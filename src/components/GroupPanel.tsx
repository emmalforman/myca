"use client";

import { useState } from "react";
import Image from "next/image";
import { Member } from "@/lib/types";

export interface Group {
  id: string;
  name: string;
  members: Member[];
  createdAt: string;
}

export default function GroupPanel({
  groups,
  onCreateGroup,
  onRemoveMember,
  onDeleteGroup,
  onOutreachGroup,
}: {
  groups: Group[];
  onCreateGroup: (name: string) => void;
  onRemoveMember: (groupId: string, memberId: string) => void;
  onDeleteGroup: (groupId: string) => void;
  onOutreachGroup: (group: Group) => void;
}) {
  const [newGroupName, setNewGroupName] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const handleCreate = () => {
    if (newGroupName.trim()) {
      onCreateGroup(newGroupName.trim());
      setNewGroupName("");
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-gray-100">
        <h2 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <svg className="w-4 h-4 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          My Groups
        </h2>
        <div className="flex gap-2">
          <input
            type="text"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            placeholder="New group name..."
            className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 text-gray-900 placeholder-gray-400"
          />
          <button
            onClick={handleCreate}
            disabled={!newGroupName.trim()}
            className="px-3 py-1.5 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700 disabled:opacity-40 transition-colors"
          >
            Create
          </button>
        </div>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {groups.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-sm text-gray-400">
              Create a group to start curating your connections
            </p>
          </div>
        ) : (
          groups.map((group) => (
            <div key={group.id} className="border-b border-gray-50 last:border-0">
              <button
                onClick={() =>
                  setExpanded(expanded === group.id ? null : group.id)
                }
                className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors text-left"
              >
                <div className="flex items-center gap-2">
                  {/* Stacked avatars */}
                  <div className="flex -space-x-2">
                    {group.members.slice(0, 3).map((m) => (
                      <div
                        key={m.id}
                        className="w-7 h-7 rounded-full border-2 border-white bg-brand-100 overflow-hidden"
                      >
                        {m.photoUrl ? (
                          <Image
                            src={m.photoUrl}
                            alt=""
                            width={28}
                            height={28}
                            className="object-cover w-full h-full"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-brand-700 text-xs font-bold">
                            {m.firstName[0]}
                          </div>
                        )}
                      </div>
                    ))}
                    {group.members.length > 3 && (
                      <div className="w-7 h-7 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600">
                        +{group.members.length - 3}
                      </div>
                    )}
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-900">
                      {group.name}
                    </span>
                    <span className="text-xs text-gray-400 ml-2">
                      {group.members.length} member
                      {group.members.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
                <svg
                  className={`w-4 h-4 text-gray-400 transition-transform ${
                    expanded === group.id ? "rotate-180" : ""
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {expanded === group.id && (
                <div className="px-3 pb-3">
                  {group.members.length === 0 ? (
                    <p className="text-xs text-gray-400 py-2 px-2">
                      Drag members here or use &quot;Add to Group&quot; on their card
                    </p>
                  ) : (
                    <div className="space-y-1">
                      {group.members.map((m) => (
                        <div
                          key={m.id}
                          className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-gray-50"
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-brand-100 overflow-hidden flex-shrink-0">
                              {m.photoUrl ? (
                                <Image
                                  src={m.photoUrl}
                                  alt=""
                                  width={24}
                                  height={24}
                                  className="object-cover w-full h-full"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-brand-700 text-xs font-bold">
                                  {m.firstName[0]}
                                </div>
                              )}
                            </div>
                            <span className="text-xs text-gray-700">
                              {m.firstName} {m.lastName}
                            </span>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onRemoveMember(group.id, m.id);
                            }}
                            className="text-gray-300 hover:text-red-500 transition-colors"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2 mt-2 pt-2 border-t border-gray-100">
                    <button
                      onClick={() => onOutreachGroup(group)}
                      disabled={group.members.length === 0}
                      className="flex-1 px-3 py-1.5 text-xs font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700 disabled:opacity-40 transition-colors"
                    >
                      Email Group
                    </button>
                    <button
                      onClick={() => onDeleteGroup(group.id)}
                      className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
