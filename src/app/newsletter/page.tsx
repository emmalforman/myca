"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Post {
  title: string;
  link: string;
  date: string;
  description: string;
  image: string | null;
}

export default function NewsletterPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/newsletter")
      .then((r) => r.json())
      .then((data) => setPosts(data.posts || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-ivory">
      <div className="bg-forest-900">
        <div className="max-w-6xl mx-auto px-6 lg:px-8 py-14 sm:py-16">
          <p className="text-[11px] uppercase tracking-[0.3em] text-forest-300 font-mono mb-4">
            From the collective
          </p>
          <h1 className="text-3xl sm:text-4xl font-serif text-cream mb-4">
            The Inside Scoop
          </h1>
          <p className="text-[15px] text-forest-300 leading-relaxed max-w-xl mb-8">
            Event recaps, member spotlights, and the conversations shaping the
            future of food — straight from our community of 300+ founders,
            operators, and investors.
          </p>
          <div className="flex flex-wrap gap-4">
            <a
              href="https://emmalforman.substack.com/subscribe"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-8 py-3.5 text-sm tracking-wide uppercase font-medium text-forest-900 bg-cream hover:bg-white transition-colors"
            >
              Subscribe
            </a>
            <Link
              href="/join"
              className="inline-flex items-center px-8 py-3.5 text-sm tracking-wide uppercase font-medium text-forest-200 border border-forest-600 hover:border-cream hover:text-cream transition-colors"
            >
              Apply for Membership
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-serif text-ink-900">Latest Updates</h2>
          <a
            href="https://substack.com/@emmalforman"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-2.5 text-[12px] uppercase tracking-wider font-medium text-cream bg-forest-900 hover:bg-forest-700 transition-colors"
          >
            View Archive
          </a>
        </div>

        {loading && (
          <div className="text-center py-16">
            <div className="w-8 h-8 border border-forest-200 border-t-forest-600 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-[13px] text-ink-300 font-mono uppercase tracking-wider">
              Loading posts...
            </p>
          </div>
        )}

        {!loading && posts.length === 0 && (
          <div className="text-center py-16">
            <p className="font-serif text-xl text-ink-900 mb-2">
              No posts yet.
            </p>
            <p className="text-[13px] text-ink-400">
              Check back soon or{" "}
              <a
                href="https://substack.com/@emmalforman"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-ink-600"
              >
                visit Substack directly
              </a>
              .
            </p>
          </div>
        )}

        {!loading && posts.length > 0 && (
          <div className="space-y-6">
            {posts.slice(0, 3).map((post, i) => (
              <a
                key={i}
                href={post.link}
                target="_blank"
                rel="noopener noreferrer"
                className="block bg-white border border-ink-100 hover:border-ink-200 transition-colors group"
              >
                <div className="flex flex-col sm:flex-row">
                  {post.image && (
                    <div className="sm:w-64 sm:flex-shrink-0">
                      <img
                        src={post.image}
                        alt=""
                        className="w-full h-48 sm:h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="p-6 flex-1">
                    {post.date && (
                      <p className="text-[11px] text-ink-300 font-mono uppercase tracking-wider mb-2">
                        {formatDate(post.date)}
                      </p>
                    )}
                    <h3 className="text-lg font-serif text-ink-900 group-hover:text-forest-700 transition-colors mb-2">
                      {post.title}
                    </h3>
                    {post.description && (
                      <p className="text-[14px] text-ink-400 leading-relaxed line-clamp-2">
                        {post.description}
                      </p>
                    )}
                    <span className="inline-block mt-4 text-[12px] uppercase tracking-wider text-forest-600 group-hover:text-forest-800 transition-colors">
                      Read more
                    </span>
                  </div>
                </div>
              </a>
            ))}

            {/* Blurred preview + dual CTA */}
            {posts.length > 3 && (
              <div className="relative">
                <div className="space-y-6 overflow-hidden max-h-72">
                  <div className="pointer-events-none select-none blur-[3px] opacity-50">
                    {posts.slice(3, 6).map((post, i) => (
                      <div
                        key={i}
                        className="bg-white border border-ink-100 mb-6"
                      >
                        <div className="flex flex-col sm:flex-row">
                          {post.image && (
                            <div className="sm:w-64 sm:flex-shrink-0">
                              <img
                                src={post.image}
                                alt=""
                                className="w-full h-48 sm:h-full object-cover"
                              />
                            </div>
                          )}
                          <div className="p-6 flex-1">
                            {post.date && (
                              <p className="text-[11px] text-ink-300 font-mono uppercase tracking-wider mb-2">
                                {formatDate(post.date)}
                              </p>
                            )}
                            <h3 className="text-lg font-serif text-ink-900 mb-2">
                              {post.title}
                            </h3>
                            {post.description && (
                              <p className="text-[14px] text-ink-400 leading-relaxed line-clamp-2">
                                {post.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-ivory via-ivory/95 to-transparent flex items-end justify-center pb-10">
                  <div className="text-center max-w-md">
                    <p className="text-[11px] uppercase tracking-[0.3em] text-ink-300 font-mono mb-3">
                      Members get the full picture
                    </p>
                    <p className="font-serif text-xl text-ink-900 mb-2">
                      Event invites, intros, and insider updates.
                    </p>
                    <p className="text-[13px] text-ink-400 mb-6">
                      Join 300+ women in food and CPG who get early access to
                      events, curated introductions, and community-only content.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <Link
                        href="/join"
                        className="inline-flex items-center justify-center px-8 py-3.5 text-sm tracking-wide uppercase font-medium text-cream bg-forest-900 hover:bg-forest-700 transition-colors"
                      >
                        Apply for Membership
                      </Link>
                      <a
                        href="https://emmalforman.substack.com/subscribe"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center px-8 py-3.5 text-sm tracking-wide uppercase font-medium text-ink-600 border border-ink-200 hover:border-ink-400 hover:text-ink-800 transition-colors"
                      >
                        Subscribe
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
