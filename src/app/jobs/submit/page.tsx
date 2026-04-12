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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
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
            Your job posting has been submitted for review. It will appear on the board once approved.
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
            Share an opportunity with the Myca community. It will be reviewed
            before appearing on the board.
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 lg:px-8 py-10">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-[12px] uppercase tracking-[0.15em] text-ink-500 font-mono mb-1.5">
                Job Title *
              </label>
              <input
                type="text"
                required
                value={form.title}
                onChange={(e) => update("title", e.target.value)}
                placeholder="e.g. Senior Brand Designer"
                className="w-full px-4 py-2.5 bg-white border border-ink-200 text-ink-900 text-[14px] placeholder-ink-300 focus:outline-none focus:border-forest-400"
              />
            </div>

            <div>
              <label className="block text-[12px] uppercase tracking-[0.15em] text-ink-500 font-mono mb-1.5">
                Company *
              </label>
              <input
                type="text"
                required
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
                Description *
              </label>
              <textarea
                required
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
              disabled={submitting}
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
