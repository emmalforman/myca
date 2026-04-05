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

export default function AdminPage() {
  const [adminKey, setAdminKey] = useState("");
  const [authed, setAuthed] = useState(false);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<"all" | "pending" | "accepted" | "rejected">("pending");
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

  const filtered = applications.filter(
    (a) => filter === "all" || a.status === filter
  );

  if (!authed) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-6">
        <div className="w-full max-w-sm text-center">
          <p className="text-[11px] uppercase tracking-[0.3em] text-clay-500 font-mono mb-4">
            Admin
          </p>
          <h1 className="text-3xl font-serif text-ink-900 mb-3">
            Application Review
          </h1>
          <p className="text-[14px] text-ink-400 mb-8">
            Enter the admin key to review applications.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              fetchApps(adminKey);
            }}
          >
            <input
              type="password"
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
              placeholder="Admin key"
              autoFocus
              className="w-full px-4 py-3 text-center text-[14px] border border-ink-200 bg-white text-ink-900 placeholder-ink-300 focus:outline-none focus:border-ink-400 mb-4"
            />
            <button
              type="submit"
              className="w-full py-3 text-[12px] uppercase tracking-wider font-medium text-white bg-ink-900 hover:bg-ink-700 transition-colors"
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
      <div className="bg-ink-950">
        <div className="max-w-6xl mx-auto px-6 lg:px-8 py-12">
          <p className="text-[11px] uppercase tracking-[0.3em] text-clay-500 font-mono mb-3">
            Admin
          </p>
          <h1 className="text-2xl font-serif text-white">
            Application Review
          </h1>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 lg:px-8 py-8">
        {/* Filter tabs */}
        <div className="flex gap-1 mb-6 border-b border-ink-100">
          {(["pending", "accepted", "rejected", "all"] as const).map((tab) => {
            const count = applications.filter(
              (a) => tab === "all" || a.status === tab
            ).length;
            return (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-4 py-2.5 text-[12px] uppercase tracking-wider font-medium border-b-2 transition-colors ${
                  filter === tab
                    ? "border-ink-900 text-ink-900"
                    : "border-transparent text-ink-400 hover:text-ink-600"
                }`}
              >
                {tab} ({count})
              </button>
            );
          })}
        </div>

        {loading && (
          <p className="text-center text-ink-400 py-12">Loading...</p>
        )}

        {/* Applications list */}
        <div className="space-y-3">
          {filtered.map((app) => (
            <div
              key={app.id}
              className="bg-white border border-ink-100 overflow-hidden"
            >
              {/* Summary row */}
              <div
                className="flex items-center gap-4 p-4 cursor-pointer hover:bg-ivory/50 transition-colors"
                onClick={() =>
                  setExpanded(expanded === app.id ? null : app.id)
                }
              >
                <div className="w-10 h-10 bg-parchment flex-shrink-0 overflow-hidden">
                  {app.photo_url ? (
                    <img
                      src={app.photo_url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-clay-400 font-serif text-sm">
                      {app.full_name?.[0]}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-serif text-ink-900">
                    {app.full_name}
                  </p>
                  <p className="text-[12px] text-ink-400 truncate">
                    {app.title} at {app.company}
                  </p>
                </div>
                <div className="flex-shrink-0 flex items-center gap-3">
                  <span
                    className={`px-2 py-0.5 text-[10px] uppercase tracking-wider font-mono ${
                      app.status === "accepted"
                        ? "text-moss-700 bg-moss-50 border border-moss-200"
                        : app.status === "rejected"
                        ? "text-rust-700 bg-rust-50 border border-rust-200"
                        : "text-clay-600 bg-clay-50 border border-clay-200"
                    }`}
                  >
                    {app.status}
                  </span>
                  <svg
                    className={`w-4 h-4 text-ink-300 transition-transform ${
                      expanded === app.id ? "rotate-180" : ""
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>

              {/* Expanded details */}
              {expanded === app.id && (
                <div className="border-t border-ink-50 p-5 bg-ivory/30">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-ink-400 font-mono mb-1">
                        Email
                      </p>
                      <p className="text-[13px] text-ink-700">{app.email}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-ink-400 font-mono mb-1">
                        Phone
                      </p>
                      <p className="text-[13px] text-ink-700">
                        {app.phone || "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-ink-400 font-mono mb-1">
                        Occupation
                      </p>
                      <p className="text-[13px] text-ink-700">
                        {app.occupation || "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-ink-400 font-mono mb-1">
                        Location
                      </p>
                      <p className="text-[13px] text-ink-700">
                        {Array.isArray(app.location)
                          ? app.location.join(", ")
                          : app.location || "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-ink-400 font-mono mb-1">
                        LinkedIn
                      </p>
                      {app.linkedin ? (
                        <a
                          href={app.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[13px] text-ink-700 underline"
                        >
                          View profile
                        </a>
                      ) : (
                        <p className="text-[13px] text-ink-400">—</p>
                      )}
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-ink-400 font-mono mb-1">
                        Comfort Food
                      </p>
                      <p className="text-[13px] text-ink-700 italic">
                        {app.comfort_food || "—"}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-3 mb-5">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-ink-400 font-mono mb-1">
                        Hoping to get out of Myca
                      </p>
                      <p className="text-[13px] text-ink-700 leading-relaxed">
                        {app.hoping_to_get}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-ink-400 font-mono mb-1">
                        Excited to contribute
                      </p>
                      <p className="text-[13px] text-ink-700 leading-relaxed">
                        {app.excited_to_contribute}
                      </p>
                    </div>
                  </div>
                  <div className="text-[11px] text-ink-300 font-mono mb-4">
                    Applied{" "}
                    {new Date(app.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </div>

                  {app.status === "pending" && (
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleAction(app.id, "accepted")}
                        className="flex-1 py-2.5 text-[12px] uppercase tracking-wider font-medium text-white bg-moss-600 hover:bg-moss-700 transition-colors"
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

          {filtered.length === 0 && (
            <p className="text-center text-ink-400 py-12 font-serif">
              No {filter === "all" ? "" : filter} applications.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
