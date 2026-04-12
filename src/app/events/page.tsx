"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import type { Event } from "@/lib/types";

function getWeekStart(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = day === 0 ? 1 : day === 1 ? 0 : 8 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().split("T")[0];
}

function getWeekEnd(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = day === 0 ? 0 : 7 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().split("T")[0];
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatDateRange(start: string, end: string): string {
  const s = new Date(start + "T00:00:00");
  const e = new Date(end + "T00:00:00");
  return `${s.toLocaleDateString("en-US", { month: "short", day: "numeric" })} \u2013 ${e.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
}

function getDaysOfWeek(start: string, end: string): { date: string; label: string; dayName: string }[] {
  const days: { date: string; label: string; dayName: string }[] = [];
  const d = new Date(start + "T00:00:00");
  const endDate = new Date(end + "T00:00:00");
  while (d <= endDate) {
    days.push({
      date: d.toISOString().split("T")[0],
      label: d.toLocaleDateString("en-US", { day: "numeric" }),
      dayName: d.toLocaleDateString("en-US", { weekday: "short" }),
    });
    d.setDate(d.getDate() + 1);
  }
  return days;
}

function EventCard({ event, blurred }: { event: Event; blurred: boolean }) {
  return (
    <div
      className={`relative bg-white border border-ink-100 overflow-hidden transition-all hover:border-forest-300 ${
        blurred ? "select-none" : ""
      }`}
    >
      {blurred && (
        <div className="absolute inset-0 bg-white/60 backdrop-blur-md z-10" />
      )}

      <div className="flex flex-col sm:flex-row">
        {event.coverImageUrl && (
          <div className="sm:w-48 sm:min-h-[140px] flex-shrink-0">
            <img
              src={event.coverImageUrl}
              alt={event.title}
              className="w-full h-40 sm:h-full object-cover"
            />
          </div>
        )}

        <div className="flex-1 p-5">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div>
              <h3 className="font-serif text-lg text-ink-900 leading-tight">
                {event.title}
              </h3>
              {event.host && (
                <p className="text-[13px] text-ink-400 mt-0.5">
                  Hosted by {event.host}
                  {event.hostCompany ? ` @ ${event.hostCompany}` : ""}
                </p>
              )}
            </div>
            {event.isMycaMemberEvent && (
              <span className="flex-shrink-0 px-2.5 py-0.5 text-[10px] uppercase tracking-wider font-mono bg-forest-50 text-forest-700 border border-forest-200">
                Myca Member
              </span>
            )}
          </div>

          {event.description && (
            <p className="text-[14px] text-ink-500 leading-relaxed mb-3 line-clamp-2">
              {event.description}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-ink-400 font-mono">
            {event.startTime && (
              <span>{event.startTime}{event.endTime ? ` – ${event.endTime}` : ""}</span>
            )}
            {event.location && (
              <span className="truncate max-w-[200px]">{event.location}</span>
            )}
            {event.rsvpPlatform && (
              <span className="uppercase text-[11px]">{event.rsvpPlatform}</span>
            )}
          </div>

          {event.rsvpUrl && !blurred && (
            <a
              href={event.rsvpUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-3 px-4 py-1.5 text-[12px] uppercase tracking-wider font-medium text-forest-800 border border-forest-300 hover:bg-forest-50 transition-colors"
            >
              RSVP
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export default function EventsPage() {
  const [signedIn, setSignedIn] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [cityFilter, setCityFilter] = useState("");
  const [view, setView] = useState<"list" | "calendar">("list");

  const startDate = getWeekStart();
  const endDate = getWeekEnd();

  useEffect(() => {
    const supabase = getSupabaseBrowser();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSignedIn(!!session);
    });
  }, []);

  useEffect(() => {
    fetch(`/api/events?startDate=${startDate}&endDate=${endDate}`)
      .then((r) => {
        if (r.status === 401) return { events: [] };
        return r.json();
      })
      .then((data) => setEvents(data.events || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [startDate, endDate]);

  const cities = useMemo(
    () => [...new Set(events.map((e) => e.city).filter(Boolean))] as string[],
    [events]
  );

  const filtered = useMemo(() => {
    if (!cityFilter) return events;
    return events.filter((e) => e.city === cityFilter);
  }, [events, cityFilter]);

  // Group events by date
  const eventsByDate = useMemo(() => {
    const groups: Record<string, Event[]> = {};
    for (const event of filtered) {
      const key = event.date;
      if (!groups[key]) groups[key] = [];
      groups[key].push(event);
    }
    return groups;
  }, [filtered]);

  const groupedByDate = useMemo(() => {
    return Object.entries(eventsByDate).sort(([a], [b]) => a.localeCompare(b));
  }, [eventsByDate]);

  const calendarDays = useMemo(() => getDaysOfWeek(startDate, endDate), [startDate, endDate]);

  const TEASER_COUNT = 3;
  let runningIndex = 0;

  return (
    <div className="min-h-screen bg-ivory">
      {/* Header */}
      <div className="bg-forest-950">
        <div className="max-w-6xl mx-auto px-6 lg:px-8 py-16 sm:py-20">
          <p className="text-[11px] uppercase tracking-[0.3em] text-forest-400 font-mono mb-3">
            This Week
          </p>
          <h1 className="text-3xl sm:text-4xl font-serif text-cream mb-2">
            What&apos;s Happening.
          </h1>
          <p className="text-forest-300 text-[15px] mb-1">
            Events in food, beverage & CPG &mdash; {formatDateRange(startDate, endDate)}
          </p>
          <p className="text-forest-500 text-[13px]">
            Curated by the Myca community
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 lg:px-8 py-8">
        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3 mb-8">
          {/* View toggle */}
          <div className="flex border border-ink-200">
            <button
              onClick={() => setView("list")}
              className={`px-3 py-1.5 text-[12px] uppercase tracking-wider transition-colors ${
                view === "list"
                  ? "bg-forest-900 text-cream"
                  : "bg-white text-ink-400 hover:text-ink-600"
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <button
              onClick={() => setView("calendar")}
              className={`px-3 py-1.5 text-[12px] uppercase tracking-wider transition-colors border-l border-ink-200 ${
                view === "calendar"
                  ? "bg-forest-900 text-cream"
                  : "bg-white text-ink-400 hover:text-ink-600"
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </button>
          </div>

          {/* City filters */}
          {cities.length > 1 && (
            <div className="flex gap-2">
              <button
                onClick={() => setCityFilter("")}
                className={`px-4 py-1.5 text-[13px] tracking-wide uppercase transition-colors border ${
                  !cityFilter
                    ? "bg-forest-900 text-cream border-forest-900"
                    : "bg-white text-ink-500 border-ink-200 hover:border-forest-400"
                }`}
              >
                All
              </button>
              {cities.map((city) => (
                <button
                  key={city}
                  onClick={() => setCityFilter(city!)}
                  className={`px-4 py-1.5 text-[13px] tracking-wide uppercase transition-colors border ${
                    cityFilter === city
                      ? "bg-forest-900 text-cream border-forest-900"
                      : "bg-white text-ink-500 border-ink-200 hover:border-forest-400"
                  }`}
                >
                  {city}
                </button>
              ))}
            </div>
          )}

          <div className="ml-auto flex items-center gap-3">
            {signedIn && (
              <Link
                href="/events/submit"
                className="px-5 py-1.5 text-[13px] tracking-wide uppercase font-medium text-cream bg-forest-600 hover:bg-forest-700 transition-colors"
              >
                Submit Event
              </Link>
            )}
            <span className="text-[11px] text-ink-300 font-mono uppercase tracking-wider">
              {filtered.length} events
            </span>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="text-center py-24">
            <div className="w-8 h-8 border border-forest-200 border-t-forest-600 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-[13px] text-ink-300 font-mono uppercase tracking-wider">
              Loading events...
            </p>
          </div>
        )}

        {/* ==================== CALENDAR VIEW ==================== */}
        {!loading && view === "calendar" && (
          <div className="relative">
            <div className="grid grid-cols-7 gap-px bg-ink-100 border border-ink-100">
              {/* Day headers */}
              {calendarDays.map((day) => (
                <div key={day.date + "-header"} className="bg-forest-900 px-2 py-2 text-center">
                  <p className="text-[11px] uppercase tracking-wider text-forest-300 font-mono">
                    {day.dayName}
                  </p>
                  <p className="text-lg font-serif text-cream">{day.label}</p>
                </div>
              ))}

              {/* Day cells */}
              {calendarDays.map((day) => {
                const dayEvents = eventsByDate[day.date] || [];
                return (
                  <div
                    key={day.date}
                    className={`bg-white min-h-[140px] p-2 ${
                      dayEvents.length > 0 ? "" : "opacity-60"
                    }`}
                  >
                    {dayEvents.length === 0 && (
                      <p className="text-[11px] text-ink-200 font-mono text-center mt-8">
                        —
                      </p>
                    )}
                    <div className="space-y-1.5">
                      {dayEvents.map((event) => {
                        const idx = runningIndex++;
                        const shouldBlur = !signedIn && idx >= TEASER_COUNT;
                        return (
                          <div
                            key={event.id}
                            className={`relative p-2 border-l-2 ${
                              event.isMycaMemberEvent
                                ? "border-l-forest-500 bg-forest-50/50"
                                : "border-l-ink-200 bg-ivory/50"
                            } ${shouldBlur ? "select-none" : ""}`}
                          >
                            {shouldBlur && (
                              <div className="absolute inset-0 bg-white/70 backdrop-blur-sm z-10 rounded" />
                            )}
                            <p className="text-[12px] font-serif text-ink-900 leading-tight line-clamp-2">
                              {event.title}
                            </p>
                            {event.startTime && (
                              <p className="text-[10px] text-ink-400 font-mono mt-0.5">
                                {event.startTime}
                              </p>
                            )}
                            {event.host && (
                              <p className="text-[10px] text-ink-300 mt-0.5 truncate">
                                {event.host}
                              </p>
                            )}
                            {event.coverImageUrl && !shouldBlur && (
                              <img
                                src={event.coverImageUrl}
                                alt=""
                                className="w-full h-16 object-cover mt-1.5 border border-ink-100"
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Blur CTA for calendar */}
            {!signedIn && events.length > TEASER_COUNT && (
              <div className="mt-8 text-center">
                <p className="font-serif text-xl text-ink-900 mb-3">
                  See all {events.length} events
                </p>
                <p className="text-[14px] text-ink-500 mb-6 max-w-md mx-auto">
                  Join Myca to unlock the full weekly event calendar.
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                  <Link
                    href="/join"
                    className="px-6 py-2.5 text-[13px] uppercase tracking-wide font-medium text-cream bg-forest-900 hover:bg-forest-800 transition-colors"
                  >
                    Apply to Myca
                  </Link>
                  <a
                    href="https://mycacollective.substack.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-6 py-2.5 text-[13px] uppercase tracking-wide font-medium text-ink-700 border border-ink-300 hover:border-ink-500 transition-colors"
                  >
                    Subscribe on Substack
                  </a>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ==================== LIST VIEW ==================== */}
        {!loading && view === "list" && (
          <div className="relative">
            {groupedByDate.map(([date, dayEvents]) => (
              <div key={date} className="mb-10">
                <div className="sticky top-14 z-10 bg-ivory/95 backdrop-blur-sm py-2 mb-4 border-b border-ink-100">
                  <p className="text-[12px] uppercase tracking-[0.2em] text-forest-600 font-mono">
                    {formatDate(date)}
                  </p>
                </div>

                <div className="space-y-5">
                  {dayEvents.map((event) => {
                    const idx = runningIndex++;
                    const shouldBlur = !signedIn && idx >= TEASER_COUNT;
                    return (
                      <EventCard key={event.id} event={event} blurred={shouldBlur} />
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Blur CTA for list */}
            {!signedIn && events.length > TEASER_COUNT && (
              <div className="relative -mt-4 pt-8 pb-12 text-center">
                <div className="absolute inset-x-0 -top-32 h-32 bg-gradient-to-b from-transparent to-ivory pointer-events-none" />
                <div className="relative">
                  <p className="font-serif text-2xl text-ink-900 mb-3">
                    See all {events.length} events this week
                  </p>
                  <p className="text-[14px] text-ink-500 mb-6 max-w-md mx-auto">
                    Join the Myca Collective to get full access to our weekly event
                    calendar, or subscribe to our Substack for the highlights.
                  </p>
                  <div className="flex flex-wrap justify-center gap-3">
                    <Link
                      href="/join"
                      className="px-6 py-2.5 text-[13px] uppercase tracking-wide font-medium text-cream bg-forest-900 hover:bg-forest-800 transition-colors"
                    >
                      Apply to Myca
                    </Link>
                    <a
                      href="https://mycacollective.substack.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-6 py-2.5 text-[13px] uppercase tracking-wide font-medium text-ink-700 border border-ink-300 hover:border-ink-500 transition-colors"
                    >
                      Subscribe on Substack
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Empty state */}
        {!loading && events.length === 0 && (
          <div className="text-center py-24">
            {signedIn ? (
              <>
                <p className="font-serif text-xl text-ink-900 mb-2">
                  No events this week yet.
                </p>
                <p className="text-[13px] text-ink-400 mb-6">
                  Check back soon &mdash; we update the calendar weekly.
                </p>
                <Link
                  href="/events/submit"
                  className="inline-block px-6 py-2.5 text-[13px] uppercase tracking-wide font-medium text-cream bg-forest-600 hover:bg-forest-700 transition-colors"
                >
                  Submit an Event
                </Link>
              </>
            ) : (
              <>
                <p className="font-serif text-2xl text-ink-900 mb-3">
                  Your weekly food & CPG event guide.
                </p>
                <p className="text-[14px] text-ink-500 mb-6 max-w-md mx-auto">
                  Myca members get access to a curated calendar of events every week
                  &mdash; tastings, panels, happy hours, and more. Join to see what&apos;s coming up.
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                  <Link
                    href="/join"
                    className="px-6 py-2.5 text-[13px] uppercase tracking-wide font-medium text-cream bg-forest-900 hover:bg-forest-800 transition-colors"
                  >
                    Apply to Myca
                  </Link>
                  <a
                    href="https://mycacollective.substack.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-6 py-2.5 text-[13px] uppercase tracking-wide font-medium text-ink-700 border border-ink-300 hover:border-ink-500 transition-colors"
                  >
                    Subscribe on Substack
                  </a>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
