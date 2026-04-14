"use client";

import { useState, useEffect } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

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
  email_status: string | null;
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

function AdminLogin({ onSuccess }: { onSuccess: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const { error: authError } = await getSupabaseBrowser().auth.signInWithPassword({
        email,
        password,
      });
      if (authError) {
        setError(authError.message);
      } else {
        onSuccess();
      }
    } catch {
      setError("Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <p className="text-[11px] uppercase tracking-[0.3em] text-clay-500 font-mono mb-4">
            Admin
          </p>
          <h1 className="text-3xl font-serif text-ink-900 mb-3">
            Myca Dashboard
          </h1>
          <p className="text-[14px] text-ink-400">
            Sign in with your admin account.
          </p>
        </div>
        <form onSubmit={handleLogin}>
          <div className="space-y-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              required
              autoFocus
              className="w-full px-4 py-3 text-[14px] border border-ink-200 bg-white text-ink-900 placeholder-ink-300 focus:outline-none focus:border-forest-400"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
              className="w-full px-4 py-3 text-[14px] border border-ink-200 bg-white text-ink-900 placeholder-ink-300 focus:outline-none focus:border-forest-400"
            />
          </div>
          {error && (
            <p className="text-[13px] text-rust-500 mt-3">{error}</p>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="w-full mt-4 py-3 text-[12px] uppercase tracking-wider font-medium text-cream bg-forest-900 hover:bg-forest-700 disabled:opacity-50 transition-colors"
          >
            {submitting ? "..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}

interface EventItem {
  id: string;
  title: string;
  host: string | null;
  hostCompany: string | null;
  description: string | null;
  date: string;
  startTime: string | null;
  endTime: string | null;
  location: string | null;
  city: string | null;
  rsvpUrl: string | null;
  rsvpPlatform: string | null;
  coverImageUrl: string | null;
  source: string | null;
  submittedByName: string | null;
  submittedByEmail: string | null;
  isMycaMemberEvent: boolean;
  isFeatured: boolean;
  status: string;
  personalNote: string | null;
  createdAt: string;
}

interface JobItem {
  id: string;
  title: string;
  company: string;
  location: string | null;
  locationType: string | null;
  type: string | null;
  description: string | null;
  applyUrl: string | null;
  applyEmail: string | null;
  salaryRange: string | null;
  submittedByName: string | null;
  submittedByEmail: string | null;
  contactName: string | null;
  contactEmail: string | null;
  status: string;
  createdAt: string;
}

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [tab, setTab] = useState<"applications" | "events" | "jobs" | "my-intros" | "member-outreach">("applications");
  const [applications, setApplications] = useState<Application[]>([]);
  const [introductions, setIntroductions] = useState<Introduction[]>([]);
  const [pendingEvents, setPendingEvents] = useState<EventItem[]>([]);
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [appFilter, setAppFilter] = useState<"all" | "pending" | "accepted" | "rejected">("pending");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [eventFilter, setEventFilter] = useState<"pending" | "approved" | "rejected" | "all">("pending");
  const [jobFilter, setJobFilter] = useState<"pending" | "approved" | "rejected" | "all">("pending");
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null);
  const [editForm, setEditForm] = useState<Partial<EventItem>>({});
  const [editSaving, setEditSaving] = useState(false);

  const fetchApps = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/applications");
      if (res.status === 401 || res.status === 403) {
        setAuthed(false);
        setLoading(false);
        return;
      }
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setApplications(data.applications || []);
      setAuthed(true);
    } catch {
      setAuthed(false);
    } finally {
      setLoading(false);
    }
  };

  const fetchEvents = async () => {
    try {
      const res = await fetch("/api/events?all=true");
      if (res.ok) {
        const data = await res.json();
        setPendingEvents(data.events || []);
      }
    } catch {
      // ignore
    }
  };

  const handleEventAction = async (id: string, status: "approved" | "rejected") => {
    const res = await fetch("/api/events", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    if (res.ok) {
      setPendingEvents((prev) =>
        prev.map((e) => (e.id === id ? { ...e, status } : e))
      );
    }
  };

  const toggleMycaMember = async (id: string, current: boolean) => {
    const res = await fetch("/api/events", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, isMycaMemberEvent: !current }),
    });
    if (res.ok) {
      setPendingEvents((prev) =>
        prev.map((e) => (e.id === id ? { ...e, isMycaMemberEvent: !current } : e))
      );
    }
  };

  const openEditEvent = (event: EventItem) => {
    setEditingEvent(event);
    setEditForm({
      title: event.title,
      host: event.host || "",
      hostCompany: event.hostCompany || "",
      description: event.description || "",
      date: event.date,
      startTime: event.startTime || "",
      endTime: event.endTime || "",
      location: event.location || "",
      city: event.city || "New York",
      rsvpUrl: event.rsvpUrl || "",
      rsvpPlatform: event.rsvpPlatform || "",
      coverImageUrl: event.coverImageUrl || "",
    });
  };

  const saveEditEvent = async () => {
    if (!editingEvent) return;
    setEditSaving(true);
    try {
      const res = await fetch("/api/events", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingEvent.id, ...editForm }),
      });
      if (res.ok) {
        setPendingEvents((prev) =>
          prev.map((e) =>
            e.id === editingEvent.id ? { ...e, ...editForm } as EventItem : e
          )
        );
        setEditingEvent(null);
      }
    } catch {}
    setEditSaving(false);
  };

  const fetchJobs = async () => {
    try {
      const res = await fetch("/api/jobs?all=true");
      if (res.ok) {
        const data = await res.json();
        setJobs(data.jobs || []);
      }
    } catch {
      // ignore
    }
  };

  const handleJobAction = async (id: string, status: "approved" | "rejected") => {
    const res = await fetch("/api/jobs", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    if (res.ok) {
      setJobs((prev) =>
        prev.map((j) => (j.id === id ? { ...j, status } : j))
      );
    }
  };

  const fetchIntros = async () => {
    const res = await fetch("/api/introductions");
    if (res.ok) {
      const data = await res.json();
      setIntroductions(data.introductions || []);
    }
  };

  useEffect(() => {
    fetchApps();
  }, []);

  useEffect(() => {
    if (authed && (tab === "my-intros" || tab === "member-outreach") && introductions.length === 0) {
      fetchIntros();
    }
    if (authed && tab === "events" && pendingEvents.length === 0) {
      fetchEvents();
    }
    if (authed && tab === "jobs" && jobs.length === 0) {
      fetchJobs();
    }
  }, [authed, tab]);

  const handleAction = async (id: string, status: "accepted" | "rejected") => {
    const res = await fetch("/api/applications", {
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

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="w-8 h-8 border border-ink-200 border-t-ink-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!authed) {
    return <AdminLogin onSuccess={fetchApps} />;
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
              { id: "events" as const, label: "Events", count: pendingEvents.filter((e) => e.status === "pending").length },
              { id: "jobs" as const, label: "Jobs", count: jobs.filter((j) => j.status === "pending").length },
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
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span
                        className={`px-2 py-0.5 text-[10px] uppercase tracking-wider font-mono ${
                          app.status === "accepted"
                            ? "text-forest-700 bg-forest-50 border border-forest-200"
                            : app.status === "rejected"
                            ? "text-rust-700 bg-rust-50 border border-rust-200"
                            : "text-clay-600 bg-clay-50 border border-clay-200"
                        }`}
                      >
                        {app.status}
                      </span>
                      {app.status === "accepted" && app.email_status && (
                        <span
                          className={`px-2 py-0.5 text-[10px] uppercase tracking-wider font-mono ${
                            app.email_status === "opened" || app.email_status === "clicked"
                              ? "text-forest-700 bg-forest-50 border border-forest-200"
                              : app.email_status === "delivered"
                              ? "text-sky-700 bg-sky-50 border border-sky-200"
                              : app.email_status === "bounced" || app.email_status === "failed" || app.email_status === "complained"
                              ? "text-rust-700 bg-rust-50 border border-rust-200"
                              : "text-ink-400 bg-ink-50 border border-ink-200"
                          }`}
                          title={`Email ${app.email_status}`}
                        >
                          {app.email_status === "opened" || app.email_status === "clicked" ? "✓ opened" :
                           app.email_status === "delivered" ? "✓ delivered" :
                           app.email_status === "bounced" ? "✗ bounced" :
                           app.email_status === "failed" ? "✗ failed" :
                           `email ${app.email_status}`}
                        </span>
                      )}
                    </div>
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
                      {app.status === "accepted" && (
                        <button
                          onClick={() => {
                            if (confirm("Remove this member? They will lose access to the directory and chat.")) {
                              handleAction(app.id, "rejected");
                            }
                          }}
                          className="py-2.5 px-4 text-[12px] uppercase tracking-wider font-medium text-rust-700 border border-rust-200 hover:bg-rust-50 transition-colors"
                        >
                          Remove Member
                        </button>
                      )}
                      {app.status === "rejected" && (
                        <button
                          onClick={() => handleAction(app.id, "accepted")}
                          className="py-2.5 px-4 text-[12px] uppercase tracking-wider font-medium text-cream bg-forest-700 hover:bg-forest-800 transition-colors"
                        >
                          Accept
                        </button>
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

        {/* Events Tab */}
        {tab === "events" && (
          <>
            <div className="flex items-center justify-between mb-6">
              <div className="flex gap-1.5">
                {(["pending", "approved", "rejected", "all"] as const).map((f) => {
                  const count = pendingEvents.filter(
                    (e) => f === "all" || e.status === f
                  ).length;
                  return (
                    <button
                      key={f}
                      onClick={() => setEventFilter(f)}
                      className={`px-3.5 py-1.5 text-[11px] uppercase tracking-wider transition-colors ${
                        eventFilter === f
                          ? "bg-forest-900 text-cream"
                          : "text-ink-400 border border-ink-200 hover:border-ink-400"
                      }`}
                    >
                      {f} <span className="opacity-50">{count}</span>
                    </button>
                  );
                })}
              </div>
              <button
                onClick={fetchEvents}
                className="text-[11px] uppercase tracking-wider text-forest-600 hover:text-forest-900"
              >
                Refresh
              </button>
            </div>

            <div className="space-y-2">
              {pendingEvents
                .filter((e) => eventFilter === "all" || e.status === eventFilter)
                .map((event) => (
                  <div key={event.id} className="bg-white border border-ink-100">
                    <div
                      className="flex items-center gap-4 p-4 cursor-pointer hover:bg-ivory/50 transition-colors"
                      onClick={() => setExpanded(expanded === event.id ? null : event.id)}
                    >
                      {/* Cover image thumbnail */}
                      <div className="w-12 h-12 bg-cream flex-shrink-0 overflow-hidden">
                        {event.coverImageUrl ? (
                          <img src={event.coverImageUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-forest-400 font-mono text-[10px]">
                            {event.rsvpPlatform?.toUpperCase() || "EVT"}
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-serif text-ink-900">{event.title}</p>
                        <p className="text-[12px] text-ink-400 truncate">
                          {event.date} &middot; {event.host || "No host"} &middot; {event.city || "NYC"}
                        </p>
                      </div>

                      {event.isMycaMemberEvent && (
                        <span className="px-2 py-0.5 text-[10px] uppercase tracking-wider font-mono text-forest-700 bg-forest-50 border border-forest-200 flex-shrink-0">
                          Member
                        </span>
                      )}

                      <span
                        className={`px-2 py-0.5 text-[10px] uppercase tracking-wider font-mono flex-shrink-0 ${
                          event.status === "approved"
                            ? "text-forest-700 bg-forest-50 border border-forest-200"
                            : event.status === "rejected"
                            ? "text-rust-700 bg-rust-50 border border-rust-200"
                            : "text-clay-600 bg-clay-50 border border-clay-200"
                        }`}
                      >
                        {event.status}
                      </span>

                      <svg
                        className={`w-4 h-4 text-ink-300 transition-transform flex-shrink-0 ${
                          expanded === event.id ? "rotate-180" : ""
                        }`}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>

                    {expanded === event.id && (
                      <div className="border-t border-ink-50 p-5 bg-ivory/30">
                        {event.coverImageUrl && (
                          <img
                            src={event.coverImageUrl}
                            alt={event.title}
                            className="w-full h-48 object-cover border border-ink-100 mb-4"
                          />
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                          {[
                            { label: "Host", value: `${event.host || "—"}${event.hostCompany ? ` @ ${event.hostCompany}` : ""}` },
                            { label: "Date", value: event.date },
                            { label: "Time", value: event.startTime ? `${event.startTime}${event.endTime ? ` – ${event.endTime}` : ""}` : "—" },
                            { label: "Location", value: event.location || "—" },
                            { label: "City", value: event.city || "—" },
                            { label: "Platform", value: event.rsvpPlatform || "—" },
                            { label: "Source", value: event.source || "manual" },
                            { label: "Submitted by", value: event.submittedByEmail || "—" },
                          ].map((field) => (
                            <div key={field.label}>
                              <p className="text-[10px] uppercase tracking-wider text-ink-400 font-mono mb-0.5">
                                {field.label}
                              </p>
                              <p className="text-[13px] text-ink-700">{field.value}</p>
                            </div>
                          ))}
                        </div>

                        {event.description && (
                          <div className="mb-4">
                            <p className="text-[10px] uppercase tracking-wider text-ink-400 font-mono mb-0.5">Description</p>
                            <p className="text-[13px] text-ink-700 leading-relaxed">{event.description}</p>
                          </div>
                        )}

                        {event.rsvpUrl && (
                          <a
                            href={event.rsvpUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block text-[12px] text-forest-700 underline mb-4"
                          >
                            View RSVP page
                          </a>
                        )}

                        <p className="text-[11px] text-ink-300 font-mono mb-4">
                          Submitted {formatDate(event.createdAt)}
                        </p>

                        <div className="flex gap-3 flex-wrap">
                          {event.status === "pending" && (
                            <>
                              <button
                                onClick={() => handleEventAction(event.id, "approved")}
                                className="flex-1 py-2.5 text-[12px] uppercase tracking-wider font-medium text-cream bg-forest-700 hover:bg-forest-800 transition-colors"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleEventAction(event.id, "rejected")}
                                className="flex-1 py-2.5 text-[12px] uppercase tracking-wider font-medium text-rust-700 border border-rust-200 hover:bg-rust-50 transition-colors"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          {event.status === "approved" && (
                            <button
                              onClick={() => handleEventAction(event.id, "rejected")}
                              className="py-2.5 px-4 text-[12px] uppercase tracking-wider font-medium text-rust-700 border border-rust-200 hover:bg-rust-50 transition-colors"
                            >
                              Remove
                            </button>
                          )}
                          {event.status === "rejected" && (
                            <button
                              onClick={() => handleEventAction(event.id, "approved")}
                              className="py-2.5 px-4 text-[12px] uppercase tracking-wider font-medium text-cream bg-forest-700 hover:bg-forest-800 transition-colors"
                            >
                              Approve
                            </button>
                          )}
                          <button
                            onClick={() => openEditEvent(event)}
                            className="py-2.5 px-4 text-[12px] uppercase tracking-wider font-medium text-ink-600 border border-ink-200 hover:border-forest-400 hover:text-forest-700 transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => toggleMycaMember(event.id, event.isMycaMemberEvent)}
                            className={`py-2.5 px-4 text-[12px] uppercase tracking-wider font-medium border transition-colors ${
                              event.isMycaMemberEvent
                                ? "text-forest-700 border-forest-300 bg-forest-50 hover:bg-forest-100"
                                : "text-ink-400 border-ink-200 hover:border-ink-400"
                            }`}
                          >
                            {event.isMycaMemberEvent ? "Myca Member ✓" : "Mark as Member Event"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

              {pendingEvents.filter((e) => eventFilter === "all" || e.status === eventFilter).length === 0 && (
                <p className="text-center text-ink-400 py-12 font-serif">
                  No {eventFilter === "all" ? "" : eventFilter} events.
                </p>
              )}
            </div>
          </>
        )}

        {/* Edit Event Modal */}
        {editingEvent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/40 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl border border-ink-100">
              <div className="flex items-center justify-between px-6 py-4 border-b border-ink-100 sticky top-0 bg-white z-10">
                <h3 className="font-serif text-lg text-ink-900">Edit Event</h3>
                <button
                  onClick={() => setEditingEvent(null)}
                  className="text-ink-300 hover:text-ink-600 p-1"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-6 space-y-4">
                {editForm.coverImageUrl && (
                  <img src={editForm.coverImageUrl} alt="" className="w-full h-40 object-cover border border-ink-100" />
                )}
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-ink-400 font-mono mb-1">Title</label>
                  <input
                    type="text"
                    value={editForm.title || ""}
                    onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
                    className="w-full px-3 py-2 bg-white border border-ink-200 text-[14px] text-ink-900 focus:outline-none focus:border-forest-400"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-ink-400 font-mono mb-1">Host</label>
                    <input
                      type="text"
                      value={editForm.host || ""}
                      onChange={(e) => setEditForm((f) => ({ ...f, host: e.target.value }))}
                      className="w-full px-3 py-2 bg-white border border-ink-200 text-[14px] text-ink-900 focus:outline-none focus:border-forest-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-ink-400 font-mono mb-1">Host Company</label>
                    <input
                      type="text"
                      value={editForm.hostCompany || ""}
                      onChange={(e) => setEditForm((f) => ({ ...f, hostCompany: e.target.value }))}
                      className="w-full px-3 py-2 bg-white border border-ink-200 text-[14px] text-ink-900 focus:outline-none focus:border-forest-400"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-ink-400 font-mono mb-1">Description</label>
                  <textarea
                    value={editForm.description || ""}
                    onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                    rows={4}
                    className="w-full px-3 py-2 bg-white border border-ink-200 text-[14px] text-ink-900 focus:outline-none focus:border-forest-400 resize-none"
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-ink-400 font-mono mb-1">Date</label>
                    <input
                      type="date"
                      value={editForm.date || ""}
                      onChange={(e) => setEditForm((f) => ({ ...f, date: e.target.value }))}
                      className="w-full px-3 py-2 bg-white border border-ink-200 text-[14px] text-ink-900 focus:outline-none focus:border-forest-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-ink-400 font-mono mb-1">Start Time</label>
                    <input
                      type="text"
                      value={editForm.startTime || ""}
                      onChange={(e) => setEditForm((f) => ({ ...f, startTime: e.target.value }))}
                      placeholder="6:30 PM"
                      className="w-full px-3 py-2 bg-white border border-ink-200 text-[14px] text-ink-900 focus:outline-none focus:border-forest-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-ink-400 font-mono mb-1">End Time</label>
                    <input
                      type="text"
                      value={editForm.endTime || ""}
                      onChange={(e) => setEditForm((f) => ({ ...f, endTime: e.target.value }))}
                      placeholder="8:30 PM"
                      className="w-full px-3 py-2 bg-white border border-ink-200 text-[14px] text-ink-900 focus:outline-none focus:border-forest-400"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-ink-400 font-mono mb-1">Location</label>
                    <input
                      type="text"
                      value={editForm.location || ""}
                      onChange={(e) => setEditForm((f) => ({ ...f, location: e.target.value }))}
                      className="w-full px-3 py-2 bg-white border border-ink-200 text-[14px] text-ink-900 focus:outline-none focus:border-forest-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-ink-400 font-mono mb-1">City</label>
                    <select
                      value={editForm.city || "New York"}
                      onChange={(e) => setEditForm((f) => ({ ...f, city: e.target.value }))}
                      className="w-full px-3 py-2 bg-white border border-ink-200 text-[14px] text-ink-900 focus:outline-none focus:border-forest-400"
                    >
                      <option>New York</option>
                      <option>San Francisco</option>
                      <option>Los Angeles</option>
                      <option>Chicago</option>
                      <option>London</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-ink-400 font-mono mb-1">RSVP URL</label>
                    <input
                      type="url"
                      value={editForm.rsvpUrl || ""}
                      onChange={(e) => setEditForm((f) => ({ ...f, rsvpUrl: e.target.value }))}
                      className="w-full px-3 py-2 bg-white border border-ink-200 text-[14px] text-ink-900 focus:outline-none focus:border-forest-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-ink-400 font-mono mb-1">Platform</label>
                    <select
                      value={editForm.rsvpPlatform || ""}
                      onChange={(e) => setEditForm((f) => ({ ...f, rsvpPlatform: e.target.value }))}
                      className="w-full px-3 py-2 bg-white border border-ink-200 text-[14px] text-ink-900 focus:outline-none focus:border-forest-400"
                    >
                      <option value="">None</option>
                      <option value="luma">Luma</option>
                      <option value="partiful">Partiful</option>
                      <option value="eventbrite">Eventbrite</option>
                      <option value="resy">Resy</option>
                      <option value="website">Website</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-ink-400 font-mono mb-1">Cover Image URL</label>
                  <input
                    type="url"
                    value={editForm.coverImageUrl || ""}
                    onChange={(e) => setEditForm((f) => ({ ...f, coverImageUrl: e.target.value }))}
                    className="w-full px-3 py-2 bg-white border border-ink-200 text-[14px] text-ink-900 focus:outline-none focus:border-forest-400"
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-ink-100 sticky bottom-0 bg-white">
                <button
                  onClick={() => setEditingEvent(null)}
                  className="px-5 py-2.5 text-[12px] uppercase tracking-wider font-medium text-ink-400 hover:text-ink-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={saveEditEvent}
                  disabled={editSaving}
                  className="px-6 py-2.5 text-[12px] uppercase tracking-wider font-medium text-cream bg-forest-800 hover:bg-forest-700 disabled:bg-ink-300 transition-colors"
                >
                  {editSaving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Jobs Tab */}
        {tab === "jobs" && (
          <>
            <div className="flex items-center justify-between mb-6">
              <div className="flex gap-1.5">
                {(["pending", "approved", "rejected", "all"] as const).map((f) => {
                  const count = jobs.filter(
                    (j) => f === "all" || j.status === f
                  ).length;
                  return (
                    <button
                      key={f}
                      onClick={() => setJobFilter(f)}
                      className={`px-3.5 py-1.5 text-[11px] uppercase tracking-wider transition-colors ${
                        jobFilter === f
                          ? "bg-forest-900 text-cream"
                          : "text-ink-400 border border-ink-200 hover:border-ink-400"
                      }`}
                    >
                      {f} <span className="opacity-50">{count}</span>
                    </button>
                  );
                })}
              </div>
              <button
                onClick={fetchJobs}
                className="text-[11px] uppercase tracking-wider text-forest-600 hover:text-forest-900"
              >
                Refresh
              </button>
            </div>

            <div className="space-y-2">
              {jobs
                .filter((j) => jobFilter === "all" || j.status === jobFilter)
                .map((job) => (
                  <div key={job.id} className="bg-white border border-ink-100">
                    <div
                      className="flex items-center gap-4 p-4 cursor-pointer hover:bg-ivory/50 transition-colors"
                      onClick={() => setExpanded(expanded === job.id ? null : job.id)}
                    >
                      <div className="w-10 h-10 bg-cream flex-shrink-0 overflow-hidden flex items-center justify-center text-forest-400 font-mono text-[10px]">
                        JOB
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-serif text-ink-900">{job.title}</p>
                        <p className="text-[12px] text-ink-400 truncate">
                          {job.company}{job.location ? ` · ${job.location}` : ""}{job.type ? ` · ${job.type}` : ""}
                        </p>
                      </div>

                      <span
                        className={`px-2 py-0.5 text-[10px] uppercase tracking-wider font-mono flex-shrink-0 ${
                          job.status === "approved"
                            ? "text-forest-700 bg-forest-50 border border-forest-200"
                            : job.status === "rejected"
                            ? "text-rust-700 bg-rust-50 border border-rust-200"
                            : "text-clay-600 bg-clay-50 border border-clay-200"
                        }`}
                      >
                        {job.status}
                      </span>
                      <svg
                        className={`w-4 h-4 text-ink-300 transition-transform flex-shrink-0 ${
                          expanded === job.id ? "rotate-180" : ""
                        }`}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>

                    {expanded === job.id && (
                      <div className="border-t border-ink-50 p-5 bg-ivory/30">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                          {[
                            { label: "Company", value: job.company },
                            { label: "Location", value: job.location || "—" },
                            { label: "Type", value: job.locationType || "—" },
                            { label: "Employment", value: job.type || "—" },
                            { label: "Salary", value: job.salaryRange || "—" },
                            { label: "Submitted by", value: job.submittedByName ? `${job.submittedByName} (${job.submittedByEmail})` : job.submittedByEmail || "—" },
                            { label: "Contact", value: job.contactName ? `${job.contactName} (${job.contactEmail})` : job.contactEmail || "—" },
                          ].map((field) => (
                            <div key={field.label}>
                              <p className="text-[10px] uppercase tracking-wider text-ink-400 font-mono mb-0.5">
                                {field.label}
                              </p>
                              <p className="text-[13px] text-ink-700">{field.value}</p>
                            </div>
                          ))}
                        </div>
                        {job.description && (
                          <div className="mb-4">
                            <p className="text-[10px] uppercase tracking-wider text-ink-400 font-mono mb-0.5">Description</p>
                            <p className="text-[13px] text-ink-700 leading-relaxed">{job.description}</p>
                          </div>
                        )}
                        {job.applyUrl && (
                          <a
                            href={job.applyUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block text-[12px] text-forest-700 underline mb-4"
                          >
                            View application link
                          </a>
                        )}
                        <p className="text-[11px] text-ink-300 font-mono mb-4">
                          Submitted {formatDate(job.createdAt)}
                        </p>
                        <div className="flex gap-3">
                          {job.status === "pending" && (
                            <>
                              <button
                                onClick={() => handleJobAction(job.id, "approved")}
                                className="flex-1 py-2.5 text-[12px] uppercase tracking-wider font-medium text-cream bg-forest-700 hover:bg-forest-800 transition-colors"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleJobAction(job.id, "rejected")}
                                className="flex-1 py-2.5 text-[12px] uppercase tracking-wider font-medium text-rust-700 border border-rust-200 hover:bg-rust-50 transition-colors"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          {job.status === "approved" && (
                            <button
                              onClick={() => handleJobAction(job.id, "rejected")}
                              className="py-2.5 px-4 text-[12px] uppercase tracking-wider font-medium text-rust-700 border border-rust-200 hover:bg-rust-50 transition-colors"
                            >
                              Remove
                            </button>
                          )}
                          {job.status === "rejected" && (
                            <button
                              onClick={() => handleJobAction(job.id, "approved")}
                              className="py-2.5 px-4 text-[12px] uppercase tracking-wider font-medium text-cream bg-forest-700 hover:bg-forest-800 transition-colors"
                            >
                              Approve
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              {jobs.filter((j) => jobFilter === "all" || j.status === jobFilter).length === 0 && (
                <p className="text-center text-ink-400 py-12 font-serif">
                  No {jobFilter === "all" ? "" : jobFilter} jobs.
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
