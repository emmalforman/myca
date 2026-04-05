"use client";

import { useState, useEffect, useMemo } from "react";
import { Member, Filters, LOCATIONS } from "@/lib/types";
import MemberCard from "@/components/MemberCard";
import OutreachModal from "@/components/OutreachModal";
import PasswordGate from "@/components/PasswordGate";

export default function DirectoryPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Filters>({
    search: "",
    location: "",
    occupation: "",
  });
  const [outreachTarget, setOutreachTarget] = useState<Member | null>(null);

  useEffect(() => {
    fetch("/api/members")
      .then((r) => r.json())
      .then((data) => {
        if (data.members?.length) setMembers(data.members);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const occupations = useMemo(
    () =>
      [...new Set(members.map((m) => m.occupationType).filter(Boolean))] as string[],
    [members]
  );

  const filtered = useMemo(() => {
    return members.filter((m) => {
      const searchLower = filters.search.toLowerCase();
      if (searchLower) {
        const haystack = [
          m.name, m.firstName, m.lastName, m.role, m.company,
          m.occupationType, m.location, m.superpower, m.industryTags, m.offers,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(searchLower)) return false;
      }
      if (filters.location && !(m.location ?? "").includes(filters.location))
        return false;
      if (filters.occupation && m.occupationType !== filters.occupation)
        return false;
      return true;
    });
  }, [members, filters]);

  return (
    <PasswordGate>
    <div className="min-h-screen bg-ivory">
      {/* Header */}
      <div className="bg-ink-950">
        <div className="max-w-6xl mx-auto px-6 lg:px-8 py-16 sm:py-20">
          <p className="text-[11px] uppercase tracking-[0.3em] text-clay-500 font-mono mb-3">
            Directory
          </p>
          <h1 className="text-3xl sm:text-4xl font-serif text-white mb-2">
            The Collective.
          </h1>
          <p className="text-ink-400 text-[15px]">
            Founders, operators, and investors building the future of food & CPG.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 lg:px-8 py-8">
        {/* Search & Filters */}
        <div className="space-y-4 mb-8">
          <div className="relative">
            <svg
              className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={filters.search}
              onChange={(e) =>
                setFilters((f) => ({ ...f, search: e.target.value }))
              }
              placeholder="Search members..."
              className="w-full pl-11 pr-4 py-3 bg-white border border-ink-200 text-ink-900 text-[14px] placeholder-ink-300 focus:outline-none focus:border-ink-400 transition-colors"
            />
            {filters.search && (
              <button
                onClick={() => setFilters((f) => ({ ...f, search: "" }))}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-ink-300 hover:text-ink-600"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <select
              value={filters.location}
              onChange={(e) =>
                setFilters((f) => ({ ...f, location: e.target.value }))
              }
              className="px-4 py-2 text-[13px] bg-white border border-ink-200 text-ink-600 focus:outline-none focus:border-ink-400 appearance-none cursor-pointer pr-8"
              style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%2378716C\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'M19 9l-7 7-7-7\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center', backgroundSize: '16px' }}
            >
              <option value="">All Cities</option>
              {LOCATIONS.map((loc) => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>

            {occupations.length > 0 && (
              <select
                value={filters.occupation}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, occupation: e.target.value }))
                }
                className="px-4 py-2 text-[13px] bg-white border border-ink-200 text-ink-600 focus:outline-none focus:border-ink-400 appearance-none cursor-pointer pr-8"
                style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%2378716C\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'M19 9l-7 7-7-7\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center', backgroundSize: '16px' }}
              >
                <option value="">All Roles</option>
                {occupations.map((occ) => (
                  <option key={occ} value={occ}>{occ}</option>
                ))}
              </select>
            )}

            {(filters.location || filters.occupation) && (
              <button
                onClick={() =>
                  setFilters((f) => ({ ...f, location: "", occupation: "" }))
                }
                className="text-[12px] text-ink-400 hover:text-ink-700 uppercase tracking-wider"
              >
                Clear
              </button>
            )}

            <span className="ml-auto text-[11px] text-ink-300 font-mono uppercase tracking-wider">
              {filtered.length} results
            </span>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="text-center py-24">
            <div className="w-8 h-8 border border-ink-200 border-t-ink-600 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-[13px] text-ink-300 font-mono uppercase tracking-wider">
              Loading directory...
            </p>
          </div>
        )}

        {/* Grid */}
        {!loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map((m) => (
              <MemberCard
                key={m.id}
                member={m}
                onOutreach={setOutreachTarget}
              />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && filtered.length === 0 && (
          <div className="text-center py-24">
            <p className="font-serif text-xl text-ink-900 mb-2">
              No members found.
            </p>
            <p className="text-[13px] text-ink-400">
              Try adjusting your search or filters.
            </p>
          </div>
        )}
      </div>

      {outreachTarget && (
        <OutreachModal
          member={outreachTarget}
          onClose={() => setOutreachTarget(null)}
        />
      )}
    </div>
    </PasswordGate>
  );
}
