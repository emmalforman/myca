"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import MemberLogin from "@/components/MemberLogin";

const ADMIN_EMAILS = ["emmalforman7@gmail.com", "emma@mycacollective.com"];

const CATEGORIES = [
  { value: "food-startup", label: "Food Startup" },
  { value: "large-food", label: "Large Food / CPG" },
  { value: "vc", label: "VC" },
  { value: "community", label: "Community" },
  { value: "other", label: "Other" },
];

const PLATFORMS = [
  { value: "greenhouse", label: "Greenhouse" },
  { value: "lever", label: "Lever" },
  { value: "ashby", label: "Ashby" },
];

interface Source {
  id: string;
  companyName: string;
  platform: string;
  slug: string;
  category: string;
  isActive: boolean;
  lastSyncedAt: string | null;
}

function JobSourcesPageInner() {
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState("");
  const [authLoading, setAuthLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [adding, setAdding] = useState(false);

  const [newSource, setNewSource] = useState({
    companyName: "",
    platform: "greenhouse",
    slug: "",
    category: "other",
  });

  const isAdmin = ADMIN_EMAILS.includes(userEmail.toLowerCase());

  useEffect(() => {
    const supabase = getSupabaseBrowser();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserEmail(session?.user?.email || "");
      setAuthLoading(false);
      if (session) fetchSources();
      else setLoading(false);
    });
  }, []);

  async function fetchSources() {
    try {
      const res = await fetch("/api/jobs/sources");
      const data = await res.json();
      setSources(data.sources || []);
    } catch {}
    setLoading(false);
  }

  async function handleSync() {
    setSyncing(true);
    setSyncResult("");
    try {
      const res = await fetch("/api/jobs/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminEmail: userEmail }),
      });
      const data = await res.json();
      setSyncResult(
        `Synced ${data.synced} new jobs from ${data.sources} sources (${data.skipped} already imported)${data.errors ? `. Errors: ${data.errors.length}` : ""}`
      );
    } catch {
      setSyncResult("Sync failed");
    }
    setSyncing(false);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setAdding(true);
    try {
      const res = await fetch("/api/jobs/sources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newSource, adminEmail: userEmail }),
      });
      if (res.ok) {
        setNewSource({ companyName: "", platform: "greenhouse", slug: "", category: "other" });
        setShowAdd(false);
        fetchSources();
      }
    } catch {}
    setAdding(false);
  }

  async function handleToggle(id: string, isActive: boolean) {
    await fetch("/api/jobs/sources", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, isActive: !isActive, adminEmail: userEmail }),
    });
    setSources((prev) =>
      prev.map((s) => (s.id === id ? { ...s, isActive: !isActive } : s))
    );
  }

  async function handleDelete(id: string) {
    await fetch(`/api/jobs/sources?id=${id}&adminEmail=${encodeURIComponent(userEmail)}`, {
      method: "DELETE",
    });
    setSources((prev) => prev.filter((s) => s.id !== id));
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-ivory flex items-center justify-center">
        <div className="w-8 h-8 border border-forest-200 border-t-forest-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-ivory">
        <div className="bg-forest-950">
          <div className="max-w-6xl mx-auto px-6 lg:px-8 py-16 sm:py-20">
            <h1 className="text-3xl font-serif text-cream">Not Authorized</h1>
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
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.3em] text-forest-400 font-mono mb-3">
                Admin
              </p>
              <h1 className="text-3xl sm:text-4xl font-serif text-cream mb-2">
                Job Sources.
              </h1>
              <p className="text-forest-300 text-[15px]">
                Manage company job boards to auto-import roles.
              </p>
            </div>
            <div className="flex gap-2 self-start sm:self-auto">
              <button
                onClick={handleSync}
                disabled={syncing}
                className="px-5 py-2.5 text-[13px] uppercase tracking-wide font-medium text-forest-900 bg-cream hover:bg-white disabled:bg-ink-200 transition-colors"
              >
                {syncing ? "Syncing..." : "Sync Now"}
              </button>
              <Link
                href="/jobs"
                className="px-5 py-2.5 text-[13px] uppercase tracking-wide font-medium text-forest-300 border border-forest-600 hover:border-forest-400 transition-colors"
              >
                Back to Jobs
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 lg:px-8 py-8">
        {syncResult && (
          <div className="mb-6 p-4 bg-forest-50 border border-forest-200 text-[14px] text-forest-800">
            {syncResult}
          </div>
        )}

        {/* Add Source */}
        {!showAdd ? (
          <button
            onClick={() => setShowAdd(true)}
            className="mb-6 px-5 py-2.5 text-[13px] uppercase tracking-wide font-medium text-cream bg-forest-900 hover:bg-forest-800 transition-colors"
          >
            + Add Company
          </button>
        ) : (
          <form onSubmit={handleAdd} className="mb-6 bg-white border border-ink-200 p-5">
            <p className="text-[12px] uppercase tracking-[0.2em] text-ink-500 font-mono mb-4">
              Add Job Source
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <input
                type="text"
                required
                value={newSource.companyName}
                onChange={(e) => setNewSource((s) => ({ ...s, companyName: e.target.value }))}
                placeholder="Company Name"
                className="px-4 py-2.5 bg-white border border-ink-200 text-ink-900 text-[14px] placeholder-ink-300 focus:outline-none focus:border-forest-400"
              />
              <select
                value={newSource.platform}
                onChange={(e) => setNewSource((s) => ({ ...s, platform: e.target.value }))}
                className="px-4 py-2.5 bg-white border border-ink-200 text-ink-900 text-[14px] focus:outline-none focus:border-forest-400 appearance-none cursor-pointer"
                style={selectStyle}
              >
                {PLATFORMS.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
              <input
                type="text"
                required
                value={newSource.slug}
                onChange={(e) => setNewSource((s) => ({ ...s, slug: e.target.value }))}
                placeholder="Board slug (e.g. sweetgreen)"
                className="px-4 py-2.5 bg-white border border-ink-200 text-ink-900 text-[14px] placeholder-ink-300 focus:outline-none focus:border-forest-400"
              />
              <select
                value={newSource.category}
                onChange={(e) => setNewSource((s) => ({ ...s, category: e.target.value }))}
                className="px-4 py-2.5 bg-white border border-ink-200 text-ink-900 text-[14px] focus:outline-none focus:border-forest-400 appearance-none cursor-pointer"
                style={selectStyle}
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2 mt-3">
              <button
                type="submit"
                disabled={adding}
                className="px-5 py-2 text-[12px] uppercase tracking-wider font-medium text-cream bg-forest-800 hover:bg-forest-700 disabled:bg-ink-300 transition-colors"
              >
                {adding ? "Adding..." : "Add"}
              </button>
              <button
                type="button"
                onClick={() => setShowAdd(false)}
                className="px-5 py-2 text-[12px] uppercase tracking-wider font-medium text-ink-500 hover:text-ink-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Sources List */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border border-forest-200 border-t-forest-600 rounded-full animate-spin" />
          </div>
        ) : sources.length === 0 ? (
          <div className="text-center py-20">
            <p className="font-serif text-xl text-ink-900 mb-2">No sources yet.</p>
            <p className="text-[14px] text-ink-500">
              Add company job boards to start auto-importing roles.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {sources.map((source) => (
              <div
                key={source.id}
                className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-4 border ${
                  source.isActive
                    ? "bg-white border-ink-100"
                    : "bg-ink-50 border-ink-100 opacity-60"
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-serif text-ink-900">
                      {source.companyName}
                    </span>
                    <span className="px-2 py-0.5 text-[10px] uppercase tracking-wider font-mono text-forest-700 bg-forest-50 border border-forest-200">
                      {source.platform}
                    </span>
                    <span className="px-2 py-0.5 text-[10px] uppercase tracking-wider font-mono text-ink-500 bg-ink-50 border border-ink-200">
                      {source.category}
                    </span>
                  </div>
                  <p className="text-[12px] text-ink-400 font-mono mt-0.5">
                    {source.slug}
                    {source.lastSyncedAt && (
                      <span className="ml-2">
                        · Last synced: {new Date(source.lastSyncedAt).toLocaleDateString()}
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => handleToggle(source.id, source.isActive)}
                    className={`px-3 py-1.5 text-[11px] uppercase tracking-wider font-medium transition-colors ${
                      source.isActive
                        ? "text-ink-500 border border-ink-300 hover:bg-ink-50"
                        : "text-forest-700 border border-forest-300 hover:bg-forest-50"
                    }`}
                  >
                    {source.isActive ? "Pause" : "Resume"}
                  </button>
                  <button
                    onClick={() => handleDelete(source.id)}
                    className="px-3 py-1.5 text-[11px] uppercase tracking-wider font-medium text-rust-600 border border-rust-300 hover:bg-rust-50 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function JobSourcesPage() {
  return (
    <MemberLogin>
      <JobSourcesPageInner />
    </MemberLogin>
  );
}
