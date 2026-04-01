"use client";

import { useState } from "react";
import { Member } from "@/lib/types";
import { Group } from "./GroupPanel";

interface Suggestion {
  type: "introduction" | "group";
  title: string;
  description: string;
  members: Member[];
}

function generateSuggestions(members: Member[], groups: Group[]): Suggestion[] {
  const suggestions: Suggestion[] = [];

  // Find members with overlapping tags for introductions
  for (let i = 0; i < members.length; i++) {
    for (let j = i + 1; j < members.length; j++) {
      const shared = members[i].tags.filter((t) =>
        members[j].tags.includes(t)
      );
      if (shared.length >= 1) {
        suggestions.push({
          type: "introduction",
          title: `${members[i].firstName} + ${members[j].firstName}`,
          description: `Both share interests in ${shared.join(", ")}. ${members[i].firstName} is ${members[i].title || "a member"} and ${members[j].firstName} is ${members[j].title || "a member"}.`,
          members: [members[i], members[j]],
        });
      }
      if (suggestions.filter((s) => s.type === "introduction").length >= 5)
        break;
    }
    if (suggestions.filter((s) => s.type === "introduction").length >= 5)
      break;
  }

  // Suggest groups by industry clusters
  const industryMap = new Map<string, Member[]>();
  members.forEach((m) => {
    if (m.industry) {
      const list = industryMap.get(m.industry) || [];
      list.push(m);
      industryMap.set(m.industry, list);
    }
  });

  industryMap.forEach((mems, industry) => {
    if (mems.length >= 2) {
      suggestions.push({
        type: "group",
        title: `${industry} Circle`,
        description: `${mems.length} members work in ${industry}. Creating a group could spark collaboration.`,
        members: mems,
      });
    }
  });

  // Suggest groups by location clusters
  const locationMap = new Map<string, Member[]>();
  members.forEach((m) => {
    if (m.location) {
      const city = m.location.split(",")[0].trim();
      const list = locationMap.get(city) || [];
      list.push(m);
      locationMap.set(city, list);
    }
  });

  locationMap.forEach((mems, city) => {
    if (mems.length >= 2) {
      suggestions.push({
        type: "group",
        title: `${city} Local`,
        description: `${mems.length} members are based in ${city}. Great for local meetups and collaboration.`,
        members: mems,
      });
    }
  });

  // Suggest groups by shared tags
  const tagMap = new Map<string, Member[]>();
  members.forEach((m) => {
    m.tags.forEach((tag) => {
      const list = tagMap.get(tag) || [];
      list.push(m);
      tagMap.set(tag, list);
    });
  });

  tagMap.forEach((mems, tag) => {
    if (mems.length >= 3) {
      suggestions.push({
        type: "group",
        title: `${tag} Network`,
        description: `${mems.length} members are interested in ${tag}. A focused group for knowledge sharing.`,
        members: mems,
      });
    }
  });

  return suggestions;
}

export default function AiAssistant({
  members,
  groups,
  onCreateGroupWithMembers,
  onOutreachIntro,
}: {
  members: Member[];
  groups: Group[];
  onCreateGroupWithMembers: (name: string, members: Member[]) => void;
  onOutreachIntro: (members: Member[]) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const suggestions = generateSuggestions(members, groups);
  const introductions = suggestions.filter((s) => s.type === "introduction");
  const groupSuggestions = suggestions.filter((s) => s.type === "group");

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-brand-600 text-white rounded-full shadow-lg hover:bg-brand-700 transition-all hover:scale-105 flex items-center justify-center z-40"
        title="AI Assistant - Discover connections"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
        {suggestions.length > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {suggestions.length}
          </span>
        )}
      </button>

      {/* Panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 max-h-[70vh] bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden z-40 flex flex-col">
          <div className="p-4 bg-gradient-to-r from-brand-600 to-brand-700 text-white">
            <h3 className="text-base font-semibold">Connection Assistant</h3>
            <p className="text-sm text-brand-100 mt-0.5">
              Smart suggestions based on member profiles
            </p>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Introductions */}
            {introductions.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Suggested Introductions
                </h4>
                <div className="space-y-2">
                  {introductions.slice(0, 4).map((s, i) => (
                    <div
                      key={i}
                      className="p-3 bg-blue-50 rounded-xl border border-blue-100"
                    >
                      <p className="text-sm font-medium text-gray-900">
                        {s.title}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        {s.description}
                      </p>
                      <button
                        onClick={() => onOutreachIntro(s.members)}
                        className="mt-2 px-3 py-1 text-xs font-medium text-blue-700 bg-white border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
                      >
                        Make Introduction
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Group suggestions */}
            {groupSuggestions.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Suggested Groups
                </h4>
                <div className="space-y-2">
                  {groupSuggestions.slice(0, 5).map((s, i) => (
                    <div
                      key={i}
                      className="p-3 bg-brand-50 rounded-xl border border-brand-100"
                    >
                      <p className="text-sm font-medium text-gray-900">
                        {s.title}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        {s.description}
                      </p>
                      <button
                        onClick={() =>
                          onCreateGroupWithMembers(s.title, s.members)
                        }
                        className="mt-2 px-3 py-1 text-xs font-medium text-brand-700 bg-white border border-brand-200 rounded-lg hover:bg-brand-50 transition-colors"
                      >
                        Create This Group
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {suggestions.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-8">
                Add more members to get smart suggestions
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
