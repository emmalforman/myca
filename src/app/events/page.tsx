"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import MemberLogin from "@/components/MemberLogin";
import type { Event } from "@/lib/types";

/* ─── date helpers ─── */
function toDateStr(d: Date): string {
  return d.toISOString().split("T")[0];
}

function getMonthStart(year: number, month: number): string {
  return toDateStr(new Date(year, month, 1));
}

function getMonthEnd(year: number, month: number): string {
  return toDateStr(new Date(year, month + 1, 0));
}

function getCalendarGrid(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startPad = firstDay.getDay();
  const totalDays = lastDay.getDate();

  const cells: { date: string; day: number; inMonth: boolean }[] = [];

  for (let i = startPad - 1; i >= 0; i--) {
    const d = new Date(year, month, -i);
    cells.push({ date: toDateStr(d), day: d.getDate(), inMonth: false });
  }

  for (let d = 1; d <= totalDays; d++) {
    const dt = new Date(year, month, d);
    cells.push({ date: toDateStr(dt), day: d, inMonth: true });
  }

  const remaining = 7 - (cells.length % 7);
  if (remaining < 7) {
    for (let i = 1; i <= remaining; i++) {
      const dt = new Date(year, month + 1, i);
      cells.push({ date: toDateStr(dt), day: dt.getDate(), inMonth: false });
    }
  }

  return cells;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const DAY_HEADERS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

/* ─── Join CTA overlay (reused in both views) ─── */
function JoinOverlay() {
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center">
      <div className="absolute inset-0 bg-cream/60 backdrop-blur-[6px] rounded-lg" />
      <div className="relative z-10 text-center px-6 py-10 max-w-md">
        <div className="w-14 h-14 bg-forest-800 rounded-xl flex items-center justify-center mx-auto mb-5">
          <svg className="w-7 h-7 text-cream" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <p className="font-serif text-2xl text-ink-900 mb-2">Join Myca to unlock</p>
        <p className="text-[14px] text-ink-500 mb-6 leading-relaxed">
          Members get full access to event details, RSVP links, and can submit their own events to be featured.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link
            href="/join"
            className="px-7 py-2.5 text-[13px] uppercase tracking-wide font-medium text-cream bg-forest-900 hover:bg-forest-800 rounded transition-colors"
          >
            Join Now
          </Link>
          <Link
            href="/directory"
            className="px-7 py-2.5 text-[13px] uppercase tracking-wide font-medium text-ink-700 border border-ink-300 hover:border-ink-500 rounded transition-colors"
          >
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ─── component ─── */
function EventsPageInner() {
  const today = new Date();
  const [signedIn, setSignedIn] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [view, setView] = useState<"calendar" | "list">("calendar");
  const [userEmail, setUserEmail] = useState("");
  const [rsvpLoading, setRsvpLoading] = useState<string | null>(null);

  useEffect(() => {
    const supabase = getSupabaseBrowser();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSignedIn(!!session);
      setUserEmail(session?.user?.email || "");
    });
  }, []);

  const fetchEvents = useCallback(() => {
    setLoading(true);
    const start = getMonthStart(year, month);
    const end = getMonthEnd(year, month);
    fetch(`/api/events?startDate=${start}&endDate=${end}`)
      .then((r) => {
        if (r.status === 401) return { events: [] };
        return r.json();
      })
      .then((data) => setEvents(data.events || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [year, month]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const eventsByDate = useMemo(() => {
    const groups: Record<string, Event[]> = {};
    for (const event of events) {
      const key = event.date;
      if (!groups[key]) groups[key] = [];
      groups[key].push(event);
    }
    return groups;
  }, [events]);

  const calendarCells = useMemo(() => getCalendarGrid(year, month), [year, month]);
  const todayStr = toDateStr(today);

  function prevMonth() {
    if (month === 0) { setYear(year - 1); setMonth(11); }
    else setMonth(month - 1);
    setSelectedEvent(null);
    setSelectedDate(null);
  }

  function nextMonth() {
    if (month === 11) { setYear(year + 1); setMonth(0); }
    else setMonth(month + 1);
    setSelectedEvent(null);
    setSelectedDate(null);
  }

  function handleDayClick(date: string) {
    if (!signedIn) return;
    const dayEvents = eventsByDate[date];
    if (dayEvents?.length) {
      setSelectedDate(date);
      setSelectedEvent(dayEvents[0]);
    }
  }

  const selectedDayEvents = selectedDate ? (eventsByDate[selectedDate] || []) : [];

  const sortedGrouped = useMemo(() => {
    return Object.entries(eventsByDate).sort(([a], [b]) => a.localeCompare(b));
  }, [eventsByDate]);

  async function toggleRsvp(eventId: string) {
    if (!signedIn) return;
    setRsvpLoading(eventId);

    const event = events.find((e) => e.id === eventId);
    const isGoing = event?.attendees?.some((a) => a.email === userEmail);

    try {
      if (isGoing) {
        await fetch("/api/events/rsvp", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ eventId }),
        });
        // Optimistic update
        setEvents((prev) =>
          prev.map((e) =>
            e.id === eventId
              ? { ...e, attendees: (e.attendees || []).filter((a) => a.email !== userEmail) }
              : e
          )
        );
        if (selectedEvent?.id === eventId) {
          setSelectedEvent((prev) =>
            prev ? { ...prev, attendees: (prev.attendees || []).filter((a) => a.email !== userEmail) } : prev
          );
        }
      } else {
        const res = await fetch("/api/events/rsvp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ eventId }),
        });
        const data = await res.json();
        if (res.ok) {
          const newAttendee = { email: userEmail, name: data.rsvp?.member_name || userEmail, photoUrl: data.rsvp?.member_photo_url };
          setEvents((prev) =>
            prev.map((e) =>
              e.id === eventId
                ? { ...e, attendees: [...(e.attendees || []), newAttendee] }
                : e
            )
          );
          if (selectedEvent?.id === eventId) {
            setSelectedEvent((prev) =>
              prev ? { ...prev, attendees: [...(prev.attendees || []), newAttendee] } : prev
            );
          }
        }
      }
    } catch {}
    setRsvpLoading(null);
  }

  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <div className="bg-forest-950">
        <div className="max-w-6xl mx-auto px-6 lg:px-8 py-16 sm:py-20">
          <p className="text-[11px] uppercase tracking-[0.3em] text-forest-400 font-mono mb-3">
            The Calendar
          </p>
          <h1 className="text-3xl sm:text-5xl font-serif text-cream mb-2">
            Upcoming experiences and{" "}
            <em className="italic">curated workshops</em>
          </h1>
          {signedIn && (
            <Link
              href="/events/submit"
              className="inline-block mt-6 px-6 py-2.5 text-[13px] uppercase tracking-wide font-medium text-forest-950 bg-cream hover:bg-white transition-colors"
            >
              Submit Event
            </Link>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 lg:px-8 py-10">
        {/* View toggle */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex border border-ink-200 rounded overflow-hidden">
            <button
              onClick={() => setView("calendar")}
              className={`flex items-center gap-1.5 px-4 py-2 text-[12px] uppercase tracking-wider font-medium transition-colors ${
                view === "calendar"
                  ? "bg-forest-900 text-cream"
                  : "bg-white text-ink-400 hover:text-ink-600"
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Calendar
            </button>
            <button
              onClick={() => setView("list")}
              className={`flex items-center gap-1.5 px-4 py-2 text-[12px] uppercase tracking-wider font-medium border-l border-ink-200 transition-colors ${
                view === "list"
                  ? "bg-forest-900 text-cream"
                  : "bg-white text-ink-400 hover:text-ink-600"
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              List
            </button>
          </div>
          <span className="text-[11px] text-ink-300 font-mono uppercase tracking-wider">
            {events.length} events
          </span>
        </div>

        {/* ==================== CALENDAR VIEW ==================== */}
        {view === "calendar" && (
          <>
            <div className="relative">
              {!signedIn && !loading && events.length > 0 && <JoinOverlay />}

              <div className={`bg-ivory/80 rounded-lg shadow-sm border border-ink-100 overflow-hidden ${!signedIn ? "select-none" : ""}`}>
                {/* Month header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-ink-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-forest-800 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-cream" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xl font-serif text-ink-900">
                        {MONTH_NAMES[month]} {year}
                      </p>
                      <p className="text-[11px] uppercase tracking-[0.2em] text-ink-400 font-mono">
                        Curated Experiences
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={prevMonth}
                      className="w-9 h-9 flex items-center justify-center text-ink-400 hover:text-ink-700 hover:bg-ink-50 rounded transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <button
                      onClick={nextMonth}
                      className="w-9 h-9 flex items-center justify-center text-ink-400 hover:text-ink-700 hover:bg-ink-50 rounded transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Loading */}
                {loading && (
                  <div className="flex items-center justify-center py-32">
                    <div className="w-8 h-8 border border-forest-200 border-t-forest-600 rounded-full animate-spin" />
                  </div>
                )}

                {/* Calendar grid */}
                {!loading && (
                  <div>
                    <div className="grid grid-cols-7 border-b border-ink-100">
                      {DAY_HEADERS.map((day) => (
                        <div key={day} className="px-2 py-3 text-center">
                          <p className="text-[11px] uppercase tracking-wider text-ink-400 font-mono">{day}</p>
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-7">
                      {calendarCells.map((cell, idx) => {
                        const dayEvents = eventsByDate[cell.date] || [];
                        const isToday = cell.date === todayStr;
                        const isSelected = cell.date === selectedDate;
                        const hasEvents = dayEvents.length > 0;

                        return (
                          <div
                            key={cell.date + "-" + idx}
                            onClick={() => hasEvents && handleDayClick(cell.date)}
                            className={`
                              relative min-h-[110px] sm:min-h-[130px] border-b border-r border-ink-100 p-2 transition-colors
                              ${cell.inMonth ? "" : "bg-ink-50/30"}
                              ${hasEvents && signedIn ? "cursor-pointer hover:bg-forest-50/40" : ""}
                              ${isSelected ? "bg-forest-50/60 ring-1 ring-inset ring-forest-300" : ""}
                            `}
                          >
                            <p className={`
                              text-[14px] mb-1
                              ${cell.inMonth ? "text-ink-700" : "text-ink-200"}
                              ${isToday ? "font-bold text-forest-700" : ""}
                            `}>
                              {cell.day}
                            </p>

                            <div className="space-y-1">
                              {dayEvents.slice(0, 3).map((event) => (
                                <div
                                  key={event.id}
                                  onClick={(e) => {
                                    if (!signedIn) return;
                                    e.stopPropagation();
                                    setSelectedDate(cell.date);
                                    setSelectedEvent(event);
                                  }}
                                  className={`
                                    px-1.5 py-1 rounded text-[10px] leading-tight truncate transition-colors
                                    ${signedIn ? "cursor-pointer" : ""}
                                    ${event.isMycaMemberEvent
                                      ? `bg-forest-100 text-forest-800 ${signedIn ? "hover:bg-forest-200" : ""}`
                                      : `bg-clay-100 text-ink-700 ${signedIn ? "hover:bg-clay-200" : ""}`
                                    }
                                    ${selectedEvent?.id === event.id ? "ring-1 ring-forest-500" : ""}
                                  `}
                                >
                                  <p className="font-medium truncate">{event.title}</p>
                                  {event.startTime && (
                                    <p className="text-[9px] opacity-70 flex items-center gap-0.5 mt-0.5">
                                      <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      </svg>
                                      {event.startTime}
                                    </p>
                                  )}
                                </div>
                              ))}
                              {dayEvents.length > 3 && (
                                <p className="text-[9px] text-ink-400 font-mono pl-1">
                                  +{dayEvents.length - 3} more
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Selected event detail panel */}
            {selectedEvent && signedIn && (
              <div className="mt-6 bg-white rounded-lg border border-ink-100 shadow-sm overflow-hidden">
                <div className="flex flex-col sm:flex-row">
                  {selectedEvent.coverImageUrl && (
                    <div className="sm:w-64 flex-shrink-0">
                      <img
                        src={selectedEvent.coverImageUrl}
                        alt={selectedEvent.title}
                        className="w-full h-48 sm:h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1 p-6">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        {selectedEvent.isMycaMemberEvent && (
                          <span className="inline-block mb-2 px-2.5 py-0.5 text-[10px] uppercase tracking-wider font-mono bg-forest-50 text-forest-700 border border-forest-200 rounded">
                            Myca Member Event
                          </span>
                        )}
                        <h2 className="text-xl font-serif text-ink-900 leading-tight">
                          {selectedEvent.title}
                        </h2>
                        {selectedEvent.host && (
                          <p className="text-[14px] text-ink-400 mt-1">
                            Hosted by {selectedEvent.host}
                            {selectedEvent.hostCompany ? ` @ ${selectedEvent.hostCompany}` : ""}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => { setSelectedEvent(null); setSelectedDate(null); }}
                        className="text-ink-300 hover:text-ink-600 flex-shrink-0 p-1"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>

                    {selectedEvent.description && (
                      <p className="text-[14px] text-ink-500 leading-relaxed mb-4">
                        {selectedEvent.description}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-4 text-[13px] text-ink-500 mb-4">
                      <span className="flex items-center gap-1.5">
                        <svg className="w-4 h-4 text-ink-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {new Date(selectedEvent.date + "T00:00:00").toLocaleDateString("en-US", {
                          weekday: "long", month: "long", day: "numeric",
                        })}
                      </span>
                      {selectedEvent.startTime && (
                        <span className="flex items-center gap-1.5">
                          <svg className="w-4 h-4 text-ink-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {selectedEvent.startTime}
                          {selectedEvent.endTime ? ` – ${selectedEvent.endTime}` : ""}
                        </span>
                      )}
                      {selectedEvent.location && (
                        <span className="flex items-center gap-1.5">
                          <svg className="w-4 h-4 text-ink-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {selectedEvent.location}
                        </span>
                      )}
                      {selectedEvent.city && (
                        <span className="text-[11px] uppercase tracking-wider font-mono text-ink-300">
                          {selectedEvent.city}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      {selectedEvent.rsvpUrl && (
                        <a
                          href={selectedEvent.rsvpUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-5 py-2.5 text-[13px] uppercase tracking-wide font-medium text-cream bg-forest-800 hover:bg-forest-700 rounded transition-colors"
                        >
                          {selectedEvent.rsvpPlatform === "resy" ? "Reserve" : selectedEvent.rsvpPlatform === "luma" || selectedEvent.rsvpPlatform === "partiful" ? "RSVP" : "Event Details"}
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      )}
                      <button
                        onClick={() => toggleRsvp(selectedEvent.id)}
                        disabled={rsvpLoading === selectedEvent.id}
                        className={`inline-flex items-center gap-2 px-5 py-2.5 text-[13px] uppercase tracking-wide font-medium rounded transition-colors ${
                          selectedEvent.attendees?.some((a) => a.email === userEmail)
                            ? "text-forest-800 bg-forest-100 border border-forest-300 hover:bg-forest-200"
                            : "text-ink-600 bg-white border border-ink-300 hover:border-forest-400 hover:text-forest-700"
                        }`}
                      >
                        {selectedEvent.attendees?.some((a) => a.email === userEmail) ? (
                          <>
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            Going
                          </>
                        ) : (
                          rsvpLoading === selectedEvent.id ? "..." : "I'm Going"
                        )}
                      </button>
                    </div>

                    {/* Members attending */}
                    {(selectedEvent.attendees?.length || 0) > 0 && (
                      <div className="mt-4 pt-4 border-t border-ink-100">
                        <p className="text-[11px] uppercase tracking-wider text-ink-400 font-mono mb-2">
                          Myca Members Going ({selectedEvent.attendees!.length})
                        </p>
                        <div className="flex flex-wrap items-center gap-2">
                          {selectedEvent.attendees!.map((a) => (
                            <div key={a.email} className="flex items-center gap-1.5 px-2.5 py-1 bg-forest-50 rounded-full border border-forest-100">
                              {a.photoUrl ? (
                                <img src={a.photoUrl} alt={a.name} className="w-5 h-5 rounded-full object-cover" />
                              ) : (
                                <div className="w-5 h-5 rounded-full bg-forest-200 flex items-center justify-center text-[9px] font-medium text-forest-700">
                                  {a.name?.charAt(0)?.toUpperCase() || "?"}
                                </div>
                              )}
                              <span className="text-[12px] text-forest-800">{a.name?.split(" ")[0]}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedDayEvents.length > 1 && (
                      <div className="mt-5 pt-4 border-t border-ink-100">
                        <p className="text-[11px] uppercase tracking-wider text-ink-400 font-mono mb-2">
                          Also on this day
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {selectedDayEvents
                            .filter((e) => e.id !== selectedEvent.id)
                            .map((event) => (
                              <button
                                key={event.id}
                                onClick={() => setSelectedEvent(event)}
                                className={`px-3 py-1.5 text-[12px] rounded border transition-colors ${
                                  event.isMycaMemberEvent
                                    ? "bg-forest-50 text-forest-800 border-forest-200 hover:bg-forest-100"
                                    : "bg-clay-50 text-ink-700 border-clay-200 hover:bg-clay-100"
                                }`}
                              >
                                {event.title}
                              </button>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* ==================== LIST VIEW ==================== */}
        {view === "list" && !loading && (
          <div className="relative">
            {!signedIn && events.length > 0 && <JoinOverlay />}

            <div className={!signedIn ? "select-none" : ""}>
              {/* Month header for list */}
              <div className="flex items-center justify-between mb-6">
                <p className="text-xl font-serif text-ink-900">
                  {MONTH_NAMES[month]} {year}
                </p>
                <div className="flex items-center gap-1">
                  <button onClick={prevMonth} className="w-9 h-9 flex items-center justify-center text-ink-400 hover:text-ink-700 hover:bg-ink-50 rounded transition-colors">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button onClick={nextMonth} className="w-9 h-9 flex items-center justify-center text-ink-400 hover:text-ink-700 hover:bg-ink-50 rounded transition-colors">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>

              {sortedGrouped.length === 0 && signedIn && (
                <div className="text-center py-20">
                  <p className="font-serif text-xl text-ink-900 mb-2">No events this month.</p>
                  <p className="text-[13px] text-ink-400">Check back soon or submit your own.</p>
                </div>
              )}

              {sortedGrouped.map(([date, dayEvents]) => (
                <div key={date} className="mb-8">
                  <div className="sticky top-14 z-10 bg-cream/95 backdrop-blur-sm py-2 mb-3 border-b border-ink-100">
                    <p className="text-[12px] uppercase tracking-[0.2em] text-forest-600 font-mono">
                      {new Date(date + "T00:00:00").toLocaleDateString("en-US", {
                        weekday: "long", month: "short", day: "numeric",
                      })}
                    </p>
                  </div>

                  <div className="space-y-3">
                    {dayEvents.map((event) => (
                      <div
                        key={event.id}
                        className="bg-white border border-ink-100 rounded-lg overflow-hidden transition-all hover:border-forest-300"
                      >
                        <div className="flex flex-col sm:flex-row">
                          {event.coverImageUrl && (
                            <div className="sm:w-48 sm:min-h-[130px] flex-shrink-0">
                              <img src={event.coverImageUrl} alt={event.title} className="w-full h-40 sm:h-full object-cover" />
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
                                <span className="flex-shrink-0 px-2.5 py-0.5 text-[10px] uppercase tracking-wider font-mono bg-forest-50 text-forest-700 border border-forest-200 rounded">
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
                                <span className="truncate max-w-[250px]">{event.location}</span>
                              )}
                              {event.city && (
                                <span className="uppercase text-[11px]">{event.city}</span>
                              )}
                            </div>

                            {signedIn && (
                              <div className="flex flex-wrap items-center gap-2 mt-3">
                                {event.rsvpUrl && (
                                  <a
                                    href={event.rsvpUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-4 py-1.5 text-[12px] uppercase tracking-wider font-medium text-forest-800 border border-forest-300 hover:bg-forest-50 rounded transition-colors"
                                  >
                                    {event.rsvpPlatform === "resy" ? "Reserve" : event.rsvpPlatform === "luma" || event.rsvpPlatform === "partiful" ? "RSVP" : "Event Details"}
                                  </a>
                                )}
                                <button
                                  onClick={() => toggleRsvp(event.id)}
                                  disabled={rsvpLoading === event.id}
                                  className={`px-4 py-1.5 text-[12px] uppercase tracking-wider font-medium rounded transition-colors ${
                                    event.attendees?.some((a) => a.email === userEmail)
                                      ? "text-forest-700 bg-forest-50 border border-forest-200"
                                      : "text-ink-500 border border-ink-200 hover:border-forest-300 hover:text-forest-700"
                                  }`}
                                >
                                  {event.attendees?.some((a) => a.email === userEmail) ? "Going \u2713" : rsvpLoading === event.id ? "..." : "I'm Going"}
                                </button>
                                {(event.attendees?.length || 0) > 0 && (
                                  <div className="flex items-center gap-1 ml-1">
                                    <div className="flex -space-x-1.5">
                                      {event.attendees!.slice(0, 5).map((a) => (
                                        a.photoUrl ? (
                                          <img key={a.email} src={a.photoUrl} alt={a.name} className="w-6 h-6 rounded-full border-2 border-white object-cover" title={a.name} />
                                        ) : (
                                          <div key={a.email} className="w-6 h-6 rounded-full border-2 border-white bg-forest-100 flex items-center justify-center text-[9px] font-medium text-forest-700" title={a.name}>
                                            {a.name?.charAt(0)?.toUpperCase() || "?"}
                                          </div>
                                        )
                                      ))}
                                    </div>
                                    <span className="text-[11px] text-ink-400 font-mono ml-1">
                                      {event.attendees!.length} going
                                    </span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function EventsPage() {
  return (
    <MemberLogin>
      <EventsPageInner />
    </MemberLogin>
  );
}
