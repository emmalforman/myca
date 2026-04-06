"use client";

import { useState, useRef, useCallback } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface PhotoItem {
  url: string;
  caption?: string;
}

interface LastWeekItem {
  title: string;
  body: string;
  photos: PhotoItem[];
  photoCaption?: string;
}

interface ThisWeekEvent {
  date: string;
  title: string;
  body: string;
  linkUrl?: string;
  linkLabel?: string;
}

interface UpcomingEvent {
  date: string;
  title: string;
  body: string;
  linkUrl?: string;
  linkLabel?: string;
}

interface SpotlightMember {
  name: string;
  role: string;
  company: string;
  photo: string;
  bio: string;
  funFact?: string;
}

interface EmailData {
  monthLabel: string;
  greeting: string;
  intro: string;
  lastWeek: LastWeekItem[];
  thisWeek: ThisWeekEvent[];
  upcoming: UpcomingEvent[];
  spotlight: SpotlightMember | null;
  signoff: string;
  signoffName: string;
}

// ─── Default Data ────────────────────────────────────────────────────────────

const defaultData: EmailData = {
  monthLabel: new Date().toLocaleString("en-US", { month: "long", year: "numeric" }).toUpperCase(),
  greeting: "Hey Myca Collective,",
  intro: "Happy week! Here's what's been happening in our little Myca world.",
  lastWeek: [
    {
      title: "Event Title",
      body: "Write a recap of what happened at this event. Who was there, what made it special, and any key takeaways.",
      photos: [],
      photoCaption: "",
    },
  ],
  thisWeek: [
    {
      date: "",
      title: "Event Name",
      body: "Details about the event happening this week.",
      linkUrl: "",
      linkLabel: "RSVP",
    },
  ],
  upcoming: [
    {
      date: "",
      title: "Upcoming Event",
      body: "Details about what's coming up soon.",
      linkUrl: "",
      linkLabel: "LEARN MORE",
    },
  ],
  spotlight: {
    name: "Member Name",
    role: "Founder",
    company: "Company Name",
    photo: "",
    bio: "Tell us about this member - what they do, what they're working on, and why they're awesome.",
    funFact: "",
  },
  signoff: "As always, reply if anything resonates.",
  signoffName: "xo, Emma",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getMonthLabel() {
  return new Date()
    .toLocaleString("en-US", { month: "long", year: "numeric" })
    .toUpperCase();
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function WeeklyEmailBuilder() {
  const [data, setData] = useState<EmailData>({ ...defaultData });
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");
  const [copied, setCopied] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null!);


  // ── Update helpers ──

  const update = useCallback((field: keyof EmailData, value: unknown) => {
    setData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const updateLastWeekItem = useCallback(
    (index: number, field: keyof LastWeekItem, value: unknown) => {
      setData((prev) => {
        const items = [...prev.lastWeek];
        items[index] = { ...items[index], [field]: value };
        return { ...prev, lastWeek: items };
      });
    },
    []
  );

  const updateThisWeekEvent = useCallback(
    (index: number, field: keyof ThisWeekEvent, value: unknown) => {
      setData((prev) => {
        const items = [...prev.thisWeek];
        items[index] = { ...items[index], [field]: value };
        return { ...prev, thisWeek: items };
      });
    },
    []
  );

  const updateUpcomingEvent = useCallback(
    (index: number, field: keyof UpcomingEvent, value: unknown) => {
      setData((prev) => {
        const items = [...prev.upcoming];
        items[index] = { ...items[index], [field]: value };
        return { ...prev, upcoming: items };
      });
    },
    []
  );

  const updateSpotlight = useCallback(
    (field: keyof SpotlightMember, value: string) => {
      setData((prev) => ({
        ...prev,
        spotlight: prev.spotlight
          ? { ...prev.spotlight, [field]: value }
          : null,
      }));
    },
    []
  );

  // ── Photo handling ──

  const addPhotoToLastWeek = useCallback((itemIndex: number) => {
    const url = prompt("Paste the image URL:");
    if (!url) return;
    setData((prev) => {
      const items = [...prev.lastWeek];
      items[itemIndex] = {
        ...items[itemIndex],
        photos: [...items[itemIndex].photos, { url }],
      };
      return { ...prev, lastWeek: items };
    });
  }, []);

  const removePhotoFromLastWeek = useCallback(
    (itemIndex: number, photoIndex: number) => {
      setData((prev) => {
        const items = [...prev.lastWeek];
        items[itemIndex] = {
          ...items[itemIndex],
          photos: items[itemIndex].photos.filter((_, i) => i !== photoIndex),
        };
        return { ...prev, lastWeek: items };
      });
    },
    []
  );

  // ── Add / remove sections ──

  const addLastWeekItem = useCallback(() => {
    setData((prev) => ({
      ...prev,
      lastWeek: [
        ...prev.lastWeek,
        { title: "Event Title", body: "Recap here...", photos: [], photoCaption: "" },
      ],
    }));
  }, []);

  const removeLastWeekItem = useCallback((index: number) => {
    setData((prev) => ({
      ...prev,
      lastWeek: prev.lastWeek.filter((_, i) => i !== index),
    }));
  }, []);

  const addThisWeekEvent = useCallback(() => {
    setData((prev) => ({
      ...prev,
      thisWeek: [
        ...prev.thisWeek,
        { date: "", title: "Event Name", body: "Details...", linkUrl: "", linkLabel: "RSVP" },
      ],
    }));
  }, []);

  const removeThisWeekEvent = useCallback((index: number) => {
    setData((prev) => ({
      ...prev,
      thisWeek: prev.thisWeek.filter((_, i) => i !== index),
    }));
  }, []);

  const addUpcomingEvent = useCallback(() => {
    setData((prev) => ({
      ...prev,
      upcoming: [
        ...prev.upcoming,
        { date: "", title: "Event Name", body: "Details...", linkUrl: "", linkLabel: "LEARN MORE" },
      ],
    }));
  }, []);

  const removeUpcomingEvent = useCallback((index: number) => {
    setData((prev) => ({
      ...prev,
      upcoming: prev.upcoming.filter((_, i) => i !== index),
    }));
  }, []);

  const toggleSpotlight = useCallback(() => {
    setData((prev) => ({
      ...prev,
      spotlight: prev.spotlight
        ? null
        : { name: "Member Name", role: "Founder", company: "Company", photo: "", bio: "Bio here...", funFact: "" },
    }));
  }, []);

  // ── Copy for Gmail ──

  const copyForGmail = useCallback(() => {
    if (!previewRef.current) return;
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(previewRef.current);
    selection?.removeAllRanges();
    selection?.addRange(range);
    document.execCommand("copy");
    selection?.removeAllRanges();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  const resetAll = useCallback(() => {
    if (confirm("Reset all content to defaults?")) {
      setData({ ...defaultData, monthLabel: getMonthLabel() });
    }
  }, []);

  // ── Render ──

  return (
    <div className="min-h-screen bg-ink-100">
      {/* ── Toolbar ── */}
      <div className="sticky top-14 z-40 bg-white border-b border-ink-200 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-3 flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveTab("edit")}
            className={`px-4 py-2 text-[11px] uppercase tracking-[0.15em] font-mono border transition-colors ${
              activeTab === "edit"
                ? "bg-moss-600 text-white border-moss-600"
                : "bg-white text-ink-600 border-ink-300 hover:border-ink-400"
            }`}
          >
            Edit
          </button>
          <button
            onClick={() => setActiveTab("preview")}
            className={`px-4 py-2 text-[11px] uppercase tracking-[0.15em] font-mono border transition-colors ${
              activeTab === "preview"
                ? "bg-moss-600 text-white border-moss-600"
                : "bg-white text-ink-600 border-ink-300 hover:border-ink-400"
            }`}
          >
            Preview
          </button>

          <div className="flex-1" />

          <button
            onClick={resetAll}
            className="px-4 py-2 text-[11px] uppercase tracking-[0.15em] font-mono border border-ink-300 text-ink-500 hover:border-ink-400 transition-colors"
          >
            Reset
          </button>
          <button
            onClick={() => {
              setActiveTab("preview");
              setTimeout(copyForGmail, 100);
            }}
            className="px-4 py-2 text-[11px] uppercase tracking-[0.15em] font-mono bg-moss-700 text-white hover:bg-moss-800 transition-colors"
          >
            {copied ? "Copied!" : "Copy for Gmail \u2192"}
          </button>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="max-w-3xl mx-auto px-4 py-8">
        {activeTab === "edit" ? (
          <EditView
            data={data}
            update={update}
            updateLastWeekItem={updateLastWeekItem}
            updateThisWeekEvent={updateThisWeekEvent}
            updateUpcomingEvent={updateUpcomingEvent}
            updateSpotlight={updateSpotlight}
            addPhotoToLastWeek={addPhotoToLastWeek}
            removePhotoFromLastWeek={removePhotoFromLastWeek}
            addLastWeekItem={addLastWeekItem}
            removeLastWeekItem={removeLastWeekItem}
            addThisWeekEvent={addThisWeekEvent}
            removeThisWeekEvent={removeThisWeekEvent}
            addUpcomingEvent={addUpcomingEvent}
            removeUpcomingEvent={removeUpcomingEvent}
            toggleSpotlight={toggleSpotlight}
          />
        ) : (
          <EmailPreview data={data} previewRef={previewRef} />
        )}
      </div>
    </div>
  );
}

// ─── Edit View ───────────────────────────────────────────────────────────────

function EditView({
  data,
  update,
  updateLastWeekItem,
  updateThisWeekEvent,
  updateUpcomingEvent,
  updateSpotlight,
  addPhotoToLastWeek,
  removePhotoFromLastWeek,
  addLastWeekItem,
  removeLastWeekItem,
  addThisWeekEvent,
  removeThisWeekEvent,
  addUpcomingEvent,
  removeUpcomingEvent,
  toggleSpotlight,
}: {
  data: EmailData;
  update: (field: keyof EmailData, value: unknown) => void;
  updateLastWeekItem: (i: number, f: keyof LastWeekItem, v: unknown) => void;
  updateThisWeekEvent: (i: number, f: keyof ThisWeekEvent, v: unknown) => void;
  updateUpcomingEvent: (i: number, f: keyof UpcomingEvent, v: unknown) => void;
  updateSpotlight: (f: keyof SpotlightMember, v: string) => void;
  addPhotoToLastWeek: (i: number) => void;
  removePhotoFromLastWeek: (itemI: number, photoI: number) => void;
  addLastWeekItem: () => void;
  removeLastWeekItem: (i: number) => void;
  addThisWeekEvent: () => void;
  removeThisWeekEvent: (i: number) => void;
  addUpcomingEvent: () => void;
  removeUpcomingEvent: (i: number) => void;
  toggleSpotlight: () => void;
}) {
  return (
    <div className="space-y-8">
      {/* ── Quick Hi ── */}
      <SectionCard label="Quick Hi">
        <Field label="Month Label">
          <input
            value={data.monthLabel}
            onChange={(e) => update("monthLabel", e.target.value)}
            className="w-full px-3 py-2 border border-ink-200 rounded text-sm"
            placeholder="APRIL 2025"
          />
        </Field>
        <Field label="Greeting">
          <input
            value={data.greeting}
            onChange={(e) => update("greeting", e.target.value)}
            className="w-full px-3 py-2 border border-ink-200 rounded text-sm"
          />
        </Field>
        <Field label="Intro">
          <textarea
            value={data.intro}
            onChange={(e) => update("intro", e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-ink-200 rounded text-sm"
          />
        </Field>
      </SectionCard>

      {/* ── Last Week ── */}
      <SectionCard
        label="Last Week"
        onAdd={addLastWeekItem}
        addLabel="+ Add Recap"
      >
        {data.lastWeek.map((item, i) => (
          <div
            key={i}
            className="border border-ink-200 rounded-lg p-4 space-y-3 bg-white"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-ink-400 uppercase">
                Recap {i + 1}
              </span>
              {data.lastWeek.length > 1 && (
                <button
                  onClick={() => removeLastWeekItem(i)}
                  className="text-xs text-rust-500 hover:text-rust-700"
                >
                  Remove
                </button>
              )}
            </div>
            <Field label="Title">
              <input
                value={item.title}
                onChange={(e) => updateLastWeekItem(i, "title", e.target.value)}
                className="w-full px-3 py-2 border border-ink-200 rounded text-sm"
              />
            </Field>
            <Field label="Description">
              <textarea
                value={item.body}
                onChange={(e) => updateLastWeekItem(i, "body", e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-ink-200 rounded text-sm"
              />
            </Field>

            {/* Photos */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-mono text-ink-500 uppercase tracking-wider">
                  Photos
                </label>
                <button
                  onClick={() => addPhotoToLastWeek(i)}
                  className="text-xs text-moss-600 hover:text-moss-800 font-mono"
                >
                  + Add Photo
                </button>
              </div>
              {item.photos.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {item.photos.map((photo, pi) => (
                    <div key={pi} className="relative group w-24 h-24">
                      <img
                        src={photo.url}
                        alt=""
                        className="w-24 h-24 object-cover rounded"
                      />
                      <button
                        onClick={() => removePhotoFromLastWeek(i, pi)}
                        className="absolute top-0.5 right-0.5 bg-red-600 text-white rounded-full w-5 h-5 text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                      >
                        x
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <Field label="Photo Caption (optional)">
              <input
                value={item.photoCaption || ""}
                onChange={(e) =>
                  updateLastWeekItem(i, "photoCaption", e.target.value)
                }
                className="w-full px-3 py-2 border border-ink-200 rounded text-sm"
                placeholder="e.g. Wine, herbs, and snacks all based around TCM"
              />
            </Field>
          </div>
        ))}
      </SectionCard>

      {/* ── This Week ── */}
      <SectionCard
        label="This Week"
        onAdd={addThisWeekEvent}
        addLabel="+ Add Event"
      >
        {data.thisWeek.map((evt, i) => (
          <div
            key={i}
            className="border border-ink-200 rounded-lg p-4 space-y-3 bg-white"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-ink-400 uppercase">
                Event {i + 1}
              </span>
              {data.thisWeek.length > 1 && (
                <button
                  onClick={() => removeThisWeekEvent(i)}
                  className="text-xs text-rust-500 hover:text-rust-700"
                >
                  Remove
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Date">
                <input
                  value={evt.date}
                  onChange={(e) =>
                    updateThisWeekEvent(i, "date", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-ink-200 rounded text-sm"
                  placeholder="4/5"
                />
              </Field>
              <Field label="Title">
                <input
                  value={evt.title}
                  onChange={(e) =>
                    updateThisWeekEvent(i, "title", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-ink-200 rounded text-sm"
                />
              </Field>
            </div>
            <Field label="Description">
              <textarea
                value={evt.body}
                onChange={(e) =>
                  updateThisWeekEvent(i, "body", e.target.value)
                }
                rows={2}
                className="w-full px-3 py-2 border border-ink-200 rounded text-sm"
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Link URL (optional)">
                <input
                  value={evt.linkUrl || ""}
                  onChange={(e) =>
                    updateThisWeekEvent(i, "linkUrl", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-ink-200 rounded text-sm"
                  placeholder="https://..."
                />
              </Field>
              <Field label="Button Label">
                <input
                  value={evt.linkLabel || ""}
                  onChange={(e) =>
                    updateThisWeekEvent(i, "linkLabel", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-ink-200 rounded text-sm"
                  placeholder="RSVP"
                />
              </Field>
            </div>
          </div>
        ))}
      </SectionCard>

      {/* ── Upcoming Events ── */}
      <SectionCard
        label="Coming Up"
        onAdd={addUpcomingEvent}
        addLabel="+ Add Event"
      >
        {data.upcoming.map((evt, i) => (
          <div
            key={i}
            className="border border-ink-200 rounded-lg p-4 space-y-3 bg-white"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-ink-400 uppercase">
                Upcoming {i + 1}
              </span>
              {data.upcoming.length > 1 && (
                <button
                  onClick={() => removeUpcomingEvent(i)}
                  className="text-xs text-rust-500 hover:text-rust-700"
                >
                  Remove
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Date">
                <input
                  value={evt.date}
                  onChange={(e) =>
                    updateUpcomingEvent(i, "date", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-ink-200 rounded text-sm"
                  placeholder="4/29"
                />
              </Field>
              <Field label="Title">
                <input
                  value={evt.title}
                  onChange={(e) =>
                    updateUpcomingEvent(i, "title", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-ink-200 rounded text-sm"
                />
              </Field>
            </div>
            <Field label="Description">
              <textarea
                value={evt.body}
                onChange={(e) =>
                  updateUpcomingEvent(i, "body", e.target.value)
                }
                rows={2}
                className="w-full px-3 py-2 border border-ink-200 rounded text-sm"
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Link URL (optional)">
                <input
                  value={evt.linkUrl || ""}
                  onChange={(e) =>
                    updateUpcomingEvent(i, "linkUrl", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-ink-200 rounded text-sm"
                />
              </Field>
              <Field label="Button Label">
                <input
                  value={evt.linkLabel || ""}
                  onChange={(e) =>
                    updateUpcomingEvent(i, "linkLabel", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-ink-200 rounded text-sm"
                />
              </Field>
            </div>
          </div>
        ))}
      </SectionCard>

      {/* ── Member Spotlight ── */}
      <SectionCard
        label="Member Spotlight"
        toggle
        toggleActive={!!data.spotlight}
        onToggle={toggleSpotlight}
      >
        {data.spotlight && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Name">
                <input
                  value={data.spotlight.name}
                  onChange={(e) => updateSpotlight("name", e.target.value)}
                  className="w-full px-3 py-2 border border-ink-200 rounded text-sm"
                />
              </Field>
              <Field label="Company">
                <input
                  value={data.spotlight.company}
                  onChange={(e) => updateSpotlight("company", e.target.value)}
                  className="w-full px-3 py-2 border border-ink-200 rounded text-sm"
                />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Role">
                <input
                  value={data.spotlight.role}
                  onChange={(e) => updateSpotlight("role", e.target.value)}
                  className="w-full px-3 py-2 border border-ink-200 rounded text-sm"
                />
              </Field>
              <Field label="Photo URL">
                <input
                  value={data.spotlight.photo}
                  onChange={(e) => updateSpotlight("photo", e.target.value)}
                  className="w-full px-3 py-2 border border-ink-200 rounded text-sm"
                  placeholder="https://..."
                />
              </Field>
            </div>
            <Field label="Bio">
              <textarea
                value={data.spotlight.bio}
                onChange={(e) => updateSpotlight("bio", e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-ink-200 rounded text-sm"
              />
            </Field>
            <Field label="Fun Fact (optional)">
              <input
                value={data.spotlight.funFact || ""}
                onChange={(e) => updateSpotlight("funFact", e.target.value)}
                className="w-full px-3 py-2 border border-ink-200 rounded text-sm"
              />
            </Field>
          </div>
        )}
      </SectionCard>

      {/* ── Sign-off ── */}
      <SectionCard label="Sign-off">
        <Field label="Closing line">
          <input
            value={data.signoff}
            onChange={(e) => update("signoff", e.target.value)}
            className="w-full px-3 py-2 border border-ink-200 rounded text-sm"
          />
        </Field>
        <Field label="Name">
          <input
            value={data.signoffName}
            onChange={(e) => update("signoffName", e.target.value)}
            className="w-full px-3 py-2 border border-ink-200 rounded text-sm"
          />
        </Field>
      </SectionCard>
    </div>
  );
}

// ─── Email Preview ───────────────────────────────────────────────────────────

function EmailPreview({
  data,
  previewRef,
}: {
  data: EmailData;
  previewRef: React.RefObject<HTMLDivElement>;
}) {
  return (
    <div
      ref={previewRef}
      style={{
        maxWidth: 640,
        margin: "0 auto",
        fontFamily: "Georgia, Cambria, 'Times New Roman', serif",
        color: "#1C1917",
        backgroundColor: "#FAF7F2",
      }}
    >
      {/* Header bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          padding: "12px 24px",
          fontSize: 11,
          fontFamily: "ui-monospace, SFMono-Regular, monospace",
          letterSpacing: "0.15em",
          textTransform: "uppercase" as const,
          color: "#57534E",
        }}
      >
        <span>Member Update</span>
        <span>{data.monthLabel}</span>
      </div>

      {/* Banner */}
      <div
        style={{
          background: "linear-gradient(135deg, #3B4D31, #4A613D)",
          padding: "40px 24px",
          textAlign: "center" as const,
        }}
      >
        <h1
          style={{
            fontSize: 32,
            color: "#FAF7F2",
            margin: 0,
            fontWeight: 400,
            letterSpacing: "0.08em",
          }}
        >
          MYCA{" "}
          <em style={{ fontStyle: "italic", color: "#C2D1B8" }}>COLLECTIVE</em>
        </h1>
        <p
          style={{
            fontSize: 10,
            color: "#9DB48E",
            margin: "8px 0 0",
            letterSpacing: "0.2em",
            fontFamily: "ui-monospace, SFMono-Regular, monospace",
            textTransform: "uppercase" as const,
          }}
        >
          Women Building Across Food & Agriculture
        </p>
      </div>

      {/* Body */}
      <div style={{ padding: "32px 24px" }}>
        {/* ── Quick Hi ── */}
        <p style={{ fontSize: 18, marginBottom: 16 }}>{data.greeting}</p>
        <p style={{ fontSize: 15, lineHeight: 1.7, marginBottom: 32, whiteSpace: "pre-wrap" }}>
          {data.intro}
        </p>

        {/* ── Last Week ── */}
        {data.lastWeek.length > 0 && (
          <>
            <SectionBadge label="Last Week" color="#4A613D" />
            {data.lastWeek.map((item, i) => (
              <div
                key={i}
                style={{
                  border: "1px solid #E8DFD0",
                  borderRadius: 8,
                  padding: 20,
                  marginBottom: 16,
                  backgroundColor: "#FFFFFF",
                }}
              >
                <h3 style={{ fontSize: 17, fontWeight: 700, margin: "0 0 8px", fontFamily: "system-ui, sans-serif" }}>
                  {item.title}
                </h3>
                <p style={{ fontSize: 14, lineHeight: 1.7, margin: "0 0 16px", color: "#44403C" }}>
                  {item.body}
                </p>
                {item.photos.length > 0 && (
                  <div style={{ display: "flex", gap: 8, marginBottom: item.photoCaption ? 8 : 0 }}>
                    {item.photos.map((photo, pi) => (
                      <img
                        key={pi}
                        src={photo.url}
                        alt=""
                        style={{
                          width: item.photos.length === 1 ? "100%" : `${100 / Math.min(item.photos.length, 3)}%`,
                          height: 160,
                          objectFit: "cover" as const,
                          borderRadius: 4,
                        }}
                      />
                    ))}
                  </div>
                )}
                {item.photoCaption && (
                  <p
                    style={{
                      fontSize: 11,
                      color: "#78716C",
                      fontFamily: "ui-monospace, SFMono-Regular, monospace",
                      margin: 0,
                    }}
                  >
                    {item.photoCaption}
                  </p>
                )}
              </div>
            ))}
          </>
        )}

        {/* ── This Week ── */}
        {data.thisWeek.length > 0 && (
          <>
            <div style={{ marginTop: 24 }} />
            <SectionBadge label="Coming Up" color="#4A613D" />
            <div
              style={{
                border: "1px solid #E8DFD0",
                borderRadius: 8,
                padding: 20,
                marginBottom: 16,
                backgroundColor: "#FFFFFF",
              }}
            >
              <p
                style={{
                  fontSize: 10,
                  fontFamily: "ui-monospace, SFMono-Regular, monospace",
                  letterSpacing: "0.15em",
                  textTransform: "uppercase" as const,
                  color: "#78716C",
                  margin: "0 0 4px",
                }}
              >
                Event
              </p>
              <h3 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 4px", fontFamily: "system-ui, sans-serif" }}>
                This Week
              </h3>
              <p style={{ fontSize: 12, color: "#A8A29E", fontFamily: "ui-monospace, monospace", margin: "0 0 16px" }}>
                Events happening this week
              </p>
              {data.thisWeek.map((evt, i) => (
                <div key={i} style={{ marginBottom: i < data.thisWeek.length - 1 ? 16 : 0 }}>
                  <p style={{ fontSize: 14, lineHeight: 1.7, margin: 0, color: "#44403C" }}>
                    {evt.date && <strong>{evt.date} - </strong>}
                    {evt.title && <strong style={{ textDecoration: "underline" }}>{evt.title}:</strong>}{" "}
                    {evt.body}
                  </p>
                </div>
              ))}
              {data.thisWeek.some((e) => e.linkUrl) && (
                <div style={{ marginTop: 16 }}>
                  {data.thisWeek
                    .filter((e) => e.linkUrl)
                    .map((evt, i) => (
                      <a
                        key={i}
                        href={evt.linkUrl}
                        style={{
                          display: "inline-block",
                          padding: "10px 20px",
                          backgroundColor: "#1C1917",
                          color: "#FFFFFF",
                          fontSize: 11,
                          fontFamily: "ui-monospace, SFMono-Regular, monospace",
                          letterSpacing: "0.15em",
                          textDecoration: "none",
                          textTransform: "uppercase" as const,
                          marginRight: 8,
                        }}
                      >
                        {evt.linkLabel || "RSVP"} &rarr;
                      </a>
                    ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* ── Upcoming Events ── */}
        {data.upcoming.length > 0 && (
          <>
            {data.upcoming.map((evt, i) => (
              <div
                key={i}
                style={{
                  border: "1px solid #E8DFD0",
                  borderRadius: 8,
                  padding: 20,
                  marginBottom: 16,
                  backgroundColor: "#FFFFFF",
                }}
              >
                <p
                  style={{
                    fontSize: 10,
                    fontFamily: "ui-monospace, SFMono-Regular, monospace",
                    letterSpacing: "0.15em",
                    textTransform: "uppercase" as const,
                    color: "#78716C",
                    margin: "0 0 4px",
                  }}
                >
                  Opportunity
                </p>
                <h3 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 4px", fontFamily: "system-ui, sans-serif" }}>
                  {evt.title}
                </h3>
                <p style={{ fontSize: 12, color: "#A8A29E", fontFamily: "ui-monospace, monospace", margin: "0 0 12px" }}>
                  Events coming soon
                </p>
                <p style={{ fontSize: 14, lineHeight: 1.7, margin: "0 0 16px", color: "#44403C" }}>
                  {evt.date && <strong>{evt.date} - </strong>}
                  {evt.body}
                </p>
                {evt.linkUrl && (
                  <a
                    href={evt.linkUrl}
                    style={{
                      display: "inline-block",
                      padding: "10px 20px",
                      border: "1px solid #1C1917",
                      color: "#1C1917",
                      fontSize: 11,
                      fontFamily: "ui-monospace, SFMono-Regular, monospace",
                      letterSpacing: "0.15em",
                      textDecoration: "none",
                      textTransform: "uppercase" as const,
                    }}
                  >
                    {evt.linkLabel || "LEARN MORE"} &rarr;
                  </a>
                )}
              </div>
            ))}
          </>
        )}

        {/* ── Member Spotlight ── */}
        {data.spotlight && (
          <>
            <div style={{ marginTop: 24 }} />
            <SectionBadge label="Member Spotlight" color="#8B7049" />
            <div
              style={{
                border: "1px solid #E8DFD0",
                borderRadius: 8,
                padding: 20,
                marginBottom: 16,
                backgroundColor: "#FFFFFF",
              }}
            >
              <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                {data.spotlight.photo && (
                  <img
                    src={data.spotlight.photo}
                    alt={data.spotlight.name}
                    style={{
                      width: 80,
                      height: 80,
                      borderRadius: "50%",
                      objectFit: "cover" as const,
                    }}
                  />
                )}
                <div>
                  <h3 style={{ fontSize: 17, fontWeight: 700, margin: "0 0 2px", fontFamily: "system-ui, sans-serif" }}>
                    {data.spotlight.name}
                  </h3>
                  <p style={{ fontSize: 13, color: "#78716C", margin: "0 0 8px" }}>
                    {data.spotlight.role} at {data.spotlight.company}
                  </p>
                </div>
              </div>
              <p style={{ fontSize: 14, lineHeight: 1.7, marginTop: 12, color: "#44403C" }}>
                {data.spotlight.bio}
              </p>
              {data.spotlight.funFact && (
                <p style={{ fontSize: 13, marginTop: 8, color: "#8B7049", fontStyle: "italic" }}>
                  Fun fact: {data.spotlight.funFact}
                </p>
              )}
            </div>
          </>
        )}

        {/* ── Sign-off ── */}
        <div
          style={{
            borderTop: "1px solid #E8DFD0",
            marginTop: 32,
            paddingTop: 24,
          }}
        >
          <p style={{ fontSize: 15, fontStyle: "italic", marginBottom: 8 }}>
            {data.signoff}
          </p>
          <p style={{ fontSize: 15, fontStyle: "italic" }}>{data.signoffName}</p>
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          backgroundColor: "#292524",
          padding: "16px 24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <p
            style={{
              fontSize: 10,
              color: "#A8A29E",
              fontFamily: "ui-monospace, SFMono-Regular, monospace",
              letterSpacing: "0.12em",
              textTransform: "uppercase" as const,
              margin: "0 0 2px",
            }}
          >
            Myca Collective
          </p>
          <p
            style={{
              fontSize: 10,
              color: "#78716C",
              fontFamily: "ui-monospace, SFMono-Regular, monospace",
              letterSpacing: "0.12em",
              textTransform: "uppercase" as const,
              margin: 0,
            }}
          >
            300+ Women in Food & Ag
          </p>
        </div>
        <div style={{ textAlign: "right" as const }}>
          <a
            href="#"
            style={{
              fontSize: 10,
              color: "#A8A29E",
              fontFamily: "ui-monospace, SFMono-Regular, monospace",
              textDecoration: "underline",
              display: "block",
              marginBottom: 2,
            }}
          >
            Unsubscribe
          </a>
          <a
            href="#"
            style={{
              fontSize: 10,
              color: "#A8A29E",
              fontFamily: "ui-monospace, SFMono-Regular, monospace",
              textDecoration: "underline",
              display: "block",
            }}
          >
            View in browser
          </a>
        </div>
      </div>
    </div>
  );
}

// ─── Shared UI Components ────────────────────────────────────────────────────

function SectionCard({
  label,
  children,
  onAdd,
  addLabel,
  toggle,
  toggleActive,
  onToggle,
}: {
  label: string;
  children: React.ReactNode;
  onAdd?: () => void;
  addLabel?: string;
  toggle?: boolean;
  toggleActive?: boolean;
  onToggle?: () => void;
}) {
  return (
    <div className="bg-white rounded-xl border border-ink-200 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 bg-parchment border-b border-ink-200">
        <h2 className="text-[11px] uppercase tracking-[0.15em] font-mono text-ink-600">
          {label}
        </h2>
        <div className="flex gap-2">
          {toggle && (
            <button
              onClick={onToggle}
              className={`text-xs font-mono px-3 py-1 rounded ${
                toggleActive
                  ? "bg-moss-100 text-moss-700"
                  : "bg-ink-100 text-ink-400"
              }`}
            >
              {toggleActive ? "On" : "Off"}
            </button>
          )}
          {onAdd && (
            <button
              onClick={onAdd}
              className="text-xs font-mono text-moss-600 hover:text-moss-800"
            >
              {addLabel || "+ Add"}
            </button>
          )}
        </div>
      </div>
      <div className="p-5 space-y-4">{children}</div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-mono text-ink-500 uppercase tracking-wider mb-1">
        {label}
      </label>
      {children}
    </div>
  );
}

function SectionBadge({ label, color }: { label: string; color: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", marginBottom: 16, gap: 12 }}>
      <span
        style={{
          display: "inline-block",
          padding: "4px 12px",
          backgroundColor: color,
          color: "#FFFFFF",
          fontSize: 10,
          fontFamily: "ui-monospace, SFMono-Regular, monospace",
          letterSpacing: "0.15em",
          textTransform: "uppercase" as const,
          borderRadius: 2,
        }}
      >
        {label}
      </span>
      <div style={{ flex: 1, height: 1, backgroundColor: "#E8DFD0" }} />
    </div>
  );
}
