import { Client } from "@notionhq/client";
import { Member } from "./types";

const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

// The Form database (applications + CRM)
const formDatabaseId = process.env.NOTION_DATABASE_ID!;
// The Directory database (accepted members)
const directoryDatabaseId = process.env.NOTION_DIRECTORY_DATABASE_ID;

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

function getMultiSelect(prop: any): string[] {
  if (!prop || prop.type !== "multi_select") return [];
  return prop.multi_select?.map((s: any) => s.name) ?? [];
}

function getFileUrl(prop: any): string {
  if (!prop) return "";

  // Standard Notion API file format
  if (prop.type === "files") {
    const file = prop.files?.[0];
    if (!file) return "";
    if (file.type === "file") return file.file.url;
    if (file.type === "external") return file.external.url;
    // Notion form submissions store files with a name and url
    if (file.name && file.file?.url) return file.file.url;
    if (file.name && file.external?.url) return file.external.url;
  }

  return "";
}

// Fetch accepted members from the Form database (has photos)
export async function fetchMembersFromNotion(): Promise<Member[]> {
  // Always use the Form DB — it has photos and Accepted status
  const allResults: any[] = [];
  let cursor: string | undefined = undefined;

  do {
    const response: any = await notion.databases.query({
      database_id: formDatabaseId,
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

  return allResults.map((page: any) => {
    const p = page.properties;

    // Handle both Form DB and Directory DB field names
    const locationRaw =
      getMultiSelect(
        p["Where do you spend most of your time? (we love IRL time!)"] ||
          p["📍 Where do you spend most of your time? (we love IRL time!)"]
      );

    return {
      id: page.id,
      name: getPlainText(p["What is your name?"]),
      firstName: getPlainText(p["First Name"]),
      lastName: getPlainText(p["Last Name"]),
      email: getPlainText(p["What is your email (so members can connect)"]),
      phone: getPlainText(
        p["What is your cell number (so we can add your to our WhatsApp group) *"] ||
          p["📞 What is your cell number (so we can add your to our WhatsApp group) *"]
      ),
      photoUrl: getFileUrl(p["Please upload a photo of yourself!"]),
      role: getPlainText(p["What is your title?"]),
      company: getPlainText(p["Where do you work?"] || p["💼 Where do you work?"]),
      occupationType: getPlainText(
        p["How would you describe your occupation (founder, investor, operator, etc)? *"] ||
          p["How would you describe your role?"]
      ),
      location: locationRaw.join(", "),
      linkedin: getPlainText(p["Please add your Linkedin"]),
      hopingToGet: getPlainText(p["What are you hoping to get out of Myca? *"] || p["What are you hoping to get out of Myca?"]),
      excitedToContribute: getPlainText(p["What are you most excited to contribute to the Myca community? "] || p["What are you most excited to contribute to the Myca community?"]),
    };
  });
}

// Submit a new application to the Form database
export async function submitApplication(data: {
  name: string;
  company: string;
  title: string;
  occupation: string;
  linkedin: string;
  email: string;
  phone: string;
  location: string[];
  comfortFood: string;
  hopingToGet: string;
  excitedToContribute: string;
  photoUrl?: string;
}) {
  return notion.pages.create({
    parent: { database_id: formDatabaseId },
    properties: {
      "What is your name?": {
        title: [{ text: { content: data.name } }],
      },
      "Where do you work?": {
        rich_text: [{ text: { content: data.company } }],
      },
      "What is your title?": {
        rich_text: [{ text: { content: data.title } }],
      },
      "How would you describe your occupation (founder, investor, operator, etc)? *":
        {
          rich_text: [{ text: { content: data.occupation } }],
        },
      "Please add your Linkedin": {
        url: data.linkedin || null,
      },
      "What is your email (so members can connect)": {
        email: data.email,
      },
      "What is your cell number (so we can add your to our WhatsApp group) *":
        {
          rich_text: [{ text: { content: data.phone } }],
        },
      "Where do you spend most of your time? (we love IRL time!)": {
        multi_select: data.location.map((name) => ({ name })),
      },
      "What's the one food that always makes you feel at home?": {
        rich_text: [{ text: { content: data.comfortFood } }],
      },
      "What are you hoping to get out of Myca? *": {
        rich_text: [{ text: { content: data.hopingToGet } }],
      },
      "What are you most excited to contribute to the Myca community? ": {
        rich_text: [{ text: { content: data.excitedToContribute } }],
      },
      ...(data.photoUrl
        ? {
            "Please upload a photo of yourself!": {
              files: [
                {
                  type: "external" as const,
                  name: "photo",
                  external: { url: data.photoUrl },
                },
              ],
            },
          }
        : {}),
    },
  });
}
