"use client";

import { useState, useEffect } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { Member } from "@/lib/types";
import Link from "next/link";

export default function OutreachModal({
  member,
  onClose,
}: {
  member: Member;
  onClose: () => void;
}) {
  const displayName =
    member.name || `${member.firstName ?? ""} ${member.lastName ?? ""}`.trim();
  const firstName = member.firstName || displayName.split(" ")[0];
  const initials =
    (member.firstName?.[0] ?? displayName?.[0] ?? "") +
    (member.lastName?.[0] ?? displayName?.split(" ")[1]?.[0] ?? "");

  const [dmMessage, setDmMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [senderEmail, setSenderEmail] = useState("");
  const [senderName, setSenderName] = useState("");
  const [sending, setSending] = useState(false);
  const [canSendIntro, setCanSendIntro] = useState(true);
  const [introsRemaining, setIntrosRemaining] = useState<number | null>(null);
  const [checkingAccess, setCheckingAccess] = useState(true);

  useEffect(() => {
    const supabase = getSupabaseBrowser();
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user?.email) {
        setSenderEmail(session.user.email);
        const { data } = await supabase
          .from("contacts")
          .select("name")
          .eq("email", session.user.email)
          .single();
        if (data) setSenderName(data.name);

        // Check intro quota
        const res = await fetch(`/api/intros/check?email=${encodeURIComponent(session.user.email)}`);
        if (res.ok) {
          const access = await res.json();
          setCanSendIntro(access.canSendIntro);
          setIntrosRemaining(access.introsRemaining);
        }
        setCheckingAccess(false);
      }
    });
  }, []);

  const handleDM = async () => {
    if (!dmMessage.trim() || !senderEmail) return;
    setSending(true);

    const supabase = getSupabaseBrowser();

    // Create a DM channel ID (sorted emails for consistency)
    const channelId = `dm:${[senderEmail, member.email].sort().join(":")}`;

    await supabase.from("messages").insert({
      channel: channelId,
      sender_email: senderEmail,
      sender_name: senderName || senderEmail.split("@")[0],
      content: dmMessage.trim(),
    });

    setSent(true);
    setSending(false);
    logOutreach();
  };

  const logOutreach = async () => {
    if (!senderEmail || !member.id) return;
    try {
      const supabase = getSupabaseBrowser();
      const { data: sender } = await supabase
        .from("contacts")
        .select("contact_id")
        .eq("email", senderEmail)
        .single();

      if (sender) {
        await supabase.from("introductions").insert({
          person_a_id: sender.contact_id,
          person_b_id: member.id,
          status: "outreach_sent",
          context: "Direct message via Myca",
        });
      }
    } catch {}
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink-950/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-ink-100">
          <p className="text-[11px] uppercase tracking-[0.2em] text-ink-400 font-mono">
            Send Message
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

        <div className="p-5">
          {/* Member preview */}
          <div className="flex items-center gap-4 mb-5">
            <div className="w-14 h-14 bg-cream overflow-hidden flex-shrink-0">
              {member.photoUrl ? (
                <img src={member.photoUrl} alt={displayName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-forest-400 font-serif text-lg">
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

          {sent ? (
            <div className="text-center py-8">
              <div className="w-14 h-14 bg-forest-50 flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-forest-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="font-serif text-lg text-ink-900 mb-1">Message sent!</p>
              <p className="text-[13px] text-ink-400">
                {firstName} will see your message in their Myca inbox.
              </p>
              <button
                onClick={onClose}
                className="mt-5 px-6 py-2 text-[12px] uppercase tracking-wider text-forest-700 border border-forest-200 hover:bg-forest-50 transition-colors"
              >
                Done
              </button>
            </div>
          ) : checkingAccess ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border border-ink-200 border-t-ink-500 rounded-full animate-spin" />
            </div>
          ) : !canSendIntro ? (
            /* Intro limit reached */
            <div className="text-center py-6">
              <div className="w-14 h-14 bg-clay-100 flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-clay-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <p className="font-serif text-lg text-ink-900 mb-1">
                Intro limit reached
              </p>
              <p className="text-[13px] text-ink-400 mb-5">
                You&apos;ve used all your intro requests this month.
                Upgrade to Founding for unlimited intros.
              </p>
              <Link
                href="/pricing"
                className="inline-block px-6 py-2.5 text-[12px] uppercase tracking-wider font-medium text-cream bg-forest-900 hover:bg-forest-700 transition-colors"
              >
                Upgrade
              </Link>
            </div>
          ) : (
            /* Direct message form */
            <>
              {introsRemaining !== null && (
                <p className="text-[11px] text-ink-300 font-mono uppercase tracking-wider mb-3">
                  {introsRemaining} intro{introsRemaining !== 1 ? "s" : ""} remaining this month
                </p>
              )}
              <div className="mb-4">
                <label className="block text-[11px] uppercase tracking-wider text-ink-400 font-mono mb-2">
                  Message
                </label>
                <textarea
                  value={dmMessage}
                  onChange={(e) => setDmMessage(e.target.value)}
                  rows={4}
                  autoFocus
                  placeholder={`Hey ${firstName}, I saw your profile on Myca and...`}
                  className="w-full px-4 py-3 text-[14px] border border-ink-200 focus:outline-none focus:border-forest-400 resize-none text-ink-900 placeholder-ink-300"
                />
              </div>
              <button
                onClick={handleDM}
                disabled={!dmMessage.trim() || sending}
                className="w-full py-3 text-[12px] uppercase tracking-wider font-medium text-cream bg-forest-900 hover:bg-forest-700 disabled:opacity-40 transition-colors"
              >
                {sending ? "Sending..." : "Send Message"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
