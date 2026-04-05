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
    "w-full px-4 py-3 bg-white border border-ink-200 text-ink-900 text-[14px] placeholder-ink-300 focus:outline-none focus:border-ink-400 transition-colors";

  if (submitted) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-6">
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
    <div>
      {/* Header */}
      <div className="bg-ink-950">
        <div className="max-w-6xl mx-auto px-6 lg:px-8 py-16 sm:py-20">
          <p className="text-[11px] uppercase tracking-[0.3em] text-clay-500 font-mono mb-3">
            Apply
          </p>
          <h1 className="text-3xl sm:text-4xl font-serif text-white mb-2">
            Request Membership.
          </h1>
          <p className="text-ink-400 text-[15px] max-w-lg">
            Tell us about yourself and what you&apos;d bring to the collective.
          </p>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-6 py-12 sm:py-16">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-[11px] uppercase tracking-[0.15em] text-ink-500 font-mono mb-2">
              Full Name <span className="text-rust-500">*</span>
            </label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="First and last name"
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] uppercase tracking-[0.15em] text-ink-500 font-mono mb-2">
                Company <span className="text-rust-500">*</span>
              </label>
              <input
                type="text"
                required
                value={form.company}
                onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-[11px] uppercase tracking-[0.15em] text-ink-500 font-mono mb-2">
                Title <span className="text-rust-500">*</span>
              </label>
              <input
                type="text"
                required
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] uppercase tracking-[0.15em] text-ink-500 font-mono mb-2">
              How would you describe your occupation?
            </label>
            <input
              type="text"
              value={form.occupation}
              onChange={(e) => setForm((f) => ({ ...f, occupation: e.target.value }))}
              placeholder="Founder, investor, operator, creative..."
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-[11px] uppercase tracking-[0.15em] text-ink-500 font-mono mb-2">
              LinkedIn <span className="text-rust-500">*</span>
            </label>
            <input
              type="url"
              required
              value={form.linkedin}
              onChange={(e) => setForm((f) => ({ ...f, linkedin: e.target.value }))}
              placeholder="https://linkedin.com/in/..."
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] uppercase tracking-[0.15em] text-ink-500 font-mono mb-2">
                Email <span className="text-rust-500">*</span>
              </label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-[11px] uppercase tracking-[0.15em] text-ink-500 font-mono mb-2">
                Phone
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] uppercase tracking-[0.15em] text-ink-500 font-mono mb-2">
              Where do you spend time? <span className="text-rust-500">*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {LOCATIONS.map((loc) => (
                <button
                  key={loc}
                  type="button"
                  onClick={() => handleLocationToggle(loc)}
                  className={`px-4 py-2 text-[13px] border transition-colors ${
                    form.location.includes(loc)
                      ? "bg-ink-900 text-white border-ink-900"
                      : "bg-white text-ink-500 border-ink-200 hover:border-ink-400"
                  }`}
                >
                  {loc}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[11px] uppercase tracking-[0.15em] text-ink-500 font-mono mb-2">
              Comfort food <span className="text-rust-500">*</span>
            </label>
            <input
              type="text"
              required
              value={form.comfortFood}
              onChange={(e) => setForm((f) => ({ ...f, comfortFood: e.target.value }))}
              placeholder="The dish that always feels like home"
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-[11px] uppercase tracking-[0.15em] text-ink-500 font-mono mb-2">
              What are you hoping to get out of Myca? <span className="text-rust-500">*</span>
            </label>
            <textarea
              required
              value={form.hopingToGet}
              onChange={(e) => setForm((f) => ({ ...f, hopingToGet: e.target.value }))}
              rows={3}
              className={inputClass + " resize-none"}
            />
          </div>

          <div>
            <label className="block text-[11px] uppercase tracking-[0.15em] text-ink-500 font-mono mb-2">
              What are you excited to contribute? <span className="text-rust-500">*</span>
            </label>
            <textarea
              required
              value={form.excitedToContribute}
              onChange={(e) => setForm((f) => ({ ...f, excitedToContribute: e.target.value }))}
              rows={3}
              className={inputClass + " resize-none"}
            />
          </div>

          <div>
            <label className="block text-[11px] uppercase tracking-[0.15em] text-ink-500 font-mono mb-2">
              Headshot <span className="text-rust-500">*</span>
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="cursor-pointer border border-dashed border-ink-200 p-8 text-center hover:border-ink-400 transition-colors bg-white"
            >
              {photoPreview ? (
                <div className="flex flex-col items-center">
                  <img
                    src={photoPreview}
                    alt="Preview"
                    className="w-20 h-20 object-cover mb-3"
                  />
                  <p className="text-[13px] text-ink-400">Click to change</p>
                </div>
              ) : (
                <>
                  <svg
                    className="w-8 h-8 text-ink-200 mx-auto mb-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <p className="text-[13px] text-ink-400">Upload a photo</p>
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
            <div className="p-4 border border-rust-200 bg-rust-50 text-[13px] text-rust-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || form.location.length === 0}
            className="w-full py-4 text-[13px] uppercase tracking-wider font-medium text-white bg-ink-900 hover:bg-ink-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting ? "Submitting..." : "Submit Application"}
          </button>
        </form>
      </div>
    </div>
  );
}
