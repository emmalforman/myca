import { Client } from "@notionhq/client";
import { Member } from "./types";

const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

const databaseId = process.env.NOTION_DATABASE_ID!;

function getPlainText(prop: any): string {
  if (!prop) return "";
  if (prop.type === "title") return prop.title?.[0]?.plain_text ?? "";
  if (prop.type === "rich_text") return prop.rich_text?.[0]?.plain_text ?? "";
  if (prop.type === "email") return prop.email ?? "";
  if (prop.type === "phone_number") return prop.phone_number ?? "";
  if (prop.type === "url") return prop.url ?? "";
  if (prop.type === "select") return prop.select?.name ?? "";
  if (prop.type === "multi_select")
    return prop.multi_select?.map((s: any) => s.name) ?? [];
  if (prop.type === "date") return prop.date?.start ?? "";
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

export async function fetchMembersFromNotion(): Promise<Member[]> {
  const response = await notion.databases.query({
    database_id: databaseId,
    page_size: 100,
  });

  return response.results.map((page: any) => {
    const props = page.properties;
    return {
      id: page.id,
      firstName: getPlainText(props["First Name"] || props["first_name"]),
      lastName: getPlainText(props["Last Name"] || props["last_name"]),
      email: getPlainText(props["Email"] || props["email"]),
      phone: getPlainText(props["Phone"] || props["phone"]),
      photoUrl:
        getFileUrl(props["Photo"] || props["photo"]) ||
        getPlainText(props["Photo URL"] || props["photo_url"]),
      title: getPlainText(props["Title"] || props["title"] || props["Role"]),
      company: getPlainText(
        props["Company"] || props["company"] || props["Organization"]
      ),
      location: getPlainText(
        props["Location"] || props["location"] || props["City"]
      ),
      industry: getPlainText(props["Industry"] || props["industry"]),
      bio: getPlainText(props["Bio"] || props["bio"] || props["About"]),
      tags: (() => {
        const val = getPlainText(
          props["Tags"] || props["tags"] || props["Skills"]
        );
        return Array.isArray(val) ? val : val ? [val] : [];
      })(),
      linkedin: getPlainText(props["LinkedIn"] || props["linkedin"]),
      twitter: getPlainText(props["Twitter"] || props["twitter"]),
      website: getPlainText(props["Website"] || props["website"]),
      joinedDate: getPlainText(
        props["Joined Date"] || props["joined_date"] || props["Created"]
      ),
    };
  });
}
