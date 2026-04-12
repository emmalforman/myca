"use client";

import { useState, useEffect } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { Member } from "@/lib/types";

const CHANNEL_LABELS: Record<string, string> = {
  general: "Myca Main Chat",
  "jobs-asks": "Jobs & Asks",
  "ai-chat": "AI Chat",
  nyc: "Myca in NYC",
  sf: "Myca in SF",
  la: "Myca in LA",
  london: "London",
  chicago: "Chicago",
  europe: "Myca in Europe",
  founders: "Founders",
  investors: "Investors",
  operators: "Operators",
  cpg: "CPG",
  "food-tech": "Food Tech",
  hospitality: "Hospitality / Restaurants",
  "book-club": "Book Club",
  traveling: "Traveling",
  "expo-west-2026": "Expo West 2026",
};

export default function MemberDrawer({
  member,
  onClose,
  onConnect,
}: {
  member: Member;
  onClose: () => void;
  onConnect: (member: Member) => void;
}) {
  const displayName =
    member.name || `${member.firstName ?? ""} ${member.lastName ?? ""}`.trim();
  const initials =
    (member.firstName?.[0] ?? displayName?.[0] ?? "") +
    (member.lastName?.[0] ?? displayName?.split(" ")[1]?.[0] ?? "");

  const [sharedChannels, setSharedChannels] = useState<string[]>([]);
  const [myChannels, setMyChannels] = useState<string[]>([]);
  const [theirChannels, setTheirChannels] = useState<string[]>([]);

  useEffect(() => {
    const loadChannels = async () => {
      const supabase = getSupabaseBrowser();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.email || !member.email) return;

      // Fetch both members' channels
      const [myRes, theirRes] = await Promise.all([
        fetch(`/api/channels?email=${encodeURIComponent(session.user.email)}`),
        fetch(`/api/channels?email=${encodeURIComponent(member.email)}`),
      ]);

      const myData = await myRes.json();
      const theirData = await theirRes.json();

      const mine = myData.channels || [];
      const theirs = theirData.channels || [];
      setMyChannels(mine);
      setTheirChannels(theirs);

      // Find shared channels (exclude general and jobs-asks since everyone's in those)
      const shared = mine.filter(
        (ch: string) => theirs.includes(ch) && ch !== "general" && ch !== "jobs-asks"
      );
      setSharedChannels(shared);
    };

    loadChannels();
  }, [member.email]);

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-ivory shadow-2xl overflow-y-auto animate-slide-in">
        {/* Header */}
        <div className="sticky top-0 bg-ivory border-b border-ink-100 px-6 py-4 flex items-center justify-between z-10">
          <p className="text-[11px] uppercase tracking-[0.2em] text-ink-400 font-mono">
            Member Profile
          </p>
          <button onClick={onClose} className="text-ink-400 hover:text-ink-700 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Photo + Name */}
        <div className="px-6 pt-6 pb-4">
          <div className="w-24 h-24 bg-cream border border-ink-100 overflow-hidden mb-4">
            {member.photoUrl ? (
              <img src={member.photoUrl} alt={displayName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-forest-400 font-serif text-3xl">
                {initials}
              </div>
            )}
          </div>
          <h2 className="text-xl font-serif text-ink-900">{displayName}</h2>
          {(member.role || member.company) && (
            <p className="text-[14px] text-ink-500 mt-1">
              {member.role}
              {member.role && member.company ? " at " : ""}
              <span className="text-ink-700">{member.company}</span>
            </p>
          )}
          {member.occupationType && (
            <span className="inline-block mt-2 px-2.5 py-0.5 text-[10px] uppercase tracking-wider text-forest-700 border border-forest-200 font-mono">
              {member.occupationType}
            </span>
          )}
        </div>

        {/* Shared context */}
        {sharedChannels.length > 0 && (
          <div className="mx-6 mb-4 p-3 bg-forest-50 border border-forest-100">
            <p className="text-[10px] uppercase tracking-[0.15em] text-forest-600 font-mono mb-2">
              You&apos;re both in
            </p>
            <div className="flex flex-wrap gap-1.5">
              {sharedChannels.map((ch) => (
                <span
                  key={ch}
                  className="px-2.5 py-1 text-[11px] text-forest-800 bg-forest-100 font-medium"
                >
                  {CHANNEL_LABELS[ch] || ch}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Their channels */}
        {theirChannels.length > 0 && (
          <div className="mx-6 mb-4">
            <p className="text-[10px] uppercase tracking-[0.15em] text-ink-400 font-mono mb-2">
              Groups
            </p>
            <div className="flex flex-wrap gap-1.5">
              {theirChannels
                .filter((ch) => ch !== "general" && ch !== "jobs-asks")
                .map((ch) => (
                  <span
                    key={ch}
                    className={`px-2.5 py-1 text-[11px] border ${
                      sharedChannels.includes(ch)
                        ? "text-forest-700 border-forest-200 bg-forest-50"
                        : "text-ink-500 border-ink-200"
                    }`}
                  >
                    {CHANNEL_LABELS[ch] || ch}
                  </span>
                ))}
            </div>
          </div>
        )}

        {/* Details */}
        <div className="px-6 space-y-5 pb-8">
          {member.location && (
            <div>
              <p className="text-[10px] uppercase tracking-[0.15em] text-ink-400 font-mono mb-1">
                Location
              </p>
              <p className="text-[14px] text-ink-700">{member.location}</p>
            </div>
          )}

          {member.superpower && (
            <div>
              <p className="text-[10px] uppercase tracking-[0.15em] text-ink-400 font-mono mb-1">
                Superpower
              </p>
              <p className="text-[14px] text-ink-700 italic">{member.superpower}</p>
            </div>
          )}

          {member.offers && (
            <div>
              <p className="text-[10px] uppercase tracking-[0.15em] text-forest-600 font-mono mb-1">
                What They Offer
              </p>
              <p className="text-[14px] text-ink-700 leading-relaxed">{member.offers}</p>
            </div>
          )}

          {member.asks && (
            <div>
              <p className="text-[10px] uppercase tracking-[0.15em] text-rust-600 font-mono mb-1">
                What They&apos;re Looking For
              </p>
              <p className="text-[14px] text-ink-700 leading-relaxed">{member.asks}</p>
            </div>
          )}

          {member.skills && (
            <div>
              <p className="text-[10px] uppercase tracking-[0.15em] text-ink-400 font-mono mb-2">
                Skills
              </p>
              <div className="flex flex-wrap gap-1.5">
                {member.skills.split(",").map((t) => t.trim()).filter(Boolean).map((tag) => (
                  <span
                    key={tag}
                    className="px-2.5 py-1 text-[11px] text-forest-800 bg-forest-50 border border-forest-100"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {member.interests && (
            <div>
              <p className="text-[10px] uppercase tracking-[0.15em] text-ink-400 font-mono mb-2">
                Interests
              </p>
              <div className="flex flex-wrap gap-1.5">
                {member.interests.split(",").map((t) => t.trim()).filter(Boolean).map((tag) => (
                  <span
                    key={tag}
                    className="px-2.5 py-1 text-[11px] text-clay-700 bg-clay-50 border border-clay-100"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-4">
            {member.linkedin && (
              <a
                href={member.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-[13px] text-ink-500 hover:text-forest-700 transition-colors"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
                LinkedIn
              </a>
            )}
            {member.instagram && (
              <a
                href={
                  member.instagram.startsWith("http")
                    ? member.instagram
                    : `https://instagram.com/${member.instagram.replace(/^@/, "")}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-[13px] text-ink-500 hover:text-clay-600 transition-colors"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                </svg>
                Instagram
              </a>
            )}
            {member.substack && (
              <a
                href={member.substack}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-[13px] text-ink-500 hover:text-forest-700 transition-colors"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M22.539 8.242H1.46V5.406h21.08v2.836zM1.46 10.812V24L12 18.11 22.54 24V10.812H1.46zM22.54 0H1.46v2.836h21.08V0z" />
                </svg>
                Substack
              </a>
            )}
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-ink-100">
            <button
              onClick={() => onConnect(member)}
              className="w-full py-3 text-[12px] uppercase tracking-wider font-medium text-cream bg-forest-900 hover:bg-forest-700 transition-colors"
            >
              Send Message
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-in {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-slide-in {
          animation: slide-in 0.25s ease-out;
        }
      `}</style>
    </div>
  );
}
