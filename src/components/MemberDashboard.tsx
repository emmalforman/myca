"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { Member } from "@/lib/types";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

interface BotRecommendation {
  email: string;
  reason: string;
}

interface BotResponse {
  reply: string;
  recommendations: BotRecommendation[];
}

interface AskMessage {
  id: string;
  sender_name: string;
  sender_email: string;
  content: string;
  created_at: string;
}

interface DashboardEvent {
  id: string;
  title: string;
  host: string;
  host_company: string;
  date: string;
  day_of_week: string;
  start_time: string;
  location: string;
  city: string;
  rsvp_url: string;
  cover_image_url: string;
}

function MemberAvatar({ member }: { member: Member }) {
  const displayName =
    member.name || `${member.firstName ?? ""} ${member.lastName ?? ""}`.trim();
  const initials =
    (member.firstName?.[0] ?? displayName?.[0] ?? "") +
    (member.lastName?.[0] ?? displayName?.split(" ")[1]?.[0] ?? "");

  return (
    <Link
      href={`/directory?member=${encodeURIComponent(member.id)}`}
      className="flex items-center gap-4 p-4 bg-white border border-forest-100 hover:border-forest-300 transition-all"
    >
      <div className="w-12 h-12 rounded-full overflow-hidden bg-cream flex-shrink-0">
        {member.photoUrl ? (
          <img
            src={member.photoUrl}
            alt={displayName}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-forest-400 font-serif text-lg">{initials}</span>
          </div>
        )}
      </div>
      <div className="min-w-0">
        <p className="text-[15px] font-serif text-forest-900 truncate">
          {displayName}
        </p>
        {(member.role || member.company) && (
          <p className="text-[13px] text-ink-400 truncate">
            {member.role}
            {member.role && member.company ? ", " : ""}
            {member.company}
          </p>
        )}
        {member.location && (
          <p className="text-[10px] uppercase tracking-[0.15em] text-ink-300 font-mono mt-0.5">
            {member.location}
          </p>
        )}
      </div>
    </Link>
  );
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function formatEventDate(dateStr: string, dayOfWeek: string): string {
  const date = new Date(dateStr + "T12:00:00");
  const month = date.toLocaleDateString("en-US", { month: "short" });
  const day = date.getDate();
  return `${dayOfWeek}, ${month} ${day}`;
}

export default function MemberDashboard({ userEmail }: { userEmail: string }) {
  const [members, setMembers] = useState<Member[]>([]);
  const [asks, setAsks] = useState<AskMessage[]>([]);
  const [events, setEvents] = useState<DashboardEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [firstName, setFirstName] = useState("");

  // Ask Myca state
  const [askInput, setAskInput] = useState("");
  const [askLoading, setAskLoading] = useState(false);
  const [askResponse, setAskResponse] = useState<BotResponse | null>(null);
  const [askMembers, setAskMembers] = useState<Member[]>([]);
  const askInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Fetch members and dashboard feed in parallel
    // Look up name directly via browser client (same pattern as MemberLogin)
    const supabase = getSupabaseBrowser();
    supabase
      .from("contacts")
      .select("first_name, name")
      .eq("email", userEmail)
      .eq("is_myca_member", true)
      .limit(1)
      .then(({ data: meData }) => {
        const me = meData?.[0];
        setFirstName(me?.first_name || me?.name?.split(" ")[0] || userEmail.split("@")[0]);
      });

    Promise.all([
      fetch("/api/members").then((r) => r.json()),
      fetch("/api/dashboard").then((r) => r.json()).catch(() => ({ asks: [], events: [] })),
    ]).then(([membersData, feedData]) => {
      setMembers(membersData.members || []);
      setAsks(feedData.asks || []);
      setEvents(feedData.events || []);
      setLoading(false);
    });
  }, [userEmail]);

  async function handleAsk(query: string) {
    const q = query.trim();
    if (!q || askLoading) return;
    setAskLoading(true);
    setAskResponse(null);
    setAskMembers([]);
    try {
      const res = await fetch("/api/bot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: q, email: userEmail }),
      });
      const data: BotResponse = await res.json();
      setAskResponse(data);
      // Resolve recommended member emails to full member objects
      if (data.recommendations?.length && members.length) {
        const matched = data.recommendations
          .map((rec) => {
            const m = members.find(
              (mem) => mem.email?.toLowerCase() === rec.email.toLowerCase()
            );
            return m ? { ...m, _reason: rec.reason } : null;
          })
          .filter(Boolean) as (Member & { _reason?: string })[];
        setAskMembers(matched);
      }
    } catch {
      setAskResponse({ reply: "Something went wrong — try again in a moment.", recommendations: [] });
    } finally {
      setAskLoading(false);
    }
  }

  const newMembers = [...members]
    .filter((m) => m.createdAt)
    .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime())
    .slice(0, 8);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-6 lg:px-8 py-20">
        <div className="animate-pulse space-y-8">
          <div className="h-8 bg-forest-100 w-64" />
          <div className="grid grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-forest-50" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 lg:px-8 py-12 sm:py-16">
      {/* Welcome */}
      <div className="mb-12">
        <p className="text-[11px] uppercase tracking-[0.3em] text-forest-500 font-mono mb-3">
          Welcome back
        </p>
        <h1 className="text-3xl sm:text-4xl font-serif text-forest-900">
          Hey, {firstName}.
        </h1>
      </div>

      {/* Ask Myca */}
      <div className="mb-14">
        <div className="bg-white border border-forest-100 p-5 sm:p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-full bg-forest-900 flex items-center justify-center flex-shrink-0">
              <span className="text-cream text-xs font-serif font-bold">M</span>
            </div>
            <p className="text-[13px] font-medium text-forest-900 tracking-wide">
              Ask Myca
            </p>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAsk(askInput);
            }}
            className="flex gap-2 mb-3"
          >
            <input
              ref={askInputRef}
              type="text"
              value={askInput}
              onChange={(e) => setAskInput(e.target.value)}
              placeholder="Who can help me with..."
              disabled={askLoading}
              className="flex-1 px-4 py-2.5 text-[14px] bg-forest-50 border border-forest-100 text-forest-900 placeholder:text-ink-300 focus:outline-none focus:border-forest-400 transition-colors disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={askLoading || !askInput.trim()}
              className="px-4 py-2.5 bg-forest-900 text-cream text-[12px] uppercase tracking-wider font-medium hover:bg-forest-800 transition-colors disabled:opacity-40"
            >
              {askLoading ? (
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                "Ask"
              )}
            </button>
          </form>
          <div className="flex flex-wrap gap-2">
            {["Who knows about retail distribution?", "Intro me to someone in CPG fundraising", "Who's in NYC?"].map((chip) => (
              <button
                key={chip}
                onClick={() => {
                  setAskInput(chip);
                  handleAsk(chip);
                }}
                disabled={askLoading}
                className="px-3 py-1.5 text-[11px] text-ink-500 bg-forest-50 hover:bg-forest-100 border border-forest-100 transition-colors disabled:opacity-40"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Response */}
          {(askLoading || askResponse) && (
            <div className="mt-5 pt-5 border-t border-forest-100">
              {askLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-forest-900 flex items-center justify-center flex-shrink-0">
                    <span className="text-cream text-[9px] font-serif font-bold">M</span>
                  </div>
                  <p className="text-[13px] text-ink-400">Thinking...</p>
                </div>
              ) : askResponse ? (
                <div>
                  <div className="flex items-start gap-2">
                    <div className="w-5 h-5 rounded-full bg-forest-900 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-cream text-[9px] font-serif font-bold">M</span>
                    </div>
                    <p className="text-[13px] text-ink-700 leading-relaxed">
                      {askResponse.reply}
                    </p>
                  </div>
                  {askMembers.length > 0 && (
                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {askMembers.map((member: any) => (
                        <Link
                          key={member.id}
                          href={`/directory?member=${encodeURIComponent(member.id)}`}
                          className="flex items-center gap-3 p-3 bg-forest-50 hover:bg-forest-100 transition-colors"
                        >
                          <div className="w-9 h-9 rounded-full overflow-hidden bg-cream flex-shrink-0">
                            {member.photoUrl ? (
                              <img src={member.photoUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <span className="text-forest-400 font-serif text-sm">
                                  {(member.firstName?.[0] || member.name?.[0] || "")}{(member.lastName?.[0] || "")}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-[13px] font-serif text-forest-900 truncate">
                              {member.name || `${member.firstName ?? ""} ${member.lastName ?? ""}`.trim()}
                            </p>
                            {member._reason && (
                              <p className="text-[11px] text-ink-400 truncate">{member._reason}</p>
                            )}
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                  <button
                    onClick={() => {
                      setAskResponse(null);
                      setAskMembers([]);
                      setAskInput("");
                      askInputRef.current?.focus();
                    }}
                    className="mt-3 text-[11px] text-ink-400 hover:text-forest-700 transition-colors"
                  >
                    Ask something else
                  </button>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-14">
        <Link
          href="/directory"
          className="group flex items-center gap-4 p-5 bg-forest-900 text-cream hover:bg-forest-800 transition-colors"
        >
          <svg className="w-5 h-5 text-forest-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <div>
            <p className="text-sm font-medium tracking-wide uppercase">Browse Directory</p>
            <p className="text-[12px] text-forest-400 mt-0.5">Search members</p>
          </div>
        </Link>
        <Link
          href="/chat"
          className="group flex items-center gap-4 p-5 bg-white border border-forest-100 hover:border-forest-300 transition-colors"
        >
          <svg className="w-5 h-5 text-forest-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <div>
            <p className="text-sm font-medium tracking-wide uppercase text-forest-900">Chat</p>
            <p className="text-[12px] text-ink-400 mt-0.5">Message members</p>
          </div>
        </Link>
        <Link
          href="/events"
          className="group flex items-center gap-4 p-5 bg-white border border-forest-100 hover:border-forest-300 transition-colors"
        >
          <svg className="w-5 h-5 text-forest-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <div>
            <p className="text-sm font-medium tracking-wide uppercase text-forest-900">Events</p>
            <p className="text-[12px] text-ink-400 mt-0.5">Upcoming gatherings</p>
          </div>
        </Link>
      </div>

      {/* Upcoming Events */}
      {events.length > 0 && (
        <section className="mb-14">
          <div className="flex items-baseline justify-between mb-5">
            <div>
              <p className="text-[11px] uppercase tracking-[0.3em] text-forest-500 font-mono mb-2">
                Coming up
              </p>
              <h2 className="text-xl font-serif text-forest-900">Upcoming Events</h2>
            </div>
            <Link
              href="/events"
              className="text-[12px] uppercase tracking-wider text-ink-400 hover:text-forest-700 transition-colors"
            >
              See all &rarr;
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {events.map((event) => (
              <a
                key={event.id}
                href={event.rsvp_url || "/events"}
                target={event.rsvp_url ? "_blank" : undefined}
                rel={event.rsvp_url ? "noopener noreferrer" : undefined}
                className="flex gap-4 p-4 bg-white border border-forest-100 hover:border-forest-300 transition-all group"
              >
                {event.cover_image_url ? (
                  <div className="w-16 h-16 rounded overflow-hidden bg-cream flex-shrink-0">
                    <img
                      src={event.cover_image_url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded bg-forest-50 flex-shrink-0 flex items-center justify-center">
                    <svg className="w-6 h-6 text-forest-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-[15px] font-serif text-forest-900 group-hover:text-forest-700 truncate transition-colors">
                    {event.title}
                  </p>
                  <p className="text-[12px] text-ink-400 mt-0.5">
                    {formatEventDate(event.date, event.day_of_week)}
                    {event.start_time ? ` at ${event.start_time}` : ""}
                  </p>
                  <p className="text-[10px] uppercase tracking-[0.15em] text-ink-300 font-mono mt-0.5">
                    {event.city || event.location}
                  </p>
                </div>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* New Members */}
      {newMembers.length > 0 && (
        <section className="mb-14">
          <div className="flex items-baseline justify-between mb-5">
            <div>
              <p className="text-[11px] uppercase tracking-[0.3em] text-forest-500 font-mono mb-2">
                New faces
              </p>
              <h2 className="text-xl font-serif text-forest-900">Recently Joined</h2>
            </div>
            <Link
              href="/directory"
              className="text-[12px] uppercase tracking-wider text-ink-400 hover:text-forest-700 transition-colors"
            >
              View all &rarr;
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {newMembers.map((member) => (
              <MemberAvatar key={member.id} member={member} />
            ))}
          </div>
        </section>
      )}

      {/* Jobs & Asks from Chat */}
      {asks.length > 0 && (
        <section className="mb-14">
          <div className="flex items-baseline justify-between mb-5">
            <div>
              <p className="text-[11px] uppercase tracking-[0.3em] text-forest-500 font-mono mb-2">
                From the community
              </p>
              <h2 className="text-xl font-serif text-forest-900">Jobs & Asks</h2>
            </div>
            <Link
              href="/chat"
              className="text-[12px] uppercase tracking-wider text-ink-400 hover:text-forest-700 transition-colors"
            >
              Join the conversation &rarr;
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {asks.map((msg) => (
              <div key={msg.id} className="p-4 bg-white border border-forest-100">
                <p className="text-[13px] text-ink-700 leading-relaxed mb-3 line-clamp-3">
                  {msg.content}
                </p>
                <div className="flex items-center justify-between">
                  <p className="text-[12px] text-ink-400">
                    {msg.sender_name}
                  </p>
                  <p className="text-[10px] text-ink-300 font-mono">
                    {timeAgo(msg.created_at)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Stay Connected — Newsletter + Instagram */}
      <section className="mb-14">
        <p className="text-[11px] uppercase tracking-[0.3em] text-forest-500 font-mono mb-2">
          Stay connected
        </p>
        <h2 className="text-xl font-serif text-forest-900 mb-5">From Myca</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <a
            href="https://substack.com/@emmalforman"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 p-5 bg-white border border-forest-100 hover:border-forest-300 transition-all group"
          >
            <div className="w-10 h-10 rounded bg-orange-50 flex-shrink-0 flex items-center justify-center">
              <svg className="w-5 h-5 text-orange-500" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.539 8.242H1.46V5.406h21.08v2.836zM1.46 10.812V24L12 18.11 22.54 24V10.812H1.46zM22.54 0H1.46v2.836h21.08V0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-forest-900 group-hover:text-forest-700 transition-colors">
                Myca Newsletter
              </p>
              <p className="text-[12px] text-ink-400 mt-0.5">
                Latest posts on Substack
              </p>
            </div>
            <svg className="w-4 h-4 text-ink-300 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
          <a
            href="https://www.instagram.com/myca_collective"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 p-5 bg-white border border-forest-100 hover:border-forest-300 transition-all group"
          >
            <div className="w-10 h-10 rounded bg-pink-50 flex-shrink-0 flex items-center justify-center">
              <svg className="w-5 h-5 text-pink-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-forest-900 group-hover:text-forest-700 transition-colors">
                @myca_collective
              </p>
              <p className="text-[12px] text-ink-400 mt-0.5">
                Follow us on Instagram
              </p>
            </div>
            <svg className="w-4 h-4 text-ink-300 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      </section>

      {/* Submit an Event CTA */}
      <section className="bg-forest-900 p-8 sm:p-10 text-center">
        <p className="text-[11px] uppercase tracking-[0.3em] text-forest-400 font-mono mb-3">
          Got something to share?
        </p>
        <h2 className="text-xl sm:text-2xl font-serif text-cream mb-4">
          Hosting an event? Post a job? Share it with the community.
        </h2>
        <div className="flex flex-wrap justify-center gap-3">
          <Link
            href="/events/submit"
            className="px-6 py-2.5 text-[12px] uppercase tracking-wider font-medium text-forest-900 bg-cream hover:bg-white transition-colors"
          >
            Submit an Event
          </Link>
          <Link
            href="/chat"
            className="px-6 py-2.5 text-[12px] uppercase tracking-wider font-medium text-forest-300 border border-forest-600 hover:border-cream hover:text-cream transition-colors"
          >
            Post in Chat
          </Link>
        </div>
      </section>
    </div>
  );
}
