"use client";

export default function NewsletterPage() {
  return (
    <div className="min-h-screen bg-ivory">
      <div className="bg-forest-900">
        <div className="max-w-6xl mx-auto px-6 lg:px-8 py-14 sm:py-16">
          <p className="text-[11px] uppercase tracking-[0.3em] text-forest-300 font-mono mb-4">
            Stay in the loop
          </p>
          <h1 className="text-3xl sm:text-4xl font-serif text-cream mb-4">
            Newsletter
          </h1>
          <p className="text-[15px] text-forest-300 leading-relaxed max-w-xl mb-8">
            Subscribe to stay up to date on events, community news, and
            the latest from Myca Collective.
          </p>
          <iframe
            src="https://emmalforman.substack.com/embed"
            width="480"
            height="150"
            className="max-w-full border-0 bg-transparent"
            frameBorder={0}
            scrolling="no"
            title="Subscribe to newsletter"
          />
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-serif text-ink-900">
            Recent Posts
          </h2>
          <a
            href="https://substack.com/@emmalforman"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-2.5 text-[12px] uppercase tracking-wider font-medium text-cream bg-forest-900 hover:bg-forest-700 transition-colors"
          >
            View on Substack
          </a>
        </div>

        <div className="border border-ink-100 bg-white">
          <iframe
            src="https://substack.com/@emmalforman"
            className="w-full border-0"
            style={{ height: "calc(100vh - 120px)" }}
            title="Newsletter Posts"
          />
        </div>

        <p className="text-[12px] text-ink-300 mt-4 text-center">
          Having trouble viewing?{" "}
          <a
            href="https://substack.com/@emmalforman"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-ink-500"
          >
            Open directly on Substack
          </a>
        </p>
      </div>
    </div>
  );
}
