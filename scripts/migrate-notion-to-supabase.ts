/**
 * One-time migration: Notion -> Supabase
 *
 * Pulls all accepted members from Notion Form DB,
 * decodes photo URLs, and upserts into Supabase.
 *
 * Usage:
 *   NOTION_API_KEY=xxx NOTION_DATABASE_ID=xxx \
 *   NEXT_PUBLIC_SUPABASE_URL=xxx SUPABASE_SERVICE_ROLE_KEY=xxx \
 *   npx tsx scripts/migrate-notion-to-supabase.ts
 */

const { Client } = require("@notionhq/client");
const { createClient } = require("@supabase/supabase-js");

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const DATABASE_ID = process.env.NOTION_DATABASE_ID || "1cbf6a28bb29803c9815c333d33ad2e9";

function getPlainText(prop: any): string {
  if (!prop) return "";
  if (prop.type === "title") return prop.title?.[0]?.plain_text ?? "";
  if (prop.type === "rich_text") return prop.rich_text?.[0]?.plain_text ?? "";
  if (prop.type === "email") return prop.email ?? "";
  if (prop.type === "phone_number") return prop.phone_number ?? "";
  if (prop.type === "url") return prop.url ?? "";
  if (prop.type === "select") return prop.select?.name ?? "";
  if (prop.type === "date") return prop.date?.start ?? "";
  return "";
}

function getMultiSelect(prop: any): string[] {
  if (!prop || prop.type !== "multi_select") return [];
  return prop.multi_select?.map((s: any) => s.name) ?? [];
}

function getFileUrl(prop: any): string {
  if (!prop || prop.type !== "files") return "";
  const file = prop.files?.[0];
  if (!file) return "";
  // Notion-hosted file (signed URL, expires ~1hr)
  if (file.type === "file") return file.file.url;
  // External URL
  if (file.type === "external") return file.external.url;
  return "";
}

async function main() {
  console.log("Fetching accepted members from Notion...");

  const allResults: any[] = [];
  let cursor: string | undefined = undefined;

  do {
    const response: any = await notion.databases.query({
      database_id: DATABASE_ID,
      filter: {
        property: "Accepted",
        select: { equals: "Yes" },
      },
      page_size: 100,
      ...(cursor ? { start_cursor: cursor } : {}),
    });
    allResults.push(...response.results);
    cursor = response.has_more ? response.next_cursor : undefined;
  } while (cursor);

  console.log(`Found ${allResults.length} accepted members`);

  const rows = allResults.map((page: any) => {
    const p = page.properties;

    const fullName = getPlainText(p["What is your name?"]);
    const photoUrl = getFileUrl(p["Please upload a photo of yourself!"]);

    console.log(`  ${fullName} — photo: ${photoUrl ? "YES" : "NO"}`);

    return {
      full_name: fullName,
      first_name: getPlainText(p["First Name"]) || null,
      last_name: getPlainText(p["Last Name"]) || null,
      email: getPlainText(p["What is your email (so members can connect)"]),
      phone:
        getPlainText(
          p["What is your cell number (so we can add your to our WhatsApp group) *"]
        ) || null,
      photo_url: photoUrl || null,
      title: getPlainText(p["What is your title?"]) || null,
      company: getPlainText(p["Where do you work?"]) || null,
      occupation:
        getPlainText(
          p["How would you describe your occupation (founder, investor, operator, etc)? *"]
        ) || null,
      location: getMultiSelect(
        p["Where do you spend most of your time? (we love IRL time!)"]
      ),
      linkedin: getPlainText(p["Please add your Linkedin"]) || null,
      comfort_food:
        getPlainText(
          p["What's the one food that always makes you feel at home?"]
        ) || null,
      hoping_to_get:
        getPlainText(p["What are you hoping to get out of Myca? *"]) || null,
      excited_to_contribute:
        getPlainText(
          p["What are you most excited to contribute to the Myca community? "]
        ) || null,
      asks_and_offers: getPlainText(p["Asks & Offers"]) || null,
      notion_id: page.id,
    };
  });

  // Filter out members without email
  const valid = rows.filter((r: any) => r.email);
  console.log(`\n${valid.length} members with valid email`);

  // Upsert into Supabase
  console.log("\nUpserting into Supabase...");
  const { data, error } = await supabase
    .from("members")
    .upsert(valid, { onConflict: "notion_id" });

  if (error) {
    console.error("Supabase error:", error);
    process.exit(1);
  }

  console.log(`\nDone! ${valid.length} members synced to Supabase.`);

  // Summary
  const withPhotos = valid.filter((r: any) => r.photo_url);
  const withoutPhotos = valid.filter((r: any) => !r.photo_url);
  console.log(`  With photos: ${withPhotos.length}`);
  console.log(`  Without photos: ${withoutPhotos.length}`);
  if (withoutPhotos.length > 0) {
    console.log("  Missing photos:");
    withoutPhotos.forEach((r: any) => console.log(`    - ${r.full_name}`));
  }
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
