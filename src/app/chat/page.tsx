"use client";

import { useState, useEffect, useRef } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import MemberLogin from "@/components/MemberLogin";
import MemberDrawer from "@/components/MemberDrawer";
import OutreachModal from "@/components/OutreachModal";
import { Member } from "@/lib/types";

const CHANNELS = [
  { id: "general", label: "General", emoji: "💬" },
  { id: "nyc", label: "New York", emoji: "🗽" },
  { id: "sf", label: "San Francisco", emoji: "🌉" },
  { id: "la", label: "Los Angeles", emoji: "🎬" },
  { id: "london", label: "London", emoji: "🇬🇧" },
  { id: "chicago", label: "Chicago", emoji: "🍕" },
  { id: "founders", label: "Founders", emoji: "🚀" },
  { id: "investors", label: "Investors", emoji: "💰" },
  { id: "operators", label: "Operators", emoji: "⚙️" },
  { id: "asks-offers", label: "Asks & Offers", emoji: "🤝" },
];

interface Message {
  id: string;
  channel: string;
  sender_email: string;
  sender_name: string;
  content: string;
  created_at: string;
}

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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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

        // Load DM channels for this user
        const { data: dmMessages } = await supabase
          .from("messages")
          .select("channel")
          .like("channel", `dm:%${session.user.email}%`)
          .limit(50);

        if (dmMessages) {
          const uniqueChannels = [...new Set(dmMessages.map((m: any) => m.channel))];
          const dms = uniqueChannels.map((ch: string) => {
            // Extract the other person's email from "dm:email1:email2"
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

  // Load messages for current channel
  useEffect(() => {
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

    const supabase = getSupabaseBrowser();
    const { error } = await supabase.from("messages").insert({
      channel,
      sender_email: user.email,
      sender_name: user.name,
      content: input.trim(),
    });

    if (!error) {
      setInput("");
      inputRef.current?.focus();
    }
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

  const currentChannel = CHANNELS.find((c) => c.id === channel);
  const isDM = channel.startsWith("dm:");
  const dmRecipient = isDM ? dmChannels.find((d) => d.id === channel) : null;
  const dmProfile = dmRecipient ? memberProfiles.get(dmRecipient.email) : null;
  const channelDisplayName = isDM
    ? dmRecipient?.name || "Direct Message"
    : currentChannel?.label;
  const channelDisplayEmoji = isDM ? "✉️" : currentChannel?.emoji;

  return (
    <div className="h-[calc(100vh-57px)] flex bg-ivory">
      {/* Sidebar - Desktop */}
      <div className="hidden md:flex w-64 flex-col bg-forest-950 flex-shrink-0">
        <div className="p-4 border-b border-ink-800">
          <p className="text-[11px] uppercase tracking-[0.2em] text-ink-500 font-mono">
            Channels
          </p>
        </div>
        <div className="flex-1 overflow-y-auto py-2">
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
          {loading && (
            <div className="flex items-center justify-center h-full">
              <div className="w-6 h-6 border border-ink-200 border-t-ink-500 rounded-full animate-spin" />
            </div>
          )}

          {!loading && messages.length === 0 && (
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

          {messages.map((msg, i) => {
            const isMe = msg.sender_email === user?.email;
            const showName =
              i === 0 || messages[i - 1].sender_email !== msg.sender_email;
            const initial = msg.sender_name?.[0]?.toUpperCase() || "?";
            const memberProfile = memberProfiles.get(msg.sender_email);
            const hasPhoto = memberProfile?.photoUrl;

            const handleProfileClick = () => {
              if (memberProfile && !isMe) {
                setSelectedMember(memberProfile);
              }
            };

            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${showName ? "mt-4" : "mt-0.5"}`}
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
                  <p className="text-[14px] text-ink-700 leading-relaxed break-words">
                    {msg.content}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="px-5 pb-5 pt-2 flex-shrink-0">
          <form onSubmit={sendMessage} className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Message ${currentChannel?.label}...`}
              className="flex-1 px-4 py-3 text-[14px] bg-white border border-ink-200 text-ink-900 placeholder-ink-300 focus:outline-none focus:border-ink-400 transition-colors"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="px-5 py-3 text-[12px] uppercase tracking-wider font-medium text-white bg-forest-900 hover:bg-forest-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex-shrink-0"
            >
              Send
            </button>
          </form>
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
