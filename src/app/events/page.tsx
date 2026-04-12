"use client";

import { useState, useEffect } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import MemberLogin from "@/components/MemberLogin";
import Link from "next/link";

interface Event {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  event_date: string;
  end_date: string | null;
  capacity: number | null;
  min_tier: string;
  rsvp_count?: number;
  my_rsvp?: string | null;
}

function EventsApp() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [contactId, setContactId] = useState("");
  const [rsvpLoading, setRsvpLoading] = useState<string | null>(null);

  useEffect(() => {
    const supabase = getSupabaseBrowser();
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.user?.email) return;
      const userEmail = session.user.email;
      setEmail(userEmail);

      // Get contact_id
      const { data: contact } = await supabase
        .from("contacts")
        .select("contact_id")
        .eq("email", userEmail)
        .single();

      if (contact) setContactId(contact.contact_id);

      // Fetch upcoming events
      const { data: eventsData } = await supabase
        .from("events")
        .select("*")
        .eq("is_published", true)
        .gte("event_date", new Date().toISOString())
        .order("event_date", { ascending: true });

      if (eventsData && contact) {
        // Get RSVP counts and user's RSVPs
        const enriched = await Promise.all(
          eventsData.map(async (evt: any) => {
            const { count } = await supabase
              .from("event_rsvps")
              .select("*", { count: "exact", head: true })
              .eq("event_id", evt.id)
              .eq("status", "going");

            const { data: myRsvp } = await supabase
              .from("event_rsvps")
              .select("status")
              .eq("event_id", evt.id)
              .eq("contact_id", contact.contact_id)
              .single();

            return {
              ...evt,
              rsvp_count: count || 0,
              my_rsvp: myRsvp?.status || null,
            };
          })
        );
        setEvents(enriched);
      }
      setLoading(false);
    });
  }, []);

  const handleRSVP = async (eventId: string, status: "going" | "canceled") => {
    if (!contactId || !email) return;
    setRsvpLoading(eventId);

    const supabase = getSupabaseBrowser();

    if (status === "going") {
      await supabase.from("event_rsvps").upsert(
        { event_id: eventId, contact_id: contactId, email, status: "going" },
        { onConflict: "event_id,contact_id" }
      );
    } else {
      await supabase
        .from("event_rsvps")
        .update({ status: "canceled" })
        .eq("event_id", eventId)
        .eq("contact_id", contactId);
    }

    // Refresh that event's RSVP status
    setEvents((prev) =>
      prev.map((evt) => {
        if (evt.id !== eventId) return evt;
        return {
          ...evt,
          my_rsvp: status,
          rsvp_count: status === "going"
            ? (evt.rsvp_count || 0) + (evt.my_rsvp === "going" ? 0 : 1)
            : Math.max(0, (evt.rsvp_count || 0) - 1),
        };
      })
    );
    setRsvpLoading(null);
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return {
      day: d.toLocaleDateString("en-US", { weekday: "short" }),
      date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      time: d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
    };
  };

  return (
    <div className="min-h-screen bg-ivory">
      <div className="bg-forest-900">
        <div className="max-w-3xl mx-auto px-6 lg:px-8 py-14">
          <p className="text-[11px] uppercase tracking-[0.3em] text-forest-400 font-mono mb-3">
            Events
          </p>
          <h1 className="text-3xl font-serif text-cream">Upcoming Events</h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 lg:px-8 py-8">
        {loading && (
          <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 border border-forest-200 border-t-forest-600 rounded-full animate-spin" />
          </div>
        )}

        {!loading && events.length === 0 && (
          <div className="text-center py-24">
            <p className="text-3xl mb-3">📅</p>
            <p className="text-[15px] font-serif text-ink-900 mb-2">No upcoming events</p>
            <p className="text-[13px] text-ink-400">
              Check back soon — new events are added regularly.
            </p>
          </div>
        )}

        {!loading && events.length > 0 && (
          <div className="space-y-4">
            {events.map((evt) => {
              const { day, date, time } = formatDate(evt.event_date);
              const isGoing = evt.my_rsvp === "going";
              const isFull = evt.capacity !== null && (evt.rsvp_count || 0) >= evt.capacity;

              return (
                <div
                  key={evt.id}
                  className="bg-white border border-ink-100 p-6 flex flex-col sm:flex-row gap-5"
                >
                  {/* Date block */}
                  <div className="sm:w-20 flex-shrink-0 text-center sm:text-left">
                    <p className="text-[10px] uppercase tracking-wider text-ink-400 font-mono">
                      {day}
                    </p>
                    <p className="text-2xl font-serif text-ink-900">{date}</p>
                    <p className="text-[12px] text-ink-400 font-mono">{time}</p>
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[16px] font-serif text-ink-900 mb-1">
                      {evt.title}
                    </h3>
                    {evt.location && (
                      <p className="text-[13px] text-ink-400 mb-2">{evt.location}</p>
                    )}
                    {evt.description && (
                      <p className="text-[13px] text-ink-500 leading-relaxed mb-3">
                        {evt.description}
                      </p>
                    )}
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-[11px] text-ink-300 font-mono uppercase tracking-wider">
                        {evt.rsvp_count} going
                        {evt.capacity !== null && ` / ${evt.capacity} spots`}
                      </span>
                      {evt.min_tier === "founding" && (
                        <span className="px-2 py-0.5 text-[10px] uppercase tracking-wider text-forest-700 border border-forest-200 font-mono">
                          Founding only
                        </span>
                      )}
                    </div>
                  </div>

                  {/* RSVP button */}
                  <div className="sm:w-32 flex-shrink-0 flex items-center">
                    {isGoing ? (
                      <button
                        onClick={() => handleRSVP(evt.id, "canceled")}
                        disabled={rsvpLoading === evt.id}
                        className="w-full py-2.5 text-[11px] uppercase tracking-wider font-medium text-forest-700 border border-forest-300 bg-forest-50 hover:bg-forest-100 transition-colors disabled:opacity-50"
                      >
                        {rsvpLoading === evt.id ? "..." : "Going"}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleRSVP(evt.id, "going")}
                        disabled={rsvpLoading === evt.id || isFull}
                        className="w-full py-2.5 text-[11px] uppercase tracking-wider font-medium text-cream bg-forest-900 hover:bg-forest-700 transition-colors disabled:opacity-50"
                      >
                        {rsvpLoading === evt.id ? "..." : isFull ? "Full" : "RSVP"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function EventsPage() {
  return (
    <MemberLogin>
      <EventsApp />
    </MemberLogin>
  );
}
