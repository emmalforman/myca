/**
 * Sync events from Myca Collective Google Calendar into Supabase.
 * Extracts descriptions, URLs, hosts, and locations from calendar data.
 *
 * Usage: npx tsx scripts/sync-calendar.ts
 */

const dotenv = require("dotenv");
const { createClient } = require("@supabase/supabase-js");

dotenv.config({ path: ".env.local" });

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ─── Raw calendar data (paste from gcal MCP) ───
const calendarEvents = [
  {
    id: "3c8qpjmtclfmclcplkbjfct65j",
    summary: "All About: Sake with Jamie Graves",
    description: `<a href="https://leonandsonwine.com/products/all-about-sake-with-jamie-graves">https://leonandsonwine.com/products/all-about-sake-with-jamie-graves</a>`,
    location: "Leon & Son Wine and Spirits, 995 Fulton St, Brooklyn, NY 11238, USA",
    start: "2026-04-13T18:30:00-04:00",
    end: "2026-04-13T20:00:00-04:00",
  },
  {
    id: "3djql3t85t2ran28ft0h9otgm0",
    summary: "nextNYC x Queen One Consumer Happy Hour + Conversation with Ryan Urban",
    description: `Get up-to-date information at: <a href="https://www.google.com/url?q=https://luma.com/event/evt-x0IBKjVr4YMCzAV">https://luma.com/event/evt-x0IBKjVr4YMCzAV?pk=g-9uXnWIVGNvyyHf6</a>\n\nAddress:\n25 Kent\n\nJoin nextNYC and Queen One for a consumer-focused happy hour bringing together founders, marketers, and investors building in consumer products and consumer tech.\nWe'll kick things off with a conversation with Ryan Urban of Queen One, followed by time to meet others across the ecosystem. Ryan previously founded and led Wunderkind (formerly BounceX), building it from his studio apartment into a profitable $200M+ ARR global software company powering personalized communications for brands including Samsung, Gucci, Dior, and Uniqlo.\nThis event is co-hosted by a group of investors actively backing…\n\nHosted by Grace Gould & 6 others`,
    location: "25 Kent Ave Suite 401, Brooklyn, NY 11249, USA",
    start: "2026-04-15T15:00:00-04:00",
    end: "2026-04-15T18:00:00-04:00",
  },
  {
    id: "7muedabe5l5kesd6e06pd2mfb9",
    summary: "An Evening of Party Tricks with Anna Hezel",
    description: undefined,
    location: undefined,
    start: "2026-04-15T18:30:00-04:00",
    end: "2026-04-15T20:30:00-04:00",
  },
  {
    id: "1hko3m11hrfda78t879sul4fdm",
    summary: "Sauna Rave (Hosted by The Nucleus Network x Range Group)",
    description: `Get up-to-date information at: <a href="https://luma.com/event/evt-33OdNVShI7zub7N">https://luma.com/event/evt-33OdNVShI7zub7N</a>\n\nAddress:\nTBD\n\nHosted by Michael Axman & 4 others`,
    location: "TBD",
    start: "2026-04-15T20:30:00-04:00",
    end: "2026-04-15T22:30:00-04:00",
  },
  {
    id: "603feij7df97tg4l4pi6mpsr38",
    summary: "Myca Labs: Building Your Own Website",
    description: `You are hosting this event. View the public page at https://luma.com/event/evt-6eHdYRa6zAibIFt\n\nManage the event at https://luma.com/event/manage/evt-6eHdYRa6zAibIFt\n\nAddress:\nAsano\nNew York, New York\n\nBuild your first website, no technical background required.\nDelicious selection of pastries (regular and gluten free), unlimited cold brew and coffee on tap, we're thrilled to present the first Myca Labs event at Asano!\nMyca Labs is a community where non-technical people learn how to use AI in ways that are practical, creative, and actually useful ways.\n\nWe believe the best way to learn is through conversation and co-creation.\nWhat we'll explore together:\nHands-On Creation: Build your own functional website step by step, with live guidance and real-time support.\nCommunity & Connection:…\n\nHosted by Emma Forman`,
    location: "Asano, 289 Bleecker St, Manhattan, NY 10014, USA",
    start: "2026-04-16T08:30:00-04:00",
    end: "2026-04-16T10:30:00-04:00",
  },
  {
    id: "540fd1q1e5o8gqcq4ijfh8a8u3",
    summary: "dinner @ Burrow 4/16 - Springbone dinner",
    description: `<a href="https://checkout.square.site/merchant/MLHGKFHECG0TN/checkout/TITMRQSFOJZAH2NIALQWDEQR">https://checkout.square.site/merchant/MLHGKFHECG0TN/checkout/TITMRQSFOJZAH2NIALQWDEQR</a>`,
    location: "300 Manhattan Ave, Brooklyn, NY 11211, USA",
    start: "2026-04-16T19:00:00-04:00",
    end: "2026-04-16T22:00:00-04:00",
  },
  {
    id: "82v0559loldlsha95vh2rlb76o",
    summary: "Eagle St Rooftop",
    description: undefined,
    location: undefined,
    start: "2026-04-18T12:30:00-04:00",
    end: "2026-04-18T14:15:00-04:00",
  },
  {
    id: "3jj8jj07bslcbvmn4sc7i0pk32",
    summary: "Food & Ag Ecosystem - Happy Hour (SFCW)",
    description: `Get up-to-date information at: https://luma.com/8yuc8udq\n\nAddress:\nVictory Hall & Parlor\nSan Francisco, California\n\nJoin Stray Dog Capital and Ponderosa Ventures for a Sustainable Food & Ag Happy Hour!\nWhether you're building a startup, investing, advancing research, working at a corporate, or simply passionate about creating more resilient and sustainable food systems, we are excited to meet you!\nThis will be a relaxed, informal evening to connect with others working across food and ag systems. No programming, no pitches, just good conversation and community.\nWe'll be serving great food (with mostly vegan options) and an open bar (+mocktail)!\n\nHosted by Anthony Cortese, Andres Manzanares & SF Climate Week`,
    location: "Victory Hall & Parlor, 360 Ritch St, San Francisco, CA 94107, USA",
    start: "2026-04-20T20:00:00-04:00",
    end: "2026-04-20T22:00:00-04:00",
  },
  {
    id: "7aog66ctpb99s6qcsni3vaerof",
    summary: "Physical AI Drinks & Bites",
    description: `Get up-to-date information at: https://luma.com/l3xh4cwt\n\nAddress:\n144 Townsend St\nSan Francisco, California\n\nFounders, investors, engineers, and operators building the next generation of physical and industrial AI. Join Tandem, Hitachi Ventures, Antler, and MFV Partners for an evening of discussions around AI in the real world.\nThis casual happy hour is an opportunity to connect with others working at the intersection of AI, robotics, manufacturing, and industrial systems.\n\nHosted by Somil Singh & 6 others`,
    location: "144 Townsend St, San Francisco, CA 94107, USA",
    start: "2026-04-21T21:00:00-04:00",
    end: "2026-04-21T23:00:00-04:00",
  },
  {
    id: "4q0gp0ilt11phh0jkgtdgmfc4r",
    summary: "PlanetHAUS @ SF Climate Week",
    description: `Get up-to-date information at: https://luma.com/event/evt-Evl1IiUZ4DD7PwE\n\nAddress:\nThe Battery\nSan Francisco, California\n\nPlanetHAUS is coming to SF Climate Week on Earth Day!\nPlanetHAUS is a nonprofit, immersive event series created to help us imagine what sustainability actually looks, tastes, and feels like.\nOn Earth Day, we're transforming The Battery into a "sustainable home of the future." Inside, you'll move through a kitchen, bathroom, bedroom, garden, and living space, experiencing products from ~50 leading brands in context, not booths or exhibits.\n\nHosted by PlanetHAUS & SF Climate Week`,
    location: "The Battery, 717 Battery St, San Francisco, CA 94111, USA",
    start: "2026-04-22T12:00:00-04:00",
    end: "2026-04-22T19:00:00-04:00",
  },
  {
    id: "5bfcauiv6uivt8hp334hmka4le",
    summary: "Female Founders & Funders Gathering @ SF Climate Week",
    description: `Get up-to-date information at: https://luma.com/event/evt-T0Qx3pQbyiFaWoi\n\nAddress:\nSalesforce Park\nSan Francisco, California\n\nFFF returns to San Francisco Climate Week on Wednesday, April 22!\nSave the date for climate week's most buzzy networking event.\nWe're bringing together hundreds of venture investors and startup operators across energy, AI, mobility, resilience, food systems, deep tech, and infrastructure. Space is limited - please RSVP to request an invitation.\nWe're hosting at an epic outdoor venue with live beats spun by DJ Nina del Sol!\nCo-hosted by Planeteer Capital & Earthshot Ventures.\n\nHosted by SF Climate Week & 5 others`,
    location: "Salesforce Park, 425 Mission St, San Francisco, CA 94105, USA",
    start: "2026-04-22T17:00:00-04:00",
    end: "2026-04-22T19:30:00-04:00",
  },
  {
    id: "20rq88506ua7et5spvrjv65j62",
    summary: "From Farm to Table to Planet: How Do We Feed the World Without Destroying It?",
    description: `Get up-to-date information at: https://luma.com/event/evt-gcu2HPSQVF4XwFP\n\nAddress:\nThe Melody of San Francisco\n\nModerator: Jonathan Foley, Ph.D., Executive Director, Project Drawdown\nPanelists include:\nAlexandria Coari, Vice President, Capital, Innovation, & Global Initiatives, ReFED\nLauren Gifford, Ph.D., Senior Advisor, Climate Philanthropy and Investing, Project Drawdown\nKelly McNamara, Climate & Nature Director, Food System Innovations\n\nHosted by SF Climate Week & Project Drawdown`,
    location: "The Melody of San Francisco, 906 Broadway, San Francisco, CA 94133, USA",
    start: "2026-04-23T17:00:00-04:00",
    end: "2026-04-23T18:00:00-04:00",
  },
  {
    id: "5il594evn5bihqnkvgteoo2202",
    summary: "132nd SF Hardware Meetup @ Sofar Ocean",
    description: `Get up-to-date information at: https://luma.com/mozdtprl\n\nAddress:\nSofar Ocean Technologies\nSan Francisco, California\n\nHardware meetup during SF Climate Tech Week. Bring physical demos for open mic!\nSofar Ocean's mission is to connect the world's oceans to power a more sustainable future.\n\nHosted by Michael Raspuzzi & 4 others`,
    location: "Sofar Ocean Technologies, 28 Pier Annex, San Francisco, CA 94105, USA",
    start: "2026-04-23T21:30:00-04:00",
    end: "2026-04-24T00:30:00-04:00",
  },
  {
    id: "22ld9jjdvr38dbhq6fo4l0jbgf",
    summary: "Fort Greene Farmers Market: Volunteer Shift",
    description: undefined,
    location: undefined,
    start: "2026-04-25T10:00:00-04:00",
    end: "2026-04-25T13:00:00-04:00",
  },
  {
    id: "56k3b5fm250t31qfm1rjhfipu9",
    summary: "Golden Age Hospitality and Myca: Martini Fountain Hour",
    description: `You are hosting this event. View the public page at https://luma.com/event/evt-ag2iL1Awj3X3pfp\n\nManage the event at https://luma.com/event/manage/evt-ag2iL1Awj3X3pfp\n\nAddress:\nDeux Chats\nKings County, New York\n\nGolden Age Hospitality and Myca Collective are teaming up for a very Spring, chic Sunday in Williamsburg.\nApril 27th, 4-6pm. Martinis, small bites, a room full of Myca Collective members. This event is invite only for Myca members.\nNatalie and the Golden Age team (The Nines, Le Dive, Bar Bianchi, Happiest Hour, Deux Chats) will have martini fountains flowing along with delicious bites.\nCome for your 1:1 Myca Match and stay for the tinis.\nSpring is finally here.\n\nHosted by Natalie Paolinelli & Emma Forman`,
    location: "Deux Chats, 27 Broadway, Brooklyn, NY 11249, USA",
    start: "2026-04-26T16:00:00-04:00",
    end: "2026-04-26T18:00:00-04:00",
  },
  {
    id: "0mrj4bubnbhheh36qirjugso6e",
    summary: "Farmer Talk: Rebuilding Our Local Grain Economy",
    description: `<a href="https://www.climatefarmschool.org/store/p/w8jqvl5rrzk2xphhnomluad9gnbxms">https://www.climatefarmschool.org/store/p/w8jqvl5rrzk2xphhnomluad9gnbxms</a>`,
    location: "Brooklyn Granary & Mill, 240 Huntington St, Brooklyn, NY 11231, USA",
    start: "2026-04-27T17:30:00-04:00",
    end: "2026-04-27T19:30:00-04:00",
  },
  {
    id: "2917bu9em1g2n42ht322nln5e8",
    summary: "Why Regenerative",
    description: undefined,
    location: undefined,
    start: "2026-04-29T13:30:00-04:00",
    end: "2026-04-30T17:30:00-04:00",
  },
  {
    id: "03hbccdr6fs55b4k2r8sti2jnq",
    summary: "Plantega's Earth Month Bodega Pop-Up",
    description: `The planet's been taking L's. Time to bite back.\n\nThis Earth Month, Plantega is taking over Market on Prince for a free bodega pop-up. Same classics you love, just made from plants. Better for you, better for the planet, and honestly just really good.\n\nCome hungry. Leave with swag. Tell your friends!\n\nWhat we're serving up:\n- Shrimp Po' Boy Sandwich\n- Chopped Cheese\n- Turkey & Cheese Sub\n\nWhen: Wednesday, April 29th from 5 to 7pm\nWhere: Market on Prince, 202 6th Ave, New York, NY 10013\n\nFull details at: https://partiful.com/e/qUknb5r4ZHcxc76xlkWI`,
    location: "Market On Prince, 202 6th Ave, New York, NY",
    start: "2026-04-29T17:00:00-04:00",
    end: "2026-04-29T19:00:00-04:00",
  },
  {
    id: "7uqiatbag0oummhehec0mfn0na",
    summary: "Vice Night - Events by CPGD x Myca",
    description: `You are hosting this event. View the public page at https://luma.com/y0ngkm04\n\nManage the event at https://luma.com/event/manage/evt-vcdd9wkMNmLFpm7\n\nAddress:\nEarshot\nNew York, New York\n\nCPGD and Myca Collective are hosting an invite-only cocktail night for ~50 of our favorite people in CPG, media, and hospitality.\nWe're taking over Earshot, a studio/creative space in downtown Manhattan with a full DJ booth, on Wednesday, April 29th for an evening of drinks, samplings, and good conversations with a curated room of CPG founders, food & bev media, and hospitality groups.\nThink launch party meets cocktail hour. We're bringing in 20+ alcohol brands for samplings, plus 10+ THC, tobacco, and non-alc brands. DJ spinning all night, good vibes.\n\nHosted by Ali Lee & Emma Forman`,
    location: "Earshot, 255 Canal St floor 3, New York, NY 10013, USA",
    start: "2026-04-29T20:00:00-04:00",
    end: "2026-04-29T22:00:00-04:00",
  },
  {
    id: "3labs3t8fkod4nbr147ck1ti6b",
    summary: "Joy of Sake",
    description: undefined,
    location: undefined,
    start: "2026-04-30T18:30:00-04:00",
    end: "2026-04-30T20:30:00-04:00",
  },
];

