"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Member } from "@/lib/types";

function MemberAvatar({ member }: { member: Member }) {
  const displayName =
    member.name || `${member.firstName ?? ""} ${member.lastName ?? ""}`.trim();
  const initials =
    (member.firstName?.[0] ?? displayName?.[0] ?? "") +
    (member.lastName?.[0] ?? displayName?.split(" ")[1]?.[0] ?? "");

  return (
    <Link
      href="/directory"
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

export default function MemberDashboard({ userEmail }: { userEmail: string }) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [firstName, setFirstName] = useState("");

  useEffect(() => {
    fetch("/api/members")
      .then((res) => res.json())
      .then((data) => {
        const allMembers: Member[] = data.members || [];
        setMembers(allMembers);

        // Find the logged-in user's name from the member list
        const me = allMembers.find(
          (m) => m.email?.toLowerCase() === userEmail.toLowerCase()
        );
        setFirstName(
          me?.firstName || me?.name?.split(" ")[0] || userEmail.split("@")[0]
        );

        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [userEmail]);

  const newMembers = [...members].slice(-8).reverse();

  const membersWithAsks = members
    .filter((m) => m.asks && m.asks.trim().length > 0)
    .slice(0, 4);

  const membersWithOffers = members
    .filter((m) => m.offers && m.offers.trim().length > 0)
    .slice(0, 4);

  const cityCounts: Record<string, number> = {};
  members.forEach((m) => {
    if (m.location) {
      const city = m.location.split(",")[0].trim();
      cityCounts[city] = (cityCounts[city] || 0) + 1;
    }
  });

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-6 lg:px-8 py-20">
        <div className="animate-pulse space-y-8">
          <div className="h-8 bg-forest-100 w-64" />
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-forest-50" />
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
            <p className="text-[12px] text-forest-400 mt-0.5">Search {members.length} members</p>
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

      {/* Asks & Offers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-14">
        {membersWithAsks.length > 0 && (
          <section>
            <p className="text-[11px] uppercase tracking-[0.3em] text-forest-500 font-mono mb-2">
              Looking for
            </p>
            <h2 className="text-xl font-serif text-forest-900 mb-5">Member Asks</h2>
            <div className="space-y-3">
              {membersWithAsks.map((member) => {
                const displayName =
                  member.name || `${member.firstName ?? ""} ${member.lastName ?? ""}`.trim();
                return (
                  <div key={member.id} className="p-4 bg-white border border-forest-100">
                    <p className="text-[13px] text-ink-700 leading-relaxed mb-2">
                      &ldquo;{member.asks}&rdquo;
                    </p>
                    <p className="text-[12px] text-ink-400">
                      &mdash; {displayName}
                      {member.company ? `, ${member.company}` : ""}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {membersWithOffers.length > 0 && (
          <section>
            <p className="text-[11px] uppercase tracking-[0.3em] text-forest-500 font-mono mb-2">
              Can help with
            </p>
            <h2 className="text-xl font-serif text-forest-900 mb-5">Member Offers</h2>
            <div className="space-y-3">
              {membersWithOffers.map((member) => {
                const displayName =
                  member.name || `${member.firstName ?? ""} ${member.lastName ?? ""}`.trim();
                return (
                  <div key={member.id} className="p-4 bg-white border border-forest-100">
                    <p className="text-[13px] text-ink-700 leading-relaxed mb-2">
                      &ldquo;{member.offers}&rdquo;
                    </p>
                    <p className="text-[12px] text-ink-400">
                      &mdash; {displayName}
                      {member.company ? `, ${member.company}` : ""}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>

      {/* Community by City */}
      {Object.keys(cityCounts).length > 0 && (
        <section>
          <p className="text-[11px] uppercase tracking-[0.3em] text-forest-500 font-mono mb-2">
            Where we are
          </p>
          <h2 className="text-xl font-serif text-forest-900 mb-5">Members by City</h2>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {Object.entries(cityCounts)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 5)
              .map(([city, count]) => (
                <div
                  key={city}
                  className="bg-white border border-forest-100 p-5 text-center hover:bg-forest-900 hover:border-forest-900 group transition-all duration-300 cursor-default"
                >
                  <p className="text-2xl font-serif text-forest-900 group-hover:text-cream transition-colors">
                    {count}
                  </p>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-ink-400 group-hover:text-forest-400 font-mono mt-1 transition-colors">
                    {city}
                  </p>
                </div>
              ))}
          </div>
        </section>
      )}
    </div>
  );
}
