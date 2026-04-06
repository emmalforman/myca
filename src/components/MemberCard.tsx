"use client";

import { Member } from "@/lib/types";

export default function MemberCard({
  member,
  onOutreach,
  onPreview,
}: {
  member: Member;
  onOutreach: (member: Member) => void;
  onPreview?: (member: Member) => void;
}) {
  const displayName = member.name || `${member.firstName ?? ""} ${member.lastName ?? ""}`.trim();
  const initials =
    (member.firstName?.[0] ?? displayName?.[0] ?? "") +
    (member.lastName?.[0] ?? displayName?.split(" ")[1]?.[0] ?? "");

  return (
    <div
      className="group bg-white border border-ink-100 hover:border-ink-300 transition-all duration-300 overflow-hidden cursor-pointer"
      onClick={() => onPreview ? onPreview(member) : onOutreach(member)}
    >
      {/* Photo */}
      <div className="aspect-square relative bg-parchment overflow-hidden">
        {member.photoUrl ? (
          <img
            src={member.photoUrl}
            alt={displayName}
            className="absolute inset-0 w-full h-full object-cover grayscale-[20%] group-hover:grayscale-0 group-hover:scale-[1.03] transition-all duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-clay-300 font-serif text-5xl">
              {initials}
            </span>
          </div>
        )}
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-ink-950/0 group-hover:bg-ink-950/20 transition-all duration-300" />
      </div>

      <div className="p-5">
        <h3 className="text-[15px] font-serif text-ink-900 truncate">
          {displayName}
        </h3>
        {(member.role || member.company) && (
          <p className="text-[13px] text-ink-400 truncate mt-0.5">
            {member.role}
            {member.role && member.company ? ", " : ""}
            {member.company}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-1.5 mt-2">
          {member.occupationType && (
            <span className="px-2 py-0.5 text-[10px] uppercase tracking-wider text-ink-500 border border-ink-200 font-mono">
              {member.occupationType}
            </span>
          )}
          {member.location && (
            <span className="text-[10px] uppercase tracking-[0.1em] text-ink-300 font-mono">
              {member.location}
            </span>
          )}
        </div>

        {member.superpower && (
          <p className="text-[13px] text-clay-600 mt-3 line-clamp-2 italic leading-relaxed">
            {member.superpower}
          </p>
        )}

        {member.industryTags && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {member.industryTags.split(",").slice(0, 2).map((tag) => (
              <span
                key={tag.trim()}
                className="px-2 py-0.5 text-[10px] uppercase tracking-wider text-ink-400 border border-ink-100 font-mono"
              >
                {tag.trim()}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-ink-50">
          <button
            onClick={() => onOutreach(member)}
            className="flex-1 px-4 py-2 text-[12px] uppercase tracking-wider font-medium text-cream bg-forest-900 hover:bg-forest-700 transition-colors"
          >
            Connect
          </button>
          {member.linkedin && (
            <a
              href={member.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-ink-300 hover:text-ink-700 transition-colors"
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