// ─── Helpers ───

function stripHtml(html: string): string {
  return html
    .replace(/<a[^>]*>/gi, "")
    .replace(/<\/a>/gi, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"');
}

function extractUrl(desc: string | undefined): string | null {
  if (!desc) return null;
  const clean = stripHtml(desc);
  // Priority: luma, partiful, resy, eventbrite, then any https
  const patterns = [
    /https:\/\/luma\.com\/event\/[^\s"<&,)]+/,
    /https:\/\/luma\.com\/[a-z0-9]+/i,
    /https:\/\/partiful\.com\/e\/[^\s"<&,)]+/,
    /https:\/\/resy\.com\/[^\s"<&,)]+/,
    /https:\/\/www\.eventbrite\.com\/[^\s"<&,)]+/,
    /https?:\/\/[^\s"<&,)]+/,
  ];
  for (const pat of patterns) {
    const match = clean.match(pat);
    if (match) {
      let url = match[0].replace(/[.,;:)\]]+$/, "");
      // Skip google redirect URLs, manage URLs
      if (url.includes("google.com/url")) continue;
      if (url.includes("/event/manage/")) continue;
      return url;
    }
  }
  return null;
}

function cleanDescription(desc: string | undefined): string | null {
  if (!desc) return null;
  let clean = stripHtml(desc);
  // Remove "Get up-to-date information at: URL" lines
  clean = clean.replace(/Get up-to-date information at:\s*https?:\/\/\S+\n*/gi, "");
  // Remove "You are hosting this event..." lines
  clean = clean.replace(/You are hosting this event\.[^\n]*\n*/gi, "");
  clean = clean.replace(/Manage the event at[^\n]*\n*/gi, "");
  clean = clean.replace(/View the public page at[^\n]*\n*/gi, "");
  // Remove "Address:" blocks (already have location field)
  clean = clean.replace(/Address:\n[^\n]+\n(?:[^\n]+\n)?(?:United States\n?)?/gi, "");
  // Remove standalone URLs
  clean = clean.replace(/^https?:\/\/\S+$/gm, "");
  // Remove "Full details at: URL"
  clean = clean.replace(/Full details at:\s*https?:\/\/\S+/gi, "");
  // Clean up extra whitespace
  clean = clean.replace(/\n{3,}/g, "\n\n").trim();
  return clean || null;
}

function extractHost(desc: string | undefined): string | null {
  if (!desc) return null;
  const clean = stripHtml(desc);
  const match = clean.match(/Hosted by\s+(.+?)$/m);
  if (match) {
    let host = match[1].trim();
    // Remove trailing "& N others" for cleaner display
    host = host.replace(/\s*&\s*\d+\s*others?\s*$/, "").trim();
    return host;
  }
  return null;
}

function detectCity(location: string | undefined): string {
  if (!location) return "New York";
  const loc = location.toLowerCase();
  if (loc.includes("san francisco") || loc.includes(", sf") || loc.includes(", ca ")) return "San Francisco";
  if (loc.includes("los angeles") || loc.includes(", la")) return "Los Angeles";
  if (loc.includes("chicago")) return "Chicago";
  if (loc.includes("london")) return "London";
  return "New York";
}

function detectPlatform(url: string | null): string | null {
  if (!url) return null;
  if (url.includes("luma.com")) return "luma";
  if (url.includes("partiful.com")) return "partiful";
  if (url.includes("resy.com")) return "resy";
  if (url.includes("eventbrite.com")) return "eventbrite";
  return "website";
}

function formatTime(isoStr: string): string | null {
  const dt = new Date(isoStr);
  if (isNaN(dt.getTime())) return null;
  return dt.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "America/New_York",
  });
}

function formatDate(isoStr: string): string {
  const dt = new Date(isoStr);
  return dt.toISOString().split("T")[0];
}

function getDayOfWeek(dateStr: string): string {
  return new Date(dateStr + "T12:00:00").toLocaleDateString("en-US", { weekday: "long" });
}

// ─── Main ───

async function main() {
  console.log(`Syncing ${calendarEvents.length} events from Myca Collective calendar...\n`);

  let inserted = 0, updated = 0, skipped = 0;

  for (const e of calendarEvents) {
    const sourceEventId = `myca-cal-${e.id}`;
    const rsvpUrl = extractUrl(e.description);
    const description = cleanDescription(e.description);
    const host = extractHost(e.description);
    const date = formatDate(e.start);
    const city = detectCity(e.location);

    const row: any = {
      title: e.summary,
      host,
      description,
      date,
      day_of_week: getDayOfWeek(date),
      start_time: formatTime(e.start),
      end_time: formatTime(e.end),
      location: e.location || null,
      city,
      rsvp_url: rsvpUrl,
      rsvp_platform: detectPlatform(rsvpUrl),
      source: "calendar",
      source_event_id: sourceEventId,
      status: "approved",
    };

    // Check if exists
    const { data: existing } = await sb
      .from("events")
      .select("id, description, rsvp_url")
      .eq("source_event_id", sourceEventId)
      .single();

    if (existing) {
      const { error } = await sb.from("events").update(row).eq("id", existing.id);
      if (error) {
        console.log(`  ERROR updating ${e.summary}: ${error.message}`);
      } else {
        const changes = [];
        if (row.description && !existing.description) changes.push("desc");
        if (row.rsvp_url && row.rsvp_url !== existing.rsvp_url) changes.push("url");
        if (changes.length) {
          console.log(`  UPDATED [${date}] ${e.summary.substring(0, 50)} (${changes.join(", ")})`);
        } else {
          console.log(`  SYNCED  [${date}] ${e.summary.substring(0, 50)}`);
        }
        updated++;
      }
    } else {
      const { error } = await sb.from("events").insert(row);
      if (error) {
        console.log(`  ERROR inserting ${e.summary}: ${error.message}`);
      } else {
        console.log(`  NEW     [${date}] ${e.summary.substring(0, 50)}`);
        inserted++;
      }
    }
  }

  console.log(`\nDone: ${inserted} new, ${updated} updated.`);
}

main();
