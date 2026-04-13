"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { JOB_TYPES, LOCATION_TYPES } from "@/lib/types";

export default function SubmitJobPage() {
  const [signedIn, setSignedIn] = useState(false);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [authLoading, setAuthLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const [jobUrl, setJobUrl] = useState("");
  const [parsing, setParsing] = useState(false);
  const [parsed, setParsed] = useState(false);
  const [parseError, setParseError] = useState("");
  const [showManual, setShowManual] = useState(false);

  const [form, setForm] = useState({
    title: "",
    company: "",
    location: "",
    locationType: "onsite",
    type: "full-time",
    description: "",
    applyUrl: "",
    applyEmail: "",
    salaryRange: "",
  });

  useEffect(() => {
    const supabase = getSupabaseBrowser();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSignedIn(!!session);
      setUserEmail(session?.user?.email || "");
      setUserName(
        session?.user?.user_metadata?.full_name ||
          session?.user?.user_metadata?.name ||
          ""
      );
      setAuthLoading(false);
    });
  }, []);

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function detectPlatformLabel(url: string): string {
    if (url.includes("linkedin.com")) return "LinkedIn";
    if (url.includes("greenhouse.io")) return "Greenhouse";
    if (url.includes("lever.co")) return "Lever";
    if (url.includes("ashbyhq.com")) return "Ashby";
    if (url.includes("wellfound.com") || url.includes("angel.co")) return "Wellfound";
    if (url.includes("indeed.com")) return "Indeed";
    if (url.includes("workable.com")) return "Workable";
    if (url.includes("gusto.com")) return "Gusto";
    if (url.includes("rippling.com")) return "Rippling";
    return "";
  }

  async function handleParseLink() {
    if (!jobUrl) return;
    setParsing(true);
    setParseError("");

    try {
      const res = await fetch("/api/jobs/parse-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: jobUrl }),
      });
      const data = await res.json();

      if (!res.ok) {
        setParseError(data.error || "Could not parse link");
        setParsing(false);
        return;
      }

      setForm((f) => ({
        ...f,
        title: data.title || f.title,
        company: data.company || f.company,
        location: data.location || f.location,
        description: data.description || f.description,
        applyUrl: data.applyUrl || f.applyUrl,
        type: data.type || f.type,
        salaryRange: data.salaryRange || f.salaryRange,
      }));
      setParsed(true);
    } catch {
      setParseError("Failed to parse link. You can enter details manually.");
    }
    setParsing(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Validate: need at least title + company (from link or manual)
    if (!form.title && !form.company) {
      setError("Please paste a job link or enter details manually.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          submittedByName: userName,
          submittedByEmail: userEmail,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to submit job");
      }
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message);
    }
    setSubmitting(false);
  }

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
              Post a Job
            </p>
            <h1 className="text-3xl sm:text-4xl font-serif text-cream mb-2">
              Members Only.
            </h1>
          </div>
        </div>
        <div className="max-w-xl mx-auto px-6 py-20 text-center">
          <p className="font-serif text-xl text-ink-900 mb-3">
            Sign in to post a job
          </p>
          <p className="text-[14px] text-ink-500 mb-6">
            Myca members can share job opportunities with the community.
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

  if (submitted) {
    return (
      <div className="min-h-screen bg-ivory">
        <div className="bg-forest-950">
          <div className="max-w-6xl mx-auto px-6 lg:px-8 py-16 sm:py-20">
            <p className="text-[11px] uppercase tracking-[0.3em] text-forest-400 font-mono mb-3">
              Submitted
            </p>
            <h1 className="text-3xl sm:text-4xl font-serif text-cream mb-2">
              Thanks for sharing.
            </h1>
          </div>
        </div>
        <div className="max-w-xl mx-auto px-6 py-20 text-center">
          <p className="text-[14px] text-ink-500 mb-6">
            Your job posting has been submitted for review. It will appear on the
            board once approved.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/jobs"
              className="px-6 py-2.5 text-[13px] uppercase tracking-wide font-medium text-cream bg-forest-900 hover:bg-forest-800 transition-colors"
            >
              Back to Jobs
            </Link>
            <button
              onClick={() => {
                setSubmitted(false);
                setParsed(false);
                setJobUrl("");
                setShowManual(false);
                setForm({
                  title: "",
                  company: "",
                  location: "",
                  locationType: "onsite",
                  type: "full-time",
                  description: "",
                  applyUrl: "",
                  applyEmail: "",
                  salaryRange: "",
                });
              }}
              className="px-6 py-2.5 text-[13px] uppercase tracking-wide font-medium text-ink-700 border border-ink-300 hover:border-ink-500 transition-colors"
            >
              Post Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  const selectStyle = {
    backgroundImage:
      'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%2378716C\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'M19 9l-7 7-7-7\'/%3E%3C/svg%3E")',
    backgroundRepeat: "no-repeat" as const,
    backgroundPosition: "right 8px center",
    backgroundSize: "16px",
  };

  const platformLabel = detectPlatformLabel(jobUrl);

  return (
    <div className="min-h-screen bg-ivory">
      <div className="bg-forest-950">
        <div className="max-w-6xl mx-auto px-6 lg:px-8 py-16 sm:py-20">
          <p className="text-[11px] uppercase tracking-[0.3em] text-forest-400 font-mono mb-3">
            Submit
          </p>
          <h1 className="text-3xl sm:text-4xl font-serif text-cream mb-2">
            Post a Job.
          </h1>
          <p className="text-forest-300 text-[15px]">
            Paste a link and we&apos;ll pull the details, or enter manually.
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 lg:px-8 py-10">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Paste Link Section */}
          <div className="bg-forest-50 border border-forest-200 p-5">
            <p className="text-[12px] uppercase tracking-[0.2em] text-forest-700 font-mono mb-3">
              Paste a Job Link
            </p>
            <div className="flex gap-2">
              <input
                type="url"
                value={jobUrl}
                onChange={(e) => {
                  setJobUrl(e.target.value);
                  setParseError("");
                }}
                placeholder="LinkedIn, Greenhouse, Lever, or any job URL..."
                className="flex-1 px-4 py-2.5 bg-white border border-ink-200 text-ink-900 text-[14px] placeholder-ink-300 focus:outline-none focus:border-forest-400"
              />
              <button
                type="button"
                onClick={handleParseLink}
                disabled={!jobUrl || parsing}
                className="px-4 py-2.5 text-[12px] uppercase tracking-wider font-medium text-cream bg-forest-800 hover:bg-forest-700 disabled:bg-ink-300 transition-colors whitespace-nowrap"
              >
                {parsing ? "Parsing..." : "Import"}
              </button>
            </div>
            {platformLabel && !parsed && !parseError && (
              <p className="text-[12px] text-forest-600 font-mono mt-2">
                Detected: {platformLabel}
              </p>
            )}
            {parseError && (
              <p className="text-[12px] text-rust-600 mt-2">{parseError}</p>
            )}
            {parsed && (
              <div className="mt-3 bg-white border border-forest-200 p-4">
                <p className="text-[11px] uppercase tracking-[0.15em] text-forest-600 font-mono mb-2">
                  Imported Details
                </p>
                <p className="font-serif text-ink-900">
                  {form.title || "No title found"}
                </p>
                <p className="text-[14px] text-ink-500">
                  {form.company || "No company found"}
                  {form.location ? ` · ${form.location}` : ""}
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {form.type && (
                    <span className="px-2 py-0.5 text-[11px] uppercase tracking-wider font-mono text-forest-700 bg-forest-50 border border-forest-200">
                      {form.type.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join("-")}
                    </span>
                  )}
                  {form.salaryRange && (
                    <span className="px-2 py-0.5 text-[11px] font-mono text-ink-500 bg-ink-50 border border-ink-200">
                      {form.salaryRange}
                    </span>
                  )}
                </div>
                {form.description && (
                  <p className="text-[13px] text-ink-400 mt-2 line-clamp-3">
                    {form.description}
                  </p>
                )}
              </div>
            )}
            <p className="text-[11px] text-ink-400 mt-2">
              Supports LinkedIn, Greenhouse, Lever, Ashby, Wellfound, and Indeed.
            </p>
          </div>

          {/* Toggle for manual entry */}
          {!showManual && (
            <button
              type="button"
              onClick={() => setShowManual(true)}
              className="text-[13px] text-ink-400 hover:text-ink-700 uppercase tracking-wider transition-colors"
            >
              {parsed ? "Edit details" : "Or enter manually"} &darr;
            </button>
          )}

          {/* Manual Entry Fields (shown if toggled or if link was parsed for editing) */}
          {showManual && (
            <div className="space-y-4">
              <div>
                <label className="block text-[12px] uppercase tracking-[0.15em] text-ink-500 font-mono mb-1.5">
                  Job Title {!parsed && "*"}
                </label>
                <input
                  type="text"
                  required={!parsed}
                  value={form.title}
                  onChange={(e) => update("title", e.target.value)}
                  placeholder="e.g. Senior Brand Designer"
                  className="w-full px-4 py-2.5 bg-white border border-ink-200 text-ink-900 text-[14px] placeholder-ink-300 focus:outline-none focus:border-forest-400"
                />
              </div>

              <div>
                <label className="block text-[12px] uppercase tracking-[0.15em] text-ink-500 font-mono mb-1.5">
                  Company {!parsed && "*"}
                </label>
                <input
                  type="text"
                  required={!parsed}
                  value={form.company}
                  onChange={(e) => update("company", e.target.value)}
                  placeholder="Company or brand name"
                  className="w-full px-4 py-2.5 bg-white border border-ink-200 text-ink-900 text-[14px] placeholder-ink-300 focus:outline-none focus:border-forest-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] uppercase tracking-[0.15em] text-ink-500 font-mono mb-1.5">
                    Job Type
                  </label>
                  <select
                    value={form.type}
                    onChange={(e) => update("type", e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-ink-200 text-ink-900 text-[14px] focus:outline-none focus:border-forest-400 appearance-none cursor-pointer"
                    style={selectStyle}
                  >
                    {JOB_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t
                          .split("-")
                          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                          .join("-")}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[12px] uppercase tracking-[0.15em] text-ink-500 font-mono mb-1.5">
                    Location Type
                  </label>
                  <select
                    value={form.locationType}
                    onChange={(e) => update("locationType", e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-ink-200 text-ink-900 text-[14px] focus:outline-none focus:border-forest-400 appearance-none cursor-pointer"
                    style={selectStyle}
                  >
                    {LOCATION_TYPES.map((lt) => (
                      <option key={lt} value={lt}>
                        {lt.charAt(0).toUpperCase() + lt.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] uppercase tracking-[0.15em] text-ink-500 font-mono mb-1.5">
                    Location
                  </label>
                  <input
                    type="text"
                    value={form.location}
                    onChange={(e) => update("location", e.target.value)}
                    placeholder="e.g. New York, NY"
                    className="w-full px-4 py-2.5 bg-white border border-ink-200 text-ink-900 text-[14px] placeholder-ink-300 focus:outline-none focus:border-forest-400"
                  />
                </div>
                <div>
                  <label className="block text-[12px] uppercase tracking-[0.15em] text-ink-500 font-mono mb-1.5">
                    Salary Range
                  </label>
                  <input
                    type="text"
                    value={form.salaryRange}
                    onChange={(e) => update("salaryRange", e.target.value)}
                    placeholder="e.g. $120k - $150k"
                    className="w-full px-4 py-2.5 bg-white border border-ink-200 text-ink-900 text-[14px] placeholder-ink-300 focus:outline-none focus:border-forest-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[12px] uppercase tracking-[0.15em] text-ink-500 font-mono mb-1.5">
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => update("description", e.target.value)}
                  rows={5}
                  placeholder="Describe the role, responsibilities, and what you're looking for..."
                  className="w-full px-4 py-2.5 bg-white border border-ink-200 text-ink-900 text-[14px] placeholder-ink-300 focus:outline-none focus:border-forest-400 resize-none"
                />
              </div>

              <div className="bg-forest-50 border border-forest-200 p-5">
                <p className="text-[12px] uppercase tracking-[0.2em] text-forest-700 font-mono mb-3">
                  How to Apply
                </p>
                <div className="space-y-3">
                  <div>
                    <label className="block text-[12px] uppercase tracking-[0.15em] text-ink-500 font-mono mb-1.5">
                      Application URL
                    </label>
                    <input
                      type="url"
                      value={form.applyUrl}
                      onChange={(e) => update("applyUrl", e.target.value)}
                      placeholder="Link to application or job posting"
                      className="w-full px-4 py-2.5 bg-white border border-ink-200 text-ink-900 text-[14px] placeholder-ink-300 focus:outline-none focus:border-forest-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[12px] uppercase tracking-[0.15em] text-ink-500 font-mono mb-1.5">
                      Or Email
                    </label>
                    <input
                      type="email"
                      value={form.applyEmail}
                      onChange={(e) => update("applyEmail", e.target.value)}
                      placeholder="Email to send applications to"
                      className="w-full px-4 py-2.5 bg-white border border-ink-200 text-ink-900 text-[14px] placeholder-ink-300 focus:outline-none focus:border-forest-400"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {error && (
            <p className="text-[13px] text-rust-600 bg-rust-50 border border-rust-200 px-4 py-2">
              {error}
            </p>
          )}

          <div className="flex items-center justify-between pt-2">
            <Link
              href="/jobs"
              className="text-[13px] text-ink-400 hover:text-ink-700 uppercase tracking-wider"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting || (!parsed && !showManual)}
              className="px-8 py-2.5 text-[13px] uppercase tracking-wide font-medium text-cream bg-forest-900 hover:bg-forest-800 disabled:bg-ink-400 transition-colors"
            >
              {submitting ? "Submitting..." : "Post Job"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
