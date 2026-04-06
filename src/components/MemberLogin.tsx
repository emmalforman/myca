"use client";

import { useState, useEffect, useRef } from "react";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

function getSupabase(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
  );
}

export default function MemberLogin({
  children,
}: {
  children: React.ReactNode;
}) {
  const [state, setState] = useState<
    "loading" | "login" | "check-email" | "not-member" | "authenticated"
  >("loading");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    // Check if already logged in
    getSupabase().auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.email) {
        verifyMembership(session.user.email);
      } else {
        setState("login");
      }
    });

    // Listen for auth changes (magic link callback)
    const {
      data: { subscription },
    } = getSupabase().auth.onAuthStateChange((_event, session) => {
      if (session?.user?.email) {
        verifyMembership(session.user.email);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const verifyMembership = async (userEmail: string) => {
    const { data } = await getSupabase()
      .from("contacts")
      .select("contact_id")
      .eq("email", userEmail)
      .eq("is_myca_member", true)
      .limit(1);

    if (data && data.length > 0) {
      setState("authenticated");
    } else {
      setState("not-member");
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const redirectUrl = typeof window !== "undefined"
      ? `${window.location.origin}/directory`
      : undefined;

    const { error: authError } = await getSupabase().auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectUrl },
    });

    if (authError) {
      setError(authError.message);
    } else {
      setState("check-email");
    }
  };

  const handleLogout = async () => {
    await getSupabase().auth.signOut();
    setState("login");
  };

  if (state === "loading") {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="w-8 h-8 border border-ink-200 border-t-ink-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (state === "authenticated") {
    return (
      <div className="relative">
        <button
          onClick={handleLogout}
          className="fixed bottom-6 right-6 z-40 px-4 py-2 text-[11px] uppercase tracking-wider text-ink-400 bg-white border border-ink-200 hover:border-ink-400 transition-colors font-mono"
        >
          Sign out
        </button>
        {children}
      </div>
    );
  }

  if (state === "not-member") {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-6">
        <div className="w-full max-w-sm text-center">
          <p className="text-[11px] uppercase tracking-[0.3em] text-clay-500 font-mono mb-4">
            Access Denied
          </p>
          <h1 className="text-3xl font-serif text-ink-900 mb-3">
            Members only.
          </h1>
          <p className="text-[14px] text-ink-400 mb-6">
            This email is not associated with an active Myca membership.
          </p>
          <button
            onClick={() => {
              getSupabase().auth.signOut();
              setState("login");
              setEmail("");
            }}
            className="text-[12px] uppercase tracking-wider text-ink-500 underline hover:text-ink-700"
          >
            Try a different email
          </button>
        </div>
      </div>
    );
  }

  if (state === "check-email") {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-6">
        <div className="w-full max-w-sm text-center">
          <p className="text-[11px] uppercase tracking-[0.3em] text-clay-500 font-mono mb-4">
            Check your inbox
          </p>
          <h1 className="text-3xl font-serif text-ink-900 mb-3">
            Magic link sent.
          </h1>
          <p className="text-[14px] text-ink-400 mb-2">
            We sent a login link to
          </p>
          <p className="text-[14px] text-ink-900 font-medium mb-6">{email}</p>
          <p className="text-[13px] text-ink-400">
            Click the link in your email to access the directory.
          </p>
          <button
            onClick={() => setState("login")}
            className="mt-6 text-[12px] uppercase tracking-wider text-ink-500 underline hover:text-ink-700"
          >
            Use a different email
          </button>
        </div>
      </div>
    );
  }

  // Login form
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
          Enter the email associated with your Myca membership.
        </p>
        <form onSubmit={handleLogin}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            autoFocus
            className="w-full px-4 py-3 text-center text-[14px] border border-ink-200 bg-white text-ink-900 placeholder-ink-300 focus:outline-none focus:border-ink-400 mb-4"
          />
          <button
            type="submit"
            className="w-full py-3 text-[12px] uppercase tracking-wider font-medium text-white bg-forest-900 hover:bg-forest-700 transition-colors"
          >
            Send Login Link
          </button>
        </form>
        {error && (
          <p className="text-[13px] text-rust-500 mt-3">{error}</p>
        )}
        <p className="text-[12px] text-ink-300 mt-6">
          Not a member?{" "}
          <a href="/join" className="text-ink-600 underline">
            Apply here
          </a>
        </p>
      </div>
    </div>
  );
}
