"use client";

import { Member } from "@/lib/types";

export default function MemberCard({
  member,
  onOutreach,
}: {
  member: Member;
  onOutreach: (member: Member) => void;
}) {
  const displayName = member.name || `${member.firstName ?? ""} ${member.lastName ?? ""}`.trim();
  const initials =
    (member.firstName?.[0] ?? displayName?.[0] ?? "") +
    (member.lastName?.[0] ?? displayName?.split(" ")[1]?.[0] ?? "");

  return (
    <div className="group bg-white rounded-2xl border border-warm-100 hover:shadow-lg hover:border-sage-200 transition-all duration-200 overflow-hidden">
      {/* Photo or Initials */}
      <div className="aspect-[4/3] relative bg-warm-100">
        {member.photoUrl ? (
          <img
            src={member.photoUrl}
            alt={displayName}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-sage-100 to-warm-100">
            <span className="text-sage-500 font-serif font-bold text-5xl">
              {initials}
            </span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      <div className="p-4">
        {/* Name & Role */}
        <h3 className="text-base font-serif font-semibold text-stone-900 truncate">
          {displayName}
        </h3>
        {member.role && (
          <p className="text-sm text-stone-500 truncate">{member.role}</p>
        )}
        {member.company && (
          <p className="text-sm text-sage-600 font-medium truncate">
            {member.company}
          </p>
        )}

        {/* Location */}
        {member.location && (
          <p className="text-xs text-stone-400 mt-1.5 truncate flex items-center gap-1">
            <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {member.location}
          </p>
        )}

        {/* Superpower */}
        {member.superpower && (
          <p className="text-xs text-warm-600 mt-2 line-clamp-2 italic">
            &ldquo;{member.superpower}&rdquo;
          </p>
        )}

        {/* Tags */}
        {member.industryTags && (
          <div className="flex flex-wrap gap-1 mt-2">
            {member.industryTags.split(",").slice(0, 3).map((tag) => (
              <span
                key={tag.trim()}
                className="px-2 py-0.5 text-xs bg-sage-50 text-sage-700 rounded-full border border-sage-100"
              >
                {tag.trim()}
              </span>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-warm-50">
          <button
            onClick={() => onOutreach(member)}
            className="flex-1 px-3 py-2 text-sm font-medium text-white bg-sage-600 rounded-lg hover:bg-sage-700 transition-colors"
          >
            Connect
          </button>
          {member.linkedin && (
            <a
              href={member.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-stone-400 hover:text-blue-600 transition-colors"
              title="LinkedIn"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
