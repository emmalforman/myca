"use client";

import { useState } from "react";
import { Member } from "@/lib/types";

export default function OutreachModal({
  member,
  onClose,
}: {
  member: Member;
  onClose: () => void;
}) {
  const displayName = member.name || `${member.firstName ?? ""} ${member.lastName ?? ""}`.trim();
  const firstName = member.firstName || displayName.split(" ")[0];
  const initials =
    (member.firstName?.[0] ?? displayName?.[0] ?? "") +
    (member.lastName?.[0] ?? displayName?.split(" ")[1]?.[0] ?? "");

  const [subject, setSubject] = useState(
    `Connecting via Myca — ${firstName}`
  );
  const [message, setMessage] = useState(
    `Hi ${firstName},\n\nI came across your profile in the Myca Collective and would love to connect.\n\n`
  );
  const [sent, setSent] = useState(false);

  const handleSend = () => {
    const mailtoUrl = `mailto:${member.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
    window.open(mailtoUrl, "_blank");
    setSent(true);
  };

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(member.email);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink-950/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-ink-100">
          <p className="text-[11px] uppercase tracking-[0.2em] text-ink-400 font-mono">
            Outreach
          </p>
          <button
            onClick={onClose}
            className="text-ink-300 hover:text-ink-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          {/* Member preview */}
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 bg-parchment overflow-hidden flex-shrink-0">
              {member.photoUrl ? (
                <img
                  src={member.photoUrl}
                  alt={displayName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-clay-400 font-serif text-lg">
                  {initials}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-serif text-ink-900">{displayName}</p>
              <p className="text-[13px] text-ink-400 truncate">
                {member.role}
                {member.company ? ` at ${member.company}` : ""}
              </p>
            </div>
          </div>

          {/* Asks & Offers */}
          {(member.offers || member.asks) && (
            <div className="mb-6 space-y-3">
              {member.offers && (
                <div className="p-3 border border-ink-100">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-moss-600 font-mono mb-1">
                    Offers
                  </p>
                  <p className="text-[13px] text-ink-600">{member.offers}</p>
                </div>
              )}
              {member.asks && (
                <div className="p-3 border border-ink-100">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-rust-600 font-mono mb-1">
                    Asks
                  </p>
                  <p className="text-[13px] text-ink-600">{member.asks}</p>
                </div>
              )}
            </div>
          )}

          <button
            onClick={handleCopyEmail}
            className="w-full mb-6 px-4 py-2.5 text-[13px] text-ink-500 border border-ink-100 hover:border-ink-300 transition-colors text-center font-mono"
          >
            {member.email}
          </button>

          {sent ? (
            <div className="text-center py-10">
              <p className="font-serif text-xl text-ink-900 mb-2">Sent.</p>
              <p className="text-[13px] text-ink-400">
                Check your email client to complete.
              </p>
              <button
                onClick={onClose}
                className="mt-6 px-6 py-2 text-[12px] uppercase tracking-wider text-ink-600 border border-ink-200 hover:border-ink-400 transition-colors"
              >
                Close
              </button>
            </div>
          ) : (
            <>
              <div className="mb-4">
                <label className="block text-[11px] uppercase tracking-wider text-ink-400 font-mono mb-2">
                  Subject
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-4 py-2.5 text-[14px] border border-ink-200 focus:outline-none focus:border-ink-400 text-ink-900 bg-white"
                />
              </div>
              <div className="mb-6">
                <label className="block text-[11px] uppercase tracking-wider text-ink-400 font-mono mb-2">
                  Message
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={5}
                  className="w-full px-4 py-2.5 text-[14px] border border-ink-200 focus:outline-none focus:border-ink-400 resize-none text-ink-900 bg-white"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-3 text-[12px] uppercase tracking-wider text-ink-500 border border-ink-200 hover:border-ink-400 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSend}
                  className="flex-1 px-4 py-3 text-[12px] uppercase tracking-wider font-medium text-white bg-forest-900 hover:bg-forest-700 transition-colors"
                >
                  Open in Email
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
