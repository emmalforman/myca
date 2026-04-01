"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import Image from "next/image";
import { Member, Filters } from "@/lib/types";
import { sampleMembers } from "@/data/members";
import Header from "@/components/Header";
import SearchBar from "@/components/SearchBar";
import FilterPanel from "@/components/FilterPanel";
import MemberCard from "@/components/MemberCard";
import OutreachModal from "@/components/OutreachModal";
import GroupPanel, { Group } from "@/components/GroupPanel";
import AiAssistant from "@/components/AiAssistant";

type ViewMode = "grid" | "spotlight";

export default function Home() {
  const [members, setMembers] = useState<Member[]>(sampleMembers);
  const [filters, setFilters] = useState<Filters>({
    search: "",
    industry: "",
    location: "",
    tags: [],
  });
  const [outreachTarget, setOutreachTarget] = useState<Member | null>(null);
  const [introTargets, setIntroTargets] = useState<Member[] | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [spotlightIndex, setSpotlightIndex] = useState(0);
  const [showGroupPanel, setShowGroupPanel] = useState(false);
  const [dataSource, setDataSource] = useState<string>("sample");
  const groupsLoaded = useRef(false);

  // Load members from API on mount
  useEffect(() => {
    fetch("/api/members")
      .then((r) => r.json())
      .then((data) => {
        if (data.members?.length) setMembers(data.members);
        if (data.source) setDataSource(data.source);
      })
      .catch(() => {});
  }, []);

  // Load groups: try Supabase API first, fall back to localStorage
  useEffect(() => {
    fetch("/api/groups")
      .then((r) => r.json())
      .then((data) => {
        if (data.groups?.length) {
          setGroups(data.groups);
          groupsLoaded.current = true;
        } else {
          // Fall back to localStorage
          const saved = localStorage.getItem("myca-groups");
          if (saved) {
            try {
              setGroups(JSON.parse(saved));
            } catch {}
          }
          groupsLoaded.current = true;
        }
      })
      .catch(() => {
        const saved = localStorage.getItem("myca-groups");
        if (saved) {
          try {
            setGroups(JSON.parse(saved));
          } catch {}
        }
        groupsLoaded.current = true;
      });
  }, []);

  // Always save to localStorage as a backup
  useEffect(() => {
    if (groupsLoaded.current) {
      localStorage.setItem("myca-groups", JSON.stringify(groups));
    }
  }, [groups]);

  // Derived data
  const industries = useMemo(
    () => [...new Set(members.map((m) => m.industry).filter(Boolean))] as string[],
    [members]
  );
  const locations = useMemo(
    () => [...new Set(members.map((m) => m.location).filter(Boolean))] as string[],
    [members]
  );
  const allTags = useMemo(
    () => [...new Set(members.flatMap((m) => m.tags))] as string[],
    [members]
  );

  // Filtered members
  const filtered = useMemo(() => {
    return members.filter((m) => {
      const searchLower = filters.search.toLowerCase();
      if (searchLower) {
        const haystack = [
          m.firstName,
          m.lastName,
          m.title,
          m.company,
          m.industry,
          m.location,
          m.bio,
          ...m.tags,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(searchLower)) return false;
      }
      if (filters.industry && m.industry !== filters.industry) return false;
      if (filters.location && m.location !== filters.location) return false;
      if (
        filters.tags.length > 0 &&
        !filters.tags.some((t) => m.tags.includes(t))
      )
        return false;
      return true;
    });
  }, [members, filters]);

  const syncFromNotion = useCallback(async () => {
    const res = await fetch("/api/sync", { method: "POST" });
    const data = await res.json();
    if (data.members?.length) setMembers(data.members);
  }, []);

  const createGroup = useCallback(async (name: string) => {
    // Optimistic local update
    const tempId = Date.now().toString();
    const newGroup: Group = { id: tempId, name, members: [], createdAt: new Date().toISOString() };
    setGroups((prev) => [...prev, newGroup]);

    // Persist to Supabase
    try {
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (data.group) {
        setGroups((prev) =>
          prev.map((g) => (g.id === tempId ? { ...newGroup, id: data.group.id } : g))
        );
      }
    } catch {}
  }, []);

  const createGroupWithMembers = useCallback(
    async (name: string, mems: Member[]) => {
      const tempId = Date.now().toString();
      const newGroup: Group = { id: tempId, name, members: mems, createdAt: new Date().toISOString() };
      setGroups((prev) => [...prev, newGroup]);

      try {
        const res = await fetch("/api/groups", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, memberIds: mems.map((m) => m.id) }),
        });
        const data = await res.json();
        if (data.group) {
          setGroups((prev) =>
            prev.map((g) =>
              g.id === tempId ? { ...newGroup, id: data.group.id } : g
            )
          );
        }
      } catch {}
    },
    []
  );

  const addToGroup = useCallback(
    async (memberId: string, groupId: string) => {
      setGroups((prev) =>
        prev.map((g) => {
          if (g.id !== groupId) return g;
          if (g.members.some((m) => m.id === memberId)) return g;
          const member = members.find((m) => m.id === memberId);
          if (!member) return g;
          return { ...g, members: [...g.members, member] };
        })
      );

      try {
        await fetch("/api/groups/members", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ groupId, memberId }),
        });
      } catch {}
    },
    [members]
  );

  const removeFromGroup = useCallback(
    async (groupId: string, memberId: string) => {
      setGroups((prev) =>
        prev.map((g) =>
          g.id === groupId
            ? { ...g, members: g.members.filter((m) => m.id !== memberId) }
            : g
        )
      );

      try {
        await fetch(
          `/api/groups/members?groupId=${groupId}&memberId=${memberId}`,
          { method: "DELETE" }
        );
      } catch {}
    },
    []
  );

  const deleteGroup = useCallback(async (groupId: string) => {
    setGroups((prev) => prev.filter((g) => g.id !== groupId));

    try {
      await fetch(`/api/groups?id=${groupId}`, { method: "DELETE" });
    } catch {}
  }, []);

  const outreachGroup = useCallback((group: Group) => {
    if (group.members.length > 0) {
      setOutreachTarget(group.members[0]);
    }
  }, []);

  // Spotlight navigation
  const spotlightMember = filtered[spotlightIndex % filtered.length];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onSyncClick={syncFromNotion} memberCount={members.length} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Hero section */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Discover & Connect
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto">
            Explore the community, find your people, and start meaningful
            conversations.
          </p>
        </div>

        {/* Featured / Spotlight carousel */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
              Featured Members
            </h3>
            <div className="flex gap-1">
              {filtered.slice(0, 6).map((m, i) => (
                <button
                  key={m.id}
                  onClick={() => setSpotlightIndex(i)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    i === spotlightIndex % Math.min(filtered.length, 6)
                      ? "bg-brand-600"
                      : "bg-gray-300"
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {filtered.slice(0, 6).map((m) => {
              const initials = (m.firstName?.[0] ?? "") + (m.lastName?.[0] ?? "");
              return (
                <button
                  key={m.id}
                  onClick={() => setOutreachTarget(m)}
                  className="group relative bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg hover:border-brand-200 transition-all duration-200 text-left"
                >
                  <div className="aspect-square relative bg-brand-50">
                    {m.photoUrl ? (
                      <Image
                        src={m.photoUrl}
                        alt={`${m.firstName} ${m.lastName}`}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 16vw"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-brand-600 font-bold text-3xl">
                        {initials}
                      </div>
                    )}
                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <div className="absolute bottom-2 left-2 right-2">
                      <p className="text-white text-sm font-semibold truncate drop-shadow">
                        {m.firstName} {m.lastName}
                      </p>
                      <p className="text-white/80 text-xs truncate drop-shadow">
                        {m.title}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Search + Filters */}
        <div className="space-y-3 mb-6">
          <SearchBar
            value={filters.search}
            onChange={(search) => setFilters((f) => ({ ...f, search }))}
          />
          <div className="flex items-center justify-between">
            <FilterPanel
              industries={industries}
              locations={locations}
              allTags={allTags}
              selectedIndustry={filters.industry}
              selectedLocation={filters.location}
              selectedTags={filters.tags}
              onIndustryChange={(industry) =>
                setFilters((f) => ({ ...f, industry }))
              }
              onLocationChange={(location) =>
                setFilters((f) => ({ ...f, location }))
              }
              onTagToggle={(tag) =>
                setFilters((f) => ({
                  ...f,
                  tags: f.tags.includes(tag)
                    ? f.tags.filter((t) => t !== tag)
                    : [...f.tags, tag],
                }))
              }
              onClearAll={() =>
                setFilters({ search: "", industry: "", location: "", tags: [] })
              }
            />
            <div className="flex items-center gap-2 flex-shrink-0 ml-4">
              <button
                onClick={() => setShowGroupPanel(!showGroupPanel)}
                className={`p-2 rounded-lg border transition-colors ${
                  showGroupPanel
                    ? "bg-brand-50 border-brand-200 text-brand-700"
                    : "bg-white border-gray-200 text-gray-500 hover:text-brand-600"
                }`}
                title="My Groups"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </button>
              <div className="flex bg-white border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 transition-colors ${
                    viewMode === "grid"
                      ? "bg-brand-50 text-brand-700"
                      : "text-gray-400 hover:text-gray-600"
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode("spotlight")}
                  className={`p-2 transition-colors ${
                    viewMode === "spotlight"
                      ? "bg-brand-50 text-brand-700"
                      : "text-gray-400 hover:text-gray-600"
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Results count */}
        <p className="text-sm text-gray-400 mb-4">
          Showing {filtered.length} of {members.length} members
        </p>

        {/* Content area */}
        <div className="flex gap-6">
          {/* Main content */}
          <div className="flex-1">
            {viewMode === "grid" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map((m) => (
                  <MemberCard
                    key={m.id}
                    member={m}
                    groups={groups}
                    onOutreach={setOutreachTarget}
                    onAddToGroup={addToGroup}
                  />
                ))}
              </div>
            ) : (
              /* Spotlight / swipe view */
              <div className="space-y-4">
                {filtered.map((m) => {
                  const initials = (m.firstName?.[0] ?? "") + (m.lastName?.[0] ?? "");
                  return (
                    <div
                      key={m.id}
                      className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                    >
                      <div className="flex flex-col sm:flex-row">
                        {/* Large photo */}
                        <div className="relative w-full sm:w-48 h-48 sm:h-auto bg-brand-50 flex-shrink-0">
                          {m.photoUrl ? (
                            <Image
                              src={m.photoUrl}
                              alt={`${m.firstName} ${m.lastName}`}
                              fill
                              className="object-cover"
                              sizes="192px"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-brand-600 font-bold text-4xl">
                              {initials}
                            </div>
                          )}
                        </div>
                        {/* Content */}
                        <div className="flex-1 p-5">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">
                                {m.firstName} {m.lastName}
                              </h3>
                              <p className="text-sm text-gray-600">
                                {m.title}
                                {m.company
                                  ? ` at `
                                  : ""}
                                {m.company && (
                                  <span className="text-brand-600 font-medium">
                                    {m.company}
                                  </span>
                                )}
                              </p>
                            </div>
                            <div className="flex gap-1">
                              {m.linkedin && (
                                <a
                                  href={m.linkedin}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-2 text-gray-400 hover:text-blue-600"
                                >
                                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                                  </svg>
                                </a>
                              )}
                              {m.twitter && (
                                <a
                                  href={m.twitter}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-2 text-gray-400 hover:text-sky-500"
                                >
                                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                                  </svg>
                                </a>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2 mb-3 text-xs text-gray-500">
                            {m.location && (
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-50 rounded-full">
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                </svg>
                                {m.location}
                              </span>
                            )}
                            {m.industry && (
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-50 rounded-full">
                                {m.industry}
                              </span>
                            )}
                          </div>

                          {m.bio && (
                            <p className="text-sm text-gray-600 mb-3">
                              {m.bio}
                            </p>
                          )}

                          <div className="flex flex-wrap gap-1.5 mb-4">
                            {m.tags.map((tag) => (
                              <span
                                key={tag}
                                className="px-2.5 py-0.5 text-xs font-medium bg-brand-50 text-brand-700 rounded-full"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>

                          <button
                            onClick={() => setOutreachTarget(m)}
                            className="px-5 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700 transition-colors"
                          >
                            Reach Out
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {filtered.length === 0 && (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  No members found
                </h3>
                <p className="text-sm text-gray-500">
                  Try adjusting your search or filters
                </p>
              </div>
            )}
          </div>

          {/* Groups sidebar */}
          {showGroupPanel && (
            <div className="hidden lg:block w-80 flex-shrink-0">
              <div className="sticky top-24">
                <GroupPanel
                  groups={groups}
                  onCreateGroup={createGroup}
                  onRemoveMember={removeFromGroup}
                  onDeleteGroup={deleteGroup}
                  onOutreachGroup={outreachGroup}
                />
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Outreach Modal */}
      {outreachTarget && !introTargets && (
        <OutreachModal
          member={outreachTarget}
          onClose={() => setOutreachTarget(null)}
        />
      )}

      {/* Intro Modal */}
      {introTargets && (
        <OutreachModal
          introMembers={introTargets}
          onClose={() => setIntroTargets(null)}
        />
      )}

      {/* AI Assistant */}
      <AiAssistant
        members={members}
        groups={groups}
        onCreateGroupWithMembers={createGroupWithMembers}
        onOutreachIntro={(mems) => setIntroTargets(mems)}
      />
    </div>
  );
}
