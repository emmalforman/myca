"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import type { Job, Member } from "@/lib/types";

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const days = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (days === 0) return "Today";
  if (days === 1) return "1 day ago";
  if (days < 7) return `${days} days ago`;
  if (days < 14) return "1 week ago";
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

function typeLabel(type: string): string {
  return type
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join("-");
}

function locationTypeLabel(lt: string): string {
  return lt.charAt(0).toUpperCase() + lt.slice(1);
}

function normalizeCompany(name: string): string {
  return name
    .toLowerCase()
    .replace(/,?\s*(inc\.?|llc\.?|ltd\.?|co\.?|corp\.?)$/i, "")
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [signedIn, setSignedIn] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [locationTypeFilter, setLocationTypeFilter] = useState("");

  useEffect(() => {
    const supabase = getSupabaseBrowser();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSignedIn(!!session);
      setAuthLoading(false);
      if (session) {
        fetchJobs();
        fetchMembers();
      } else {
        setLoading(false);
      }
    });
  }, []);

  async function fetchJobs() {
    try {
      const res = await fetch("/api/jobs");
      const data = await res.json();
      setJobs(data.jobs || []);
    } catch {
      // fail silently
    }
    setLoading(false);
  }

  async function fetchMembers() {
    try {
      const res = await fetch("/api/members");
      const data = await res.json();
      setMembers(data.members || []);
    } catch {
      // fail silently
    }
  }

  // Build a map of normalized company name -> member names
  const companyMembers = useMemo(() => {
    const map: Record<string, { name: string; photoUrl?: string }[]> = {};
    for (const m of members) {
      if (!m.company) continue;
      const key = normalizeCompany(m.company);
      if (!key) continue;
      if (!map[key]) map[key] = [];
      map[key].push({ name: m.name, photoUrl: m.photoUrl });
    }
    return map;
  }, [members]);

  function getMembersAtCompany(
    company: string
  ): { name: string; photoUrl?: string }[] {
    const key = normalizeCompany(company);
    return companyMembers[key] || [];
  }

  const filtered = useMemo(() => {
    return jobs.filter((job) => {
      if (typeFilter && job.type !== typeFilter) return false;
      if (locationTypeFilter && job.locationType !== locationTypeFilter)
        return false;
      if (search) {
        const q = search.toLowerCase();
        const haystack =
          `${job.title} ${job.company} ${job.location || ""} ${job.description}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [jobs, search, typeFilter, locationTypeFilter]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-ivory flex items-center justify-center">
        <div className="w-8 h-8 border border-forest-200 border-t-forest-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!signedIn) {
    return (
      <div className="min-h-screen bg-ivory">
        <div className="bg-forest-950">
          <div className="max-w-6xl mx-auto px-6 lg:px-8 py-16 sm:py-20">
            <p className="text-[11px] uppercase tracking-[0.3em] text-forest-400 font-mono mb-3">
              Job Board
            </p>
            <h1 className="text-3xl sm:text-4xl font-serif text-cream mb-2">
              Members Only.
            </h1>
          </div>
        </div>
        <div className="max-w-xl mx-auto px-6 py-20 text-center">
          <p className="font-serif text-xl text-ink-900 mb-3">
            Sign in to browse jobs
          </p>
          <p className="text-[14px] text-ink-500 mb-6">
            Myca members share job opportunities, freelance gigs, and open roles
            within the community.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/directory"
              className="px-6 py-2.5 text-[13px] uppercase tracking-wide font-medium text-cream bg-forest-900 hover:bg-forest-800 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/join"
              className="px-6 py-2.5 text-[13px] uppercase tracking-wide font-medium text-ink-700 border border-ink-300 hover:border-ink-500 transition-colors"
            >
              Apply to Myca
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const selectStyle = {
    backgroundImage:
      'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%2378716C\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'M19 9l-7 7-7-7\'/%3E%3C/svg%3E")',
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 8px center",
    backgroundSize: "16px",
  };

  return (
    <div className="min-h-screen bg-ivory">
      {/* Header */}
      <div className="bg-forest-950">
        <div className="max-w-6xl mx-auto px-6 lg:px-8 py-16 sm:py-20">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.3em] text-forest-400 font-mono mb-3">
                Community
              </p>
              <h1 className="text-3xl sm:text-4xl font-serif text-cream mb-2">
                Job Board.
              </h1>
              <p className="text-forest-300 text-[15px]">
                Opportunities shared by Myca members.
              </p>
            </div>
            <Link
              href="/jobs/submit"
              className="self-start sm:self-auto px-6 py-2.5 text-[13px] uppercase tracking-wide font-medium text-forest-900 bg-cream hover:bg-white transition-colors"
            >
              Post a Job
            </Link>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-6xl mx-auto px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search jobs..."
            className="flex-1 px-4 py-2.5 bg-white border border-ink-200 text-ink-900 text-[14px] placeholder-ink-300 focus:outline-none focus:border-forest-400"
          />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2.5 bg-white border border-ink-200 text-ink-900 text-[14px] focus:outline-none focus:border-forest-400 appearance-none cursor-pointer"
            style={selectStyle}
          >
            <option value="">All Types</option>
            <option value="full-time">Full-Time</option>
            <option value="part-time">Part-Time</option>
            <option value="contract">Contract</option>
            <option value="freelance">Freelance</option>
            <option value="internship">Internship</option>
          </select>
          <select
            value={locationTypeFilter}
            onChange={(e) => setLocationTypeFilter(e.target.value)}
            className="px-4 py-2.5 bg-white border border-ink-200 text-ink-900 text-[14px] focus:outline-none focus:border-forest-400 appearance-none cursor-pointer"
            style={selectStyle}
          >
            <option value="">All Locations</option>
            <option value="onsite">Onsite</option>
            <option value="remote">Remote</option>
            <option value="hybrid">Hybrid</option>
          </select>
        </div>
      </div>

      {/* Job Listings */}
      <div className="max-w-6xl mx-auto px-6 lg:px-8 pb-20">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border border-forest-200 border-t-forest-600 rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="font-serif text-xl text-ink-900 mb-2">No jobs yet.</p>
            <p className="text-[14px] text-ink-500 mb-6">
              Be the first to share an opportunity with the community.
            </p>
            <Link
              href="/jobs/submit"
              className="inline-block px-6 py-2.5 text-[13px] uppercase tracking-wide font-medium text-cream bg-forest-900 hover:bg-forest-800 transition-colors"
            >
              Post a Job
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((job) => {
              const membersHere = getMembersAtCompany(job.company);
              return (
                <div
                  key={job.id}
                  className="bg-white border border-ink-100 hover:border-ink-300 transition-colors p-5 sm:p-6"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-serif text-lg text-ink-900 mb-1">
                        {job.title}
                      </h3>
                      <p className="text-[14px] text-ink-600 mb-2">
                        {job.company}
                      </p>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {job.type && (
                          <span className="px-2.5 py-0.5 text-[11px] uppercase tracking-wider font-mono text-forest-700 bg-forest-50 border border-forest-200">
                            {typeLabel(job.type)}
                          </span>
                        )}
                        {job.locationType && (
                          <span className="px-2.5 py-0.5 text-[11px] uppercase tracking-wider font-mono text-ink-500 bg-ink-50 border border-ink-200">
                            {locationTypeLabel(job.locationType)}
                          </span>
                        )}
                        {job.location && (
                          <span className="text-[12px] text-ink-400">
                            {job.location}
                          </span>
                        )}
                        {job.salaryRange && (
                          <span className="text-[12px] text-ink-400">
                            {job.salaryRange}
                          </span>
                        )}
                      </div>
                      <p className="text-[14px] text-ink-500 line-clamp-2">
                        {job.description}
                      </p>

                      {/* Member connection badge */}
                      {membersHere.length > 0 && (
                        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-ink-100">
                          <div className="flex -space-x-2">
                            {membersHere.slice(0, 3).map((m, i) =>
                              m.photoUrl ? (
                                <img
                                  key={i}
                                  src={m.photoUrl}
                                  alt={m.name}
                                  className="w-6 h-6 rounded-full border-2 border-white object-cover"
                                />
                              ) : (
                                <div
                                  key={i}
                                  className="w-6 h-6 rounded-full border-2 border-white bg-forest-100 flex items-center justify-center text-[10px] font-medium text-forest-700"
                                >
                                  {m.name.charAt(0)}
                                </div>
                              )
                            )}
                          </div>
                          <span className="text-[12px] text-forest-700">
                            {membersHere.length === 1
                              ? `${membersHere[0].name.split(" ")[0]} works here`
                              : `${membersHere.length} Myca members work here`}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      {job.createdAt && (
                        <span className="text-[12px] text-ink-400 font-mono">
                          {timeAgo(job.createdAt)}
                        </span>
                      )}
                      {(job.applyUrl || job.applyEmail) && (
                        <a
                          href={
                            job.applyUrl || `mailto:${job.applyEmail}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-5 py-2 text-[12px] uppercase tracking-wider font-medium text-cream bg-forest-900 hover:bg-forest-800 transition-colors"
                        >
                          Apply
                        </a>
                      )}
                    </div>
                  </div>
                  {job.submittedByName && !membersHere.length && (
                    <p className="text-[11px] text-ink-300 mt-3 pt-3 border-t border-ink-100">
                      Shared by {job.submittedByName}
                    </p>
                  )}
                  {job.submittedByName && membersHere.length > 0 && (
                    <p className="text-[11px] text-ink-300 mt-2">
                      Shared by {job.submittedByName}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
