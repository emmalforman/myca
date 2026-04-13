import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/auth";

export const dynamic = "force-dynamic";

const ALLOWED_HOSTS = [
  "linkedin.com",
  "www.linkedin.com",
  "greenhouse.io",
  "boards.greenhouse.io",
  "job-boards.greenhouse.io",
  "lever.co",
  "jobs.lever.co",
  "ashbyhq.com",
  "jobs.ashbyhq.com",
  "wellfound.com",
  "www.wellfound.com",
  "angel.co",
  "www.angel.co",
  "indeed.com",
  "www.indeed.com",
  "jobs.gusto.com",
  "apply.workable.com",
  "rippling.com",
  "www.rippling.com",
];

function isAllowedUrl(urlString: string): boolean {
  try {
    const parsed = new URL(urlString);
    if (parsed.protocol !== "https:") return false;
    return ALLOWED_HOSTS.some(
      (host) =>
        parsed.hostname === host || parsed.hostname.endsWith("." + host)
    );
  } catch {
    return false;
  }
}

function extractMeta(html: string, attrMatch: string): string | null {
  const escaped = attrMatch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const patterns = [
    new RegExp(
      `<meta[^>]*${escaped}[^>]*content=["']([^"']+)["'][^>]*/?>`,
      "i"
    ),
    new RegExp(
      `<meta[^>]*content=["']([^"']+)["'][^>]*${escaped}[^>]*/?>`,
      "i"
    ),
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return match[1];
  }
  return null;
}

function extractTitle(html: string): string | null {
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return titleMatch?.[1]?.trim() || null;
}

