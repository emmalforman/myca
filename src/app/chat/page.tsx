"use client";

import { useState, useEffect, useRef } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import MemberLogin from "@/components/MemberLogin";
import MemberDrawer from "@/components/MemberDrawer";
import OutreachModal from "@/components/OutreachModal";
import { Member } from "@/lib/types";

const CHANNELS = [
  { id: "general", label: "Myca Main Chat", emoji: "💬" },
  { id: "jobs-asks", label: "Jobs & Asks", emoji: "💼" },
  { id: "ai-chat", label: "AI Chat", emoji: "🤖" },
  { id: "nyc", label: "Myca in NYC", emoji: "🗽" },
  { id: "sf", label: "Myca in SF", emoji: "🌉" },
  { id: "la", label: "Myca in LA", emoji: "🎬" },
  { id: "london", label: "London", emoji: "🇬🇧" },
  { id: "chicago", label: "Chicago", emoji: "🍕" },
  { id: "europe", label: "Myca in Europe", emoji: "🌍" },
  { id: "founders", label: "Founders", emoji: "🚀" },
  { id: "investors", label: "Investors", emoji: "💰" },
  { id: "operators", label: "Operators", emoji: "⚙️" },
  { id: "cpg", label: "CPG", emoji: "🛒" },
  { id: "food-tech", label: "Food Tech", emoji: "🔬" },
  { id: "hospitality", label: "Hospitality / Restaurants", emoji: "🍽️" },
  { id: "book-club", label: "Book Club", emoji: "📚" },
  { id: "traveling", label: "Traveling", emoji: "✈️" },
  { id: "expo-west-2026", label: "Expo West 2026", emoji: "🎪" },
];

interface Message {
  id: string;
  channel: string;
  sender_email: string;
  sender_name: string;
  content: string;
  created_at: string;
}

interface BotMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  recommendations?: { email: string; reason: string }[];
  created_at: string;
}

const BOT_CHANNEL = "bot:myca";

