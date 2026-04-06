"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const SECTIONS = [
  {
    label: "Hero",
    fields: [
      { key: "hero_label", label: "Top label", type: "text" },
      { key: "hero_title", label: "Headline", type: "textarea" },
      { key: "hero_subtitle", label: "Description", type: "textarea" },
      { key: "hero_cta_1", label: "Primary button", type: "text" },
      { key: "hero_cta_2", label: "Secondary button", type: "text" },
    ],
  },
  {
    label: "Metrics",
    fields: [
      { key: "stat_1_value", label: "Stat 1 value", type: "text" },
      { key: "stat_1_label", label: "Stat 1 label", type: "text" },
      { key: "stat_2_value", label: "Stat 2 value", type: "text" },
      { key: "stat_2_label", label: "Stat 2 label", type: "text" },
      { key: "stat_3_value", label: "Stat 3 value", type: "text" },
      { key: "stat_3_label", label: "Stat 3 label", type: "text" },
      { key: "stat_4_value", label: "Stat 4 value", type: "text" },
      { key: "stat_4_label", label: "Stat 4 label", type: "text" },
    ],
  },
  {
    label: "What We Do",
    fields: [
      { key: "section_what_label", label: "Section label", type: "text" },
      { key: "section_what_title", label: "Section title", type: "text" },
      { key: "card_1_title", label: "Card 1 title", type: "text" },
      { key: "card_1_desc", label: "Card 1 description", type: "textarea" },
      { key: "card_2_title", label: "Card 2 title", type: "text" },
      { key: "card_2_desc", label: "Card 2 description", type: "textarea" },
      { key: "card_3_title", label: "Card 3 title", type: "text" },
      { key: "card_3_desc", label: "Card 3 description", type: "textarea" },
    ],
  },
  {
    label: "Cities",
    fields: [
      { key: "cities_label", label: "Section label", type: "text" },
      { key: "cities_title", label: "Section title", type: "text" },
    ],
  },
  {
    label: "Members",
    fields: [
      { key: "members_label", label: "Section label", type: "text" },
      { key: "members_title", label: "Section title", type: "text" },
    ],
  },
  {
    label: "Call to Action",
    fields: [
      { key: "cta_label", label: "Section label", type: "text" },
      { key: "cta_title", label: "Headline", type: "text" },
      { key: "cta_subtitle", label: "Description", type: "textarea" },
      { key: "cta_button", label: "Button text", type: "text" },
    ],
  },
  {
    label: "About",
    fields: [
      { key: "about_text", label: "About paragraph", type: "textarea" },
    ],
  },
];

export default function ContentEditor() {
  const [adminKey, setAdminKey] = useState("");
  const [authed, setAuthed] = useState(false);
  const [content, setContent] = useState<Record<string, string>>({});
  const [original, setOriginal] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const fetchContent = async () => {
    const res = await fetch("/api/content");
    const data = await res.json();
    if (data.content) {
      setContent(data.content);
      setOriginal(data.content);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthed(true);
    fetchContent();
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);

    // Only send changed values
    const changes: Record<string, string> = {};
    for (const [key, value] of Object.entries(content)) {
      if (value !== original[key]) {
        changes[key] = value;
      }
    }

    if (Object.keys(changes).length === 0) {
      setSaving(false);
      setSaved(true);
      return;
    }

    const res = await fetch(`/api/content?key=${encodeURIComponent(adminKey)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(changes),
    });

    if (res.ok) {
      setOriginal({ ...content });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
    setSaving(false);
  };

  const hasChanges = JSON.stringify(content) !== JSON.stringify(original);

  if (!authed) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-6">
        <div className="w-full max-w-sm text-center">
          <p className="text-[11px] uppercase tracking-[0.3em] text-clay-500 font-mono mb-4">
            Admin
          </p>
          <h1 className="text-3xl font-serif text-ink-900 mb-8">
            Content Editor
          </h1>
          <form onSubmit={handleLogin}>
            <input
              type="password"
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
              placeholder="Admin key"
              autoFocus
              className="w-full px-4 py-3 text-center text-[14px] border border-ink-200 bg-white text-ink-900 placeholder-ink-300 focus:outline-none focus:border-forest-400 mb-4"
            />
            <button
              type="submit"
              className="w-full py-3 text-[12px] uppercase tracking-wider font-medium text-cream bg-forest-900 hover:bg-forest-700 transition-colors"
            >
              Enter
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ivory">
      <div className="bg-forest-900">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 py-10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.3em] text-forest-400 font-mono mb-2">
                Admin
              </p>
              <h1 className="text-2xl font-serif text-cream">
                Content Editor
              </h1>
            </div>
            <Link
              href="/admin"
              className="text-[12px] uppercase tracking-wider text-forest-400 hover:text-cream transition-colors"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </div>

      {/* Sticky save bar */}
      {hasChanges && (
        <div className="sticky top-14 z-30 bg-forest-800 border-b border-forest-700">
          <div className="max-w-4xl mx-auto px-6 lg:px-8 py-3 flex items-center justify-between">
            <p className="text-[13px] text-forest-200">
              You have unsaved changes
            </p>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2 text-[12px] uppercase tracking-wider font-medium text-forest-900 bg-cream hover:bg-white disabled:opacity-50 transition-colors"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      )}

      {saved && (
        <div className="bg-forest-50 border-b border-forest-100">
          <div className="max-w-4xl mx-auto px-6 lg:px-8 py-3">
            <p className="text-[13px] text-forest-700">
              Changes saved. Refresh your homepage to see them live.
            </p>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-6 lg:px-8 py-8">
        <div className="space-y-10">
          {SECTIONS.map((section) => (
            <div key={section.label}>
              <h2 className="text-lg font-serif text-forest-900 mb-4 pb-2 border-b border-ink-100">
                {section.label}
              </h2>
              <div className="space-y-4">
                {section.fields.map((field) => (
                  <div key={field.key}>
                    <label className="block text-[11px] uppercase tracking-[0.15em] text-ink-400 font-mono mb-1.5">
                      {field.label}
                    </label>
                    {field.type === "textarea" ? (
                      <textarea
                        value={content[field.key] || ""}
                        onChange={(e) =>
                          setContent((prev) => ({
                            ...prev,
                            [field.key]: e.target.value,
                          }))
                        }
                        rows={3}
                        className="w-full px-4 py-3 text-[14px] border border-ink-200 bg-white text-ink-900 focus:outline-none focus:border-forest-400 resize-none transition-colors"
                      />
                    ) : (
                      <input
                        type="text"
                        value={content[field.key] || ""}
                        onChange={(e) =>
                          setContent((prev) => ({
                            ...prev,
                            [field.key]: e.target.value,
                          }))
                        }
                        className="w-full px-4 py-3 text-[14px] border border-ink-200 bg-white text-ink-900 focus:outline-none focus:border-forest-400 transition-colors"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 pt-6 border-t border-ink-100 flex items-center gap-4">
          <button
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className="px-8 py-3 text-[12px] uppercase tracking-wider font-medium text-cream bg-forest-900 hover:bg-forest-700 disabled:opacity-30 transition-colors"
          >
            {saving ? "Saving..." : "Save All Changes"}
          </button>
          {saved && (
            <span className="text-[13px] text-forest-600">Saved.</span>
          )}
        </div>
      </div>
    </div>
  );
}
