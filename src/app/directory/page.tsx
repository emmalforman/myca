"use client";

import { useState, useEffect, useMemo } from "react";
import { Member, Filters, LOCATIONS } from "@/lib/types";
import MemberCard from "@/components/MemberCard";
import OutreachModal from "@/components/OutreachModal";

export default function DirectoryPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Filters>({
    search: "",
    location: "",
    occupation: "",
  });
  const [outreachTarget, setOutreachTarget] = useState<Member | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

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
      [
        ...new Set(members.map((m) => m.occupationType).filter(Boolean)),
      ] as string[],
    [members]
  );

  const filtered = useMemo(() => {
    return members.filter((m) => {
      const searchLower = filters.search.toLowerCase();
      if (searchLower) {
        const haystack = [
          m.name,
          m.firstName,
          m.lastName,
          m.role,
          m.company,
          m.occupationType,
          m.location,
          m.superpower,
          m.industryTags,
          m.offers,
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
    <div className="py-8 sm:py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-stone-900 mb-2">
            Member Directory
          </h1>
          <p className="text-stone-500">
            {members.length} members. Find your next collaborator, investor, or co-founder.
          </p>
        </div>

        {/* Search & Filters */}
        <div className="space-y-3 mb-8">
          <div className="relative">
            <svg
              className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={filters.search}
              onChange={(e) =>
                setFilters((f) => ({ ...f, search: e.target.value }))
              }
              placeholder="Search by name, company, superpower, or what they offer..."
              className="w-full pl-11 pr-4 py-3.5 bg-white border border-warm-200 rounded-xl text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-sage-400 focus:border-transparent transition-shadow"
            />
            {filters.search && (
              <button
                onClick={() => setFilters((f) => ({ ...f, search: "" }))}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
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
              className="px-4 py-2.5 text-sm bg-white border border-warm-200 rounded-full text-stone-700 focus:outline-none focus:ring-2 focus:ring-sage-400"
            >
              <option value="">All Locations</option>
              {LOCATIONS.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>

            {occupations.length > 0 && (
              <select
                value={filters.occupation}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, occupation: e.target.value }))
                }
                className="px-4 py-2.5 text-sm bg-white border border-warm-200 rounded-full text-stone-700 focus:outline-none focus:ring-2 focus:ring-sage-400"
              >
                <option value="">All Roles</option>
                {occupations.map((occ) => (
                  <option key={occ} value={occ}>
                    {occ}
                  </option>
                ))}
              </select>
            )}

            {(filters.location || filters.occupation) && (
              <button
                onClick={() =>
                  setFilters((f) => ({ ...f, location: "", occupation: "" }))
                }
                className="text-sm text-terracotta-600 hover:text-terracotta-700 font-medium"
              >
                Clear filters
              </button>
            )}

            <div className="ml-auto flex bg-white border border-warm-200 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 transition-colors ${
                  viewMode === "grid"
                    ? "bg-sage-50 text-sage-700"
                    : "text-stone-400 hover:text-stone-600"
                }`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 transition-colors ${
                  viewMode === "list"
                    ? "bg-sage-50 text-sage-700"
                    : "text-stone-400 hover:text-stone-600"
                }`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <p className="text-sm text-stone-400 mb-5">
          Showing {filtered.length} of {members.length} members
        </p>

        {loading && (
          <div className="text-center py-20">
            <div className="w-10 h-10 border-2 border-sage-200 border-t-sage-600 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm text-stone-400">Loading members...</p>
          </div>
        )}

        {/* Grid view */}
        {!loading && viewMode === "grid" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((m) => (
              <MemberCard
                key={m.id}
                member={m}
                onOutreach={setOutreachTarget}
              />
            ))}
          </div>
        )}

        {/* List view */}
        {!loading && viewMode === "list" && (
          <div className="space-y-3">
            {filtered.map((m) => {
              const displayName = m.name || `${m.firstName ?? ""} ${m.lastName ?? ""}`.trim();
              const initials =
                (m.firstName?.[0] ?? displayName?.[0] ?? "") +
                (m.lastName?.[0] ?? displayName?.split(" ")[1]?.[0] ?? "");
              return (
                <div
                  key={m.id}
                  className="bg-white rounded-xl border border-warm-100 p-4 flex items-center gap-4 hover:shadow-md transition-shadow"
                >
                  <div className="relative w-14 h-14 rounded-full overflow-hidden bg-sage-100 flex-shrink-0">
                    {m.photoUrl ? (
                      <img
                        src={m.photoUrl}
                        alt={displayName}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-sage-600 font-serif font-bold text-lg">
                        {initials}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-serif font-semibold text-stone-900 truncate">
                      {displayName}
                    </p>
                    <p className="text-sm text-stone-500 truncate">
                      {m.role}
                      {m.company ? ` at ${m.company}` : ""}
                    </p>
                    {m.location && (
                      <p className="text-xs text-stone-400 truncate">
                        {m.location}
                      </p>
                    )}
                  </div>
                  {m.superpower && (
                    <p className="hidden md:block text-xs text-warm-600 italic max-w-48 truncate">
                      {m.superpower}
                    </p>
                  )}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {m.linkedin && (
                      <a
                        href={m.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-stone-400 hover:text-blue-600 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                        </svg>
                      </a>
                    )}
                    <button
                      onClick={() => setOutreachTarget(m)}
                      className="px-4 py-2 text-sm font-medium text-white bg-sage-600 rounded-full hover:bg-sage-700 transition-colors"
                    >
                      Connect
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-warm-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-warm-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-serif font-semibold text-stone-900 mb-1">
              No members found
            </h3>
            <p className="text-sm text-stone-500">
              Try adjusting your search or filters
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
  );
}
