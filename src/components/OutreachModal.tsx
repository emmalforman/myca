"use client";

import { useState, useEffect } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { Member } from "@/lib/types";

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

  const [mode, setMode] = useState<"choose" | "email" | "dm">("choose");
  const [subject, setSubject] = useState(
    `Connecting via Myca — ${firstName}`
  );
  const [emailBody, setEmailBody] = useState(
    `Hi ${firstName},\n\nI came across your profile in the Myca Collective and would love to connect.\n\n`
  );
  const [dmMessage, setDmMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [senderEmail, setSenderEmail] = useState("");
  const [senderName, setSenderName] = useState("");
  const [sending, setSending] = useState(false);

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
      }
    });
  }, []);

  const handleGmail = async () => {
    const gmailUrl = `https://mail.google.com/mail/?view=cm&to=${encodeURIComponent(member.email)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailBody)}`;
    window.open(gmailUrl, "_blank");
    setSent(true);
    logOutreach();
  };

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
          context: mode === "dm" ? "Direct message via Myca" : `Email: "${subject}"`,
        });
      }
    } catch {}
  };

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(member.email);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink-950/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-ink-100">
          <p className="text-[11px] uppercase tracking-[0.2em] text-ink-400 font-mono">
            Connect
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
              <p className="font-serif text-lg text-ink-900 mb-1">
                {mode === "dm" ? "Message sent!" : "Gmail opened!"}
              </p>
              <p className="text-[13px] text-ink-400">
                {mode === "dm"
                  ? `${firstName} will see your message in their Myca inbox.`
                  : "Your email should be ready to send."}
              </p>
              <button
                onClick={onClose}
                className="mt-5 px-6 py-2 text-[12px] uppercase tracking-wider text-forest-700 border border-forest-200 hover:bg-forest-50 transition-colors"
              >
                Done
              </button>
            </div>
          ) : mode === "choose" ? (
            /* Choose method */
            <div className="space-y-3">
              <button
                onClick={() => setMode("dm")}
                className="w-full p-4 text-left border border-ink-200 hover:border-forest-400 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-forest-50 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-forest-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-[14px] text-ink-900 font-medium">Direct Message</p>
                    <p className="text-[12px] text-ink-400">Message {firstName} on Myca</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setMode("email")}
                className="w-full p-4 text-left border border-ink-200 hover:border-forest-400 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-clay-50 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-clay-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-[14px] text-ink-900 font-medium">Email via Gmail</p>
                    <p className="text-[12px] text-ink-400">Opens in Gmail with a draft</p>
                  </div>
                </div>
              </button>

              <button
                onClick={handleCopyEmail}
                className="w-full py-2 text-[12px] text-ink-400 hover:text-ink-600 transition-colors text-center font-mono"
              >
                Copy email: {member.email}
              </button>
            </div>
          ) : mode === "dm" ? (
            /* Direct message */
            <>
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
              <div className="flex gap-3">
                <button
                  onClick={() => setMode("choose")}
                  className="flex-1 py-3 text-[12px] uppercase tracking-wider text-ink-500 border border-ink-200 hover:border-ink-400 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleDM}
                  disabled={!dmMessage.trim() || sending}
                  className="flex-1 py-3 text-[12px] uppercase tracking-wider font-medium text-cream bg-forest-900 hover:bg-forest-700 disabled:opacity-40 transition-colors"
                >
                  {sending ? "Sending..." : "Send Message"}
                </button>
              </div>
            </>
          ) : (
            /* Email via Gmail */
            <>
              <div className="mb-3">
                <label className="block text-[11px] uppercase tracking-wider text-ink-400 font-mono mb-2">
                  Subject
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-4 py-2.5 text-[14px] border border-ink-200 focus:outline-none focus:border-forest-400 text-ink-900"
                />
              </div>
              <div className="mb-4">
                <label className="block text-[11px] uppercase tracking-wider text-ink-400 font-mono mb-2">
                  Message
                </label>
                <textarea
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  rows={5}
                  className="w-full px-4 py-2.5 text-[14px] border border-ink-200 focus:outline-none focus:border-forest-400 resize-none text-ink-900"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setMode("choose")}
                  className="flex-1 py-3 text-[12px] uppercase tracking-wider text-ink-500 border border-ink-200 hover:border-ink-400 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleGmail}
                  className="flex-1 py-3 text-[12px] uppercase tracking-wider font-medium text-cream bg-forest-900 hover:bg-forest-700 transition-colors"
                >
                  Open in Gmail
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
