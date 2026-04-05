"use client";

import { useState, useRef } from "react";
import { LOCATIONS } from "@/lib/types";

export default function JoinPage() {
  const [form, setForm] = useState({
    name: "",
    company: "",
    title: "",
    occupation: "",
    linkedin: "",
    email: "",
    phone: "",
    location: [] as string[],
    comfortFood: "",
    hopingToGet: "",
    excitedToContribute: "",
  });
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLocationToggle = (loc: string) => {
    setForm((f) => ({
      ...f,
      location: f.location.includes(loc)
        ? f.location.filter((l) => l !== loc)
        : [...f.location, loc],
    }));
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
      // Upload photo to Supabase storage if available, otherwise skip
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
        body: JSON.stringify({ ...form, photoUrl }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to submit application");
      }

      setSubmitted(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="max-w-lg text-center">
          <div className="w-20 h-20 bg-sage-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-sage-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl font-serif font-bold text-stone-900 mb-3">
            Application received!
          </h1>
          <p className="text-lg text-stone-500 leading-relaxed">
            Thanks for applying to Myca Collective. We review applications on a
            rolling basis and will be in touch soon. In the meantime, keep doing
            amazing things in the food world.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-12 sm:py-20">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-stone-900 mb-3">
            Join Myca Collective
          </h1>
          <p className="text-lg text-stone-500 max-w-lg mx-auto">
            We&apos;re building a community of the most passionate people in
            food and CPG. Tell us about yourself.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Name */}
          <div>
            <label className="block text-sm font-semibold text-stone-800 mb-2">
              What is your name? <span className="text-terracotta-500">*</span>
            </label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="First and last name"
              className="w-full px-4 py-3 bg-white border border-warm-200 rounded-xl text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-sage-400 focus:border-transparent transition-shadow"
            />
          </div>

          {/* Company */}
          <div>
            <label className="block text-sm font-semibold text-stone-800 mb-2">
              Where do you work? <span className="text-terracotta-500">*</span>
            </label>
            <input
              type="text"
              required
              value={form.company}
              onChange={(e) =>
                setForm((f) => ({ ...f, company: e.target.value }))
              }
              placeholder="Company or brand name"
              className="w-full px-4 py-3 bg-white border border-warm-200 rounded-xl text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-sage-400 focus:border-transparent transition-shadow"
            />
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-stone-800 mb-2">
              What is your title?{" "}
              <span className="text-terracotta-500">*</span>
            </label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) =>
                setForm((f) => ({ ...f, title: e.target.value }))
              }
              placeholder="e.g. CEO, Head of Sales, Brand Manager"
              className="w-full px-4 py-3 bg-white border border-warm-200 rounded-xl text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-sage-400 focus:border-transparent transition-shadow"
            />
          </div>

          {/* Occupation */}
          <div>
            <label className="block text-sm font-semibold text-stone-800 mb-2">
              How would you describe your occupation (founder, investor,
              operator, etc)?
            </label>
            <input
              type="text"
              value={form.occupation}
              onChange={(e) =>
                setForm((f) => ({ ...f, occupation: e.target.value }))
              }
              placeholder="e.g. Founder, Investor, Operator, Creative"
              className="w-full px-4 py-3 bg-white border border-warm-200 rounded-xl text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-sage-400 focus:border-transparent transition-shadow"
            />
          </div>

          {/* LinkedIn */}
          <div>
            <label className="block text-sm font-semibold text-stone-800 mb-2">
              Please add your LinkedIn{" "}
              <span className="text-terracotta-500">*</span>
            </label>
            <input
              type="url"
              required
              value={form.linkedin}
              onChange={(e) =>
                setForm((f) => ({ ...f, linkedin: e.target.value }))
              }
              placeholder="https://linkedin.com/in/yourprofile"
              className="w-full px-4 py-3 bg-white border border-warm-200 rounded-xl text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-sage-400 focus:border-transparent transition-shadow"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-semibold text-stone-800 mb-2">
              What is your email (so members can connect)?{" "}
              <span className="text-terracotta-500">*</span>
            </label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) =>
                setForm((f) => ({ ...f, email: e.target.value }))
              }
              placeholder="you@example.com"
              className="w-full px-4 py-3 bg-white border border-warm-200 rounded-xl text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-sage-400 focus:border-transparent transition-shadow"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-semibold text-stone-800 mb-2">
              What is your cell number (so we can add you to our WhatsApp
              group)?
            </label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) =>
                setForm((f) => ({ ...f, phone: e.target.value }))
              }
              placeholder="(555) 123-4567"
              className="w-full px-4 py-3 bg-white border border-warm-200 rounded-xl text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-sage-400 focus:border-transparent transition-shadow"
            />
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-semibold text-stone-800 mb-2">
              Where do you spend most of your time? (We love IRL time!){" "}
              <span className="text-terracotta-500">*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {LOCATIONS.map((loc) => (
                <button
                  key={loc}
                  type="button"
                  onClick={() => handleLocationToggle(loc)}
                  className={`px-4 py-2.5 text-sm font-medium rounded-full border transition-colors ${
                    form.location.includes(loc)
                      ? "bg-sage-600 text-white border-sage-600"
                      : "bg-white text-stone-600 border-warm-200 hover:border-sage-300 hover:text-sage-700"
                  }`}
                >
                  {loc}
                </button>
              ))}
            </div>
          </div>

          {/* Comfort food */}
          <div>
            <label className="block text-sm font-semibold text-stone-800 mb-2">
              What&apos;s the one food that always makes you feel at home?{" "}
              <span className="text-terracotta-500">*</span>
            </label>
            <input
              type="text"
              required
              value={form.comfortFood}
              onChange={(e) =>
                setForm((f) => ({ ...f, comfortFood: e.target.value }))
              }
              placeholder="The dish that feels like a warm hug"
              className="w-full px-4 py-3 bg-white border border-warm-200 rounded-xl text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-sage-400 focus:border-transparent transition-shadow"
            />
          </div>

          {/* Hoping to get */}
          <div>
            <label className="block text-sm font-semibold text-stone-800 mb-2">
              What are you hoping to get out of Myca?{" "}
              <span className="text-terracotta-500">*</span>
            </label>
            <textarea
              required
              value={form.hopingToGet}
              onChange={(e) =>
                setForm((f) => ({ ...f, hopingToGet: e.target.value }))
              }
              rows={3}
              placeholder="What would make this community valuable to you?"
              className="w-full px-4 py-3 bg-white border border-warm-200 rounded-xl text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-sage-400 focus:border-transparent resize-none transition-shadow"
            />
          </div>

          {/* Excited to contribute */}
          <div>
            <label className="block text-sm font-semibold text-stone-800 mb-2">
              What are you most excited to contribute to the Myca community?{" "}
              <span className="text-terracotta-500">*</span>
            </label>
            <textarea
              required
              value={form.excitedToContribute}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  excitedToContribute: e.target.value,
                }))
              }
              rows={3}
              placeholder="Everyone brings something to the table..."
              className="w-full px-4 py-3 bg-white border border-warm-200 rounded-xl text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-sage-400 focus:border-transparent resize-none transition-shadow"
            />
          </div>

          {/* Photo upload */}
          <div>
            <label className="block text-sm font-semibold text-stone-800 mb-2">
              Please upload a photo of yourself!{" "}
              <span className="text-terracotta-500">*</span>
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="cursor-pointer border-2 border-dashed border-warm-200 rounded-2xl p-8 text-center hover:border-sage-400 transition-colors bg-white"
            >
              {photoPreview ? (
                <div className="flex flex-col items-center">
                  <img
                    src={photoPreview}
                    alt="Preview"
                    className="w-24 h-24 rounded-full object-cover mb-3"
                  />
                  <p className="text-sm text-sage-600 font-medium">
                    Click to change photo
                  </p>
                </div>
              ) : (
                <>
                  <svg
                    className="w-10 h-10 text-stone-300 mx-auto mb-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <p className="text-sm text-stone-500">
                    Click to upload a headshot
                  </p>
                  <p className="text-xs text-stone-400 mt-1">
                    JPG, PNG, or WebP
                  </p>
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
            <div className="p-4 bg-terracotta-50 border border-terracotta-200 rounded-xl text-sm text-terracotta-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || form.location.length === 0}
            className="w-full py-4 text-base font-semibold text-white bg-sage-600 rounded-full hover:bg-sage-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {submitting ? "Submitting..." : "Submit Application"}
          </button>
        </form>
      </div>
    </div>
  );
}
