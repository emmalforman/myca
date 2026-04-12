"use client";

import { useState, useEffect } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { Member } from "@/lib/types";

const CHANNELS = [
  { id: "nyc", label: "New York", emoji: "🗽", type: "city" },
  { id: "sf", label: "San Francisco", emoji: "🌉", type: "city" },
  { id: "la", label: "Los Angeles", emoji: "🎬", type: "city" },
  { id: "london", label: "London", emoji: "🇬🇧", type: "city" },
  { id: "chicago", label: "Chicago", emoji: "🍕", type: "city" },
  { id: "founders", label: "Founders", emoji: "🚀", type: "role" },
  { id: "investors", label: "Investors", emoji: "💰", type: "role" },
  { id: "operators", label: "Operators", emoji: "⚙️", type: "role" },
  { id: "asks-offers", label: "Asks & Offers", emoji: "🤝", type: "topic" },
];

export default function OnboardingFlow({
  email,
  onComplete,
}: {
  email: string;
  onComplete: () => void;
}) {
  const [step, setStep] = useState<"channels" | "connect">("channels");
  const [selectedChannels, setSelectedChannels] = useState<string[]>(["general"]);
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [senderName, setSenderName] = useState("");

  useEffect(() => {
    // Load members for step 2
    fetch("/api/members")
      .then((r) => r.json())
      .then((data) => {
        if (data.members) {
          // Shuffle and exclude self
          const others = data.members
            .filter((m: Member) => m.email !== email)
            .sort(() => Math.random() - 0.5);
          setMembers(others);
        }
      });

    // Get sender name
    getSupabaseBrowser()
      .from("contacts")
      .select("name")
      .eq("email", email)
      .single()
      .then(({ data }) => {
        if (data) setSenderName(data.name);
      });
  }, [email]);

  const toggleChannel = (id: string) => {
    setSelectedChannels((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const handleJoinChannels = async () => {
    // Save channel memberships
    await fetch("/api/channels", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    // Also save the manually selected ones
    const supabase = getSupabaseBrowser();
    const rows = selectedChannels.map((ch) => ({ channel: ch, email }));
    await supabase
      .from("channel_members")
      .upsert(rows, { onConflict: "channel,email" });

    setStep("connect");
  };

  const handleSendIntro = async () => {
    if (!selectedMember || !message.trim()) return;
    setSending(true);

    const supabase = getSupabaseBrowser();
    const channelId = `dm:${[email, selectedMember.email].sort().join(":")}`;

    const name = senderName || email.split("@")[0];
    await supabase.from("messages").insert({
      channel: channelId,
      sender_email: email,
      sender_name: name,
      content: message.trim(),
    });

    // Fire-and-forget email notification
    fetch("/api/notify-dm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recipientEmail: selectedMember.email, senderName: name }),
    }).catch(() => {});

    // Mark onboarding complete
    await supabase
      .from("channel_members")
      .upsert([{ channel: "_onboarded", email }], { onConflict: "channel,email" });

    setSending(false);
    onComplete();
  };

  const cityChannels = CHANNELS.filter((c) => c.type === "city");
  const roleChannels = CHANNELS.filter((c) => c.type === "role");
  const topicChannels = CHANNELS.filter((c) => c.type === "topic");
  const nonGeneralSelected = selectedChannels.filter((c) => c !== "general").length;

  if (step === "channels") {
    return (
      <div className="min-h-screen bg-ivory flex items-center justify-center px-6">
        <div className="w-full max-w-lg">
          <div className="text-center mb-10">
            <p className="text-[11px] uppercase tracking-[0.3em] text-forest-500 font-mono mb-3">
              Welcome to Myca
            </p>
            <h1 className="text-3xl font-serif text-ink-900 mb-3">
              Join your channels.
            </h1>
            <p className="text-[14px] text-ink-400">
              Pick at least 2 channels to join. You can always change these later.
            </p>
          </div>

          <div className="space-y-6">
            {/* Cities */}
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-ink-400 font-mono mb-3">
                Your City
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {cityChannels.map((ch) => (
                  <button
                    key={ch.id}
                    onClick={() => toggleChannel(ch.id)}
                    className={`p-3 text-left border transition-all ${
                      selectedChannels.includes(ch.id)
                        ? "bg-forest-900 text-cream border-forest-900"
                        : "bg-white text-ink-600 border-ink-200 hover:border-forest-400"
                    }`}
                  >
                    <span className="text-lg mr-2">{ch.emoji}</span>
                    <span className="text-[13px]">{ch.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Roles */}
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-ink-400 font-mono mb-3">
                Your Role
              </p>
              <div className="grid grid-cols-3 gap-2">
                {roleChannels.map((ch) => (
                  <button
                    key={ch.id}
                    onClick={() => toggleChannel(ch.id)}
                    className={`p-3 text-left border transition-all ${
                      selectedChannels.includes(ch.id)
                        ? "bg-forest-900 text-cream border-forest-900"
                        : "bg-white text-ink-600 border-ink-200 hover:border-forest-400"
                    }`}
                  >
                    <span className="text-lg mr-2">{ch.emoji}</span>
                    <span className="text-[13px]">{ch.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Topics */}
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-ink-400 font-mono mb-3">
                Topics
              </p>
              <div className="grid grid-cols-2 gap-2">
                {topicChannels.map((ch) => (
                  <button
                    key={ch.id}
                    onClick={() => toggleChannel(ch.id)}
                    className={`p-3 text-left border transition-all ${
                      selectedChannels.includes(ch.id)
                        ? "bg-forest-900 text-cream border-forest-900"
                        : "bg-white text-ink-600 border-ink-200 hover:border-forest-400"
                    }`}
                  >
                    <span className="text-lg mr-2">{ch.emoji}</span>
                    <span className="text-[13px]">{ch.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={handleJoinChannels}
            disabled={nonGeneralSelected < 2}
            className="w-full mt-8 py-3.5 text-[12px] uppercase tracking-wider font-medium text-cream bg-forest-900 hover:bg-forest-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            {nonGeneralSelected < 2
              ? `Select ${2 - nonGeneralSelected} more`
              : `Join ${nonGeneralSelected} channels`}
          </button>
        </div>
      </div>
    );
  }

  // Step 2: Connect with a member
  return (
    <div className="min-h-screen bg-ivory flex items-center justify-center px-6">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <p className="text-[11px] uppercase tracking-[0.3em] text-forest-500 font-mono mb-3">
            One last thing
          </p>
          <h1 className="text-3xl font-serif text-ink-900 mb-3">
            Say hello to someone.
          </h1>
          <p className="text-[14px] text-ink-400">
            Introduce yourself to one member. This is what Myca is all about.
          </p>
        </div>

        {/* Member selection */}
        {!selectedMember ? (
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {members.slice(0, 12).map((m) => {
              const initials = (m.firstName?.[0] ?? m.name?.[0] ?? "") +
                (m.lastName?.[0] ?? m.name?.split(" ")[1]?.[0] ?? "");
              return (
                <button
                  key={m.id}
                  onClick={() => setSelectedMember(m)}
                  className="w-full flex items-center gap-3 p-3 bg-white border border-ink-100 hover:border-forest-400 transition-colors text-left"
                >
                  <div className="w-11 h-11 bg-cream flex-shrink-0 overflow-hidden">
                    {m.photoUrl ? (
                      <img src={m.photoUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-forest-400 font-serif text-sm">
                        {initials}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-serif text-ink-900 truncate">{m.name}</p>
                    <p className="text-[12px] text-ink-400 truncate">
                      {m.role}{m.company ? `, ${m.company}` : ""}
                    </p>
                  </div>
                  {m.location && (
                    <span className="text-[10px] text-ink-300 font-mono uppercase tracking-wider flex-shrink-0 hidden sm:inline">
                      {m.location}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          <div>
            {/* Selected member */}
            <div className="flex items-center gap-3 p-4 bg-forest-50 border border-forest-100 mb-4">
              <div className="w-12 h-12 bg-cream flex-shrink-0 overflow-hidden">
                {selectedMember.photoUrl ? (
                  <img src={selectedMember.photoUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-forest-400 font-serif">
                    {selectedMember.name?.[0]}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-serif text-ink-900">{selectedMember.name}</p>
                <p className="text-[12px] text-ink-400">
                  {selectedMember.role}{selectedMember.company ? `, ${selectedMember.company}` : ""}
                </p>
              </div>
              <button
                onClick={() => setSelectedMember(null)}
                className="text-[11px] uppercase tracking-wider text-ink-400 hover:text-ink-700"
              >
                Change
              </button>
            </div>

            {/* Message */}
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              autoFocus
              placeholder={`Hey ${selectedMember.firstName || selectedMember.name?.split(" ")[0]}, I just joined Myca and wanted to introduce myself...`}
              className="w-full px-4 py-3 text-[14px] border border-ink-200 focus:outline-none focus:border-forest-400 resize-none text-ink-900 placeholder-ink-300 mb-4"
            />

            <button
              onClick={handleSendIntro}
              disabled={!message.trim() || sending}
              className="w-full py-3.5 text-[12px] uppercase tracking-wider font-medium text-cream bg-forest-900 hover:bg-forest-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              {sending ? "Sending..." : "Send & Enter Myca"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
