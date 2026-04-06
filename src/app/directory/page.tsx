"use client";

import { useState, useEffect, useMemo } from "react";
import { Member, LOCATIONS } from "@/lib/types";
import MemberCard from "@/components/MemberCard";
import OutreachModal from "@/components/OutreachModal";
import MemberLogin from "@/components/MemberLogin";

function FilterPill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3.5 py-1.5 text-[12px] tracking-wide transition-all ${
        active
          ? "bg-ink-900 text-white"
          : "bg-white text-ink-500 border border-ink-200 hover:border-ink-400 hover:text-ink-700"
      }`}
    >
      {label}
    </button>
  );
}

export default function DirectoryPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [selectedOccupations, setSelectedOccupations] = useState<string[]>([]);
  const [outreachTarget, setOutreachTarget] = useState<Member | null>(null);
  const [showFilters, setShowFilters] = useState(true);

  useEffect(() => {
    fetch("/api/members")
      .then((r) => r.json())
      .then((data) => {
        if (data.members?.length) setMembers(data.members);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Extract unique values for filters
  const occupations = useMemo(
    () =>
      [...new Set(members.map((m) => m.occupationType).filter(Boolean))].sort() as string[],
    [members]
  );

  const locations = useMemo(() => {
    const locs = new Set<string>();
    members.forEach((m) => {
      if (m.location) {
        // Handle "New York", "San Francisco, Los Angeles", etc.
        m.location.split(",").forEach((l) => {
          const trimmed = l.trim();
          if (trimmed) locs.add(trimmed);
        });
      }
    });
    return [...locs].sort();
  }, [members]);

  // Top companies for quick filter
  const topCompanies = useMemo(() => {
    const counts = new Map<string, number>();
    members.forEach((m) => {
      if (m.company) {
        counts.set(m.company, (counts.get(m.company) || 0) + 1);
      }
    });
    return [...counts.entries()]
      .filter(([_, count]) => count >= 2)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name]) => name);
  }, [members]);

  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);

  // Filter logic
  const filtered = useMemo(() => {
    return members.filter((m) => {
      // Text search
      if (search) {
        const searchLower = search.toLowerCase();
        const haystack = [
          m.name, m.firstName, m.lastName, m.role, m.company,
          m.occupationType, m.location, m.superpower, m.industryTags,
          m.offers, m.asks,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(searchLower)) return false;
      }

      // Location multi-select
      if (selectedLocations.length > 0) {
        const memberLocs = (m.location ?? "").toLowerCase();
        if (!selectedLocations.some((l) => memberLocs.includes(l.toLowerCase())))
          return false;
      }

      // Occupation multi-select
      if (selectedOccupations.length > 0) {
        if (!selectedOccupations.includes(m.occupationType || "")) return false;
      }

      // Company multi-select
      if (selectedCompanies.length > 0) {
        if (!selectedCompanies.includes(m.company || "")) return false;
      }

      return true;
    });
  }, [members, search, selectedLocations, selectedOccupations, selectedCompanies]);

  const toggleFilter = (
    value: string,
    selected: string[],
    setSelected: (v: string[]) => void
  ) => {
    if (selected.includes(value)) {
      setSelected(selected.filter((v) => v !== value));
    } else {
      setSelected([...selected, value]);
    }
  };

  const activeFilterCount =
    selectedLocations.length + selectedOccupations.length + selectedCompanies.length;

  const clearAllFilters = () => {
    setSelectedLocations([]);
    setSelectedOccupations([]);
    setSelectedCompanies([]);
    setSearch("");
  };

  return (
    <MemberLogin>
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
              Founders, operators, and investors building the future of food &
              CPG.
            </p>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-6 lg:px-8 py-8">
          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <svg
                className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, company, role, or what they offer..."
                className="w-full pl-11 pr-4 py-3.5 bg-white border border-ink-200 text-ink-900 text-[14px] placeholder-ink-300 focus:outline-none focus:border-ink-400 transition-colors"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-ink-300 hover:text-ink-600"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Filter toggle + count */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 text-[12px] uppercase tracking-wider text-ink-500 hover:text-ink-700 transition-colors"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                />
              </svg>
              Filters
              {activeFilterCount > 0 && (
                <span className="px-1.5 py-0.5 text-[10px] bg-ink-900 text-white font-mono">
                  {activeFilterCount}
                </span>
              )}
            </button>

            <div className="flex items-center gap-3">
              {activeFilterCount > 0 && (
                <button
                  onClick={clearAllFilters}
                  className="text-[11px] uppercase tracking-wider text-rust-500 hover:text-rust-700"
                >
                  Clear all
                </button>
              )}
              <span className="text-[11px] text-ink-300 font-mono uppercase tracking-wider">
                {filtered.length} results
              </span>
            </div>
          </div>

          {/* Filter panels */}
          {showFilters && (
            <div className="mb-8 space-y-4 p-5 bg-white border border-ink-100">
              {/* Role / Occupation */}
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-ink-400 font-mono mb-2.5">
                  Role
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {occupations.map((occ) => (
                    <FilterPill
                      key={occ}
                      label={occ}
                      active={selectedOccupations.includes(occ)}
                      onClick={() =>
                        toggleFilter(
                          occ,
                          selectedOccupations,
                          setSelectedOccupations
                        )
                      }
                    />
                  ))}
                </div>
              </div>

              {/* Location */}
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-ink-400 font-mono mb-2.5">
                  City
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {locations.map((loc) => (
                    <FilterPill
                      key={loc}
                      label={loc}
                      active={selectedLocations.includes(loc)}
                      onClick={() =>
                        toggleFilter(
                          loc,
                          selectedLocations,
                          setSelectedLocations
                        )
                      }
                    />
                  ))}
                </div>
              </div>

              {/* Top companies */}
              {topCompanies.length > 0 && (
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-ink-400 font-mono mb-2.5">
                    Company
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {topCompanies.map((co) => (
                      <FilterPill
                        key={co}
                        label={co}
                        active={selectedCompanies.includes(co)}
                        onClick={() =>
                          toggleFilter(
                            co,
                            selectedCompanies,
                            setSelectedCompanies
                          )
                        }
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Active filter tags */}
          {activeFilterCount > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {selectedLocations.map((loc) => (
                <span
                  key={`loc-${loc}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1 text-[11px] uppercase tracking-wider bg-ink-900 text-white font-mono"
                >
                  {loc}
                  <button
                    onClick={() =>
                      setSelectedLocations(
                        selectedLocations.filter((l) => l !== loc)
                      )
                    }
                    className="hover:text-ink-300"
                  >
                    ×
                  </button>
                </span>
              ))}
              {selectedOccupations.map((occ) => (
                <span
                  key={`occ-${occ}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1 text-[11px] uppercase tracking-wider bg-ink-900 text-white font-mono"
                >
                  {occ}
                  <button
                    onClick={() =>
                      setSelectedOccupations(
                        selectedOccupations.filter((o) => o !== occ)
                      )
                    }
                    className="hover:text-ink-300"
                  >
                    ×
                  </button>
                </span>
              ))}
              {selectedCompanies.map((co) => (
                <span
                  key={`co-${co}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1 text-[11px] uppercase tracking-wider bg-ink-900 text-white font-mono"
                >
                  {co}
                  <button
                    onClick={() =>
                      setSelectedCompanies(
                        selectedCompanies.filter((c) => c !== co)
                      )
                    }
                    className="hover:text-ink-300"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}

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
              <p className="text-[13px] text-ink-400 mb-4">
                Try adjusting your filters.
              </p>
              <button
                onClick={clearAllFilters}
                className="text-[12px] uppercase tracking-wider text-ink-600 underline hover:text-ink-900"
              >
                Clear all filters
              </button>
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
    </MemberLogin>
  );
}