function ChatApp() {
  const [channel, setChannel] = useState("general");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [user, setUser] = useState<{ email: string; name: string } | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [memberProfiles, setMemberProfiles] = useState<Map<string, Member>>(new Map());
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [outreachTarget, setOutreachTarget] = useState<Member | null>(null);
  const [dmChannels, setDmChannels] = useState<{ id: string; name: string; email: string }[]>([]);
  const [botMessages, setBotMessages] = useState<BotMessage[]>([]);
  const [botLoading, setBotLoading] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const isBot = channel === BOT_CHANNEL;

  // Load all member profiles for lookups
  useEffect(() => {
    fetch("/api/members")
      .then((r) => r.json())
      .then((data) => {
        if (data.members) {
          const map = new Map<string, Member>();
          data.members.forEach((m: Member) => {
            if (m.email) map.set(m.email, m);
          });
          setMemberProfiles(map);
        }
      })
      .catch(() => {});
  }, []);

  // Get current user
  useEffect(() => {
    const supabase = getSupabaseBrowser();
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user?.email) {
        const { data } = await supabase
          .from("contacts")
          .select("name")
          .eq("email", session.user.email)
          .limit(1);

        setUser({
          email: session.user.email,
          name: data?.[0]?.name || session.user.email.split("@")[0],
        });

        // Load DM channels from both channel_members and messages
        const [{ data: dmMemberships }, { data: dmMessages }] = await Promise.all([
          supabase
            .from("channel_members")
            .select("channel")
            .eq("email", session.user.email)
            .like("channel", "dm:%"),
          supabase
            .from("messages")
            .select("channel")
            .like("channel", `dm:%${session.user.email}%`)
            .limit(50),
        ]);

        // Merge both sources for complete DM list
        const allDmChannels = new Set<string>();
        (dmMemberships || []).forEach((r: any) => allDmChannels.add(r.channel));
        (dmMessages || []).forEach((r: any) => allDmChannels.add(r.channel));

        if (allDmChannels.size > 0) {
          const dms = [...allDmChannels].map((ch: string) => {
            const parts = ch.replace("dm:", "").split(":");
            const otherEmail = parts.find((e: string) => e !== session.user.email) || "";
            return { id: ch, email: otherEmail, name: "" };
          });
          setDmChannels(dms);
        }
      }
    });
  }, []);

  // Resolve DM channel names from member profiles
  useEffect(() => {
    if (dmChannels.length > 0 && memberProfiles.size > 0) {
      setDmChannels((prev) =>
        prev.map((dm) => {
          const profile = memberProfiles.get(dm.email);
          return { ...dm, name: profile?.name || dm.email.split("@")[0] };
        })
      );
    }
  }, [memberProfiles]);

  // Load messages for current channel (skip for bot channel)
  useEffect(() => {
    setSendError(null);

    if (channel === BOT_CHANNEL) {
      setLoading(false);
      setTimeout(scrollToBottom, 100);
      setTimeout(() => inputRef.current?.focus(), 150);
      return;
    }

    setLoading(true);
    const supabase = getSupabaseBrowser();

    supabase
      .from("messages")
      .select("*")
      .eq("channel", channel)
      .order("created_at", { ascending: true })
      .limit(100)
      .then(({ data }) => {
        setMessages(data || []);
        setLoading(false);
        setTimeout(scrollToBottom, 100);
        setTimeout(() => inputRef.current?.focus(), 150);
      });

    // Subscribe to new messages
    const subscription = supabase
      .channel(`messages:${channel}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `channel=eq.${channel}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
          setTimeout(scrollToBottom, 100);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [channel]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !user) return;
    setSendError(null);

    if (isBot) {
      return sendBotMessage(input.trim());
    }

    const supabase = getSupabaseBrowser();
    const { error } = await supabase.from("messages").insert({
      channel,
      sender_email: user.email,
      sender_name: user.name,
      content: input.trim(),
    });

    if (error) {
      setSendError("Message failed to send. Please try again.");
    } else {
      setInput("");
      if (inputRef.current) inputRef.current.style.height = "auto";
      inputRef.current?.focus();
    }
  };

  const sendBotMessage = async (text: string) => {
    if (!user) return;
    const userMsg: BotMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
      created_at: new Date().toISOString(),
    };
    setBotMessages((prev) => [...prev, userMsg]);
    setInput("");
    if (inputRef.current) inputRef.current.style.height = "auto";
    setBotLoading(true);
    setTimeout(scrollToBottom, 50);

    try {
      const history = botMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch("/api/bot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          email: user.email,
          history,
        }),
      });

      const data = await res.json();

      const botMsg: BotMessage = {
        id: `bot-${Date.now()}`,
        role: "assistant",
        content: data.reply || "Sorry, I couldn't process that. Try again?",
        recommendations: data.recommendations || [],
        created_at: new Date().toISOString(),
      };
      setBotMessages((prev) => [...prev, botMsg]);
    } catch {
      setBotMessages((prev) => [
        ...prev,
        {
          id: `bot-err-${Date.now()}`,
          role: "assistant",
          content: "Something went wrong. Please try again.",
          created_at: new Date().toISOString(),
        },
      ]);
    }

    setBotLoading(false);
    setTimeout(scrollToBottom, 100);
    inputRef.current?.focus();
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();

    const time = date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });

    if (isToday) return time;
    if (isYesterday) return `Yesterday ${time}`;
    return `${date.toLocaleDateString("en-US", { month: "short", day: "numeric" })} ${time}`;
  };

  // Render message content with clickable URLs
  const renderContent = (text: string) => {
    const urlRegex = /(https?:\/\/[^\s<]+)/g;
    const parts = text.split(urlRegex);
    if (parts.length === 1) return text;
    return parts.map((part, i) =>
      urlRegex.test(part) ? (
        <a
          key={i}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-forest-700 underline underline-offset-2 hover:text-forest-500 break-all"
        >
          {part}
        </a>
      ) : (
        <span key={i}>{part}</span>
      )
    );
  };

  // Format date separator label
  const formatDateLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();

    if (isToday) return "Today";
    if (isYesterday) return "Yesterday";
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  };

  // Check if a date separator should be shown between two messages
  const shouldShowDateSeparator = (
    msg: Message,
    prevMsg: Message | null
  ): boolean => {
    if (!prevMsg) return true;
    const d1 = new Date(msg.created_at).toDateString();
    const d2 = new Date(prevMsg.created_at).toDateString();
    return d1 !== d2;
  };

  // Handle Enter to send, Shift+Enter for newline
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(e as unknown as React.FormEvent);
    }
  };

  // Auto-resize textarea
  const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  };

  const currentChannel = CHANNELS.find((c) => c.id === channel);
  const isDM = channel.startsWith("dm:");
  const dmRecipient = isDM ? dmChannels.find((d) => d.id === channel) : null;
  const dmProfile = dmRecipient ? memberProfiles.get(dmRecipient.email) : null;
  const channelDisplayName = isBot
    ? "Ask Myca"
    : isDM
      ? dmRecipient?.name || "Direct Message"
      : currentChannel?.label;
  const channelDisplayEmoji = isBot ? "✨" : isDM ? "✉️" : currentChannel?.emoji;

  return (
    <div className="h-[calc(100vh-57px)] flex bg-ivory">
      {/* Sidebar - Desktop */}
      <div className="hidden md:flex w-64 flex-col bg-forest-950 flex-shrink-0">
        <div className="p-4 border-b border-ink-800">
          <button
            onClick={() => setChannel(BOT_CHANNEL)}
            className={`w-full text-left px-3 py-2.5 text-[13px] flex items-center gap-2.5 transition-colors rounded ${
              isBot
                ? "bg-forest-700 text-white"
                : "text-cream hover:bg-forest-800"
            }`}
          >
            <span className="text-base">✨</span>
            <span className="font-medium">Ask Myca</span>
            <span className="ml-auto text-[9px] uppercase tracking-wider text-forest-400 font-mono">Private</span>
          </button>
        </div>
        <div className="px-4 pt-3 pb-1">
          <p className="text-[11px] uppercase tracking-[0.2em] text-ink-500 font-mono">
            Channels
          </p>
        </div>
        <div className="flex-1 overflow-y-auto py-1">
          {CHANNELS.map((ch) => (
            <button
              key={ch.id}
              onClick={() => setChannel(ch.id)}
              className={`w-full text-left px-4 py-2.5 text-[13px] flex items-center gap-2.5 transition-colors ${
                channel === ch.id
                  ? "bg-forest-800 text-white"
                  : "text-ink-400 hover:text-ink-200 hover:bg-forest-900"
              }`}
            >
              <span className="text-base">{ch.emoji}</span>
              {ch.label}
            </button>
          ))}

          {/* DM channels */}
          {dmChannels.length > 0 && (
            <>
              <div className="px-4 pt-4 pb-2">
                <p className="text-[10px] uppercase tracking-[0.2em] text-forest-600 font-mono">
                  Direct Messages
                </p>
              </div>
              {dmChannels.map((dm) => {
                const profile = memberProfiles.get(dm.email);
                return (
                  <button
                    key={dm.id}
                    onClick={() => setChannel(dm.id)}
                    className={`w-full text-left px-4 py-2 text-[13px] flex items-center gap-2.5 transition-colors ${
                      channel === dm.id
                        ? "bg-forest-800 text-white"
                        : "text-ink-400 hover:text-ink-200 hover:bg-forest-900"
                    }`}
                  >
                    <div className="w-6 h-6 bg-forest-800 overflow-hidden flex-shrink-0">
                      {profile?.photoUrl ? (
                        <img src={profile.photoUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] font-serif text-forest-300">
                          {dm.name?.[0] || "?"}
                        </div>
                      )}
                    </div>
                    <span className="truncate">{dm.name}</span>
                  </button>
                );
              })}
            </>
          )}
        </div>
        {user && (
          <div className="p-4 border-t border-ink-800">
            <p className="text-[12px] text-ink-400 truncate">{user.name}</p>
            <p className="text-[10px] text-ink-600 font-mono truncate">
              {user.email}
            </p>
          </div>
        )}
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-40">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="relative w-64 h-full bg-forest-950 flex flex-col">
            <div className="p-4 border-b border-ink-800 flex items-center justify-between">
              <p className="text-[11px] uppercase tracking-[0.2em] text-ink-500 font-mono">
                Channels
              </p>
              <button
                onClick={() => setSidebarOpen(false)}
                className="text-ink-500"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto py-2">
              <button
                onClick={() => { setChannel(BOT_CHANNEL); setSidebarOpen(false); }}
                className={`w-full text-left px-4 py-2.5 text-[13px] flex items-center gap-2.5 transition-colors ${
                  isBot ? "bg-forest-800 text-white" : "text-cream hover:bg-forest-900"
                }`}
              >
                <span className="text-base">✨</span>
                <span className="font-medium">Ask Myca</span>
              </button>
              <div className="px-4 pt-3 pb-1">
                <p className="text-[10px] uppercase tracking-[0.2em] text-ink-500 font-mono">Channels</p>
              </div>
              {CHANNELS.map((ch) => (
                <button
                  key={ch.id}
                  onClick={() => {
                    setChannel(ch.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2.5 text-[13px] flex items-center gap-2.5 transition-colors ${
                    channel === ch.id
                      ? "bg-forest-800 text-white"
                      : "text-ink-400 hover:text-ink-200"
                  }`}
                >
                  <span className="text-base">{ch.emoji}</span>
                  {ch.label}
                </button>
              ))}

              {/* DM channels - mobile */}
              {dmChannels.length > 0 && (
                <>
                  <div className="px-4 pt-4 pb-2">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-forest-600 font-mono">
                      Direct Messages
                    </p>
                  </div>
                  {dmChannels.map((dm) => {
                    const profile = memberProfiles.get(dm.email);
                    return (
                      <button
                        key={dm.id}
                        onClick={() => {
                          setChannel(dm.id);
                          setSidebarOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-[13px] flex items-center gap-2.5 transition-colors ${
                          channel === dm.id
                            ? "bg-forest-800 text-white"
                            : "text-ink-400 hover:text-ink-200"
                        }`}
                      >
                        <div className="w-6 h-6 bg-forest-800 overflow-hidden flex-shrink-0">
                          {profile?.photoUrl ? (
                            <img src={profile.photoUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[10px] font-serif text-forest-300">
                              {dm.name?.[0] || "?"}
                            </div>
                          )}
                        </div>
                        <span className="truncate">{dm.name}</span>
                      </button>
                    );
                  })}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Channel header */}
        <div className="h-14 flex items-center gap-3 px-5 border-b border-ink-100 bg-white flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden text-ink-400"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
          <span className="text-lg">{channelDisplayEmoji}</span>
          <span className="text-[14px] font-serif text-ink-900">
            {channelDisplayName}
          </span>
          {isDM && dmProfile && (
            <span className="text-[11px] text-ink-400 hidden sm:inline">
              {dmProfile.role}{dmProfile.company ? `, ${dmProfile.company}` : ""}
            </span>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {loading && !isBot && (
            <div className="flex items-center justify-center h-full">
              <div className="w-6 h-6 border border-ink-200 border-t-ink-500 rounded-full animate-spin" />
            </div>
          )}

          {/* Bot channel */}
          {isBot && botMessages.length === 0 && !botLoading && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center max-w-sm">
                <p className="text-4xl mb-4">✨</p>
                <p className="text-lg font-serif text-ink-900 mb-2">
                  Hi, I&apos;m Myca
                </p>
                <p className="text-[14px] text-ink-400 mb-6">
                  I can help you find the right person to connect with. Try asking me something like:
                </p>
                <div className="space-y-2">
                  {[
                    "Who can help me with retail distribution?",
                    "I'm looking for a co-packer in NYC",
                    "Who knows about DTC marketing?",
                    "Connect me with other founders in food tech",
                  ].map((q) => (
                    <button
                      key={q}
                      onClick={() => sendBotMessage(q)}
                      className="w-full text-left px-4 py-2.5 text-[13px] text-ink-600 bg-white border border-ink-100 hover:border-forest-400 transition-colors"
                    >
                      &ldquo;{q}&rdquo;
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {isBot && botMessages.map((msg) => (
            <div key={msg.id} className={`flex gap-3 mt-4`}>
              <div className={`w-8 h-8 flex-shrink-0 flex items-center justify-center text-[14px] ${
                msg.role === "user" ? "bg-forest-900 text-cream font-serif font-bold" : "bg-clay-100 text-clay-700"
              }`}>
                {msg.role === "user" ? (user?.name?.[0] || "?") : "✨"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 mb-0.5">
                  <span className="text-[13px] font-medium text-ink-900">
                    {msg.role === "user" ? user?.name : "Myca"}
                  </span>
                  <span className="text-[10px] text-ink-300 font-mono">
                    {formatTime(msg.created_at)}
                  </span>
                </div>
                <p className="text-[14px] text-ink-700 leading-relaxed break-words whitespace-pre-wrap">
                  {renderContent(msg.content)}
                </p>
                {/* Recommendation cards */}
                {msg.recommendations && msg.recommendations.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {msg.recommendations.map((rec) => {
                      const profile = memberProfiles.get(rec.email);
                      if (!profile) return null;
                      const initials = (profile.firstName?.[0] || profile.name?.[0] || "") +
                        (profile.lastName?.[0] || profile.name?.split(" ")[1]?.[0] || "");
                      return (
                        <div key={rec.email} className="flex items-start gap-3 p-3 bg-white border border-ink-100">
                          <div className="w-11 h-11 bg-cream flex-shrink-0 overflow-hidden">
                            {profile.photoUrl ? (
                              <img src={profile.photoUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-forest-400 font-serif text-sm">
                                {initials}
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <button
                              onClick={() => setSelectedMember(profile)}
                              className="text-[14px] font-serif text-ink-900 hover:text-forest-700 transition-colors"
                            >
                              {profile.name}
                            </button>
                            <p className="text-[12px] text-ink-400 truncate">
                              {profile.role}{profile.company ? `, ${profile.company}` : ""}
                            </p>
                            <p className="text-[12px] text-forest-700 mt-1">{rec.reason}</p>
                          </div>
                          <div className="flex gap-1.5 flex-shrink-0">
                            <button
                              onClick={() => setSelectedMember(profile)}
                              className="px-3 py-1.5 text-[11px] uppercase tracking-wider text-ink-500 border border-ink-200 hover:border-ink-400 transition-colors"
                            >
                              View
                            </button>
                            <button
                              onClick={() => {
                                const dmId = `dm:${[user!.email, profile.email].sort().join(":")}`;
                                setChannel(dmId);
                                // Add to DM list if not already there
                                setDmChannels((prev) => {
                                  if (prev.some((d) => d.id === dmId)) return prev;
                                  return [...prev, { id: dmId, email: profile.email, name: profile.name }];
                                });
                              }}
                              className="px-3 py-1.5 text-[11px] uppercase tracking-wider text-cream bg-forest-900 hover:bg-forest-700 transition-colors"
                            >
                              DM
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ))}

          {isBot && botLoading && (
            <div className="flex gap-3 mt-4">
              <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center bg-clay-100 text-clay-700 text-[14px]">
                ✨
              </div>
              <div className="flex-1">
                <p className="text-[13px] font-medium text-ink-900 mb-1">Myca</p>
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 bg-ink-300 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="w-2 h-2 bg-ink-300 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="w-2 h-2 bg-ink-300 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}

          {/* Regular channel messages */}
          {!isBot && !loading && messages.length === 0 && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-3xl mb-3">{channelDisplayEmoji}</p>
                <p className="text-[14px] text-ink-400">
                  {isDM ? (
                    <>Start your conversation with <span className="font-serif text-ink-600">{channelDisplayName}</span>.</>
                  ) : (
                    <>No messages in <span className="font-serif text-ink-600">{channelDisplayName}</span> yet.</>
                  )}
                </p>
                <p className="text-[13px] text-ink-300 mt-1">
                  Be the first to say something.
                </p>
              </div>
            </div>
          )}

          {!isBot && messages.map((msg, i) => {
            const isMe = msg.sender_email === user?.email;
            const prevMsg = i > 0 ? messages[i - 1] : null;
            const showDate = shouldShowDateSeparator(msg, prevMsg);
            const showName =
              showDate || i === 0 || messages[i - 1].sender_email !== msg.sender_email;
            const initial = msg.sender_name?.[0]?.toUpperCase() || "?";
            const memberProfile = memberProfiles.get(msg.sender_email);
            const hasPhoto = memberProfile?.photoUrl;

            const handleProfileClick = () => {
              if (memberProfile && !isMe) {
                setSelectedMember(memberProfile);
              }
            };

            return (
              <div key={msg.id}>
                {showDate && (
                  <div className="flex items-center gap-3 my-5">
                    <div className="flex-1 h-px bg-ink-100" />
                    <span className="text-[11px] text-ink-300 font-mono uppercase tracking-wider">
                      {formatDateLabel(msg.created_at)}
                    </span>
                    <div className="flex-1 h-px bg-ink-100" />
                  </div>
                )}
                <div
                  className={`flex gap-3 ${showName && !showDate ? "mt-4" : showDate ? "" : "mt-0.5"}`}
                >
                  {showName ? (
                    <button
                      onClick={handleProfileClick}
                      className={`w-8 h-8 flex-shrink-0 overflow-hidden ${
                        !isMe ? "cursor-pointer hover:opacity-80" : ""
                      } ${
                        hasPhoto
                          ? ""
                          : `flex items-center justify-center text-[12px] font-serif font-bold ${
                              isMe
                                ? "bg-forest-900 text-cream"
                                : "bg-clay-200 text-clay-700"
                            }`
                      }`}
                    >
                      {hasPhoto ? (
                        <img
                          src={memberProfile!.photoUrl}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        initial
                      )}
                    </button>
                  ) : (
                    <div className="w-8 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    {showName && (
                      <div className="flex items-baseline gap-2 mb-0.5">
                        <button
                          onClick={handleProfileClick}
                          className={`text-[13px] font-medium ${
                            isMe
                              ? "text-ink-900"
                              : "text-ink-700 hover:text-forest-700 cursor-pointer"
                          }`}
                        >
                          {msg.sender_name}
                        </button>
                        {memberProfile?.role && (
                          <span className="text-[10px] text-ink-300 hidden sm:inline">
                            {memberProfile.role}
                            {memberProfile.company ? `, ${memberProfile.company}` : ""}
                          </span>
                        )}
                        <span className="text-[10px] text-ink-300 font-mono">
                          {formatTime(msg.created_at)}
                        </span>
                      </div>
                    )}
                    <p className="text-[14px] text-ink-700 leading-relaxed break-words whitespace-pre-wrap">
                      {renderContent(msg.content)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="px-5 pb-5 pt-2 flex-shrink-0">
          {sendError && (
            <div className="mb-2 px-3 py-2 text-[12px] text-red-700 bg-red-50 border border-red-200 flex items-center justify-between">
              <span>{sendError}</span>
              <button onClick={() => setSendError(null)} className="text-red-400 hover:text-red-600 ml-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
          <form onSubmit={sendMessage} className="flex gap-2 items-end">
            <textarea
              ref={inputRef}
              value={input}
              onChange={handleTextareaInput}
              onKeyDown={handleKeyDown}
              placeholder={isBot ? "Ask Myca anything..." : `Message ${currentChannel?.label || channelDisplayName}...`}
              rows={1}
              className="flex-1 px-4 py-3 text-[14px] bg-white border border-ink-200 text-ink-900 placeholder-ink-300 focus:outline-none focus:border-ink-400 transition-colors resize-none overflow-hidden"
              style={{ maxHeight: 160 }}
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="px-5 py-3 text-[12px] uppercase tracking-wider font-medium text-white bg-forest-900 hover:bg-forest-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex-shrink-0"
            >
              Send
            </button>
          </form>
          <p className="text-[10px] text-ink-300 mt-1.5 ml-1">
            Press <kbd className="px-1 py-0.5 bg-ink-50 border border-ink-200 rounded text-[9px] font-mono">Enter</kbd> to send, <kbd className="px-1 py-0.5 bg-ink-50 border border-ink-200 rounded text-[9px] font-mono">Shift + Enter</kbd> for new line
          </p>
        </div>
      </div>

      {/* Member profile drawer */}
      {selectedMember && (
        <MemberDrawer
          member={selectedMember}
          onClose={() => setSelectedMember(null)}
          onConnect={(m) => {
            setSelectedMember(null);
            setOutreachTarget(m);
          }}
        />
      )}

      {/* Outreach modal */}
      {outreachTarget && (
        <OutreachModal
          member={outreachTarget}
          onClose={() => setOutreachTarget(null)}
        />
      )}
    </div>
  );
}

export default function ChatPage() {
  return (
    <MemberLogin>
      <ChatApp />
    </MemberLogin>
  );
}
