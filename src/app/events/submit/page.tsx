"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { LOCATIONS } from "@/lib/types";

export default function SubmitEventPage() {
  const [signedIn, setSignedIn] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [authLoading, setAuthLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [fetchingCover, setFetchingCover] = useState(false);
  const [coverPreview, setCoverPreview] = useState("");

  const [form, setForm] = useState({
    title: "",
    host: "",
    hostCompany: "",
    description: "",
    date: "",
    startTime: "",
    endTime: "",
    location: "",
    city: "New York",
    rsvpUrl: "",
    rsvpPlatform: "",
  });

  useEffect(() => {
    const supabase = getSupabaseBrowser();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSignedIn(!!session);
      setUserEmail(session?.user?.email || "");
      setAuthLoading(false);
    });
  }, []);

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function fetchCoverImage() {
    if (!form.rsvpUrl) return;
    setFetchingCover(true);
    try {
      const res = await fetch("/api/events/fetch-cover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: form.rsvpUrl }),
      });
      const data = await res.json();
      if (data.imageUrl) setCoverPreview(data.imageUrl);
    } catch {
      // cover is optional
    }
    setFetchingCover(false);
  }

  function detectPlatform(url: string): string {
    if (url.includes("lu.ma") || url.includes("luma.com")) return "luma";
    if (url.includes("partiful.com")) return "partiful";
    if (url.includes("eventbrite.com")) return "eventbrite";
    if (url.includes("instagram.com")) return "instagram";
    return "";
  }

  function handleUrlChange(url: string) {
    update("rsvpUrl", url);
    const platform = detectPlatform(url);
    if (platform) update("rsvpPlatform", platform);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const dayOfWeek = form.date
        ? new Date(form.date + "T00:00:00").toLocaleDateString("en-US", { weekday: "long" })
        : "";

      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          dayOfWeek,
          coverImageUrl: coverPreview || null,
          source: "member_submit",
          submittedByEmail: userEmail,
          status: "pending",
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to submit event");
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
              Submit Event
            </p>
            <h1 className="text-3xl sm:text-4xl font-serif text-cream mb-2">
              Members Only.
            </h1>
          </div>
        </div>
        <div className="max-w-xl mx-auto px-6 py-20 text-center">
          <p className="font-serif text-xl text-ink-900 mb-3">
            Sign in to submit events
          </p>
          <p className="text-[14px] text-ink-500 mb-6">
            Myca members can submit events to be featured in our weekly calendar and newsletter.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/directory"
              className="px-6 py-2.5 text-[13px] uppercase tracking-wide font-medium text-cream bg-forest-900 hover:bg-forest-800 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/join-us"
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
            Your event has been submitted for review. It will appear on the calendar once approved.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/events"
              className="px-6 py-2.5 text-[13px] uppercase tracking-wide font-medium text-cream bg-forest-900 hover:bg-forest-800 transition-colors"
            >
              Back to Events
            </Link>
            <button
              onClick={() => {
                setSubmitted(false);
                setForm({ title: "", host: "", hostCompany: "", description: "", date: "", startTime: "", endTime: "", location: "", city: "New York", rsvpUrl: "", rsvpPlatform: "" });
                setCoverPreview("");
              }}
              className="px-6 py-2.5 text-[13px] uppercase tracking-wide font-medium text-ink-700 border border-ink-300 hover:border-ink-500 transition-colors"
            >
              Submit Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ivory">
      <div className="bg-forest-950">
        <div className="max-w-6xl mx-auto px-6 lg:px-8 py-16 sm:py-20">
          <p className="text-[11px] uppercase tracking-[0.3em] text-forest-400 font-mono mb-3">
            Submit
          </p>
          <h1 className="text-3xl sm:text-4xl font-serif text-cream mb-2">
            Add an Event.
          </h1>
          <p className="text-forest-300 text-[15px]">
            Share an event with the Myca community. It will be reviewed before appearing on the calendar.
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 lg:px-8 py-10">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Quick add from URL */}
          <div className="bg-forest-50 border border-forest-200 p-5">
            <p className="text-[12px] uppercase tracking-[0.2em] text-forest-700 font-mono mb-3">
              Quick Add from Link
            </p>
            <div className="flex gap-2">
              <input
                type="url"
                value={form.rsvpUrl}
                onChange={(e) => handleUrlChange(e.target.value)}
                placeholder="Paste a Luma, Partiful, or event URL..."
                className="flex-1 px-4 py-2.5 bg-white border border-ink-200 text-ink-900 text-[14px] placeholder-ink-300 focus:outline-none focus:border-forest-400"
              />
              <button
                type="button"
                onClick={fetchCoverImage}
                disabled={!form.rsvpUrl || fetchingCover}
                className="px-4 py-2.5 text-[12px] uppercase tracking-wider font-medium text-cream bg-forest-800 hover:bg-forest-700 disabled:bg-ink-300 transition-colors"
              >
                {fetchingCover ? "..." : "Get Photo"}
              </button>
            </div>
            {form.rsvpPlatform && (
              <p className="text-[12px] text-forest-600 font-mono mt-2">
                Detected: {form.rsvpPlatform}
              </p>
            )}
            {coverPreview && (
              <div className="mt-3">
                <img src={coverPreview} alt="Cover preview" className="w-full h-40 object-cover border border-ink-100" />
              </div>
            )}
          </div>

          {/* Event details */}
          <div className="space-y-4">
            <div>
              <label className="block text-[12px] uppercase tracking-[0.15em] text-ink-500 font-mono mb-1.5">
                Event Name *
              </label>
              <input type="text" required value={form.title} onChange={(e) => update("title", e.target.value)}
                placeholder="e.g. CPG Happy Hour at Soho House"
                className="w-full px-4 py-2.5 bg-white border border-ink-200 text-ink-900 text-[14px] placeholder-ink-300 focus:outline-none focus:border-forest-400" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[12px] uppercase tracking-[0.15em] text-ink-500 font-mono mb-1.5">Host</label>
                <input type="text" value={form.host} onChange={(e) => update("host", e.target.value)}
                  placeholder="Person or org hosting"
                  className="w-full px-4 py-2.5 bg-white border border-ink-200 text-ink-900 text-[14px] placeholder-ink-300 focus:outline-none focus:border-forest-400" />
              </div>
              <div>
                <label className="block text-[12px] uppercase tracking-[0.15em] text-ink-500 font-mono mb-1.5">Host Company</label>
                <input type="text" value={form.hostCompany} onChange={(e) => update("hostCompany", e.target.value)}
                  placeholder="Company or brand"
                  className="w-full px-4 py-2.5 bg-white border border-ink-200 text-ink-900 text-[14px] placeholder-ink-300 focus:outline-none focus:border-forest-400" />
              </div>
            </div>

            <div>
              <label className="block text-[12px] uppercase tracking-[0.15em] text-ink-500 font-mono mb-1.5">Description</label>
              <textarea value={form.description} onChange={(e) => update("description", e.target.value)}
                rows={3} placeholder="Brief description of the event..."
                className="w-full px-4 py-2.5 bg-white border border-ink-200 text-ink-900 text-[14px] placeholder-ink-300 focus:outline-none focus:border-forest-400 resize-none" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[12px] uppercase tracking-[0.15em] text-ink-500 font-mono mb-1.5">Date *</label>
                <input type="date" required value={form.date} onChange={(e) => update("date", e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-ink-200 text-ink-900 text-[14px] focus:outline-none focus:border-forest-400" />
              </div>
              <div>
                <label className="block text-[12px] uppercase tracking-[0.15em] text-ink-500 font-mono mb-1.5">Start Time</label>
                <input type="time" value={form.startTime} onChange={(e) => update("startTime", e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-ink-200 text-ink-900 text-[14px] focus:outline-none focus:border-forest-400" />
              </div>
              <div>
                <label className="block text-[12px] uppercase tracking-[0.15em] text-ink-500 font-mono mb-1.5">End Time</label>
                <input type="time" value={form.endTime} onChange={(e) => update("endTime", e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-ink-200 text-ink-900 text-[14px] focus:outline-none focus:border-forest-400" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[12px] uppercase tracking-[0.15em] text-ink-500 font-mono mb-1.5">Location</label>
                <input type="text" value={form.location} onChange={(e) => update("location", e.target.value)}
                  placeholder="Venue name and address"
                  className="w-full px-4 py-2.5 bg-white border border-ink-200 text-ink-900 text-[14px] placeholder-ink-300 focus:outline-none focus:border-forest-400" />
              </div>
              <div>
                <label className="block text-[12px] uppercase tracking-[0.15em] text-ink-500 font-mono mb-1.5">City</label>
                <select value={form.city} onChange={(e) => update("city", e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-ink-200 text-ink-900 text-[14px] focus:outline-none focus:border-forest-400 appearance-none cursor-pointer"
                  style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%2378716C\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'M19 9l-7 7-7-7\'/%3E%3C/svg%3E")', backgroundRepeat: "no-repeat", backgroundPosition: "right 8px center", backgroundSize: "16px" }}>
                  {LOCATIONS.map((loc) => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {error && (
            <p className="text-[13px] text-rust-600 bg-rust-50 border border-rust-200 px-4 py-2">{error}</p>
          )}

          <div className="flex items-center justify-between pt-2">
            <Link href="/events" className="text-[13px] text-ink-400 hover:text-ink-700 uppercase tracking-wider">
              Cancel
            </Link>
            <button type="submit" disabled={submitting}
              className="px-8 py-2.5 text-[13px] uppercase tracking-wide font-medium text-cream bg-forest-900 hover:bg-forest-800 disabled:bg-ink-400 transition-colors">
              {submitting ? "Submitting..." : "Submit Event"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
