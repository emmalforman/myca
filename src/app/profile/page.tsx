"use client";

import { useState, useEffect, useRef } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import MemberLogin from "@/components/MemberLogin";

interface Profile {
  name: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  company: string;
  role: string;
  occupation_type: string;
  location: string;
  linkedin: string;
  superpower: string;
  asks: string;
  offers: string;
  photo_url: string;
}

const OCCUPATIONS = ["Founder", "Operator", "Investor", "Creator", "Media", "Advisor", "Other"];

function ProfileEditor() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const supabase = getSupabaseBrowser();
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user?.email) {
        setEmail(session.user.email);
        const res = await fetch(
          `/api/profile?email=${encodeURIComponent(session.user.email)}`
        );
        if (res.ok) {
          const data = await res.json();
          setProfile(data.profile);
        }
      }
      setLoading(false);
    });
  }, []);

  const handleChange = (field: keyof Profile, value: string) => {
    if (!profile) return;
    setProfile({ ...profile, [field]: value });
    setSaved(false);
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    setPhotoPreview(URL.createObjectURL(file));

    // Upload to Supabase Storage
    const formData = new FormData();
    formData.append("photo", file);
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    if (res.ok) {
      const data = await res.json();
      if (data.url) {
        setProfile({ ...profile, photo_url: data.url });
        setSaved(false);
      }
    }
  };

  const handleSave = async () => {
    if (!profile || !email) return;
    setSaving(true);
    setError("");

    const res = await fetch(`/api/profile?email=${encodeURIComponent(email)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: profile.name,
        first_name: profile.first_name,
        last_name: profile.last_name,
        company: profile.company,
        role: profile.role,
        occupation_type: profile.occupation_type,
        location: profile.location,
        linkedin: profile.linkedin,
        phone: profile.phone,
        superpower: profile.superpower,
        asks: profile.asks,
        offers: profile.offers,
        photo_url: profile.photo_url,
      }),
    });

    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } else {
      const data = await res.json();
      setError(data.error || "Failed to save");
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border border-forest-200 border-t-forest-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-6">
        <p className="text-ink-400">Profile not found.</p>
      </div>
    );
  }

  const inputClass =
    "w-full px-4 py-3 bg-white border border-ink-200 text-ink-900 text-[14px] placeholder-ink-300 focus:outline-none focus:border-forest-400 transition-colors";
  const labelClass =
    "block text-[10px] uppercase tracking-[0.15em] text-ink-400 font-mono mb-2";

  return (
    <div className="min-h-screen bg-ivory">
      <div className="bg-forest-900">
        <div className="max-w-2xl mx-auto px-6 lg:px-8 py-12">
          <p className="text-[11px] uppercase tracking-[0.3em] text-forest-400 font-mono mb-3">
            Profile
          </p>
          <h1 className="text-2xl font-serif text-cream">
            Edit Your Profile
          </h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 lg:px-8 py-10">
        <div className="space-y-6">
          {/* Photo */}
          <div className="flex items-center gap-6">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="w-24 h-24 bg-cream border border-ink-200 overflow-hidden cursor-pointer hover:opacity-80 transition-opacity flex-shrink-0"
            >
              {photoPreview || profile.photo_url ? (
                <img
                  src={photoPreview || profile.photo_url}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-forest-400 font-serif text-2xl">
                  {profile.name?.[0]}
                </div>
              )}
            </div>
            <div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-[12px] uppercase tracking-wider text-forest-700 hover:text-forest-900 transition-colors underline"
              >
                Change photo
              </button>
              <p className="text-[11px] text-ink-300 mt-1">JPG, PNG, or WebP</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="hidden"
            />
          </div>

          {/* Name */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>First Name</label>
              <input
                type="text"
                value={profile.first_name || ""}
                onChange={(e) => handleChange("first_name", e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Last Name</label>
              <input
                type="text"
                value={profile.last_name || ""}
                onChange={(e) => handleChange("last_name", e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          {/* Full Name */}
          <div>
            <label className={labelClass}>Display Name</label>
            <input
              type="text"
              value={profile.name || ""}
              onChange={(e) => handleChange("name", e.target.value)}
              className={inputClass}
            />
          </div>

          {/* Company + Role */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Company</label>
              <input
                type="text"
                value={profile.company || ""}
                onChange={(e) => handleChange("company", e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Title</label>
              <input
                type="text"
                value={profile.role || ""}
                onChange={(e) => handleChange("role", e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          {/* Occupation type */}
          <div>
            <label className={labelClass}>Role Type</label>
            <div className="flex flex-wrap gap-1.5">
              {OCCUPATIONS.map((occ) => (
                <button
                  key={occ}
                  type="button"
                  onClick={() => handleChange("occupation_type", occ)}
                  className={`px-3.5 py-1.5 text-[12px] tracking-wide transition-all ${
                    profile.occupation_type === occ
                      ? "bg-forest-900 text-cream"
                      : "bg-white text-ink-500 border border-ink-200 hover:border-forest-400"
                  }`}
                >
                  {occ}
                </button>
              ))}
            </div>
          </div>

          {/* Location */}
          <div>
            <label className={labelClass}>Location</label>
            <input
              type="text"
              value={profile.location || ""}
              onChange={(e) => handleChange("location", e.target.value)}
              placeholder="e.g. New York"
              className={inputClass}
            />
          </div>

          {/* LinkedIn */}
          <div>
            <label className={labelClass}>LinkedIn</label>
            <input
              type="url"
              value={profile.linkedin || ""}
              onChange={(e) => handleChange("linkedin", e.target.value)}
              placeholder="https://linkedin.com/in/..."
              className={inputClass}
            />
          </div>

          {/* Phone */}
          <div>
            <label className={labelClass}>Phone</label>
            <input
              type="tel"
              value={profile.phone || ""}
              onChange={(e) => handleChange("phone", e.target.value)}
              className={inputClass}
            />
          </div>

          {/* Superpower */}
          <div>
            <label className={labelClass}>Your Superpower</label>
            <input
              type="text"
              value={profile.superpower || ""}
              onChange={(e) => handleChange("superpower", e.target.value)}
              placeholder="What are you known for?"
              className={inputClass}
            />
          </div>

          {/* Asks */}
          <div>
            <label className={labelClass}>What You&apos;re Looking For</label>
            <textarea
              value={profile.asks || ""}
              onChange={(e) => handleChange("asks", e.target.value)}
              rows={3}
              placeholder="What do you need from the community?"
              className={inputClass + " resize-none"}
            />
          </div>

          {/* Offers */}
          <div>
            <label className={labelClass}>What You Can Offer</label>
            <textarea
              value={profile.offers || ""}
              onChange={(e) => handleChange("offers", e.target.value)}
              rows={3}
              placeholder="What can you contribute?"
              className={inputClass + " resize-none"}
            />
          </div>

          {/* Email (read only) */}
          <div>
            <label className={labelClass}>Email</label>
            <input
              type="email"
              value={profile.email || ""}
              disabled
              className={inputClass + " bg-cream text-ink-400 cursor-not-allowed"}
            />
          </div>

          {/* Save */}
          {error && (
            <div className="p-3 border border-rust-200 bg-rust-50 text-[13px] text-rust-700">
              {error}
            </div>
          )}

          <div className="flex items-center gap-4 pt-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-8 py-3 text-[12px] uppercase tracking-wider font-medium text-cream bg-forest-900 hover:bg-forest-700 disabled:opacity-50 transition-colors"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
            {saved && (
              <span className="text-[13px] text-forest-600">
                Profile updated.
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <MemberLogin>
      <ProfileEditor />
    </MemberLogin>
  );
}
