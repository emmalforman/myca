/**
 * Reconcile Notion <-> Supabase members.
 *
 * Lists any members present in Notion (Form DB accepted + Directory DB)
 * but missing from the Supabase `contacts` table. Matches on notion_id
 * first, then on normalized email. Pass `--fix` to upsert the missing rows.
 *
 * Usage:
 *   NOTION_API_KEY=xxx NOTION_DATABASE_ID=xxx \
 *   NOTION_DIRECTORY_DATABASE_ID=xxx \
 *   NEXT_PUBLIC_SUPABASE_URL=xxx SUPABASE_SERVICE_ROLE_KEY=xxx \
 *   npx tsx scripts/check-missing-members.ts [--fix]
 */

const { Client } = require("@notionhq/client");
const { createClient } = require("@supabase/supabase-js");

const FIX = process.argv.includes("--fix");

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const FORM_DB = process.env.NOTION_DATABASE_ID || "1cbf6a28bb29803c9815c333d33ad2e9";
const DIRECTORY_DB = process.env.NOTION_DIRECTORY_DATABASE_ID;

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
  if (file.type === "file") return file.file.url;
  if (file.type === "external") return file.external.url;
  return "";
}

function normEmail(e: string | null | undefined): string {
  return (e ?? "").trim().toLowerCase();
}

async function queryAll(database_id: string, filter?: any) {
  const results: any[] = [];
  let cursor: string | undefined = undefined;
  do {
    const response: any = await notion.databases.query({
      database_id,
      ...(filter ? { filter } : {}),
      page_size: 100,
      ...(cursor ? { start_cursor: cursor } : {}),
    });
    results.push(...response.results);
    cursor = response.has_more ? response.next_cursor : undefined;
  } while (cursor);
  return results;
}

type NotionMember = {
  source: "form" | "directory";
  notion_id: string;
  name: string;
  email: string;
  row: Record<string, any>;
};

function pickName(p: any): string {
  return (
    getPlainText(p["What is your name?"]) ||
    getPlainText(p["Name"]) ||
    [getPlainText(p["First Name"]), getPlainText(p["Last Name"])]
      .filter(Boolean)
      .join(" ")
  );
}

function pickEmail(p: any): string {
  return (
    getPlainText(p["What is your email (so members can connect)"]) ||
    getPlainText(p["Email"]) ||
    getPlainText(p["email"])
  );
}

function toContactRow(page: any, source: "form" | "directory") {
  const p = page.properties;
  const name = pickName(p);
  const email = pickEmail(p);
  const firstName = getPlainText(p["First Name"]);
  const lastName = getPlainText(p["Last Name"]);
  const phone =
    getPlainText(
      p["What is your cell number (so we can add your to our WhatsApp group) *"] ||
        p["📞 What is your cell number (so we can add your to our WhatsApp group) *"]
    );
  const company = getPlainText(p["Where do you work?"] || p["💼 Where do you work?"]);
  const role = getPlainText(p["What is your title?"]);
  const occupation = getPlainText(
    p["How would you describe your occupation (founder, investor, operator, etc)? *"] ||
      p["How would you describe your role?"]
  );
  const location = getMultiSelect(
    p["Where do you spend most of your time? (we love IRL time!)"] ||
      p["📍 Where do you spend most of your time? (we love IRL time!)"]
  ).join(", ");
  const linkedin = getPlainText(p["Please add your Linkedin"]);
  const photoUrl = getFileUrl(p["Please upload a photo of yourself!"]);

  return {
    notion_id: page.id,
    name: name || null,
    first_name: firstName || null,
    last_name: lastName || null,
    email: email || null,
    phone: phone || null,
    company: company || null,
    role: role || null,
    occupation_type: occupation || null,
    location: location || null,
    linkedin: linkedin || null,
    photo_url: photoUrl || null,
    is_myca_member: true,
    _source: source,
  };
}

