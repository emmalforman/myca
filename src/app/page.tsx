import Link from "next/link";

export default function Home() {
  return (
    <div>
      {/* Hero */}
      <section className="relative">
        <div className="absolute inset-0 bg-ink-950" />
        <div className="relative max-w-6xl mx-auto px-6 lg:px-8 py-28 sm:py-36 lg:py-44">
          <p className="text-[11px] uppercase tracking-[0.3em] text-clay-400 font-mono mb-6">
            Members-only collective
          </p>
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-serif text-white leading-[1.1] mb-8 max-w-4xl">
            The inner circle of
            <br />
            food & CPG.
          </h1>
          <p className="text-lg text-ink-400 leading-relaxed max-w-xl mb-12">
            Myca brings together the founders, operators, and investors building
            the brands you&apos;ll see everywhere tomorrow. We meet IRL, make
            warm intros, and open doors.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/join"
              className="inline-flex items-center px-8 py-3.5 text-sm tracking-wide uppercase font-medium text-ink-950 bg-clay-100 hover:bg-white transition-colors"
            >
              Apply for Membership
            </Link>
            <Link
              href="/directory"
              className="inline-flex items-center px-8 py-3.5 text-sm tracking-wide uppercase font-medium text-clay-200 border border-ink-700 hover:border-clay-400 transition-colors"
            >
              View Directory
            </Link>
          </div>
        </div>
      </section>

      {/* Metrics */}
      <section className="bg-ink-900 border-t border-ink-800">
        <div className="max-w-6xl mx-auto px-6 lg:px-8 py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: "289", label: "Members" },
              { value: "5", label: "Cities" },
              { value: "10+", label: "Events Hosted" },
              { value: "200+", label: "Intros Made" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-3xl sm:text-4xl font-serif text-white mb-1">
                  {stat.value}
                </p>
                <p className="text-[11px] uppercase tracking-[0.2em] text-ink-500 font-mono">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What is Myca */}
      <section className="py-24 sm:py-32 bg-ivory">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="max-w-2xl mb-16">
            <p className="text-[11px] uppercase tracking-[0.3em] text-clay-500 font-mono mb-4">
              What we do
            </p>
            <h2 className="text-3xl sm:text-4xl font-serif text-ink-900 leading-tight">
              A private community built
              <br />
              on real relationships.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                title: "IRL Gatherings",
                desc: "Intimate dinners, tastings, happy hours, and coworking sessions across NYC, SF, LA, London, and Chicago. No panels. No name tags.",
                icon: (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                ),
              },
              {
                title: "Warm Introductions",
                desc: "Every member is vetted. When you need to meet someone — a co-packer, an investor, a retail buyer — we make it happen through trusted connections.",
                icon: (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                ),
              },
              {
                title: "Asks & Offers",
                desc: "Every member brings something to the table and needs something in return. We match makers with seekers — co-founders, capital, distribution, talent.",
                icon: (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                ),
              },
            ].map((item) => (
              <div
                key={item.title}
                className="group p-8 bg-white border border-ink-100 hover:border-ink-200 transition-all"
              >
                <svg
                  className="w-8 h-8 text-ink-300 mb-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  {item.icon}
                </svg>
                <h3 className="text-lg font-serif text-ink-900 mb-3">
                  {item.title}
                </h3>
                <p className="text-sm text-ink-500 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cities */}
      <section className="py-24 sm:py-32 bg-parchment">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <p className="text-[11px] uppercase tracking-[0.3em] text-clay-500 font-mono mb-4 text-center">
            Where we gather
          </p>
          <h2 className="text-3xl sm:text-4xl font-serif text-ink-900 text-center mb-14">
            Five cities. One community.
          </h2>
          <div className="grid grid-cols-5 gap-4">
            {[
              { city: "New York", abbr: "NYC" },
              { city: "San Francisco", abbr: "SF" },
              { city: "Los Angeles", abbr: "LA" },
              { city: "London", abbr: "LDN" },
              { city: "Chicago", abbr: "CHI" },
            ].map((item) => (
              <div
                key={item.city}
                className="bg-white border border-ink-100 p-6 text-center group hover:bg-ink-900 hover:border-ink-900 transition-all duration-300 cursor-default"
              >
                <p className="text-2xl font-serif text-ink-900 group-hover:text-white transition-colors mb-1">
                  {item.abbr}
                </p>
                <p className="text-[10px] uppercase tracking-[0.2em] text-ink-400 group-hover:text-ink-500 transition-colors font-mono">
                  {item.city}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Member types */}
      <section className="py-24 sm:py-32 bg-ivory">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center mb-14">
            <p className="text-[11px] uppercase tracking-[0.3em] text-clay-500 font-mono mb-4">
              Our members
            </p>
            <h2 className="text-3xl sm:text-4xl font-serif text-ink-900">
              Builders across the spectrum.
            </h2>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {[
              "CPG Founders",
              "Investors & VCs",
              "Operators",
              "Brand Builders",
              "Food Creators",
              "Retail Buyers",
              "Supply Chain",
              "Food Tech",
              "Chefs & Culinary",
              "Marketing & Growth",
            ].map((tag) => (
              <span
                key={tag}
                className="px-5 py-2.5 text-[13px] text-ink-600 border border-ink-200 hover:border-ink-900 hover:text-ink-900 transition-colors cursor-default"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-ink-950">
        <div className="max-w-3xl mx-auto px-6 lg:px-8 py-24 sm:py-32 text-center">
          <p className="text-[11px] uppercase tracking-[0.3em] text-clay-500 font-mono mb-6">
            Join the collective
          </p>
          <h2 className="text-3xl sm:text-4xl font-serif text-white mb-6">
            Know someone? Good.
          </h2>
          <p className="text-ink-400 mb-10 max-w-md mx-auto">
            Applications are reviewed weekly. If you&apos;re building in food &
            CPG, we want to hear from you.
          </p>
          <Link
            href="/join"
            className="inline-flex items-center px-10 py-4 text-sm tracking-wide uppercase font-medium text-ink-950 bg-clay-100 hover:bg-white transition-colors"
          >
            Apply Now
          </Link>
        </div>
      </section>
    </div>
  );
}
