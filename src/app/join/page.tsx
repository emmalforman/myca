"use client";

import { useState, useRef, useEffect } from "react";

const LOCATIONS = [
  "New York 🗽",
  "San Francisco 🌉",
  "Los Angeles 🎬",
  "London 🇬🇧",
  "Chicago 🍕",
  "Other",
];

const REFERRAL_SOURCES = [
  "A friend or colleague",
  "LinkedIn",
  "Instagram",
  "Twitter / X",
  "Event",
  "Newsletter",
  "Google Search",
  "Other",
];

const INDUSTRIES = [
  "CPG / Consumer Packaged Goods",
  "Food Technology",
  "Agriculture & Farming",
  "Retail & Restaurant",
  "Food Service & Hospitality",
  "Media & Publishing",
  "Venture Capital & Investing",
  "Nonprofits & Policy",
  "Supply Chain & Logistics",
  "Sustainability & Climate",
  "Other",
];

const EXPERIENCE_LEVELS = [
  "0-2 years",
  "3-5 years",
  "6-10 years",
  "10-15 years",
  "15+ years",
];

interface MemberResult {
  name: string;
  email: string;
  company: string;
}

export default function JoinPage() {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    company: "",
    title: "",
    occupation: "",
    linkedin: "",
    instagram: "",
    website: "",
    email: "",
    phone: "",
    location: "",
    locationOther: "",
    industryFocus: "",
    skills: "",
    yearsExperience: "",
    comfortFood: "",
    referralSource: "",
    referredByName: "",
    referredByEmail: "",
    hopingToGet: "",
    excitedToContribute: "",
    website_url: "",
  });
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Referral search
  const [referralQuery, setReferralQuery] = useState("");
  const [referralResults, setReferralResults] = useState<MemberResult[]>([]);
  const [allMembers, setAllMembers] = useState<MemberResult[]>([]);
  const [showReferralDropdown, setShowReferralDropdown] = useState(false);

  useEffect(() => {
    fetch("/api/members")
      .then((r) => r.json())
      .then((data) => {
        if (data.members) {
          setAllMembers(
            data.members.map((m: any) => ({
              name: m.name || "",
              email: m.email || "",
              company: m.company || "",
            }))
          );
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (referralQuery.length < 2) {
      setReferralResults([]);
      return;
    }
    const q = referralQuery.toLowerCase();
    const matches = allMembers
      .filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.company.toLowerCase().includes(q)
      )
      .slice(0, 6);
    setReferralResults(matches);
  }, [referralQuery, allMembers]);

  const selectReferral = (member: MemberResult) => {
    setForm((f: any) => ({
      ...f,
      referredByName: member.name,
      referredByEmail: member.email,
    }));
    setReferralQuery(member.name);
    setShowReferralDropdown(false);
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      let photoUrl: string | undefined;
      if (photo) {
        const formData = new FormData();
        formData.append("photo", photo);
        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          photoUrl = uploadData.url;
        }
      }

      const res = await fetch("/api/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `${form.firstName} ${form.lastName}`.trim(),
          ...form,
          location: [
            form.location === "Other" ? form.locationOther : form.location,
          ],
          photoUrl,
          website_url: form.website_url, // honeypot
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to submit");
      }

      setSubmitted(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    "w-full px-4 py-3.5 bg-white border border-ink-200 rounded-full text-ink-900 text-[14px] placeholder-ink-300 focus:outline-none focus:border-forest-400 transition-colors";
  const textareaClass =
    "w-full px-4 py-3.5 bg-white border border-ink-200 rounded-2xl text-ink-900 text-[14px] placeholder-ink-300 focus:outline-none focus:border-forest-400 transition-colors resize-none";
  const labelClass = "block text-[14px] text-ink-800 mb-2";
  const requiredClass = "text-ink-400 text-[13px] ml-1";

  if (submitted) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-6">
        <div className="max-w-md text-center">
          <p className="text-[11px] uppercase tracking-[0.3em] text-clay-500 font-mono mb-4">
            Application received
          </p>
          <h1 className="text-3xl font-serif text-ink-900 mb-4">
            We&apos;ll be in touch.
          </h1>
          <p className="text-[15px] text-ink-400 leading-relaxed">
            Applications are reviewed weekly. If your profile is a fit, expect
            to hear from us soon. In the meantime, keep building.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-parchment min-h-screen">
      <div className="max-w-xl mx-auto px-6 py-16 sm:py-24">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Honeypot - hidden from humans, bots will fill it */}
          <div className="absolute opacity-0 top-0 left-0 h-0 w-0 -z-10" aria-hidden="true">
            <label htmlFor="website_url">Website</label>
            <input
              type="text"
              id="website_url"
              name="website_url"
              tabIndex={-1}
              autoComplete="off"
              value={form.website_url}
              onChange={(e) => setForm((f: any) => ({ ...f, website_url: e.target.value }))}
            />
          </div>
          {/* Name */}
          <div>
            <p className={labelClass}>Name</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[13px] text-ink-500 mb-1.5">
                  First Name <span className={requiredClass}>(required)</span>
                </p>
                <input
                  type="text"
                  required
                  value={form.firstName}
                  onChange={(e) =>
                    setForm((f: any) => ({ ...f, firstName: e.target.value }))
                  }
                  className={inputClass}
                />
              </div>
              <div>
                <p className="text-[13px] text-ink-500 mb-1.5">
                  Last Name <span className={requiredClass}>(required)</span>
                </p>
                <input
                  type="text"
                  required
                  value={form.lastName}
                  onChange={(e) =>
                    setForm((f: any) => ({ ...f, lastName: e.target.value }))
                  }
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          {/* Company + Title */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className={labelClass}>
                Where do you work? <span className={requiredClass}>(required)</span>
              </p>
              <input
                type="text"
                required
                value={form.company}
                onChange={(e) =>
                  setForm((f: any) => ({ ...f, company: e.target.value }))
                }
                className={inputClass}
              />
            </div>
            <div>
              <p className={labelClass}>
                Title <span className={requiredClass}>(required)</span>
              </p>
              <input
                type="text"
                required
                value={form.title}
                onChange={(e) =>
                  setForm((f: any) => ({ ...f, title: e.target.value }))
                }
                className={inputClass}
              />
            </div>
          </div>

          {/* Occupation */}
          <div>
            <p className={labelClass}>
              How would you describe your occupation?{" "}
              <span className={requiredClass}>(required)</span>
            </p>
            <input
              type="text"
              required
              value={form.occupation}
              onChange={(e) =>
                setForm((f: any) => ({ ...f, occupation: e.target.value }))
              }
              placeholder="Founder, investor, operator, creative..."
              className={inputClass}
            />
          </div>

          {/* Industry Focus */}
          <div>
            <p className={labelClass}>
              Industry focus <span className={requiredClass}>(required)</span>
            </p>
            <div className="relative">
              <select
                required
                value={form.industryFocus}
                onChange={(e) =>
                  setForm((f: any) => ({ ...f, industryFocus: e.target.value }))
                }
                className={`${inputClass} appearance-none cursor-pointer pr-10`}
              >
                <option value="">Select your industry</option>
                {INDUSTRIES.map((ind) => (
                  <option key={ind} value={ind}>{ind}</option>
                ))}
              </select>
              <svg className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {/* Skills */}
          <div>
            <p className={labelClass}>
              Skills & expertise
            </p>
            <input
              type="text"
              value={form.skills}
              onChange={(e) =>
                setForm((f: any) => ({ ...f, skills: e.target.value }))
              }
              placeholder="e.g. Brand strategy, fundraising, retail distribution..."
              className={inputClass}
            />
          </div>

          {/* Years of experience */}
          <div>
            <p className={labelClass}>
              Years of experience <span className={requiredClass}>(required)</span>
            </p>
            <div className="flex flex-wrap gap-2">
              {EXPERIENCE_LEVELS.map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() =>
                    setForm((f: any) => ({ ...f, yearsExperience: lvl }))
                  }
                  className={`px-4 py-2 text-[13px] border transition-colors rounded-full ${
                    form.yearsExperience === lvl
                      ? "bg-forest-900 text-cream border-forest-900"
                      : "bg-white text-ink-500 border-ink-200 hover:border-forest-400"
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          {/* LinkedIn + Instagram */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className={labelClass}>
                LinkedIn <span className={requiredClass}>(required)</span>
              </p>
              <input
                type="url"
                required
                value={form.linkedin}
                onChange={(e) =>
                  setForm((f: any) => ({ ...f, linkedin: e.target.value }))
                }
                placeholder="https://linkedin.com/in/..."
                className={inputClass}
              />
            </div>
            <div>
              <p className={labelClass}>Instagram</p>
              <input
                type="text"
                value={form.instagram}
                onChange={(e) =>
                  setForm((f: any) => ({ ...f, instagram: e.target.value }))
                }
                placeholder="@handle"
                className={inputClass}
              />
            </div>
          </div>

          {/* Website */}
          <div>
            <p className={labelClass}>Website or portfolio</p>
            <input
              type="url"
              value={form.website}
              onChange={(e) =>
                setForm((f: any) => ({ ...f, website: e.target.value }))
              }
              placeholder="https://..."
              className={inputClass}
            />
          </div>

          {/* Email + Phone */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className={labelClass}>
                Email <span className={requiredClass}>(required)</span>
              </p>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) =>
                  setForm((f: any) => ({ ...f, email: e.target.value }))
                }
                className={inputClass}
              />
            </div>
            <div>
              <p className={labelClass}>
                Phone <span className={requiredClass}>(required)</span>
              </p>
              <input
                type="tel"
                required
                value={form.phone}
                onChange={(e) =>
                  setForm((f: any) => ({ ...f, phone: e.target.value }))
                }
                className={inputClass}
              />
            </div>
          </div>

          {/* Location */}
          <div>
            <p className={labelClass}>
              Where do you spend most of your time?{" "}
              <span className={requiredClass}>(required)</span>
            </p>
            <div className="relative">
              <select
                required
                value={form.location}
                onChange={(e) =>
                  setForm((f: any) => ({
                    ...f,
                    location: e.target.value,
                    locationOther: e.target.value === "Other" ? f.locationOther : "",
                  }))
                }
                className={`${inputClass} appearance-none cursor-pointer pr-10`}
              >
                <option value="">Select your city</option>
                {LOCATIONS.map((loc) => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
              <svg className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            {form.location === "Other" && (
              <input
                type="text"
                value={form.locationOther}
                onChange={(e) =>
                  setForm((f: any) => ({ ...f, locationOther: e.target.value }))
                }
                placeholder="Enter your city"
                required
                className={`${inputClass} mt-3`}
              />
            )}
          </div>

          {/* Comfort food */}
          <div>
            <p className={labelClass}>
              What&apos;s the one food that always makes you feel at home?{" "}
              <span className={requiredClass}>(required)</span>
            </p>
            <input
              type="text"
              required
              value={form.comfortFood}
              onChange={(e) =>
                setForm((f: any) => ({ ...f, comfortFood: e.target.value }))
              }
              className={inputClass}
            />
          </div>

          {/* How did you hear about us */}
          <div>
            <p className={labelClass}>
              How did you hear about us?{" "}
              <span className={requiredClass}>(required)</span>
            </p>
            <div className="relative">
              <select
                required
                value={form.referralSource}
                onChange={(e) =>
                  setForm((f: any) => ({ ...f, referralSource: e.target.value }))
                }
                className={`${inputClass} appearance-none cursor-pointer pr-10`}
              >
                <option value="">Select an option</option>
                {REFERRAL_SOURCES.map((src) => (
                  <option key={src} value={src}>{src}</option>
                ))}
              </select>
              <svg className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {/* Referred by (member search) */}
          <div>
            <p className={labelClass}>Were you referred by a current member?</p>
            <div className="relative">
              <input
                type="text"
                value={referralQuery}
                onChange={(e) => {
                  setReferralQuery(e.target.value);
                  setShowReferralDropdown(true);
                  if (!e.target.value) {
                    setForm((f: any) => ({
                      ...f,
                      referredByName: "",
                      referredByEmail: "",
                    }));
                  }
                }}
                onFocus={() => referralQuery.length >= 2 && setShowReferralDropdown(true)}
                placeholder="Search by name or company..."
                className={inputClass}
              />
              {form.referredByName && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  <svg className="w-4 h-4 text-forest-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}

              {showReferralDropdown && referralResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-ink-200 shadow-lg z-20 max-h-48 overflow-y-auto">
                  {referralResults.map((m) => (
                    <button
                      key={m.email}
                      type="button"
                      onClick={() => selectReferral(m)}
                      className="w-full text-left px-4 py-3 hover:bg-forest-50 transition-colors border-b border-ink-50 last:border-0"
                    >
                      <p className="text-[14px] text-ink-900 font-serif">
                        {m.name}
                      </p>
                      <p className="text-[12px] text-ink-400">{m.company}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Hoping to get */}
          <div>
            <p className={labelClass}>
              What are you hoping to get out of Myca?{" "}
              <span className={requiredClass}>(required)</span>
            </p>
            <textarea
              required
              value={form.hopingToGet}
              onChange={(e) =>
                setForm((f: any) => ({ ...f, hopingToGet: e.target.value }))
              }
              rows={4}
              className={textareaClass}
            />
          </div>

          {/* Excited to contribute */}
          <div>
            <p className={labelClass}>
              What are you most excited to contribute to the Myca community?{" "}
              <span className={requiredClass}>(required)</span>
            </p>
            <textarea
              required
              value={form.excitedToContribute}
              onChange={(e) =>
                setForm((f: any) => ({
                  ...f,
                  excitedToContribute: e.target.value,
                }))
              }
              rows={4}
              className={textareaClass}
            />
          </div>

          {/* Photo upload */}
          <div>
            <p className={labelClass}>
              Please upload a photo of yourself!{" "}
              <span className={requiredClass}>(required)</span>
            </p>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="cursor-pointer border-2 border-dashed border-ink-300 rounded-2xl p-10 text-center hover:border-forest-400 transition-colors bg-white"
            >
              {photoPreview ? (
                <div className="flex flex-col items-center">
                  <img
                    src={photoPreview}
                    alt="Preview"
                    className="w-20 h-20 object-cover rounded-full mb-3"
                  />
                  <p className="text-[13px] text-ink-400">Click to change</p>
                </div>
              ) : (
                <>
                  <div className="w-10 h-10 bg-ink-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg
                      className="w-5 h-5 text-ink-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                  </div>
                  <p className="text-[14px] text-ink-500">Add a File</p>
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="hidden"
              />
            </div>
          </div>

          {error && (
            <div className="p-4 border border-rust-200 bg-rust-50 text-[13px] text-rust-700 rounded-xl">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={
              submitting ||
              !form.location ||
              (form.location === "Other" && !form.locationOther) ||
              !form.yearsExperience
            }
            className="px-8 py-3.5 text-[14px] font-medium text-cream bg-forest-900 rounded-full hover:bg-forest-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting ? "Submitting..." : "Submit Application"}
          </button>
        </form>
      </div>
    </div>
  );
}
