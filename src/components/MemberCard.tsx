"use client";

import Image from "next/image";
import { Member } from "@/lib/types";

export default function MemberCard({
  member,
  onOutreach,
}: {
  member: Member;
  onOutreach: (member: Member) => void;
}) {
  const displayName =
    member.fullName ||
    [member.firstName, member.lastName].filter(Boolean).join(" ");
  const initials =
    (member.firstName?.[0] ?? member.fullName?.[0] ?? "") +
    (member.lastName?.[0] ?? member.fullName?.split(" ")[1]?.[0] ?? "");

  return (
    <div className="group bg-white rounded-2xl border border-warm-100 hover:shadow-lg hover:border-sage-200 transition-all duration-200 overflow-hidden">
      {/* Photo */}
      <div className="aspect-[4/3] relative bg-warm-100">
        {member.photoUrl ? (
          <Image
            src={member.photoUrl}
            alt={displayName}
            fill
            className="object-cover group-hover:scale-[1.03] transition-transform duration-300"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-warm-400 font-serif font-bold text-4xl">
            {initials}
          </div>
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      <div className="p-4">
        {/* Name & Title */}
        <h3 className="text-base font-serif font-semibold text-stone-900 truncate">
          {displayName}
        </h3>
        {member.title && (
          <p className="text-sm text-stone-500 truncate">{member.title}</p>
        )}
        {member.company && (
          <p className="text-sm text-sage-600 font-medium truncate">
            {member.company}
          </p>
        )}

        {/* Location pills */}
        {member.location.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {member.location.map((loc) => (
              <span
                key={loc}
                className="px-2 py-0.5 text-xs bg-warm-50 text-stone-500 rounded-full border border-warm-100"
              >
                {loc}
              </span>
            ))}
          </div>
        )}

        {/* Comfort food */}
        {member.comfortFood && (
          <p className="text-xs text-stone-400 mt-2 truncate italic">
            Comfort food: {member.comfortFood}
          </p>
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
