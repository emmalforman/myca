"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Member } from "@/lib/types";
import VoiceRecorder from "./VoiceRecorder";

export default function OutreachModal({
  member,
  introMembers,
  onClose,
}: {
  member?: Member;
  introMembers?: Member[];
  onClose: () => void;
}) {
  const isIntro = introMembers && introMembers.length === 2;
  const target = member || introMembers?.[0];
  if (!target) return null;

  const [mode, setMode] = useState<"text" | "voice">("text");
  const [subject, setSubject] = useState(
    isIntro
      ? `Introduction: ${introMembers![0].firstName} meet ${introMembers![1].firstName}`
      : `Hey ${target.firstName} - let's connect!`
  );
  const [message, setMessage] = useState(
    isIntro
      ? `Hi ${introMembers![0].firstName} and ${introMembers![1].firstName},\n\nI'd love to introduce you two! You both share interests that I think could lead to a great connection.\n\n${introMembers![0].firstName} is ${introMembers![0].title || "a member"}${introMembers![0].company ? ` at ${introMembers![0].company}` : ""}.\n${introMembers![1].firstName} is ${introMembers![1].title || "a member"}${introMembers![1].company ? ` at ${introMembers![1].company}` : ""}.\n\nI'll let you two take it from here!`
      : `Hi ${target.firstName},\n\nI came across your profile in the Myca directory and would love to connect. `
  );
  const [sent, setSent] = useState(false);
  const [voiceBlob, setVoiceBlob] = useState<Blob | null>(null);
  const [voiceDuration, setVoiceDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const allTargets = isIntro ? introMembers! : [target];

  const handleSend = () => {
    const emails = allTargets.map((m) => m.email).join(",");
    const mailtoUrl = `mailto:${emails}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
    window.open(mailtoUrl, "_blank");
    setSent(true);
  };

  const handleCopyEmails = () => {
    const emails = allTargets.map((m) => m.email).join(", ");
    navigator.clipboard.writeText(emails);
  };

  const handleVoiceComplete = (blob: Blob, dur: number) => {
    setVoiceBlob(blob);
    setVoiceDuration(dur);
  };

  const playVoice = () => {
    if (voiceBlob && audioRef.current) {
      audioRef.current.src = URL.createObjectURL(voiceBlob);
      audioRef.current.play();
    }
  };

  const formatTime = (s: number) =>
    `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">
            {isIntro
              ? "Make an Introduction"
              : `Reach out to ${target.firstName}`}
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-5">
          {/* Member preview(s) */}
          <div className={`flex ${isIntro ? "gap-2" : ""} mb-5`}>
            {allTargets.map((m) => {
              const initials = (m.firstName?.[0] ?? "") + (m.lastName?.[0] ?? "");
              return (
                <div
                  key={m.id}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl flex-1"
                >
                  <div className="relative w-12 h-12 rounded-full overflow-hidden bg-brand-100 flex-shrink-0">
                    {m.photoUrl ? (
                      <Image
                        src={m.photoUrl}
                        alt={`${m.firstName} ${m.lastName}`}
                        fill
                        className="object-cover"
                        sizes="48px"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-brand-700 font-bold">
                        {initials}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {m.firstName} {m.lastName}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {m.title}
                      {m.company ? ` at ${m.company}` : ""}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {isIntro && (
            <div className="flex items-center justify-center mb-4">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-full border border-blue-100">
                <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span className="text-xs font-medium text-blue-700">
                  Shared interests:{" "}
                  {introMembers![0].tags
                    .filter((t) => introMembers![1].tags.includes(t))
                    .join(", ") || "Community members"}
                </span>
              </div>
            </div>
          )}

          <button
            onClick={handleCopyEmails}
            className="w-full mb-4 px-3 py-2 text-xs font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors text-center"
          >
            Copy email{allTargets.length > 1 ? "s" : ""}: {allTargets.map((m) => m.email).join(", ")}
          </button>

          {sent ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-brand-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                {isIntro ? "Introduction sent!" : "Email client opened!"}
              </h3>
              <p className="text-sm text-gray-500">
                Your message should be ready in your email client.
              </p>
              <button
                onClick={onClose}
                className="mt-4 px-6 py-2 text-sm font-medium text-brand-700 bg-brand-50 rounded-lg hover:bg-brand-100 transition-colors"
              >
                Done
              </button>
            </div>
          ) : (
            <>
              {/* Mode toggle */}
              <div className="flex gap-1 p-1 bg-gray-100 rounded-lg mb-4">
                <button
                  onClick={() => setMode("text")}
                  className={`flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    mode === "text"
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Text Message
                </button>
                <button
                  onClick={() => setMode("voice")}
                  className={`flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    mode === "voice"
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Voice Note
                </button>
              </div>

              {mode === "text" ? (
                <>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Subject
                    </label>
                    <input
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 text-gray-900"
                    />
                  </div>
                  <div className="mb-5">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Message
                    </label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={6}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none text-gray-900"
                    />
                  </div>
                </>
              ) : (
                <div className="mb-5 p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <p className="text-sm text-gray-600 mb-3">
                    Record a personal voice message — more engaging than text!
                  </p>
                  <VoiceRecorder onRecordingComplete={handleVoiceComplete} />
                  {voiceBlob && (
                    <div className="mt-3 flex items-center gap-3 p-2 bg-white rounded-lg border border-gray-200">
                      <button
                        onClick={playVoice}
                        className="p-2 text-brand-600 hover:bg-brand-50 rounded-full transition-colors"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </button>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          Voice message recorded
                        </p>
                        <p className="text-xs text-gray-500">
                          Duration: {formatTime(voiceDuration)}
                        </p>
                      </div>
                      <button
                        onClick={() => setVoiceBlob(null)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                      <audio ref={audioRef} />
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSend}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700 transition-colors inline-flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  {mode === "voice" ? "Send with Voice" : "Open in Email"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
