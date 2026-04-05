import { NextResponse } from "next/server";
import { Client } from "@notionhq/client";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

function getPlainText(prop: any): string {
  if (!prop) return "";
  if (prop.type === "title") return prop.title?.[0]?.plain_text ?? "";
  if (prop.type === "rich_text") return prop.rich_text?.[0]?.plain_text ?? "";
  if (prop.type === "email") return prop.email ?? "";
  return "";
}

function getFileUrl(prop: any): string {
  if (!prop || prop.type !== "files") return "";
  const file = prop.files?.[0];
  if (!file) return "";
  if (file.type === "file") return file.file.url;
  if (file.type === "external") return file.external.url;
  return "";
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function downloadWithRetry(url: string): Promise<{ data: Uint8Array; contentType: string } | null> {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url);
      if (res.status === 429) {
        await new Promise((r) => setTimeout(r, attempt * 3000));
        continue;
      }
      if (!res.ok) return null;
      const contentType = res.headers.get("content-type") || "image/jpeg";
      const arrayBuffer = await res.arrayBuffer();
      return { data: new Uint8Array(arrayBuffer), contentType };
    } catch {
      if (attempt < 3) await new Promise((r) => setTimeout(r, 2000));
    }
  }
  return null;
}

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get("limit") || "0");
  const notionKey = process.env.NOTION_API_KEY;
  const dbId = process.env.NOTION_DATABASE_ID;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!notionKey || !dbId) {
    return NextResponse.json({ error: "NOTION_API_KEY and NOTION_DATABASE_ID required" }, { status: 400 });
  }
  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY required" }, { status: 400 });
  }

  const notion = new Client({ auth: notionKey });
  const supabase = createClient(supabaseUrl, serviceKey);

  // Fetch all accepted members
  const allResults: any[] = [];
  let cursor: string | undefined = undefined;
  do {
    const response: any = await notion.databases.query({
      database_id: dbId,
      filter: { property: "Accepted", select: { equals: "Yes" } },
      page_size: 100,
      ...(cursor ? { start_cursor: cursor } : {}),
    });
    allResults.push(...response.results);
    cursor = response.has_more ? response.next_cursor : undefined;
  } while (cursor);

  let uploaded = 0;
  let skipped = 0;
  let failed = 0;
  const log: string[] = [];

  const toProcess = limit > 0 ? allResults.slice(0, limit) : allResults;

  for (const page of toProcess) {
    const p = page.properties;
    const name = getPlainText(p["What is your name?"]);
    const email = getPlainText(p["What is your email (so members can connect)"]);
    const photoUrl = getFileUrl(p["Please upload a photo of yourself!"]);
    const notionId = page.id;

    if (!name || !photoUrl) {
      skipped++;
      continue;
    }

    try {
      const image = await downloadWithRetry(photoUrl);
      if (!image) {
        log.push(`${name}: download failed`);
        failed++;
        continue;
      }

      // Verify it's actually an image (check magic bytes)
      const isJpeg = image.data[0] === 0xFF && image.data[1] === 0xD8;
      const isPng = image.data[0] === 0x89 && image.data[1] === 0x50;
      const isWebp = image.data[8] === 0x57 && image.data[9] === 0x45;
      const isGif = image.data[0] === 0x47 && image.data[1] === 0x49;

      if (!isJpeg && !isPng && !isWebp && !isGif) {
        log.push(`${name}: not a valid image (${image.contentType}, ${image.data.length} bytes, first bytes: ${image.data[0]},${image.data[1]})`);
        failed++;
        continue;
      }

      const ext = isJpeg ? "jpg" : isPng ? "png" : isWebp ? "webp" : "gif";
      const contentType = isJpeg ? "image/jpeg" : isPng ? "image/png" : isWebp ? "image/webp" : "image/gif";
      const fileName = `${slugify(name)}-${notionId.slice(0, 8)}.${ext}`;

      // Upload as Uint8Array directly
      const { error: uploadError } = await supabase.storage
        .from("photos")
        .upload(fileName, image.data, {
          contentType,
          upsert: true,
        });

      if (uploadError) {
        log.push(`${name}: upload failed - ${uploadError.message}`);
        failed++;
        continue;
      }

      const { data: { publicUrl } } = supabase.storage
        .from("photos")
        .getPublicUrl(fileName);

      // Update contacts table
      let updated = false;
      if (email) {
        const { error } = await supabase
          .from("contacts")
          .update({ photo_url: publicUrl })
          .eq("email", email);
        if (!error) updated = true;
      }
      if (!updated) {
        await supabase
          .from("contacts")
          .update({ photo_url: publicUrl })
          .eq("notion_id", notionId);
      }

      log.push(`${name}: OK (${ext}, ${Math.round(image.data.length / 1024)}KB)`);
      uploaded++;

      // Rate limit delay
      await new Promise((r) => setTimeout(r, 400));
    } catch (err: any) {
      log.push(`${name}: error - ${err.message}`);
      failed++;
    }
  }

  return NextResponse.json({ total: allResults.length, uploaded, skipped, failed, log });
}
