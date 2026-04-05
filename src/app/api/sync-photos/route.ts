import { NextResponse } from "next/server";
import { Client } from "@notionhq/client";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 min timeout for Vercel Pro, 60s for free tier

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

export async function POST() {
  const notionKey = process.env.NOTION_API_KEY;
  const dbId = process.env.NOTION_DATABASE_ID;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!notionKey || !dbId) {
    return NextResponse.json({ error: "NOTION_API_KEY and NOTION_DATABASE_ID required" }, { status: 400 });
  }
  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: "Supabase service role key required" }, { status: 400 });
  }

  const notion = new Client({ auth: notionKey });
  const supabase = createClient(supabaseUrl, serviceKey);

  // Fetch all accepted members from Notion
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

  for (const page of allResults) {
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
      // Download photo from Notion signed URL
      const response = await fetch(photoUrl);
      if (!response.ok) {
        log.push(`${name}: download failed (${response.status})`);
        failed++;
        continue;
      }

      const contentType = response.headers.get("content-type") || "image/jpeg";
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const extMap: Record<string, string> = {
        "image/jpeg": "jpg", "image/jpg": "jpg", "image/png": "png",
        "image/webp": "webp", "image/gif": "gif",
      };
      const ext = extMap[contentType] || "jpg";
      const fileName = `${slugify(name)}-${notionId.slice(0, 8)}.${ext}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("photos")
        .upload(fileName, buffer, { contentType, upsert: true });

      if (uploadError) {
        log.push(`${name}: upload failed - ${uploadError.message}`);
        failed++;
        continue;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("photos")
        .getPublicUrl(fileName);

      // Update contacts table by email or notion_id
      let updated = false;
      if (email) {
        const { error } = await supabase
          .from("contacts")
          .update({ photo: publicUrl })
          .eq("email", email);
        if (!error) updated = true;
      }
      if (!updated) {
        await supabase
          .from("contacts")
          .update({ photo: publicUrl })
          .eq("notion_id", notionId);
      }

      log.push(`${name}: OK -> ${fileName}`);
      uploaded++;
    } catch (err: any) {
      log.push(`${name}: error - ${err.message}`);
      failed++;
    }
  }

  return NextResponse.json({
    total: allResults.length,
    uploaded,
    skipped,
    failed,
    log,
  });
}
