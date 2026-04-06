"use client";

import { useState, useRef } from "react";

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

export default function JoinPage() {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    company: "",
    title: "",
    occupation: "",
    linkedin: "",
    email: "",
    phone: "",
    location: "",
    comfortFood: "",
    referralSource: "",
    hopingToGet: "",
    excitedToContribute: "",
  });
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
          location: [form.location],
          photoUrl,
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
    "w-full px-4 py-3.5 bg-white border border-ink-200 rounded-full text-ink-900 text-[14px] placeholder-ink-300 focus:outline-none focus:border-ink-400 transition-colors";
  const textareaClass =
    "w-full px-4 py-3.5 bg-white border border-ink-200 rounded-2xl text-ink-900 text-[14px] placeholder-ink-300 focus:outline-none focus:border-ink-400 transition-colors resize-none";
  const labelClass =
    "block text-[14px] text-ink-800 mb-2";
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
                    setForm((f) => ({ ...f, firstName: e.target.value }))
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
                    setForm((f) => ({ ...f, lastName: e.target.value }))
                  }
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          {/* Where do you work */}
          <div>
            <p className={labelClass}>
              Where do you work? <span className={requiredClass}>(required)</span>
            </p>
            <input
              type="text"
              required
              value={form.company}
              onChange={(e) =>
                setForm((f) => ({ ...f, company: e.target.value }))
              }
              className={inputClass}
            />
          </div>

          {/* Title */}
          <div>
            <p className={labelClass}>
              What is your title? <span className={requiredClass}>(required)</span>
            </p>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) =>
                setForm((f) => ({ ...f, title: e.target.value }))
              }
              className={inputClass}
            />
          </div>

          {/* Occupation */}
          <div>
            <p className={labelClass}>
              How would you describe your occupation (founder, investor,
              operator, etc)? <span className={requiredClass}>(required)</span>
            </p>
            <input
              type="text"
              required
              value={form.occupation}
              onChange={(e) =>
                setForm((f) => ({ ...f, occupation: e.target.value }))
              }
              className={inputClass}
            />
          </div>

          {/* LinkedIn */}
          <div>
            <p className={labelClass}>
              Please add your Linkedin{" "}
              <span className={requiredClass}>(required)</span>
            </p>
            <input
              type="url"
              required
              value={form.linkedin}
              onChange={(e) =>
                setForm((f) => ({ ...f, linkedin: e.target.value }))
              }
              placeholder="http://"
              className={inputClass}
            />
          </div>

          {/* Email */}
          <div>
            <p className={labelClass}>
              What is your email (so members can connect){" "}
              <span className={requiredClass}>(required)</span>
            </p>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) =>
                setForm((f) => ({ ...f, email: e.target.value }))
              }
              className={inputClass}
            />
          </div>

          {/* Phone */}
          <div>
            <p className={labelClass}>
              What is your cell number (so we can add your to our WhatsApp
              group) <span className={requiredClass}>(required)</span>
            </p>
            <input
              type="tel"
              required
              value={form.phone}
              onChange={(e) =>
                setForm((f) => ({ ...f, phone: e.target.value }))
              }
              className={inputClass}
            />
          </div>

          {/* Location - radio buttons */}
          <div>
            <p className={labelClass}>
              Where do you spend most of your time? (we love IRL time!){" "}
              <span className={requiredClass}>(required)</span>
            </p>
            <div className="space-y-3 mt-2">
              {LOCATIONS.map((loc) => (
                <label
                  key={loc}
                  className="flex items-center gap-3 cursor-pointer group"
                >
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                      form.location === loc
                        ? "border-ink-900"
                        : "border-ink-300 group-hover:border-ink-400"
                    }`}
                  >
                    {form.location === loc && (
                      <div className="w-2.5 h-2.5 rounded-full bg-forest-900" />
                    )}
                  </div>
                  <span className="text-[14px] text-ink-700">{loc}</span>
                </label>
              ))}
            </div>
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
                setForm((f) => ({ ...f, comfortFood: e.target.value }))
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
                  setForm((f) => ({ ...f, referralSource: e.target.value }))
                }
                className={`${inputClass} appearance-none cursor-pointer pr-10`}
              >
                <option value="">Select an option</option>
                {REFERRAL_SOURCES.map((src) => (
                  <option key={src} value={src}>
                    {src}
                  </option>
                ))}
              </select>
              <svg
                className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400 pointer-events-none"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </div>

          {/* Hoping to get */}
          <div>
            <p className={labelClass}>
              What are you hoping to get out of Myca? *{" "}
              <span className={requiredClass}>(required)</span>
            </p>
            <textarea
              required
              value={form.hopingToGet}
              onChange={(e) =>
                setForm((f) => ({ ...f, hopingToGet: e.target.value }))
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
                setForm((f) => ({
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
              className="cursor-pointer border-2 border-dashed border-ink-300 rounded-2xl p-10 text-center hover:border-ink-400 transition-colors bg-white"
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
            disabled={submitting || !form.location}
            className="px-8 py-3.5 text-[14px] font-medium text-white bg-forest-900 rounded-full hover:bg-forest-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting ? "Submitting..." : "Submit"}
          </button>
        </form>
      </div>
    </div>
  );
}
