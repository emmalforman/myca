"use client";

import { useState, useEffect } from "react";

interface Application {
  id: string;
  full_name: string;
  email: string;
  company: string;
  title: string;
  occupation: string;
  linkedin: string;
  phone: string;
  location: string[];
  comfort_food: string;
  hoping_to_get: string;
  excited_to_contribute: string;
  photo_url: string | null;
  status: string;
  created_at: string;
}

interface Introduction {
  id: string;
  person_a_id: string;
  person_b_id: string;
  status: string;
  context: string;
  permission_email: string;
  intro_email: string;
  created_at: string;
  archived: boolean;
  person_a: { name: string; email: string; company: string; role: string; photo_url: string } | null;
  person_b: { name: string; email: string; company: string; role: string; photo_url: string } | null;
  is_admin_intro: boolean;
}

function IntroList({ intros, formatDate }: { intros: Introduction[]; formatDate: (d: string) => string }) {
  if (intros.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="font-serif text-xl text-ink-900 mb-2">None yet.</p>
        <p className="text-[13px] text-ink-400">
          Connections will appear here as they happen.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {intros.map((intro) => (
        <div key={intro.id} className="bg-white border border-ink-100 p-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="w-9 h-9 bg-cream flex-shrink-0 overflow-hidden">
                {intro.person_a?.photo_url ? (
                  <img src={intro.person_a.photo_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-forest-400 font-serif text-xs">
                    {intro.person_a?.name?.[0] || "?"}
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-[13px] font-serif text-ink-900 truncate">
                  {intro.person_a?.name || "Unknown"}
                </p>
                <p className="text-[10px] text-ink-400 truncate">
                  {intro.person_a?.role}
                  {intro.person_a?.company ? `, ${intro.person_a.company}` : ""}
                </p>
              </div>
            </div>

            <div className="flex-shrink-0 px-2">
              <svg className="w-5 h-5 text-forest-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </div>

            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="w-9 h-9 bg-cream flex-shrink-0 overflow-hidden">
                {intro.person_b?.photo_url ? (
                  <img src={intro.person_b.photo_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-forest-400 font-serif text-xs">
                    {intro.person_b?.name?.[0] || "?"}
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-[13px] font-serif text-ink-900 truncate">
                  {intro.person_b?.name || "Unknown"}
                </p>
                <p className="text-[10px] text-ink-400 truncate">
                  {intro.person_b?.role}
                  {intro.person_b?.company ? `, ${intro.person_b.company}` : ""}
                </p>
              </div>
            </div>

            <div className="flex-shrink-0 text-right">
              <span className={`px-2 py-0.5 text-[10px] uppercase tracking-wider font-mono ${
                intro.status === "completed"
                  ? "text-forest-700 bg-forest-50 border border-forest-200"
                  : intro.status === "outreach_sent"
                  ? "text-clay-600 bg-clay-50 border border-clay-200"
                  : "text-ink-400 bg-ink-50 border border-ink-200"
              }`}>
                {intro.status?.replace(/_/g, " ") || "pending"}
              </span>
              <p className="text-[10px] text-ink-300 font-mono mt-1">
                {formatDate(intro.created_at)}
              </p>
            </div>
          </div>

          {intro.context && (
            <p className="text-[12px] text-ink-400 mt-2 pl-11 italic">
              {intro.context}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

export default function AdminPage() {
  const [adminKey, setAdminKey] = useState("");
  const [authed, setAuthed] = useState(false);
  const [tab, setTab] = useState<"applications" | "my-intros" | "member-outreach">("applications");
  const [applications, setApplications] = useState<Application[]>([]);
  const [introductions, setIntroductions] = useState<Introduction[]>([]);
  const [loading, setLoading] = useState(false);
  const [appFilter, setAppFilter] = useState<"all" | "pending" | "accepted" | "rejected">("pending");
  const [expanded, setExpanded] = useState<string | null>(null);

  const fetchApps = async (key: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/applications?key=${encodeURIComponent(key)}`);
      if (!res.ok) throw new Error("Unauthorized");
      const data = await res.json();
      setApplications(data.applications || []);
      setAuthed(true);
    } catch {
      alert("Invalid admin key");
    } finally {
      setLoading(false);
    }
  };

  const fetchIntros = async () => {
    const res = await fetch(`/api/introductions?key=${encodeURIComponent(adminKey)}`);
    if (res.ok) {
      const data = await res.json();
      setIntroductions(data.introductions || []);
    }
  };

  useEffect(() => {
    if (authed && (tab === "my-intros" || tab === "member-outreach") && introductions.length === 0) {
      fetchIntros();
    }
  }, [authed, tab]);

  const handleAction = async (id: string, status: "accepted" | "rejected") => {
    const res = await fetch(`/api/applications?key=${encodeURIComponent(adminKey)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    if (res.ok) {
      setApplications((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status } : a))
      );
    }
  };

  const filteredApps = applications.filter(
    (a) => appFilter === "all" || a.status === appFilter
  );

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", {
      month: "short", day: "numeric", year: "numeric",
    });

  // Login screen
  if (!authed) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-6">
        <div className="w-full max-w-sm text-center">
          <p className="text-[11px] uppercase tracking-[0.3em] text-clay-500 font-mono mb-4">
            Admin
          </p>
          <h1 className="text-3xl font-serif text-ink-900 mb-8">
            Myca Dashboard
          </h1>
          <form onSubmit={(e) => { e.preventDefault(); fetchApps(adminKey); }}>
            <input
              type="password"
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
              placeholder="Admin key"
              autoFocus
              className="w-full px-4 py-3 text-center text-[14px] border border-ink-200 bg-white text-ink-900 placeholder-ink-300 focus:outline-none focus:border-forest-400 mb-4"
            />
            <button
              type="submit"
              className="w-full py-3 text-[12px] uppercase tracking-wider font-medium text-cream bg-forest-900 hover:bg-forest-700 transition-colors"
            >
              Enter
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ivory">
      {/* Header */}
      <div className="bg-forest-900">
        <div className="max-w-6xl mx-auto px-6 lg:px-8 py-10">
          <p className="text-[11px] uppercase tracking-[0.3em] text-forest-400 font-mono mb-2">
            Admin
          </p>
          <h1 className="text-2xl font-serif text-cream">
            Myca Dashboard
          </h1>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-ink-100">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="flex gap-0">
            {[
              { id: "applications" as const, label: "Applications", count: applications.length },
              { id: "my-intros" as const, label: "My Intros", count: introductions.filter((i) => i.is_admin_intro).length },
              { id: "member-outreach" as const, label: "Member Outreach", count: introductions.filter((i) => !i.is_admin_intro).length },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-6 py-3.5 text-[12px] uppercase tracking-wider font-medium border-b-2 transition-colors ${
                  tab === t.id
                    ? "border-forest-900 text-forest-900"
                    : "border-transparent text-ink-400 hover:text-ink-600"
                }`}
              >
                {t.label}
                {t.count > 0 && (
                  <span className="ml-2 text-[10px] px-1.5 py-0.5 bg-ink-100 text-ink-500 font-mono">
                    {t.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 lg:px-8 py-8">
        {/* Applications Tab */}
        {tab === "applications" && (
          <>
            {/* Status filters */}
            <div className="flex gap-1.5 mb-6">
              {(["pending", "accepted", "rejected", "all"] as const).map((f) => {
                const count = applications.filter(
                  (a) => f === "all" || a.status === f
                ).length;
                return (
                  <button
                    key={f}
                    onClick={() => setAppFilter(f)}
                    className={`px-3.5 py-1.5 text-[11px] uppercase tracking-wider transition-colors ${
                      appFilter === f
                        ? "bg-forest-900 text-cream"
                        : "text-ink-400 border border-ink-200 hover:border-ink-400"
                    }`}
                  >
                    {f} <span className="opacity-50">{count}</span>
                  </button>
                );
              })}
            </div>

            {loading && <p className="text-ink-400 py-12 text-center">Loading...</p>}

            <div className="space-y-2">
              {filteredApps.map((app) => (
                <div key={app.id} className="bg-white border border-ink-100">
                  <div
                    className="flex items-center gap-4 p-4 cursor-pointer hover:bg-ivory/50 transition-colors"
                    onClick={() => setExpanded(expanded === app.id ? null : app.id)}
                  >
                    <div className="w-10 h-10 bg-cream flex-shrink-0 overflow-hidden">
                      {app.photo_url ? (
                        <img src={app.photo_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-forest-400 font-serif text-sm">
                          {app.full_name?.[0]}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-serif text-ink-900">{app.full_name}</p>
                      <p className="text-[12px] text-ink-400 truncate">
                        {app.title} at {app.company}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-0.5 text-[10px] uppercase tracking-wider font-mono flex-shrink-0 ${
                        app.status === "accepted"
                          ? "text-forest-700 bg-forest-50 border border-forest-200"
                          : app.status === "rejected"
                          ? "text-rust-700 bg-rust-50 border border-rust-200"
                          : "text-clay-600 bg-clay-50 border border-clay-200"
                      }`}
                    >
                      {app.status}
                    </span>
                    <svg
                      className={`w-4 h-4 text-ink-300 transition-transform flex-shrink-0 ${
                        expanded === app.id ? "rotate-180" : ""
                      }`}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>

                  {expanded === app.id && (
                    <div className="border-t border-ink-50 p-5 bg-ivory/30">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                        {[
                          { label: "Email", value: app.email },
                          { label: "Phone", value: app.phone },
                          { label: "Occupation", value: app.occupation },
                          { label: "Location", value: Array.isArray(app.location) ? app.location.join(", ") : app.location },
                          { label: "LinkedIn", value: app.linkedin, link: true },
                          { label: "Comfort Food", value: app.comfort_food, italic: true },
                        ].map((field) => (
                          <div key={field.label}>
                            <p className="text-[10px] uppercase tracking-wider text-ink-400 font-mono mb-0.5">
                              {field.label}
                            </p>
                            {field.link ? (
                              <a href={field.value} target="_blank" rel="noopener noreferrer" className="text-[13px] text-forest-700 underline">
                                View
                              </a>
                            ) : (
                              <p className={`text-[13px] text-ink-700 ${field.italic ? "italic" : ""}`}>
                                {field.value || "—"}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                      {app.hoping_to_get && (
                        <div className="mb-3">
                          <p className="text-[10px] uppercase tracking-wider text-ink-400 font-mono mb-0.5">Hoping to get</p>
                          <p className="text-[13px] text-ink-700 leading-relaxed">{app.hoping_to_get}</p>
                        </div>
                      )}
                      {app.excited_to_contribute && (
                        <div className="mb-3">
                          <p className="text-[10px] uppercase tracking-wider text-ink-400 font-mono mb-0.5">Excited to contribute</p>
                          <p className="text-[13px] text-ink-700 leading-relaxed">{app.excited_to_contribute}</p>
                        </div>
                      )}
                      <p className="text-[11px] text-ink-300 font-mono mb-4">
                        Applied {formatDate(app.created_at)}
                      </p>
                      {app.status === "pending" && (
                        <div className="flex gap-3">
                          <button
                            onClick={() => handleAction(app.id, "accepted")}
                            className="flex-1 py-2.5 text-[12px] uppercase tracking-wider font-medium text-cream bg-forest-700 hover:bg-forest-800 transition-colors"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handleAction(app.id, "rejected")}
                            className="flex-1 py-2.5 text-[12px] uppercase tracking-wider font-medium text-rust-700 border border-rust-200 hover:bg-rust-50 transition-colors"
                          >
                            Decline
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
              {filteredApps.length === 0 && (
                <p className="text-center text-ink-400 py-12 font-serif">
                  No {appFilter === "all" ? "" : appFilter} applications.
                </p>
              )}
            </div>
          </>
        )}

        {/* My Intros Tab */}
        {tab === "my-intros" && (
          <>
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-[14px] text-ink-700 font-serif">Your Introductions</p>
                <p className="text-[12px] text-ink-400">
                  Connections you&apos;ve facilitated as the organizer
                </p>
              </div>
              <button onClick={fetchIntros} className="text-[11px] uppercase tracking-wider text-forest-600 hover:text-forest-900">
                Refresh
              </button>
            </div>
            <IntroList intros={introductions.filter((i) => i.is_admin_intro)} formatDate={formatDate} />
          </>
        )}

        {/* Member Outreach Tab */}
        {tab === "member-outreach" && (
          <>
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-[14px] text-ink-700 font-serif">Member-to-Member Outreach</p>
                <p className="text-[12px] text-ink-400">
                  Connections members are making through the directory on their own
                </p>
              </div>
              <button onClick={fetchIntros} className="text-[11px] uppercase tracking-wider text-forest-600 hover:text-forest-900">
                Refresh
              </button>
            </div>
            <IntroList intros={introductions.filter((i) => !i.is_admin_intro)} formatDate={formatDate} />
          </>
        )}
      </div>
    </div>
  );
}
