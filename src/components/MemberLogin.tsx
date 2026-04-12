"use client";

import { useState, useEffect, ReactNode, KeyboardEvent } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import Link from "next/link";
import OnboardingFlow from "./OnboardingFlow";

export default function MemberLogin({
  children,
}: {
  children: ReactNode;
}) {
  const [state, setState] = useState<
    "loading" | "login" | "signup" | "forgot" | "reset-sent" | "not-member" | "onboarding" | "profile-incomplete" | "authenticated"
  >("loading");
  const [email, setEmail] = useState("");
  const [authedEmail, setAuthedEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const supabase = getSupabaseBrowser();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.email) {
        verifyMembership(session.user.email);
      } else {
        setState("login");
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user?.email) {
        verifyMembership(session.user.email);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const verifyMembership = async (userEmail: string) => {
    const supabase = getSupabaseBrowser();
    const { data } = await supabase
      .from("contacts")
      .select("contact_id, skills, interests")
      .eq("email", userEmail)
      .eq("is_myca_member", true)
      .limit(1);

    if (data && data.length > 0) {
      setAuthedEmail(userEmail);
      // Check if onboarded
      const { data: onboarded } = await supabase
        .from("channel_members")
        .select("channel")
        .eq("email", userEmail)
        .eq("channel", "_onboarded")
        .limit(1);

      if (!onboarded || onboarded.length === 0) {
        setState("onboarding");
      } else {
        // Check if profile has at least 1 skill and 1 interest
        const hasSkills = !!(data[0].skills && data[0].skills.trim());
        const hasInterests = !!(data[0].interests && data[0].interests.trim());
        if (!hasSkills || !hasInterests) {
          setState("profile-incomplete");
        } else {
          setState("authenticated");
        }
      }
    } else {
      setState("not-member");
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const { error: authError } = await getSupabaseBrowser().auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        if (authError.message.includes("Invalid login") || authError.message.includes("invalid")) {
          setError("Invalid email or password. If you haven't created an account yet, click 'Create an account' below.");
        } else if (authError.message.includes("Email not confirmed")) {
          setError("Please check your email and click the confirmation link first.");
        } else {
          setError(authError.message);
        }
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      setSubmitting(false);
      return;
    }

    try {
      const supabase = getSupabaseBrowser();

      const { data: signUpData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: typeof window !== "undefined" ? `${window.location.origin}/directory` : undefined,
        },
      });

      if (authError) {
        if (authError.message.includes("already registered")) {
          setError("This email already has an account. Try signing in instead.");
          setState("login");
        } else {
          setError(authError.message);
        }
        return;
      }

      // Check if email confirmation is required
      if (signUpData?.user?.identities?.length === 0) {
        setError("This email already has an account. Try signing in instead.");
        setState("login");
        return;
      }

      // Try auto sign-in (works when email confirmation is disabled)
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        // Email confirmation is probably required
        setError("Account created! Check your email to confirm, then come back and sign in.");
        setState("login");
      }
      // If sign-in succeeded, onAuthStateChange will handle the rest
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const redirectUrl = typeof window !== "undefined"
        ? `${window.location.origin}/directory`
        : undefined;

      const { error: resetError } = await getSupabaseBrowser().auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });

      if (resetError) {
        setError(resetError.message);
      } else {
        setState("reset-sent");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (state === "loading") {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="w-8 h-8 border border-forest-200 border-t-forest-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (state === "onboarding") {
    return (
      <OnboardingFlow
        email={authedEmail}
        onComplete={() => {
          // After onboarding, check if profile is complete
          verifyMembership(authedEmail);
        }}
      />
    );
  }

  if (state === "profile-incomplete") {
    return (
      <ProfileCompleter
        email={authedEmail}
        onComplete={() => setState("authenticated")}
      />
    );
  }

  if (state === "authenticated") {
    return <>{children}</>;
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
            onClick={async () => {
              await getSupabaseBrowser().auth.signOut();
              setState("login");
              setEmail("");
              setPassword("");
            }}
            className="text-[12px] uppercase tracking-wider text-ink-500 underline hover:text-ink-700"
          >
            Try a different email
          </button>
        </div>
      </div>
    );
  }

  if (state === "reset-sent") {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-6">
        <div className="w-full max-w-sm text-center">
          <p className="text-[11px] uppercase tracking-[0.3em] text-clay-500 font-mono mb-4">
            Check your inbox
          </p>
          <h1 className="text-3xl font-serif text-ink-900 mb-3">
            Reset link sent.
          </h1>
          <p className="text-[14px] text-ink-400 mb-2">
            We sent a password reset link to
          </p>
          <p className="text-[14px] text-ink-900 font-medium mb-6">{email}</p>
          <button
            onClick={() => setState("login")}
            className="text-[12px] uppercase tracking-wider text-ink-500 underline hover:text-ink-700"
          >
            Back to login
          </button>
        </div>
      </div>
    );
  }

  // Login / Signup / Forgot password forms
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <p className="text-[11px] uppercase tracking-[0.3em] text-clay-500 font-mono mb-4">
            Members Only
          </p>
          <h1 className="text-3xl font-serif text-ink-900 mb-3">
            {state === "signup" ? "Create Account" : state === "forgot" ? "Reset Password" : "Welcome Back"}
          </h1>
          <p className="text-[14px] text-ink-400">
            {state === "signup"
              ? "Set up your login for the Myca member portal."
              : state === "forgot"
              ? "Enter your email and we'll send a reset link."
              : "Sign in to access the directory and chat."}
          </p>
        </div>

        <form onSubmit={state === "signup" ? handleSignup : state === "forgot" ? handleForgotPassword : handleLogin}>
          <div className="space-y-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              required
              autoFocus
              className="w-full px-4 py-3 text-[14px] border border-ink-200 bg-white text-ink-900 placeholder-ink-300 focus:outline-none focus:border-forest-400"
            />
            {state !== "forgot" && (
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                required
                className="w-full px-4 py-3 text-[14px] border border-ink-200 bg-white text-ink-900 placeholder-ink-300 focus:outline-none focus:border-forest-400"
              />
            )}
          </div>

          {error && (
            <p className="text-[13px] text-rust-500 mt-3">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full mt-4 py-3 text-[12px] uppercase tracking-wider font-medium text-cream bg-forest-900 hover:bg-forest-700 disabled:opacity-50 transition-colors"
          >
            {submitting
              ? "..."
              : state === "signup"
              ? "Create Account"
              : state === "forgot"
              ? "Send Reset Link"
              : "Sign In"}
          </button>
        </form>

        <div className="mt-6 text-center space-y-2">
          {state === "login" && (
            <>
              <button
                onClick={() => { setState("signup"); setError(""); }}
                className="block w-full text-[13px] text-ink-500 hover:text-ink-700"
              >
                First time? <span className="underline">Create an account</span>
              </button>
              <button
                onClick={() => { setState("forgot"); setError(""); }}
                className="block w-full text-[13px] text-ink-400 hover:text-ink-600"
              >
                Forgot password?
              </button>
            </>
          )}
          {(state === "signup" || state === "forgot") && (
            <button
              onClick={() => { setState("login"); setError(""); }}
              className="block w-full text-[13px] text-ink-500 hover:text-ink-700"
            >
              Already have an account? <span className="underline">Sign in</span>
            </button>
          )}
          <p className="text-[12px] text-ink-300 mt-4">
            Not a member?{" "}
            <Link href="/join" className="text-ink-600 underline">
              Apply here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

// ------ Profile Completer: forces skills + interests before entry ------

const SKILL_SUGGESTIONS = [
  "Product", "Engineering", "Design", "Marketing", "Sales", "Operations",
  "Finance", "Fundraising", "Brand", "Content", "Community", "Supply Chain",
  "R&D", "Culinary", "Retail", "E-commerce", "Partnerships", "PR",
];

const INTEREST_SUGGESTIONS = [
  "Plant-Based", "Sustainability", "Regenerative Ag", "Functional Foods",
  "Fermentation", "Zero Waste", "Wellness", "Climate", "Food Justice",
  "Hospitality", "Wine", "Coffee", "Spirits", "Snacks", "Beverages",
  "Restaurants", "Travel", "Foraging", "Female Founders",
];

const parseTags = (s: string) => s.split(",").map((t) => t.trim()).filter(Boolean);
const tagsToStr = (tags: string[]) => tags.join(", ");

function MiniTagInput({
  tags,
  setTags,
  suggestions,
  placeholder,
  color,
}: {
  tags: string[];
  setTags: (t: string[]) => void;
  suggestions: string[];
  placeholder: string;
  color: "forest" | "clay";
}) {
  const [input, setInput] = useState("");

  const add = (tag: string) => {
    const t = tag.trim();
    if (t && !tags.includes(t)) setTags([...tags, t]);
    setInput("");
  };

  const remove = (tag: string) => setTags(tags.filter((t) => t !== tag));

  const chipBg = color === "forest" ? "bg-forest-100 text-forest-800" : "bg-clay-100 text-clay-800";
  const activeBg = color === "forest" ? "bg-forest-900" : "bg-clay-600";
  const hoverBorder = color === "forest" ? "hover:border-forest-400" : "hover:border-clay-400";

  return (
    <div>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {tags.map((tag) => (
            <span key={tag} className={`inline-flex items-center gap-1 px-2.5 py-1 text-[11px] ${chipBg}`}>
              {tag}
              <button type="button" onClick={() => remove(tag)} className="ml-0.5 opacity-60 hover:opacity-100">x</button>
            </span>
          ))}
        </div>
      )}
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === ",") && input.trim()) {
            e.preventDefault();
            add(input.replace(",", ""));
          }
          if (e.key === "Backspace" && !input && tags.length > 0) remove(tags[tags.length - 1]);
        }}
        placeholder={tags.length > 0 ? "Add more..." : placeholder}
        className="w-full px-4 py-3 text-[14px] border border-ink-200 bg-white text-ink-900 placeholder-ink-300 focus:outline-none focus:border-forest-400 transition-colors"
      />
      <div className="flex flex-wrap gap-1.5 mt-2">
        {suggestions.map((s) => {
          const active = tags.includes(s);
          return (
            <button
              key={s}
              type="button"
              onClick={() => active ? remove(s) : add(s)}
              className={`px-2.5 py-1 text-[11px] transition-colors ${
                active ? `${activeBg} text-cream` : `bg-white text-ink-500 border border-ink-200 ${hoverBorder}`
              }`}
            >
              {s}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ProfileCompleter({
  email,
  onComplete,
}: {
  email: string;
  onComplete: () => void;
}) {
  const [skills, setSkills] = useState<string[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  // Load existing values
  useEffect(() => {
    getSupabaseBrowser()
      .from("contacts")
      .select("skills, interests")
      .eq("email", email)
      .single()
      .then(({ data }) => {
        if (data?.skills) setSkills(parseTags(data.skills));
        if (data?.interests) setInterests(parseTags(data.interests));
      });
  }, [email]);

  const canSave = skills.length >= 1 && interests.length >= 1;

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);

    await fetch(`/api/profile?email=${encodeURIComponent(email)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        skills: tagsToStr(skills),
        interests: tagsToStr(interests),
      }),
    });

    setSaving(false);
    onComplete();
  };

  return (
    <div className="min-h-screen bg-ivory flex items-center justify-center px-6">
      <div className="w-full max-w-lg">
        <div className="text-center mb-10">
          <p className="text-[11px] uppercase tracking-[0.3em] text-forest-500 font-mono mb-3">
            Complete Your Profile
          </p>
          <h1 className="text-3xl font-serif text-ink-900 mb-3">
            Add your skills &amp; interests.
          </h1>
          <p className="text-[14px] text-ink-400">
            This helps us connect you with the right people. Add at least one of each.
          </p>
        </div>

        <div className="space-y-6">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-ink-400 font-mono mb-3">
              Skills
              {skills.length === 0 && (
                <span className="ml-2 text-[9px] text-rust-500 normal-case tracking-normal">
                  Add at least 1
                </span>
              )}
            </p>
            <MiniTagInput
              tags={skills}
              setTags={setSkills}
              suggestions={SKILL_SUGGESTIONS}
              placeholder="Type a skill and press Enter..."
              color="forest"
            />
          </div>

          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-ink-400 font-mono mb-3">
              Interests
              {interests.length === 0 && (
                <span className="ml-2 text-[9px] text-rust-500 normal-case tracking-normal">
                  Add at least 1
                </span>
              )}
            </p>
            <MiniTagInput
              tags={interests}
              setTags={setInterests}
              suggestions={INTEREST_SUGGESTIONS}
              placeholder="Type an interest and press Enter..."
              color="clay"
            />
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={!canSave || saving}
          className="w-full mt-8 py-3.5 text-[12px] uppercase tracking-wider font-medium text-cream bg-forest-900 hover:bg-forest-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? "Saving..." : canSave ? "Continue to Myca" : "Add at least 1 skill and 1 interest"}
        </button>
      </div>
    </div>
  );
}
