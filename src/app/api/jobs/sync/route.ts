import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, isAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function getSupabaseAdmin() {
  const { createClient } = require("@supabase/supabase-js");
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

interface ATSJob {
  title: string;
  location: string;
  applyUrl: string;
  sourceJobId: string;
}

async function fetchGreenhouseJobs(slug: string): Promise<ATSJob[]> {
  const res = await fetch(
    `https://boards-api.greenhouse.io/v1/boards/${slug}/jobs?content=true`,
    { headers: { "User-Agent": "Myca-JobSync/1.0" } }
  );
  if (!res.ok) return [];
  const data = await res.json();
  return (data.jobs || []).map((job: any) => ({
    title: job.title,
    location: job.location?.name || "",
    applyUrl: job.absolute_url || `https://boards.greenhouse.io/${slug}/jobs/${job.id}`,
    sourceJobId: `gh-${slug}-${job.id}`,
  }));
}

async function fetchLeverJobs(slug: string): Promise<ATSJob[]> {
  const res = await fetch(
    `https://api.lever.co/v0/postings/${slug}`,
    { headers: { "User-Agent": "Myca-JobSync/1.0" } }
  );
  if (!res.ok) return [];
  const data = await res.json();
  return (data || []).map((job: any) => ({
    title: job.text,
    location: job.categories?.location || "",
    applyUrl: job.hostedUrl || `https://jobs.lever.co/${slug}/${job.id}`,
    sourceJobId: `lever-${slug}-${job.id}`,
  }));
}

async function fetchAshbyJobs(slug: string): Promise<ATSJob[]> {
  const res = await fetch("https://jobs.ashbyhq.com/api/non-user-graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "Myca-JobSync/1.0",
    },
    body: JSON.stringify({
      operationName: "ApiJobBoardWithTeams",
      variables: { organizationHostedJobsPageName: slug },
      query: `query ApiJobBoardWithTeams($organizationHostedJobsPageName: String!) {
        jobBoard: jobBoardWithTeams(organizationHostedJobsPageName: $organizationHostedJobsPageName) {
          jobPostings {
            id title locationName
          }
        }
      }`,
    }),
  });
  if (!res.ok) return [];
  const data = await res.json();
  const postings = data?.data?.jobBoard?.jobPostings || [];
  return postings.map((job: any) => ({
    title: job.title,
    location: job.locationName || "",
    applyUrl: `https://jobs.ashbyhq.com/${slug}/${job.id}`,
    sourceJobId: `ashby-${slug}-${job.id}`,
  }));
}

export async function POST(request: NextRequest) {
  // Verify admin or cron secret
  let isAuthorized = false;

  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");
  if (secret && secret === process.env.ADMIN_SECRET) {
    isAuthorized = true;
  }

  if (!isAuthorized) {
    try {
      const user = await getAuthenticatedUser();
      if (user?.email && isAdmin(user.email)) {
        isAuthorized = true;
      }
    } catch {}
  }

  // Also accept adminEmail in body
  if (!isAuthorized) {
    try {
      const body = await request.clone().json();
      if (body.adminEmail && isAdmin(body.adminEmail)) {
        isAuthorized = true;
      }
    } catch {}
  }

  if (!isAuthorized) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabaseAdmin = getSupabaseAdmin();

  // Fetch active sources
  const { data: sources, error: sourcesError } = await supabaseAdmin
    .from("job_sources")
    .select("*")
    .eq("is_active", true);

  if (sourcesError || !sources?.length) {
    return NextResponse.json({
      error: sourcesError ? "Failed to fetch sources" : "No active sources",
      synced: 0,
    });
  }

  let totalSynced = 0;
  let totalSkipped = 0;
  const errors: string[] = [];

  for (const source of sources) {
    try {
      let atsJobs: ATSJob[] = [];

      if (source.platform === "greenhouse") {
        atsJobs = await fetchGreenhouseJobs(source.slug);
      } else if (source.platform === "lever") {
        atsJobs = await fetchLeverJobs(source.slug);
      } else if (source.platform === "ashby") {
        atsJobs = await fetchAshbyJobs(source.slug);
      }

      for (const job of atsJobs) {
        // Check if already imported
        const { data: existing } = await supabaseAdmin
          .from("jobs")
          .select("id")
          .eq("source_job_id", job.sourceJobId)
          .single();

        if (existing) {
          totalSkipped++;
          continue;
        }

        // Insert as approved (auto-approved from tracked sources)
        const { error: insertError } = await supabaseAdmin
          .from("jobs")
          .insert({
            title: job.title,
            company: source.company_name,
            location: job.location || null,
            location_type: "onsite",
            type: "full-time",
            description: `Open role at ${source.company_name}`,
            apply_url: job.applyUrl,
            source: source.platform,
            source_job_id: job.sourceJobId,
            submitted_by_name: "Myca Jobs",
            status: "approved",
          });

        if (insertError) {
          errors.push(`${source.company_name}: ${job.title} - ${insertError.message}`);
        } else {
          totalSynced++;
        }
      }

      // Update last_synced_at
      await supabaseAdmin
        .from("job_sources")
        .update({ last_synced_at: new Date().toISOString() })
        .eq("id", source.id);
    } catch (err: any) {
      errors.push(`${source.company_name}: ${err.message}`);
    }
  }

  return NextResponse.json({
    synced: totalSynced,
    skipped: totalSkipped,
    sources: sources.length,
    errors: errors.length > 0 ? errors : undefined,
  });
}
