"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
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
  const startPad = firstDay.getDay(); // 0=Sun
  const totalDays = lastDay.getDate();

  const cells: { date: string; day: number; inMonth: boolean }[] = [];

  // Padding days from previous month
  const prevMonthLast = new Date(year, month, 0);
  for (let i = startPad - 1; i >= 0; i--) {
    const d = new Date(year, month, -i);
    cells.push({ date: toDateStr(d), day: d.getDate(), inMonth: false });
  }

  // Days in current month
  for (let d = 1; d <= totalDays; d++) {
    const dt = new Date(year, month, d);
    cells.push({ date: toDateStr(dt), day: d, inMonth: true });
  }

  // Padding days to fill last row
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

/* ─── component ─── */
export default function EventsPage() {
  const today = new Date();
  const [signedIn, setSignedIn] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    const supabase = getSupabaseBrowser();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSignedIn(!!session);
    });
  }, []);

  // Fetch events for the visible month (+ padding)
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
    const dayEvents = eventsByDate[date];
    if (dayEvents?.length) {
      setSelectedDate(date);
      setSelectedEvent(dayEvents[0]);
    }
  }

  const selectedDayEvents = selectedDate ? (eventsByDate[selectedDate] || []) : [];

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
        {/* Calendar card */}
        <div className="bg-ivory/80 rounded-lg shadow-sm border border-ink-100 overflow-hidden">
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

          {/* Loading overlay */}
          {loading && (
            <div className="flex items-center justify-center py-32">
              <div className="w-8 h-8 border border-forest-200 border-t-forest-600 rounded-full animate-spin" />
            </div>
          )}

          {/* Calendar grid */}
          {!loading && (
            <div>
              {/* Day-of-week headers */}
              <div className="grid grid-cols-7 border-b border-ink-100">
                {DAY_HEADERS.map((day) => (
                  <div key={day} className="px-2 py-3 text-center">
                    <p className="text-[11px] uppercase tracking-wider text-ink-400 font-mono">
                      {day}
                    </p>
                  </div>
                ))}
              </div>

              {/* Day cells */}
              <div className="grid grid-cols-7">
                {calendarCells.map((cell, idx) => {
                  const dayEvents = eventsByDate[cell.date] || [];
                  const isToday = cell.date === todayStr;
                  const isSelected = cell.date === selectedDate;
                  const hasEvents = dayEvents.length > 0;
                  const hasMycaEvent = dayEvents.some((e) => e.isMycaMemberEvent);

                  return (
                    <div
                      key={cell.date + "-" + idx}
                      onClick={() => hasEvents && handleDayClick(cell.date)}
                      className={`
                        relative min-h-[110px] sm:min-h-[130px] border-b border-r border-ink-100 p-2 transition-colors
                        ${cell.inMonth ? "" : "bg-ink-50/30"}
                        ${hasEvents ? "cursor-pointer hover:bg-forest-50/40" : ""}
                        ${isSelected ? "bg-forest-50/60 ring-1 ring-inset ring-forest-300" : ""}
                      `}
                    >
                      {/* Day number */}
                      <p className={`
                        text-[14px] mb-1
                        ${cell.inMonth ? "text-ink-700" : "text-ink-200"}
                        ${isToday ? "font-bold text-forest-700" : ""}
                      `}>
                        {cell.day}
                      </p>

                      {/* Event pills */}
                      {signedIn ? (
                        <div className="space-y-1">
                          {dayEvents.slice(0, 3).map((event) => (
                            <div
                              key={event.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedDate(cell.date);
                                setSelectedEvent(event);
                              }}
                              className={`
                                px-1.5 py-1 rounded text-[10px] leading-tight truncate cursor-pointer transition-colors
                                ${event.isMycaMemberEvent
                                  ? "bg-forest-100 text-forest-800 hover:bg-forest-200"
                                  : "bg-clay-100 text-ink-700 hover:bg-clay-200"
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
                      ) : (
                        /* Non-signed-in: just show dots */
                        hasEvents && (
                          <div className="flex gap-1 mt-1">
                            {dayEvents.slice(0, 4).map((event) => (
                              <div
                                key={event.id}
                                className={`w-2 h-2 rounded-full ${
                                  event.isMycaMemberEvent ? "bg-forest-500" : "bg-clay-400"
                                }`}
                              />
                            ))}
                          </div>
                        )
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
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

                {selectedEvent.rsvpUrl && (
                  <a
                    href={selectedEvent.rsvpUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-[13px] uppercase tracking-wide font-medium text-cream bg-forest-800 hover:bg-forest-700 rounded transition-colors"
                  >
                    RSVP
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                )}

                {/* Other events on this day */}
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

        {/* CTA for non-signed-in users */}
        {!loading && !signedIn && (
          <div className="mt-10 text-center py-8">
            <p className="font-serif text-2xl text-ink-900 mb-3">
              See the full calendar
            </p>
            <p className="text-[14px] text-ink-500 mb-6 max-w-md mx-auto">
              Join the Myca Collective to unlock event details, RSVP links,
              and submit your own events to be featured.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                href="/join"
                className="px-6 py-2.5 text-[13px] uppercase tracking-wide font-medium text-cream bg-forest-900 hover:bg-forest-800 rounded transition-colors"
              >
                Apply to Myca
              </Link>
              <a
                href="https://mycacollective.substack.com"
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-2.5 text-[13px] uppercase tracking-wide font-medium text-ink-700 border border-ink-300 hover:border-ink-500 rounded transition-colors"
              >
                Subscribe on Substack
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