async function main() {
  if (!process.env.NOTION_API_KEY) throw new Error("NOTION_API_KEY missing");
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) throw new Error("NEXT_PUBLIC_SUPABASE_URL missing");
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error("SUPABASE_SERVICE_ROLE_KEY missing");

  console.log(`Form DB:      ${FORM_DB}`);
  console.log(`Directory DB: ${DIRECTORY_DB || "(not set)"}`);
  console.log(`Fix mode:     ${FIX ? "ON (will upsert missing rows)" : "OFF (dry run)"}`);
  console.log("");

  console.log("Fetching accepted members from Notion Form DB...");
  const formPages = await queryAll(FORM_DB, {
    property: "Accepted",
    select: { equals: "Yes" },
  });
  console.log(`  ${formPages.length} accepted in Form DB`);

  let directoryPages: any[] = [];
  if (DIRECTORY_DB) {
    console.log("Fetching all members from Notion Directory DB...");
    directoryPages = await queryAll(DIRECTORY_DB);
    console.log(`  ${directoryPages.length} in Directory DB`);
  }

  const notionMembers: NotionMember[] = [];
  for (const page of formPages) {
    const row = toContactRow(page, "form");
    notionMembers.push({
      source: "form",
      notion_id: page.id,
      name: row.name || "(no name)",
      email: normEmail(row.email),
      row,
    });
  }
  for (const page of directoryPages) {
    const row = toContactRow(page, "directory");
    notionMembers.push({
      source: "directory",
      notion_id: page.id,
      name: row.name || "(no name)",
      email: normEmail(row.email),
      row,
    });
  }

  console.log("\nFetching existing contacts from Supabase...");
  const existingByNotionId = new Map<string, any>();
  const existingByEmail = new Map<string, any>();
  const pageSize = 1000;
  let offset = 0;
  while (true) {
    const { data, error } = await supabase
      .from("contacts")
      .select("contact_id,notion_id,email,name,is_myca_member")
      .range(offset, offset + pageSize - 1);
    if (error) throw new Error(`Supabase fetch failed: ${error.message}`);
    if (!data || data.length === 0) break;
    for (const row of data) {
      if (row.notion_id) existingByNotionId.set(row.notion_id, row);
      const e = normEmail(row.email);
      if (e) existingByEmail.set(e, row);
    }
    if (data.length < pageSize) break;
    offset += pageSize;
  }
  console.log(`  ${existingByNotionId.size} contacts with notion_id`);
  console.log(`  ${existingByEmail.size} contacts with email`);

  const missing: NotionMember[] = [];
  const matchedByEmailOnly: Array<{ n: NotionMember; contact: any }> = [];
  const seen = new Set<string>();

  for (const n of notionMembers) {
    const dedupKey = n.email || n.notion_id;
    if (seen.has(dedupKey)) continue;
    seen.add(dedupKey);

    const byId = existingByNotionId.get(n.notion_id);
    if (byId) continue;

    const byEmail = n.email ? existingByEmail.get(n.email) : null;
    if (byEmail) {
      matchedByEmailOnly.push({ n, contact: byEmail });
      continue;
    }

    missing.push(n);
  }

  console.log("\n=== RESULTS ===");
  console.log(`Notion members (deduped): ${seen.size}`);
  console.log(`Already synced by notion_id: ${seen.size - missing.length - matchedByEmailOnly.length}`);
  console.log(`Matched by email but missing notion_id: ${matchedByEmailOnly.length}`);
  console.log(`Completely missing from Supabase: ${missing.length}`);

  if (matchedByEmailOnly.length > 0) {
    console.log("\n--- Contacts matched by email, need notion_id backfill ---");
    for (const { n, contact } of matchedByEmailOnly) {
      console.log(`  [${n.source}] ${n.name} <${n.email}>  (contact_id=${contact.contact_id})`);
    }
  }

  if (missing.length > 0) {
    console.log("\n--- MISSING from Supabase contacts ---");
    for (const n of missing) {
      console.log(`  [${n.source}] ${n.name} <${n.email || "no email"}>  notion=${n.notion_id}`);
    }
  } else {
    console.log("\nNo missing members.");
  }

  if (FIX && (missing.length > 0 || matchedByEmailOnly.length > 0)) {
    console.log("\nApplying fixes...");

    // Backfill notion_id on email matches
    for (const { n, contact } of matchedByEmailOnly) {
      const { error } = await supabase
        .from("contacts")
        .update({ notion_id: n.notion_id, is_myca_member: true })
        .eq("contact_id", contact.contact_id);
      if (error) {
        console.error(`  backfill failed for ${n.email}: ${error.message}`);
      } else {
        console.log(`  backfilled notion_id for ${n.email}`);
      }
    }

    // Insert missing. Form DB rows take priority over Directory DB if both exist.
    const toInsert = missing
      .filter((m) => m.row.email) // contacts table likely requires email
      .sort((a, b) => (a.source === "form" ? -1 : 1))
      .map((m) => {
        const { _source, ...row } = m.row;
        return row;
      });

    const missingNoEmail = missing.filter((m) => !m.row.email);
    if (missingNoEmail.length > 0) {
      console.log(`\n  Skipping ${missingNoEmail.length} missing rows without email:`);
      for (const m of missingNoEmail) {
        console.log(`    - [${m.source}] ${m.name} (notion=${m.notion_id})`);
      }
    }

    if (toInsert.length > 0) {
      const { error } = await supabase
        .from("contacts")
        .upsert(toInsert, { onConflict: "email" });
      if (error) {
        console.error(`  upsert failed: ${error.message}`);
        process.exit(1);
      }
      console.log(`  upserted ${toInsert.length} missing members`);
    }
  } else if (!FIX && (missing.length > 0 || matchedByEmailOnly.length > 0)) {
    console.log("\nRe-run with --fix to upsert missing rows and backfill notion_ids.");
  }
}

main().catch((err) => {
  console.error("Check failed:", err);
  process.exit(1);
});
