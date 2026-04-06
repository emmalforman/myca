"use client";

import { useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

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
  const [selectedChannels, setSelectedChannels] = useState<string[]>(["general"]);
  const [joining, setJoining] = useState(false);

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

    // Mark onboarding complete
    await supabase
      .from("channel_members")
      .upsert([{ channel: "_onboarded", email }], { onConflict: "channel,email" });

    onComplete();
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
