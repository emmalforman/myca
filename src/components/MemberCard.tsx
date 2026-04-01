"use client";

import Image from "next/image";
import { Member } from "@/lib/types";
import { Group } from "./GroupPanel";

export default function MemberCard({
  member,
  groups,
  onOutreach,
  onAddToGroup,
}: {
  member: Member;
  groups: Group[];
  onOutreach: (member: Member) => void;
  onAddToGroup: (memberId: string, groupId: string) => void;
}) {
  const initials =
    (member.firstName?.[0] ?? "") + (member.lastName?.[0] ?? "");

  return (
    <div className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:border-brand-200 transition-all duration-200 overflow-hidden">
      {/* Card top accent */}
      <div className="h-1.5 bg-gradient-to-r from-brand-400 to-brand-600" />

      <div className="p-5">
        {/* Photo + Name */}
        <div className="flex items-start gap-4 mb-4">
          <div className="relative w-16 h-16 rounded-full overflow-hidden bg-brand-100 flex-shrink-0 ring-2 ring-white shadow-md">
            {member.photoUrl ? (
              <Image
                src={member.photoUrl}
                alt={`${member.firstName} ${member.lastName}`}
                fill
                className="object-cover"
                sizes="64px"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-brand-700 font-bold text-lg">
                {initials}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-gray-900 truncate">
              {member.firstName} {member.lastName}
            </h3>
            {member.title && (
              <p className="text-sm text-gray-600 truncate">{member.title}</p>
            )}
            {member.company && (
              <p className="text-sm text-brand-600 font-medium truncate">
                {member.company}
              </p>
            )}
          </div>
        </div>

        {/* Location & Industry */}
        <div className="flex flex-wrap gap-2 mb-3 text-xs text-gray-500">
          {member.location && (
            <span className="inline-flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {member.location}
            </span>
          )}
          {member.industry && (
            <span className="inline-flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              {member.industry}
            </span>
          )}
        </div>

        {/* Bio */}
        {member.bio && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {member.bio}
          </p>
        )}

        {/* Tags */}
        {member.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {member.tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 text-xs font-medium bg-gray-50 text-gray-600 rounded-full border border-gray-100"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 pt-3 border-t border-gray-50">
          <button
            onClick={() => onOutreach(member)}
            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700 transition-colors"
          >
            Reach Out
          </button>

          {/* Add to group dropdown */}
          {groups.length > 0 && (
            <div className="relative group/dropdown">
              <button className="p-2 text-gray-400 hover:text-brand-600 border border-gray-200 rounded-lg hover:border-brand-200 transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </button>
              <div className="absolute right-0 bottom-full mb-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover/dropdown:opacity-100 group-hover/dropdown:visible transition-all z-20">
                <div className="p-1">
                  <p className="px-2 py-1 text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Add to group
                  </p>
                  {groups.map((g) => (
                    <button
                      key={g.id}
                      onClick={() => onAddToGroup(member.id, g.id)}
                      className="w-full text-left px-2 py-1.5 text-sm text-gray-700 rounded hover:bg-brand-50 hover:text-brand-700 transition-colors"
                    >
                      {g.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Social links */}
          <div className="flex items-center gap-0.5">
            {member.linkedin && (
              <a
                href={member.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                title="LinkedIn"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </a>
            )}
            {member.twitter && (
              <a
                href={member.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-gray-400 hover:text-sky-500 transition-colors"
                title="Twitter"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                </svg>
              </a>
            )}
            {member.website && (
              <a
                href={member.website}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-gray-400 hover:text-brand-600 transition-colors"
                title="Website"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
