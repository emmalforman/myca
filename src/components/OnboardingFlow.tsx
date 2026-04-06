"use client";

import { useState, useEffect } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { Member } from "@/lib/types";

const CHANNELS = [
  // Cities - open
  { id: "nyc", label: "Myca in NYC", emoji: "🗽", type: "city", restricted: false },
  { id: "sf", label: "Myca in SF", emoji: "🌉", type: "city", restricted: false },
  { id: "la", label: "Myca in LA", emoji: "🎬", type: "city", restricted: false },
  { id: "london", label: "London", emoji: "🇬🇧", type: "city", restricted: false },
  { id: "chicago", label: "Chicago", emoji: "🍕", type: "city", restricted: false },
  { id: "europe", label: "Myca in Europe", emoji: "🌍", type: "city", restricted: false },
  // Roles - restricted (must match your role)
  { id: "founders", label: "Founders", emoji: "🚀", type: "role", restricted: true },
  { id: "investors", label: "Investors", emoji: "💰", type: "role", restricted: true },
  { id: "operators", label: "Operators", emoji: "⚙️", type: "role", restricted: true },
  // Industry - restricted
  { id: "cpg", label: "CPG", emoji: "🛒", type: "industry", restricted: true },
  { id: "food-tech", label: "Food Tech", emoji: "🔬", type: "industry", restricted: true },
  { id: "hospitality", label: "Hospitality / Restaurants", emoji: "🍽️", type: "industry", restricted: true },
  // Topics - open
  { id: "jobs-asks", label: "Jobs & Asks", emoji: "💼", type: "topic", restricted: false },
  { id: "ai-chat", label: "AI Chat", emoji: "🤖", type: "topic", restricted: false },
  { id: "book-club", label: "Book Club", emoji: "📚", type: "topic", restricted: false },
  { id: "traveling", label: "Traveling", emoji: "✈️", type: "topic", restricted: false },
  // Events - restricted (invite/approval needed)
  { id: "expo-west-2026", label: "Expo West 2026", emoji: "🎪", type: "event", restricted: true },
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
  const [joining, setJoining] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [senderName, setSenderName] = useState("");

  useEffect(() => {
    const loadData = async () => {
      const supabase = getSupabaseBrowser();

      // Get current user's profile for smart matching
      const { data: myProfile } = await supabase
        .from("contacts")
        .select("name, location, occupation_type")
        .eq("email", email)
        .single();

      if (myProfile) setSenderName(myProfile.name);

      const res = await fetch("/api/members");
      const data = await res.json();
      if (!data.members) return;

      const others = data.members.filter((m: Member) => m.email !== email);
      const myLocation = (myProfile?.location || "").toLowerCase();
      const myRole = (myProfile?.occupation_type || "").toLowerCase();

      // Score members: same city = 3, same role = 2, random tiebreaker
      const scored = others.map((m: Member) => {
        let score = 0;
        const loc = (m.location || "").toLowerCase();
        const role = (m.occupationType || "").toLowerCase();

        // City match
        if (myLocation && loc) {
          const cities = ["new york", "nyc", "san francisco", "sf", "los angeles", "la", "london", "chicago", "europe"];
          for (const city of cities) {
            if (myLocation.includes(city) && loc.includes(city)) {
              score += 3;
              break;
            }
          }
        }

        // Role match
        if (myRole && role && (
          (myRole.includes("founder") && role.includes("founder")) ||
          (myRole.includes("investor") && role.includes("investor")) ||
          (myRole.includes("operator") && role.includes("operator"))
        )) {
          score += 2;
        }

        // Recently active members get a slight boost
        // (proxy: members with photos tend to be more engaged)
        if (m.photoUrl) score += 1;

        return { member: m, score, rand: Math.random() };
      });

      // Sort by score desc, then random within same score
      scored.sort((a: { score: number; rand: number }, b: { score: number; rand: number }) =>
        b.score - a.score || a.rand - b.rand
      );

      setMembers(scored.map((s: { member: Member }) => s.member));
    };

    loadData();
  }, [email]);

  const toggleChannel = (id: string) => {
    setSelectedChannels((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const handleJoinChannels = async () => {
    setJoining(true);
    // Save channel memberships
    await fetch("/api/channels", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const supabase = getSupabaseBrowser();

    // Separate open vs restricted channels
    const openChannels = selectedChannels.filter((id) => {
      const ch = CHANNELS.find((c) => c.id === id);
      return !ch?.restricted;
    });
    const restrictedChannels = selectedChannels.filter((id) => {
      const ch = CHANNELS.find((c) => c.id === id);
      return ch?.restricted;
    });

    // Join open channels immediately
    if (openChannels.length > 0) {
      const rows = openChannels.map((ch) => ({ channel: ch, email }));
      await supabase
        .from("channel_members")
        .upsert(rows, { onConflict: "channel,email" });
    }

    // Request access to restricted channels (pending approval)
    if (restrictedChannels.length > 0) {
      const rows = restrictedChannels.map((ch) => ({
        channel: ch,
        email,
        status: "pending",
      }));
      await supabase
        .from("channel_requests")
        .upsert(rows, { onConflict: "channel,email" });
    }

    setJoining(false);
    setStep("connect");
  };

  const finishOnboarding = async () => {
    const supabase = getSupabaseBrowser();
    await supabase
      .from("channel_members")
      .upsert([{ channel: "_onboarded", email }], { onConflict: "channel,email" });
    onComplete();
  };

  const handleSendIntro = async () => {
    if (!selectedMember || !message.trim()) return;
    setSending(true);

    const supabase = getSupabaseBrowser();
    const channelId = `dm:${[email, selectedMember.email].sort().join(":")}`;

    await supabase.from("messages").insert({
      channel: channelId,
      sender_email: email,
      sender_name: senderName || email.split("@")[0],
      content: message.trim(),
    });

    setSending(false);
    await finishOnboarding();
  };

  const cityChannels = CHANNELS.filter((c) => c.type === "city");
  const roleChannels = CHANNELS.filter((c) => c.type === "role");
  const industryChannels = CHANNELS.filter((c) => c.type === "industry");
  const topicChannels = CHANNELS.filter((c) => c.type === "topic");
  const eventChannels = CHANNELS.filter((c) => c.type === "event");
  const nonGeneralSelected = selectedChannels.filter((c) => c !== "general").length;
  const pendingValidation = selectedChannels.filter((id) => {
    const ch = CHANNELS.find((c) => c.id === id);
    return ch?.restricted;
  });

  if (step === "connect") {
    return (
      <div className="min-h-screen bg-ivory flex items-center justify-center px-6">
        <div className="w-full max-w-lg">
          <div className="text-center mb-8">
            <p className="text-[11px] uppercase tracking-[0.3em] text-forest-500 font-mono mb-3">
              Almost there
            </p>
            <h1 className="text-3xl font-serif text-ink-900 mb-3">
              Say hello to someone?
            </h1>
            <p className="text-[14px] text-ink-400">
              Optionally introduce yourself to a member, or skip this step.
            </p>
          </div>

          <button
            onClick={finishOnboarding}
            className="w-full mb-6 py-3 text-[12px] uppercase tracking-wider font-medium text-forest-900 border border-forest-300 hover:bg-forest-50 transition-colors"
          >
            Skip &mdash; enter Myca
          </button>

          {!selectedMember ? (
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {members.slice(0, 12).map((m) => {
                const initials = (m.firstName?.[0] ?? m.name?.[0] ?? "") +
                  (m.lastName?.[0] ?? m.name?.split(" ")[1]?.[0] ?? "");
                return (
                  <button
                    key={m.id}
                    onClick={() => setSelectedMember(m)}
                    className="w-full flex items-start gap-4 p-4 bg-white border border-ink-100 hover:border-forest-400 transition-colors text-left"
                  >
                    <div className="w-14 h-14 bg-cream flex-shrink-0 overflow-hidden">
                      {m.photoUrl ? (
                        <img src={m.photoUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-forest-400 font-serif text-lg">
                          {initials}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="text-[14px] font-serif text-ink-900 truncate">{m.name}</p>
                        {m.location && (
                          <span className="text-[10px] text-ink-300 font-mono uppercase tracking-wider flex-shrink-0">
                            {m.location}
                          </span>
                        )}
                      </div>
                      <p className="text-[12px] text-ink-400 truncate">
                        {m.role}{m.company ? `, ${m.company}` : ""}
                      </p>
                      {m.occupationType && (
                        <span className="inline-block mt-1 px-2 py-0.5 text-[9px] uppercase tracking-wider text-ink-500 border border-ink-200 font-mono">
                          {m.occupationType}
                        </span>
                      )}
                      {m.superpower && (
                        <p className="text-[12px] text-clay-600 mt-1.5 italic line-clamp-1">
                          {m.superpower}
                        </p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div>
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
                  onClick={() => {
                    setSelectedMember(null);
                    setMessage("");
                  }}
                  className="text-[11px] uppercase tracking-wider text-ink-400 hover:text-ink-700"
                >
                  Back
                </button>
              </div>

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

          <div className="space-y-6 max-h-[50vh] overflow-y-auto pr-1">
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
                <span className="ml-2 text-[9px] text-clay-500 normal-case tracking-normal">
                  Requires validation
                </span>
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

            {/* Industry */}
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-ink-400 font-mono mb-3">
                Industry
                <span className="ml-2 text-[9px] text-clay-500 normal-case tracking-normal">
                  Requires validation
                </span>
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {industryChannels.map((ch) => (
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

            {/* Events */}
            {eventChannels.length > 0 && (
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-ink-400 font-mono mb-3">
                  Events
                  <span className="ml-2 text-[9px] text-clay-500 normal-case tracking-normal">
                    Requires validation
                  </span>
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {eventChannels.map((ch) => (
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
            )}
          </div>

          {pendingValidation.length > 0 && (
            <p className="mt-4 text-[12px] text-clay-600 text-center">
              {pendingValidation.length} channel{pendingValidation.length !== 1 ? "s" : ""} will
              require admin approval before you can access{" "}
              {pendingValidation.length !== 1 ? "them" : "it"}.
            </p>
          )}

          <button
            onClick={handleJoinChannels}
            disabled={nonGeneralSelected < 2 || joining}
            className="w-full mt-4 py-3.5 text-[12px] uppercase tracking-wider font-medium text-cream bg-forest-900 hover:bg-forest-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            {joining
              ? "Joining..."
              : nonGeneralSelected < 2
                ? `Select ${2 - nonGeneralSelected} more`
                : `Join ${nonGeneralSelected} channels`}
          </button>
        </div>
      </div>
    );
}
