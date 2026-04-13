import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function extractUrl(desc: string | undefined): string | null {
  if (!desc) return null;
  // Priority order: Luma, Resy, Partiful, Eventbrite, then any https URL
  const patterns = [
    /https:\/\/luma\.com\/event\/[^\s"<&]+/,
    /https:\/\/luma\.com\/[a-z0-9]+/i,
    /https:\/\/resy\.com\/[^\s"<&]+/,
    /https:\/\/www\.resy\.com\/[^\s"<&]+/,
    /https:\/\/partiful\.com\/[^\s"<&]+/,
    /https:\/\/www\.eventbrite\.com\/[^\s"<&]+/,
    /https?:\/\/[^\s"<&]+/, // fallback: any URL
  ];
  for (const pat of patterns) {
    const match = desc.match(pat);
    if (match) {
      let url = match[0];
      // Strip trailing punctuation
      url = url.replace(/[.,;:)}\]]+$/, "");
      return url;
    }
  }
  return null;
}

function detectRsvpPlatform(url: string | null): string | null {
  if (!url) return null;
  if (url.includes("luma.com")) return "luma";
  if (url.includes("resy.com")) return "resy";
  if (url.includes("partiful.com")) return "partiful";
  if (url.includes("eventbrite.com")) return "eventbrite";
  return "website";
}

function extractHost(desc: string | undefined): string | null {
  if (!desc) return null;
  const match = desc.match(/Hosted by (.+?)(?:\n|$)/);
  return match ? match[1].replace(/&amp;/g, "&") : null;
}

function cleanDesc(desc: string | undefined): string | null {
  if (!desc) return null;
  // Strip HTML tags and clean up
  let cleaned = desc
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
  // Remove "Get up-to-date..." and "Hosted by..." lines, URLs
  cleaned = cleaned
    .replace(/Get up-to-date information at:.*?\n/g, "")
    .replace(/You are hosting this event\..*?\n/g, "")
    .replace(/Manage the event at.*?\n/g, "")
    .replace(/https?:\/\/\S+/g, "")
    .replace(/Address:\n.*?\n.*?\n.*?\n/g, "")
    .replace(/\nHosted by .+$/g, "")
    .trim();
  // Take first 300 chars
  if (cleaned.length > 300) cleaned = cleaned.slice(0, 300) + "...";
  return cleaned || null;
}

function detectCity(location: string | undefined): string {
  if (!location) return "New York";
  if (location.includes("San Francisco") || location.includes(", CA")) return "San Francisco";
  if (location.includes("Brooklyn") || location.includes("Manhattan") || location.includes("New York") || location.includes(", NY")) return "New York";
  return "New York";
}

function formatTime(dt: string): string {
  const d = new Date(dt);
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "America/New_York" });
}

function getDayOfWeek(dateStr: string): string {
  return new Date(dateStr + "T12:00:00").toLocaleDateString("en-US", { weekday: "long" });
}

const events = [
  {
    id: "3c8qpjmtclfmclcplkbjfct65j",
    summary: "All About: Sake with Jamie Graves",
    description: "https://leonandsonwine.com/products/all-about-sake-with-jamie-graves",
    location: "Leon & Son Wine and Spirits, 995 Fulton St, Brooklyn, NY 11238, USA",
    start: "2026-04-13T18:30:00-04:00",
    end: "2026-04-13T20:00:00-04:00",
  },
  {
    id: "3djql3t85t2ran28ft0h9otgm0",
    summary: "nextNYC x Queen One Consumer Happy Hour + Conversation with Ryan Urban",
    description: "Join nextNYC and Queen One for a consumer-focused happy hour bringing together founders, marketers, and investors building in consumer products and consumer tech.\nWe'll kick things off with a conversation with Ryan Urban of Queen One.\n\nHosted by Grace Gould & 6 others",
    location: "25 Kent Ave Suite 401, Brooklyn, NY 11249, USA",
    start: "2026-04-15T15:00:00-04:00",
    end: "2026-04-15T18:00:00-04:00",
    rsvpUrl: "https://luma.com/event/evt-x0IBKjVr4YMCzAV",
  },
  {
    id: "7muedabe5l5kesd6e06pd2mfb9",
    summary: "An Evening of Party Tricks with Anna Hezel",
    location: null,
    start: "2026-04-15T18:30:00-04:00",
    end: "2026-04-15T20:30:00-04:00",
  },
  {
    id: "1hko3m11hrfda78t879sul4fdm",
    summary: "Sauna Rave (Hosted by The Nucleus Network x Range Group)",
    description: "Hosted by Michael Axman & 4 others",
    location: "TBD",
    start: "2026-04-15T20:30:00-04:00",
    end: "2026-04-15T22:30:00-04:00",
    rsvpUrl: "https://luma.com/event/evt-33OdNVShI7zub7N",
  },
  {
    id: "603feij7df97tg4l4pi6mpsr38",
    summary: "Myca Labs: Building Your Own Website",
    description: "Build your first website, no technical background required. Pastries, cold brew, and coffee on tap at Asano!",
    location: "Asano, 289 Bleecker St, Manhattan, NY 10014, USA",
    start: "2026-04-16T08:30:00-04:00",
    end: "2026-04-16T10:30:00-04:00",
    rsvpUrl: "https://luma.com/event/evt-6eHdYRa6zAibIFt",
    isMycaMemberEvent: true,
  },
  {
    id: "540fd1q1e5o8gqcq4ijfh8a8u3",
    summary: "Dinner @ Burrow - Springbone Dinner",
    description: null,
    location: "300 Manhattan Ave, Brooklyn, NY 11211, USA",
    start: "2026-04-16T19:00:00-04:00",
    end: "2026-04-16T22:00:00-04:00",
  },
  {
    id: "3jj8jj07bslcbvmn4sc7i0pk32",
    summary: "Food & Ag Ecosystem Happy Hour (SFCW)",
    description: "Join Stray Dog Capital and Ponderosa Ventures for a Sustainable Food & Ag Happy Hour! Great food (mostly vegan), open bar, and conversation.\n\nHosted by Anthony Cortese, Andres Manzanares & SF Climate Week",
    location: "Victory Hall & Parlor, 360 Ritch St, San Francisco, CA 94107, USA",
    start: "2026-04-20T20:00:00-04:00",
    end: "2026-04-20T22:00:00-04:00",
    rsvpUrl: "https://luma.com/8yuc8udq",
  },
  {
    id: "7aog66ctpb99s6qcsni3vaerof",
    summary: "Physical AI Drinks & Bites",
    description: "Founders, investors, engineers, and operators building physical and industrial AI. Hosted by Tandem, Hitachi Ventures, Antler, and MFV Partners.\n\nHosted by Somil Singh & 6 others",
    location: "144 Townsend St, San Francisco, CA 94107, USA",
    start: "2026-04-21T21:00:00-04:00",
    end: "2026-04-21T23:00:00-04:00",
    rsvpUrl: "https://luma.com/l3xh4cwt",
  },
  {
    id: "4q0gp0ilt11phh0jkgtdgmfc4r",
    summary: "PlanetHAUS @ SF Climate Week",
    description: "Immersive sustainable home experience with 50+ leading brands. Breakfast, scent stacking, and more at The Battery.",
    location: "The Battery, 717 Battery St, San Francisco, CA 94111, USA",
    start: "2026-04-22T12:00:00-04:00",
    end: "2026-04-22T19:00:00-04:00",
    rsvpUrl: "https://luma.com/event/evt-Evl1IiUZ4DD7PwE",
  },
  {
    id: "5bfcauiv6uivt8hp334hmka4le",
    summary: "Female Founders & Funders Gathering @ SF Climate Week",
    description: "Hundreds of venture investors and startup operators across energy, AI, food systems, deep tech. Live beats by DJ Nina del Sol! Co-hosted by Planeteer Capital & Earthshot Ventures.",
    location: "Salesforce Park, 425 Mission St, San Francisco, CA 94105, USA",
    start: "2026-04-22T17:00:00-04:00",
    end: "2026-04-22T19:30:00-04:00",
    rsvpUrl: "https://luma.com/event/evt-T0Qx3pQbyiFaWoi",
  },
  {
    id: "20rq88506ua7et5spvrjv65j62",
    summary: "From Farm to Table to Planet: How Do We Feed the World Without Destroying It?",
    description: "Panel with Jonathan Foley (Project Drawdown), Alexandria Coari (ReFED), Lauren Gifford, Kelly McNamara on food systems and climate.",
    location: "The Melody of San Francisco, 906 Broadway, San Francisco, CA 94133, USA",
    start: "2026-04-23T17:00:00-04:00",
    end: "2026-04-23T18:00:00-04:00",
    rsvpUrl: "https://luma.com/event/evt-gcu2HPSQVF4XwFP",
  },
  {
    id: "5il594evn5bihqnkvgteoo2202",
    summary: "132nd SF Hardware Meetup @ Sofar Ocean",
    description: "Hardware meetup during SF Climate Tech Week. Bring physical demos for open mic! Speakers from Sofar Ocean and Novos Power.",
    location: "Sofar Ocean Technologies, 28 Pier Annex, San Francisco, CA 94105, USA",
    start: "2026-04-23T21:30:00-04:00",
    end: "2026-04-24T00:30:00-04:00",
    rsvpUrl: "https://luma.com/mozdtprl",
  },
  {
    id: "22ld9jjdvr38dbhq6fo4l0jbgf",
    summary: "Fort Greene Farmers Market: Volunteer Shift",
    location: null,
    start: "2026-04-25T10:00:00-04:00",
    end: "2026-04-25T13:00:00-04:00",
  },
  {
    id: "56k3b5fm250t31qfm1rjhfipu9",
    summary: "Golden Age Hospitality and Myca: Martini Fountain Hour",
    description: "Martini fountains, small bites, and Myca member matchmaking at Deux Chats. Invite only for Myca members.",
    location: "Deux Chats, 27 Broadway, Brooklyn, NY 11249, USA",
    start: "2026-04-26T16:00:00-04:00",
    end: "2026-04-26T18:00:00-04:00",
    rsvpUrl: "https://luma.com/event/evt-ag2iL1Awj3X3pfp",
    isMycaMemberEvent: true,
  },
  {
    id: "0mrj4bubnbhheh36qirjugso6e",
    summary: "Farmer Talk: Rebuilding Our Local Grain Economy",
    location: "Brooklyn Granary & Mill, 240 Huntington St, Brooklyn, NY 11231, USA",
    start: "2026-04-27T17:30:00-04:00",
    end: "2026-04-27T19:30:00-04:00",
  },
  {
    id: "2917bu9em1g2n42ht322nln5e8",
    summary: "Why Regenerative",
    location: null,
    start: "2026-04-29T13:30:00-04:00",
    end: "2026-04-30T17:30:00-04:00",
  },
  {
    id: "7uqiatbag0oummhehec0mfn0na",
    summary: "Vice Night - Events by CPGD x Myca",
    description: "Invite-only cocktail night for ~50 people in CPG, media, and hospitality. 20+ alcohol brands for samplings, plus 10+ THC, tobacco, and non-alc brands. DJ spinning all night.",
    location: "Earshot, 255 Canal St floor 3, New York, NY 10013, USA",
    start: "2026-04-29T20:00:00-04:00",
    end: "2026-04-29T22:00:00-04:00",
    rsvpUrl: "https://luma.com/event/evt-vcdd9wkMNmLFpm7",
    isMycaMemberEvent: true,
  },
  {
    id: "3labs3t8fkod4nbr147ck1ti6b",
    summary: "Joy of Sake",
    location: null,
    start: "2026-04-30T18:30:00-04:00",
    end: "2026-04-30T20:30:00-04:00",
  },
];

async function main() {
  const rows = events.map((e) => {
    const date = e.start.split("T")[0];
    const host = extractHost(e.description) || null;
    // Use explicit rsvpUrl if set, otherwise extract from description
    const rsvpUrl = (e as any).rsvpUrl || extractUrl(e.description) || null;
    return {
      title: e.summary,
      host,
      description: e.description ? cleanDesc(e.description) : null,
      date,
      day_of_week: getDayOfWeek(date),
      start_time: formatTime(e.start),
      end_time: formatTime(e.end),
      location: e.location || null,
      city: detectCity(e.location || undefined),
      rsvp_url: rsvpUrl,
      rsvp_platform: detectRsvpPlatform(rsvpUrl),
      source: "calendar",
      source_event_id: `myca-cal-${e.id}`,
      is_myca_member_event: (e as any).isMycaMemberEvent || false,
      status: "approved",
    };
  });

  console.log(`Upserting ${rows.length} events from Myca Collective calendar...\n`);

  let inserted = 0, updated = 0;
  for (const row of rows) {
    // Check if event already exists by source_event_id
    const { data: existing } = await sb
      .from("events")
      .select("id")
      .eq("source_event_id", row.source_event_id)
      .single();

    if (existing) {
      const { error } = await sb
        .from("events")
        .update(row)
        .eq("id", existing.id);
      if (error) {
        console.log(`  ERROR updating ${row.title}: ${error.message}`);
      } else {
        console.log(`  UPDATED [${row.date}] ${row.title} → ${row.rsvp_url || "no link"}`);
        updated++;
      }
    } else {
      const { error } = await sb.from("events").insert(row);
      if (error) {
        console.log(`  ERROR inserting ${row.title}: ${error.message}`);
      } else {
        console.log(`  INSERTED [${row.date}] ${row.title} → ${row.rsvp_url || "no link"}`);
        inserted++;
      }
    }
  }

  console.log(`\nDone: ${inserted} inserted, ${updated} updated.`);
}

main();
