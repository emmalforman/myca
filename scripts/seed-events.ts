/**
 * Seed the Supabase `events` table with curated calendar events.
 *
 * Usage (env vars inline, same pattern as other scripts):
 *   NEXT_PUBLIC_SUPABASE_URL=xxx SUPABASE_SERVICE_ROLE_KEY=xxx \
 *   npx tsx scripts/seed-events.ts
 *
 * Or with a .env.local file:
 *   npx tsx scripts/seed-events.ts
 */

import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

// Try to load .env.local (no-op if missing)
config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.\n" +
      "Pass them as env vars or create a .env.local file."
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Helper: compute day of week from YYYY-MM-DD
function getDayOfWeek(dateStr: string): string {
  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const d = new Date(dateStr + "T12:00:00"); // noon to avoid TZ edge cases
  return days[d.getDay()];
}

const events = [
  {
    title:
      "nextNYC x Queen One Consumer Happy Hour + Conversation with Ryan Urban",
    host: "Grace Gould",
    host_company: null,
    description: null,
    date: "2026-04-15",
    start_time: "3:00 PM",
    end_time: "6:00 PM",
    location: "25 Kent Ave Suite 401, Brooklyn, NY 11249",
    city: "New York",
    rsvp_url: "https://luma.com/event/evt-x0IBKjVr4YMCzAV",
    rsvp_platform: "luma",
    source_event_id: "gcal-evt-x0IBKjVr4YMCzAV",
    is_myca_member_event: false,
  },
  {
    title: "A SIGN OF THE TIMES: WORLD PREMIERE PARTY",
    host: "ari & Alex Munno",
    host_company: null,
    description: null,
    date: "2026-04-15",
    start_time: "6:00 PM",
    end_time: "8:00 PM",
    location: "3 Howard St, New York, NY 10013",
    city: "New York",
    rsvp_url: "https://luma.com/event/evt-bYOrDskLs208g3Q",
    rsvp_platform: "luma",
    source_event_id: "gcal-evt-bYOrDskLs208g3Q",
    is_myca_member_event: false,
  },
  {
    title: "Sauna Rave (Hosted by The Nucleus Network x Range Group)",
    host: "Michael Axman",
    host_company: null,
    description: null,
    date: "2026-04-15",
    start_time: "8:30 PM",
    end_time: "10:30 PM",
    location: "TBD",
    city: "New York",
    rsvp_url: "https://luma.com/event/evt-33OdNVShI7zub7N",
    rsvp_platform: "luma",
    source_event_id: "gcal-evt-33OdNVShI7zub7N",
    is_myca_member_event: false,
  },
  {
    title: "Myca Labs: Building Your Own Website",
    host: "Emma Forman",
    host_company: "Myca Collective",
    description:
      "Build your first website, no technical background required. Pastries, cold brew, and coffee on tap.",
    date: "2026-04-16",
    start_time: "8:30 AM",
    end_time: "10:30 AM",
    location: "Asano, 289 Bleecker St, Manhattan, NY 10014",
    city: "New York",
    rsvp_url: "https://luma.com/event/evt-6eHdYRa6zAibIFt",
    rsvp_platform: "luma",
    source_event_id: "gcal-evt-6eHdYRa6zAibIFt",
    is_myca_member_event: true,
  },
  {
    title: "228 Sunset Rooftop Party",
    host: null,
    host_company: null,
    description: null,
    date: "2026-04-18",
    start_time: "5:30 PM",
    end_time: "7:30 PM",
    location: "228 Berry Street",
    city: "New York",
    rsvp_url: "https://partiful.com/e/O4hozmIROdPReMWNwcxv",
    rsvp_platform: "partiful",
    source_event_id: "gcal-partiful-O4hozmIROdPReMWNwcxv",
    is_myca_member_event: false,
  },
  {
    title: "Myca in Marin: Farmers Market & Hiking",
    host: "Emma Forman",
    host_company: "Myca Collective",
    description: null,
    date: "2026-04-19",
    start_time: "10:00 AM",
    end_time: "12:00 PM",
    location:
      "Sunday Marin Farmers' Market, 3501 Civic Center Dr, San Rafael, CA",
    city: "San Francisco",
    rsvp_url: "https://luma.com/event/evt-EjZ8lZsFrsGUrol",
    rsvp_platform: "luma",
    source_event_id: "gcal-evt-EjZ8lZsFrsGUrol",
    is_myca_member_event: true,
  },
  {
    title: "Friends of FlightPlan Dinner",
    host: null,
    host_company: null,
    description: null,
    date: "2026-04-21",
    start_time: "7:00 PM",
    end_time: "9:00 PM",
    location: "580 Market St, San Francisco, CA",
    city: "San Francisco",
    rsvp_url: "https://partiful.com/e/VzMo9QZSVRwZVRDmbzpJ",
    rsvp_platform: "partiful",
    source_event_id: "gcal-partiful-VzMo9QZSVRwZVRDmbzpJ",
    is_myca_member_event: false,
  },
  {
    title: "PlanetHAUS @ SF Climate Week",
    host: "PlanetHAUS & SF Climate Week",
    host_company: null,
    description:
      "Immersive sustainable home experience with 50+ leading brands",
    date: "2026-04-22",
    start_time: "12:00 PM",
    end_time: "7:00 PM",
    location: "The Battery, 717 Battery St, San Francisco, CA 94111",
    city: "San Francisco",
    rsvp_url: "https://luma.com/event/evt-Evl1IiUZ4DD7PwE",
    rsvp_platform: "luma",
    source_event_id: "gcal-evt-Evl1IiUZ4DD7PwE",
    is_myca_member_event: false,
  },
  {
    title: "Jewish Climate & Israeli DeserTech Summit",
    host: "Jewish Green Business Network",
    host_company: null,
    description: null,
    date: "2026-04-22",
    start_time: "5:00 PM",
    end_time: "8:00 PM",
    location: "Morrison Foerster, 425 Market St, San Francisco, CA 94105",
    city: "San Francisco",
    rsvp_url: "https://luma.com/event/evt-O1hLxLSeMI8tcUV",
    rsvp_platform: "luma",
    source_event_id: "gcal-evt-O1hLxLSeMI8tcUV",
    is_myca_member_event: false,
  },
  {
    title: "Female Founders & Funders Gathering @ SF Climate Week",
    host: "Planeteer Capital",
    host_company: null,
    description: null,
    date: "2026-04-22",
    start_time: "5:00 PM",
    end_time: "7:30 PM",
    location: "Salesforce Park, 425 Mission St, San Francisco, CA 94105",
    city: "San Francisco",
    rsvp_url: "https://luma.com/event/evt-T0Qx3pQbyiFaWoi",
    rsvp_platform: "luma",
    source_event_id: "gcal-evt-T0Qx3pQbyiFaWoi",
    is_myca_member_event: false,
  },
  {
    title: "Community Leads Collective: Vol. 2 Dinner",
    host: "Michael Axman, Jake Fleshner & Danny Samoon",
    host_company: null,
    description: null,
    date: "2026-04-22",
    start_time: "7:00 PM",
    end_time: "10:00 PM",
    location: "Centurion New York, 1 Vanderbilt Ave, New York, NY 10017",
    city: "New York",
    rsvp_url: "https://luma.com/event/evt-O5yONgArfkUQ5qt",
    rsvp_platform: "luma",
    source_event_id: "gcal-evt-O5yONgArfkUQ5qt",
    is_myca_member_event: false,
  },
  {
    title:
      "From Farm to Table to Planet: How Do We Feed the World Without Destroying It?",
    host: "SF Climate Week & Project Drawdown",
    host_company: null,
    description: null,
    date: "2026-04-23",
    start_time: "5:00 PM",
    end_time: "6:00 PM",
    location:
      "The Melody of San Francisco, 906 Broadway, San Francisco, CA 94133",
    city: "San Francisco",
    rsvp_url: "https://luma.com/event/evt-gcu2HPSQVF4XwFP",
    rsvp_platform: "luma",
    source_event_id: "gcal-evt-gcu2HPSQVF4XwFP",
    is_myca_member_event: false,
  },
  {
    title: "Golden Age Hospitality and Myca: Martini Fountain Hour",
    host: "Natalie Paolinelli & Emma Forman",
    host_company: "Golden Age Hospitality x Myca",
    description:
      "Martini fountains, small bites, and Myca member matchmaking at Deux Chats in Williamsburg",
    date: "2026-04-26",
    start_time: "4:00 PM",
    end_time: "6:00 PM",
    location: "Deux Chats, 27 Broadway, Brooklyn, NY 11249",
    city: "New York",
    rsvp_url: "https://luma.com/event/evt-ag2iL1Awj3X3pfp",
    rsvp_platform: "luma",
    source_event_id: "gcal-evt-ag2iL1Awj3X3pfp",
    is_myca_member_event: true,
  },
];

async function main() {
  // Add computed fields to each event
  const rows = events.map((e) => ({
    ...e,
    day_of_week: getDayOfWeek(e.date),
    status: "approved" as const,
    source: "calendar" as const,
    cover_image_url: null,
  }));

  console.log(`Inserting ${rows.length} events into Supabase...\n`);

  // Insert events (use insert since there's no unique constraint on source_event_id)
  const { data, error } = await supabase
    .from("events")
    .insert(rows)
    .select("id, title, date, day_of_week");

  if (error) {
    console.error("Supabase error:", error);
    process.exit(1);
  }

  console.log(`Successfully inserted ${data?.length ?? 0} events:\n`);
  for (const row of data ?? []) {
    console.log(`  [${row.date} ${row.day_of_week}] ${row.title}`);
  }
}

main();
