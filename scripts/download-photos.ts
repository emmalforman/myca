/**
 * Step 1: Download all photos from Notion to a local folder.
 * Step 2: Upload from local folder to Supabase Storage.
 *
 * Usage:
 *   Step 1 - Download:
 *     NOTION_API_KEY=xxx NOTION_DATABASE_ID=xxx \
 *     npx tsx scripts/download-photos.ts
 *
 *   Step 2 - Upload:
 *     NEXT_PUBLIC_SUPABASE_URL=xxx SUPABASE_SERVICE_ROLE_KEY=xxx \
 *     npx tsx scripts/upload-photos.ts
 */

import { Client } from "@notionhq/client";
import * as fs from "fs";
import * as path from "path";
import * as https from "https";
import * as http from "http";

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const DATABASE_ID = process.env.NOTION_DATABASE_ID || "1cbf6a28bb29803c9815c333d33ad2e9";
const OUTPUT_DIR = path.join(process.env.HOME || "~", "Desktop", "myca-photos");

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
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function downloadFile(url: string, destPath: string): Promise<boolean> {
  return new Promise((resolve) => {
    const client = url.startsWith("https") ? https : http;
    const file = fs.createWriteStream(destPath);

    client.get(url, { headers: { "User-Agent": "Mozilla/5.0" } }, (response) => {
      // Follow redirects
      if (response.statusCode === 301 || response.statusCode === 302) {
        const redirectUrl = response.headers.location;
        if (redirectUrl) {
          file.close();
          fs.unlinkSync(destPath);
          downloadFile(redirectUrl, destPath).then(resolve);
          return;
        }
      }

      if (response.statusCode !== 200) {
        console.log(`    HTTP ${response.statusCode}`);
        file.close();
        fs.unlinkSync(destPath);
        resolve(false);
        return;
      }

      response.pipe(file);
      file.on("finish", () => {
        file.close();
        // Check file size - if < 1KB it's probably an error page
        const stats = fs.statSync(destPath);
        if (stats.size < 1000) {
          console.log(`    Too small (${stats.size} bytes) - probably not an image`);
          fs.unlinkSync(destPath);
          resolve(false);
          return;
        }

        // Check magic bytes
        const buf = Buffer.alloc(4);
        const fd = fs.openSync(destPath, "r");
        fs.readSync(fd, buf, 0, 4, 0);
        fs.closeSync(fd);

        const isJpeg = buf[0] === 0xFF && buf[1] === 0xD8;
        const isPng = buf[0] === 0x89 && buf[1] === 0x50;
        const isGif = buf[0] === 0x47 && buf[1] === 0x49;
        const isWebp = buf[0] === 0x52 && buf[1] === 0x49; // RIFF

        if (!isJpeg && !isPng && !isGif && !isWebp) {
          console.log(`    Not a valid image (bytes: ${buf[0]},${buf[1]},${buf[2]},${buf[3]})`);
          fs.unlinkSync(destPath);
          resolve(false);
          return;
        }

        resolve(true);
      });
    }).on("error", (err) => {
      file.close();
      if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
      console.log(`    Download error: ${err.message}`);
      resolve(false);
    });
  });
}

async function main() {
  console.log("=== Myca Photo Download ===\n");

  // Create output directory
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  console.log(`Saving photos to: ${OUTPUT_DIR}\n`);

  // Also create a mapping file
  const mapping: { name: string; email: string; notionId: string; fileName: string }[] = [];

  console.log("Fetching accepted members from Notion...");
  const allResults: any[] = [];
  let cursor: string | undefined = undefined;
  do {
    const response: any = await notion.databases.query({
      database_id: DATABASE_ID,
      filter: { property: "Accepted", select: { equals: "Yes" } },
      page_size: 100,
      ...(cursor ? { start_cursor: cursor } : {}),
    });
    allResults.push(...response.results);
    cursor = response.has_more ? response.next_cursor : undefined;
  } while (cursor);

  console.log(`Found ${allResults.length} accepted members\n`);

  let downloaded = 0;
  let skipped = 0;
  let failed = 0;

  for (const page of allResults) {
    const p = page.properties;
    const name = getPlainText(p["What is your name?"]);
    const email = getPlainText(p["What is your email (so members can connect)"]);
    const photoUrl = getFileUrl(p["Please upload a photo of yourself!"]);
    const notionId = page.id;

    if (!name || !photoUrl) {
      console.log(`  ${name || "unnamed"} — no photo`);
      skipped++;
      continue;
    }

    const slug = slugify(name);
    const fileName = `${slug}.jpg`;
    const destPath = path.join(OUTPUT_DIR, fileName);

    // Skip if already downloaded
    if (fs.existsSync(destPath)) {
      console.log(`  ${name} — already downloaded`);
      mapping.push({ name, email, notionId, fileName });
      skipped++;
      continue;
    }

    console.log(`  Downloading: ${name}...`);
    const ok = await downloadFile(photoUrl, destPath);

    if (ok) {
      const stats = fs.statSync(destPath);
      console.log(`    OK (${Math.round(stats.size / 1024)}KB)`);
      mapping.push({ name, email, notionId, fileName });
      downloaded++;
    } else {
      failed++;
    }

    // Small delay
    await new Promise((r) => setTimeout(r, 300));
  }

  // Save mapping file
  const mappingPath = path.join(OUTPUT_DIR, "_mapping.json");
  fs.writeFileSync(mappingPath, JSON.stringify(mapping, null, 2));

  console.log(`\n=== Done ===`);
  console.log(`  Downloaded: ${downloaded}`);
  console.log(`  Skipped:    ${skipped}`);
  console.log(`  Failed:     ${failed}`);
  console.log(`  Total:      ${allResults.length}`);
  console.log(`\n  Photos saved to: ${OUTPUT_DIR}`);
  console.log(`  Mapping file: ${mappingPath}`);
  console.log(`\n  Next step: run upload-photos.ts to upload to Supabase`);
}

main().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
