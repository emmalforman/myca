import Link from "next/link";

export default function Home() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-sage-50 via-cream to-warm-100" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32 lg:py-40">
          <div className="max-w-3xl">
            <p className="text-sm font-medium text-sage-600 uppercase tracking-widest mb-4">
              A curated community
            </p>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold text-stone-900 leading-tight mb-6">
              Where food people
              <br />
              <span className="text-sage-600">find their people.</span>
            </h1>
            <p className="text-lg sm:text-xl text-stone-600 leading-relaxed mb-10 max-w-2xl">
              Myca Collective brings together founders, operators, and investors
              in food & CPG. We meet IRL, make intros, and help each other
              build&mdash;across New York, San Francisco, Los Angeles, London,
              and Chicago.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/join"
                className="inline-flex items-center px-7 py-3.5 text-sm font-semibold text-white bg-sage-600 rounded-full hover:bg-sage-700 transition-colors shadow-sm"
              >
                Apply to Join
              </Link>
              <Link
                href="/directory"
                className="inline-flex items-center px-7 py-3.5 text-sm font-semibold text-sage-700 bg-white border border-sage-200 rounded-full hover:bg-sage-50 transition-colors"
              >
                Browse the Directory
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* What We Do */}
      <section className="py-20 sm:py-28 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-stone-900 mb-4">
              Built for the food world
            </h2>
            <p className="text-lg text-stone-500">
              Myca is the connective tissue between the people building the
              future of food and consumer goods.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 bg-warm-50 rounded-2xl border border-warm-100">
              <div className="w-12 h-12 bg-terracotta-100 rounded-xl flex items-center justify-center mb-5">
                <svg className="w-6 h-6 text-terracotta-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-serif font-semibold text-stone-900 mb-2">
                IRL Gatherings
              </h3>
              <p className="text-stone-500 leading-relaxed">
                Happy hours, coworking days, tastings, and showcases in cities
                where our members live. We believe the best connections happen
                in person.
              </p>
            </div>

            <div className="p-8 bg-sage-50 rounded-2xl border border-sage-100">
              <div className="w-12 h-12 bg-sage-100 rounded-xl flex items-center justify-center mb-5">
                <svg className="w-6 h-6 text-sage-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-xl font-serif font-semibold text-stone-900 mb-2">
                Warm Introductions
              </h3>
              <p className="text-stone-500 leading-relaxed">
                Our directory connects you to the right people&mdash;investors,
                co-founders, mentors, and collaborators. Search, filter, and
                reach out directly.
              </p>
            </div>

            <div className="p-8 bg-warm-50 rounded-2xl border border-warm-100">
              <div className="w-12 h-12 bg-warm-200 rounded-xl flex items-center justify-center mb-5">
                <svg className="w-6 h-6 text-warm-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-xl font-serif font-semibold text-stone-900 mb-2">
                Asks & Offers
              </h3>
              <p className="text-stone-500 leading-relaxed">
                Every member brings something to the table. Share what you need,
                offer what you know, and watch the community rally around you.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Cities */}
      <section className="py-20 sm:py-28 bg-cream">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-stone-900 mb-4 text-center">
            Where we gather
          </h2>
          <p className="text-lg text-stone-500 text-center mb-12 max-w-xl mx-auto">
            We love IRL time. Our members are based in these cities, and we host
            events in each.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {[
              { city: "New York", emoji: "🗽" },
              { city: "San Francisco", emoji: "🌉" },
              { city: "Los Angeles", emoji: "🎬" },
              { city: "London", emoji: "🇬🇧" },
              { city: "Chicago", emoji: "🍕" },
            ].map((item) => (
              <div
                key={item.city}
                className="bg-white rounded-2xl border border-warm-100 p-6 text-center hover:shadow-md transition-shadow"
              >
                <span className="text-4xl mb-3 block">{item.emoji}</span>
                <p className="font-serif font-semibold text-stone-900">
                  {item.city}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Members snapshot */}
      <section className="py-20 sm:py-28 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-sage-600 to-sage-800 rounded-3xl p-10 sm:p-16 text-center">
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-white mb-4">
              200+ members and growing
            </h2>
            <p className="text-lg text-sage-100 mb-4 max-w-xl mx-auto">
              Founders, investors, operators, creatives, and everything in
              between. All united by a love of food and building.
            </p>
            <div className="flex flex-wrap justify-center gap-3 mb-10 text-sm">
              {[
                "CPG Founders",
                "Investors",
                "Operators",
                "Food Creators",
                "Brand Builders",
                "Chefs & Culinary",
              ].map((tag) => (
                <span
                  key={tag}
                  className="px-4 py-1.5 bg-white/15 text-white rounded-full backdrop-blur-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
            <Link
              href="/directory"
              className="inline-flex items-center px-8 py-3.5 text-sm font-semibold text-sage-800 bg-white rounded-full hover:bg-sage-50 transition-colors shadow-sm"
            >
              Explore the Directory
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 sm:py-28 bg-cream">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-stone-900 mb-4">
            Ready to join?
          </h2>
          <p className="text-lg text-stone-500 mb-8">
            We&apos;re always looking for passionate people in the food and CPG
            space. Applications are reviewed on a rolling basis.
          </p>
          <Link
            href="/join"
            className="inline-flex items-center px-8 py-4 text-base font-semibold text-white bg-sage-600 rounded-full hover:bg-sage-700 transition-colors shadow-sm"
          >
            Apply to Myca Collective
          </Link>
        </div>
      </section>
    </div>
  );
}
