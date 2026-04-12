"use client";

import { useEffect } from "react";

export default function NewsletterPage() {
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://substackapi.com/widget.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (
    <div className="min-h-screen bg-ivory">
      <div className="bg-forest-900">
        <div className="max-w-6xl mx-auto px-6 lg:px-8 py-14 sm:py-16">
          <p className="text-[11px] uppercase tracking-[0.3em] text-forest-300 font-mono mb-4">
            Stay in the loop
          </p>
          <h1 className="text-3xl sm:text-4xl font-serif text-cream mb-4">
            AI Snack Club
          </h1>
          <p className="text-[15px] text-forest-300 leading-relaxed max-w-xl mb-8">
            Our newsletter covering the latest at the intersection of food,
            agriculture, and technology. Subscribe to get updates on events and
            community news.
          </p>
          <div id="custom-substack-embed" />
          <script
            dangerouslySetInnerHTML={{
              __html: `
                window.CustomSubstackWidget = {
                  substackUrl: "aisnackclub.substack.com",
                  placeholder: "Enter your email",
                  buttonText: "Subscribe",
                  theme: "custom",
                  colors: {
                    primary: "#FDFBF7",
                    input: "#1a3a2a",
                    email: "#FDFBF7",
                    text: "#1B2B1F",
                  },
                };
              `,
            }}
          />
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-serif text-ink-900">
            Events & Community
          </h2>
          <a
            href="https://aisnackclub.com/events"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-2.5 text-[12px] uppercase tracking-wider font-medium text-cream bg-forest-900 hover:bg-forest-700 transition-colors"
          >
            View All Events
          </a>
        </div>

        <div className="border border-ink-100 bg-white">
          <iframe
            src="https://aisnackclub.com/events"
            className="w-full border-0"
            style={{ height: "calc(100vh - 120px)" }}
            title="AI Snack Club Events"
          />
        </div>

        <p className="text-[12px] text-ink-300 mt-4 text-center">
          Having trouble viewing?{" "}
          <a
            href="https://aisnackclub.com/events"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-ink-500"
          >
            Open directly on AI Snack Club
          </a>
        </p>
      </div>
    </div>
  );
}
