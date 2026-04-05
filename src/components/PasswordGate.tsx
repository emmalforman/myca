"use client";

import { useState, useEffect } from "react";

const PASSWORD = "myca2024"; // Change this or move to env var

export default function PasswordGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const [unlocked, setUnlocked] = useState(false);
  const [input, setInput] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem("myca-directory-access");
    if (stored === "true") setUnlocked(true);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input === PASSWORD) {
      setUnlocked(true);
      sessionStorage.setItem("myca-directory-access", "true");
    } else {
      setError(true);
      setTimeout(() => setError(false), 2000);
    }
  };

  if (unlocked) return <>{children}</>;

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-6">
      <div className="w-full max-w-sm text-center">
        <p className="text-[11px] uppercase tracking-[0.3em] text-clay-500 font-mono mb-4">
          Members Only
        </p>
        <h1 className="text-3xl font-serif text-ink-900 mb-3">
          Directory Access
        </h1>
        <p className="text-[14px] text-ink-400 mb-8">
          Enter the member password to view the directory.
        </p>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Password"
            autoFocus
            className={`w-full px-4 py-3 text-center text-[14px] border bg-white text-ink-900 placeholder-ink-300 focus:outline-none transition-colors mb-4 ${
              error
                ? "border-rust-400 animate-shake"
                : "border-ink-200 focus:border-ink-400"
            }`}
          />
          <button
            type="submit"
            className="w-full py-3 text-[12px] uppercase tracking-wider font-medium text-white bg-ink-900 hover:bg-ink-700 transition-colors"
          >
            Enter
          </button>
        </form>
        {error && (
          <p className="text-[13px] text-rust-500 mt-3">
            Incorrect password. Try again.
          </p>
        )}
      </div>
    </div>
  );
}