function cleanText(text: string | null): string {
  if (!text) return "";
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function detectPlatform(url: string): string {
  if (url.includes("linkedin.com")) return "linkedin";
  if (url.includes("greenhouse.io")) return "greenhouse";
  if (url.includes("lever.co")) return "lever";
  if (url.includes("ashbyhq.com")) return "ashby";
  if (url.includes("wellfound.com") || url.includes("angel.co"))
    return "wellfound";
  if (url.includes("indeed.com")) return "indeed";
  if (url.includes("workable.com")) return "workable";
  if (url.includes("gusto.com")) return "gusto";
  if (url.includes("rippling.com")) return "rippling";
  return "other";
}

function parseGreenhouseCompany(url: string): string | null {
  // boards.greenhouse.io/companyname/jobs/123 or job-boards.greenhouse.io/companyname/jobs/123
  const match = url.match(/(?:boards|job-boards)\.greenhouse\.io\/([^/]+)/);
  if (match) {
    return match[1]
      .replace(/[-_]/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }
  return null;
}

function parseLeverCompany(url: string): string | null {
  // jobs.lever.co/companyname/job-id
  const match = url.match(/jobs\.lever\.co\/([^/]+)/);
  if (match) {
    return match[1]
      .replace(/[-_]/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }
  return null;
}

function parseJobDetails(html: string, url: string) {
  const platform = detectPlatform(url);

  // Try OG tags first (most reliable)
  const ogTitle = cleanText(extractMeta(html, 'property="og:title"'));
  const ogDesc = cleanText(extractMeta(html, 'property="og:description"'));
  const ogSiteName = cleanText(extractMeta(html, 'property="og:site_name"'));
  const pageTitle = cleanText(extractTitle(html));

  let title = "";
  let company = "";
  let location = "";
  let description = ogDesc;
  let jobType = "";
  let salaryRange = "";

  // Try JSON-LD (structured data)
  const jsonLdMatch = html.match(
    /<script type="application\/ld\+json">([\s\S]*?)<\/script>/
  );
  if (jsonLdMatch) {
    try {
      const jsonLd = JSON.parse(jsonLdMatch[1]);
      const posting =
        jsonLd["@type"] === "JobPosting"
          ? jsonLd
          : Array.isArray(jsonLd["@graph"])
            ? jsonLd["@graph"].find((item: any) => item["@type"] === "JobPosting")
            : null;

      if (posting) {
        title = posting.title || "";
        company =
          typeof posting.hiringOrganization === "string"
            ? posting.hiringOrganization
            : posting.hiringOrganization?.name || "";
        if (posting.jobLocation) {
          const loc = Array.isArray(posting.jobLocation)
            ? posting.jobLocation[0]
            : posting.jobLocation;
          const addr = loc?.address;
          if (addr) {
            location = [addr.addressLocality, addr.addressRegion]
              .filter(Boolean)
              .join(", ");
          }
        }
        if (posting.description) {
          // Strip HTML tags from description
          description =
            posting.description.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 500) ||
            description;
        }
        // Map employmentType to our type values
        if (posting.employmentType) {
          const etMap: Record<string, string> = {
            FULL_TIME: "full-time",
            PART_TIME: "part-time",
            CONTRACT: "contract",
            INTERN: "internship",
            INTERNSHIP: "internship",
            FREELANCE: "freelance",
            TEMPORARY: "contract",
          };
          const et = Array.isArray(posting.employmentType)
            ? posting.employmentType[0]
            : posting.employmentType;
          jobType = etMap[et] || "";
        }
        // Extract salary from JSON-LD
        if (posting.baseSalary) {
          const sal = posting.baseSalary;
          const value = sal.value;
          if (value?.minValue && value?.maxValue) {
            const currency = sal.currency || "USD";
            const sym = currency === "USD" ? "$" : currency;
            salaryRange = `${sym}${Math.round(value.minValue / 1000)}k - ${sym}${Math.round(value.maxValue / 1000)}k`;
          }
        }
      }
    } catch {
      // ignore parse errors
    }
  }

  // Platform-specific fallbacks
  if (platform === "greenhouse") {
    if (!company) company = ogSiteName || parseGreenhouseCompany(url) || "";
    if (!title && ogTitle) {
      // Greenhouse OG titles are usually just the job title
      title = ogTitle;
    }
    // Greenhouse location from page
    const ghLoc = html.match(
      /<div class="location"[^>]*>([^<]+)<\/div>/i
    );
    if (ghLoc && !location) location = cleanText(ghLoc[1]);
  }

  if (platform === "lever") {
    if (!company) company = ogSiteName || parseLeverCompany(url) || "";
    if (!title && ogTitle) {
      // Lever titles: "Company - Job Title"
      const parts = ogTitle.split(" - ");
      if (parts.length >= 2) {
        if (!company) company = parts[0].trim();
        title = parts.slice(1).join(" - ").trim();
      } else {
        title = ogTitle;
      }
    }
    // Lever location
    const leverLoc = html.match(
      /<div class="posting-categories"[^>]*>[\s\S]*?<span[^>]*>([^<]+)<\/span>/i
    );
    if (leverLoc && !location) location = cleanText(leverLoc[1]);
  }

  if (platform === "linkedin") {
    // LinkedIn titles: "Job Title at Company | LinkedIn" or similar
    if (ogTitle) {
      const atMatch = ogTitle.match(/^(.+?)\s+at\s+(.+?)(?:\s*\||\s*-\s*LinkedIn)/i);
      if (atMatch) {
        title = title || atMatch[1].trim();
        company = company || atMatch[2].trim();
      } else if (!title) {
        title = ogTitle.replace(/\s*\|.*$/, "").replace(/\s*-\s*LinkedIn.*$/i, "").trim();
      }
    }
    // LinkedIn location from description
    const locMatch = ogDesc?.match(/Location:\s*([^.·\n]+)/i);
    if (locMatch && !location) location = cleanText(locMatch[1]);
  }

  // Generic fallbacks
  if (!title && ogTitle) {
    // Remove common suffixes like "| Company" or "- Company"
    title = ogTitle.replace(/\s*[\|–—-]\s*[^|–—-]+$/, "").trim();
  }
  if (!title && pageTitle) {
    title = pageTitle.replace(/\s*[\|–—-]\s*[^|–—-]+$/, "").trim();
  }
  if (!company && ogSiteName) {
    company = ogSiteName;
  }

  // Try to extract salary from description text if not found in JSON-LD
  if (!salaryRange) {
    const salaryMatch = (description || ogDesc || "").match(
      /\$[\d,]+k?\s*[-–—]\s*\$?[\d,]+k?/i
    );
    if (salaryMatch) {
      salaryRange = salaryMatch[0].trim();
    }
  }

  // Truncate description
  if (description && description.length > 500) {
    description = description.slice(0, 497) + "...";
  }

  return {
    title: cleanText(title),
    company: cleanText(company),
    location: cleanText(location),
    description: cleanText(description),
    type: jobType,
    salaryRange,
    platform,
    applyUrl: url,
  };
}

export async function POST(request: NextRequest) {
  // Try auth but don't block — the submit page already requires login client-side
  try {
    await getAuthenticatedUser();
  } catch {}

  const { url } = await request.json();

  if (!url) {
    return NextResponse.json({ error: "url is required" }, { status: 400 });
  }

  if (!isAllowedUrl(url)) {
    return NextResponse.json(
      {
        error:
          "URL not supported. Try LinkedIn, Greenhouse, Lever, Ashby, Wellfound, or Indeed links.",
      },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
      redirect: "follow",
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch: ${response.status}` },
        { status: 400 }
      );
    }

    const html = await response.text();
    const parsed = parseJobDetails(html, url);

    return NextResponse.json(parsed);
  } catch {
    return NextResponse.json(
      { error: "Failed to parse job link" },
      { status: 500 }
    );
  }
}
