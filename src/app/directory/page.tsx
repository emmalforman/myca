"use client";

import { useState, useEffect, useMemo } from "react";
import { Member, LOCATIONS } from "@/lib/types";
import MemberCard from "@/components/MemberCard";
import MemberDrawer from "@/components/MemberDrawer";
import OutreachModal from "@/components/OutreachModal";
import MemberLogin from "@/components/MemberLogin";

export default function DirectoryPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [previewMember, setPreviewMember] = useState<Member | null>(null);
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

  // Build quick filter options from actual data
  const quickFilters = useMemo(() => {
    const occ = new Map<string, number>();
    const loc = new Map<string, number>();
    const ind = new Map<string, number>();
    members.forEach((m) => {
      if (m.occupationType) occ.set(m.occupationType, (occ.get(m.occupationType) || 0) + 1);
      if (m.location) {
        m.location.split(",").forEach((l) => {
          const t = l.trim();
          if (t) loc.set(t, (loc.get(t) || 0) + 1);
        });
      }
      if (m.industryTags) {
        m.industryTags.split(",").forEach((tag) => {
          const t = tag.trim();
          if (t) ind.set(t, (ind.get(t) || 0) + 1);
        });
      }
    });
    return {
      occupations: [...occ.entries()].sort((a, b) => b[1] - a[1]),
      locations: [...loc.entries()].sort((a, b) => b[1] - a[1]),
      industries: [...ind.entries()].sort((a, b) => b[1] - a[1]),
    };
  }, [members]);

  // Smart search: fuzzy matching across all fields
  const filtered = useMemo(() => {
    let results = members;

    // Apply quick filter
    if (activeFilter) {
      results = results.filter((m) => {
        const occ = m.occupationType || "";
        const loc = (m.location || "").toLowerCase();
        const tags = (m.industryTags || "").toLowerCase();
        return (
          occ === activeFilter ||
          loc.includes(activeFilter.toLowerCase()) ||
          tags.includes(activeFilter.toLowerCase())
        );
      });
    }

    // Apply search
    if (search.trim()) {
      const terms = search.toLowerCase().split(/\s+/);
      results = results.filter((m) => {
        const haystack = [
          m.name, m.firstName, m.lastName, m.role, m.company,
          m.occupationType, m.location, m.superpower,
          m.industryTags, m.offers, m.asks, m.focusAreas,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return terms.every((term) => haystack.includes(term));
      });

      // Sort by relevance: name matches first, then company, then everything else
      const searchLower = search.toLowerCase();
      results.sort((a, b) => {
        const aName = (a.name || "").toLowerCase().includes(searchLower) ? 0 : 1;
        const bName = (b.name || "").toLowerCase().includes(searchLower) ? 0 : 1;
        if (aName !== bName) return aName - bName;
        const aCompany = (a.company || "").toLowerCase().includes(searchLower) ? 0 : 1;
        const bCompany = (b.company || "").toLowerCase().includes(searchLower) ? 0 : 1;
        return aCompany - bCompany;
      });
    }

    return results;
  }, [members, search, activeFilter]);

  return (
    <MemberLogin>
      <div className="min-h-screen bg-ivory">
        {/* Header */}
        <div className="bg-forest-900">
          <div className="max-w-6xl mx-auto px-6 lg:px-8 py-14 sm:py-16">
            <h1 className="text-3xl sm:text-4xl font-serif text-cream mb-6">
              The Collective
            </h1>

            {/* Search bar */}
            <div className="relative max-w-xl">
              <svg
                className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-forest-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, company, industry, or what they offer..."
                className="w-full pl-11 pr-10 py-3 bg-forest-800 border border-forest-700 text-cream text-[14px] placeholder-forest-500 focus:outline-none focus:border-forest-400 transition-colors"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-forest-500 hover:text-cream"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {/* Compact inline filters */}
            <div className="flex flex-wrap items-center gap-1.5 mt-4">
              <button
                onClick={() => setActiveFilter(null)}
                className={`px-3 py-1 text-[11px] uppercase tracking-wider transition-colors ${
                  !activeFilter
                    ? "bg-cream text-forest-900"
                    : "text-forest-400 hover:text-cream border border-forest-700"
                }`}
              >
                All
              </button>
              {quickFilters.occupations.map(([name, count]) => (
                <button
                  key={name}
                  onClick={() =>
                    setActiveFilter(activeFilter === name ? null : name)
                  }
                  className={`px-3 py-1 text-[11px] uppercase tracking-wider transition-colors ${
                    activeFilter === name
                      ? "bg-cream text-forest-900"
                      : "text-forest-400 hover:text-cream border border-forest-700"
                  }`}
                >
                  {name}
                  <span className="ml-1 opacity-50">{count}</span>
                </button>
              ))}
              <span className="text-forest-700 mx-1">|</span>
              {quickFilters.locations.slice(0, 5).map(([name, count]) => (
                <button
                  key={name}
                  onClick={() =>
                    setActiveFilter(activeFilter === name ? null : name)
                  }
                  className={`px-3 py-1 text-[11px] uppercase tracking-wider transition-colors ${
                    activeFilter === name
                      ? "bg-cream text-forest-900"
                      : "text-forest-400 hover:text-cream border border-forest-700"
                  }`}
                >
                  {name}
                  <span className="ml-1 opacity-50">{count}</span>
                </button>
              ))}
              {quickFilters.industries.length > 0 && (
                <>
                  <span className="text-forest-700 mx-1">|</span>
                  {quickFilters.industries.slice(0, 6).map(([name, count]) => (
                    <button
                      key={`ind-${name}`}
                      onClick={() =>
                        setActiveFilter(activeFilter === name ? null : name)
                      }
                      className={`px-3 py-1 text-[11px] uppercase tracking-wider transition-colors ${
                        activeFilter === name
                          ? "bg-cream text-forest-900"
                          : "text-forest-400 hover:text-cream border border-forest-700"
                      }`}
                    >
                      {name}
                      <span className="ml-1 opacity-50">{count}</span>
                    </button>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-6 lg:px-8 py-8">
          {/* Results count */}
          <div className="flex items-center justify-between mb-6">
            <span className="text-[11px] text-ink-300 font-mono uppercase tracking-wider">
              {filtered.length} member{filtered.length !== 1 ? "s" : ""}
            </span>
            {activeFilter && (
              <button
                onClick={() => setActiveFilter(null)}
                className="text-[11px] uppercase tracking-wider text-forest-600 hover:text-forest-900"
              >
                Clear filter
              </button>
            )}
          </div>

          {/* Loading */}
          {loading && (
            <div className="text-center py-24">
              <div className="w-8 h-8 border border-forest-200 border-t-forest-600 rounded-full animate-spin mx-auto mb-4" />
              <p className="text-[13px] text-ink-300 font-mono uppercase tracking-wider">
                Loading...
              </p>
            </div>
          )}

          {/* Grid */}
          {!loading && filtered.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {filtered.map((m) => (
                <MemberCard
                  key={m.id}
                  member={m}
                  onPreview={setPreviewMember}
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
              <p className="text-[13px] text-ink-400 mb-4">
                Try a different search or clear your filter.
              </p>
              <button
                onClick={() => {
                  setSearch("");
                  setActiveFilter(null);
                }}
                className="text-[12px] uppercase tracking-wider text-forest-600 underline hover:text-forest-900"
              >
                Reset
              </button>
            </div>
          )}
        </div>

        {previewMember && (
          <MemberDrawer
            member={previewMember}
            onClose={() => setPreviewMember(null)}
            onConnect={(m) => {
              setPreviewMember(null);
              setOutreachTarget(m);
            }}
          />
        )}

        {outreachTarget && (
          <OutreachModal
            member={outreachTarget}
            onClose={() => setOutreachTarget(null)}
          />
        )}
      </div>
    </MemberLogin>
  );
}
