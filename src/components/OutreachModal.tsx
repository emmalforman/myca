"use client";

import { useState } from "react";
import Image from "next/image";
import { Member } from "@/lib/types";

export default function OutreachModal({
  member,
  onClose,
}: {
  member: Member;
  onClose: () => void;
}) {
  const displayName =
    member.fullName ||
    [member.firstName, member.lastName].filter(Boolean).join(" ");
  const initials =
    (member.firstName?.[0] ?? member.fullName?.[0] ?? "") +
    (member.lastName?.[0] ?? member.fullName?.split(" ")[1]?.[0] ?? "");

  const [subject, setSubject] = useState(
    `Hey ${member.firstName || displayName.split(" ")[0]} - connecting via Myca!`
  );
  const [message, setMessage] = useState(
    `Hi ${member.firstName || displayName.split(" ")[0]},\n\nI found your profile in the Myca Collective directory and would love to connect. `
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
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-warm-100">
          <h2 className="text-lg font-serif font-semibold text-stone-900">
            Connect with {member.firstName || displayName.split(" ")[0]}
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-stone-400 hover:text-stone-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-5">
          {/* Member preview */}
          <div className="flex items-center gap-4 p-4 bg-warm-50 rounded-xl mb-5">
            <div className="relative w-14 h-14 rounded-full overflow-hidden bg-warm-100 flex-shrink-0">
              {member.photoUrl ? (
                <Image
                  src={member.photoUrl}
                  alt={displayName}
                  fill
                  className="object-cover"
                  sizes="56px"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-warm-500 font-serif font-bold text-lg">
                  {initials}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-serif font-semibold text-stone-900">
                {displayName}
              </p>
              <p className="text-sm text-stone-500 truncate">
                {member.title}
                {member.company ? ` at ${member.company}` : ""}
              </p>
              {member.location.length > 0 && (
                <p className="text-xs text-stone-400">
                  {member.location.join(" / ")}
                </p>
              )}
            </div>
          </div>

          <button
            onClick={handleCopyEmail}
            className="w-full mb-5 px-4 py-2.5 text-sm text-stone-600 bg-white border border-warm-200 rounded-xl hover:bg-warm-50 transition-colors text-center"
          >
            Copy email: {member.email}
          </button>

          {sent ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-sage-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-sage-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-serif font-semibold text-stone-900 mb-1">
                Email client opened!
              </h3>
              <p className="text-sm text-stone-500">
                Your message should be ready to send.
              </p>
              <button
                onClick={onClose}
                className="mt-4 px-6 py-2 text-sm font-medium text-sage-700 bg-sage-50 rounded-full hover:bg-sage-100 transition-colors"
              >
                Done
              </button>
            </div>
          ) : (
            <>
              <div className="mb-4">
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  Subject
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm border border-warm-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sage-400 text-stone-900"
                />
              </div>
              <div className="mb-5">
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  Message
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={5}
                  className="w-full px-4 py-2.5 text-sm border border-warm-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sage-400 resize-none text-stone-900"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-stone-700 bg-warm-100 rounded-full hover:bg-warm-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSend}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-sage-600 rounded-full hover:bg-sage-700 transition-colors inline-flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
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
