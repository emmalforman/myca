import Link from "next/link";
import AnimatedCounter from "@/components/AnimatedCounter";
import ScrollReveal from "@/components/ScrollReveal";

export default function Home() {
  return (
    <div>
      {/* Hero */}
      <section className="relative">
        <div className="absolute inset-0 bg-forest-900" />
        <div className="relative max-w-6xl mx-auto px-6 lg:px-8 py-28 sm:py-36 lg:py-44">
          <p className="text-[11px] uppercase tracking-[0.3em] text-forest-300 font-mono mb-6">
            A curated community for food & CPG
          </p>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif text-cream leading-[1.15] mb-8 max-w-4xl">
            A global network connecting women building the future of food.
          </h1>
          <p className="text-lg text-forest-300 leading-relaxed max-w-xl mb-12">
            Myca Collective connects the founders, operators, and investors
            shaping food, beverage, and consumer goods. We meet in person, make
            meaningful introductions, and help each other grow.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/join"
              className="inline-flex items-center px-8 py-3.5 text-sm tracking-wide uppercase font-medium text-forest-900 bg-cream hover:bg-white transition-colors"
            >
              Apply for Membership
            </Link>
            <Link
              href="/directory"
              className="inline-flex items-center px-8 py-3.5 text-sm tracking-wide uppercase font-medium text-forest-200 border border-forest-600 hover:border-cream hover:text-cream transition-colors"
            >
              Member Login
            </Link>
          </div>
        </div>
      </section>

      {/* Metrics */}
      <section className="bg-forest-950 border-t border-forest-800">
        <div className="max-w-6xl mx-auto px-6 lg:px-8 py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { end: 250, suffix: "+", label: "Members" },
              { end: 5, suffix: "", label: "Cities" },
              { end: 10, suffix: "+", label: "Events Hosted" },
              { end: 200, suffix: "+", label: "Intros Made" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-3xl sm:text-4xl font-serif text-cream mb-1">
                  <AnimatedCounter end={stat.end} suffix={stat.suffix} duration={2200} />
                </p>
                <p className="text-[11px] uppercase tracking-[0.2em] text-forest-500 font-mono">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What We Do */}
      <section className="py-24 sm:py-32 bg-ivory">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <ScrollReveal>
            <div className="max-w-2xl mb-16">
              <p className="text-[11px] uppercase tracking-[0.3em] text-forest-500 font-mono mb-4">
                What we do
              </p>
              <h2 className="text-3xl sm:text-4xl font-serif text-forest-900 leading-tight">
                Real relationships, not another networking group.
              </h2>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                title: "IRL Gatherings",
                desc: "Intimate dinners, tastings, coworking sessions, and happy hours across New York, San Francisco, Los Angeles, London, and Chicago. No stages. No sponsors. Just good people and great food.",
                icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />,
              },
              {
                title: "Warm Introductions",
                desc: "Need a co-packer? An investor? A retail buyer? Every member is vetted and connected through people they trust. We facilitate introductions that actually lead somewhere.",
                icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />,
              },
              {
                title: "Member Directory & Chat",
                desc: "Browse 250+ profiles, filter by role and city, and reach out directly. Our members-only chat channels keep the conversation going between events.",
                icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />,
              },
            ].map((item, i) => (
              <ScrollReveal key={item.title} delay={i * 150}>
                <div className="group p-8 bg-white border border-forest-100 hover:border-forest-300 transition-all h-full">
                  <svg className="w-8 h-8 text-forest-400 mb-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    {item.icon}
                  </svg>
                  <h3 className="text-lg font-serif text-forest-900 mb-3">{item.title}</h3>
                  <p className="text-sm text-ink-500 leading-relaxed">{item.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Cities */}
      <section className="py-24 sm:py-32 bg-cream">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <ScrollReveal>
            <p className="text-[11px] uppercase tracking-[0.3em] text-forest-500 font-mono mb-4 text-center">
              Where we gather
            </p>
            <h2 className="text-3xl sm:text-4xl font-serif text-forest-900 text-center mb-14">
              Five cities. One community.
            </h2>
          </ScrollReveal>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            {[
              { city: "New York", abbr: "NYC" },
              { city: "San Francisco", abbr: "SF" },
              { city: "Los Angeles", abbr: "LA" },
              { city: "London", abbr: "LDN" },
              { city: "Chicago", abbr: "CHI" },
            ].map((item, i) => (
              <ScrollReveal key={item.city} delay={i * 100}>
                <div className="bg-white border border-forest-100 p-6 text-center group hover:bg-forest-900 hover:border-forest-900 transition-all duration-300 cursor-default">
                  <p className="text-2xl font-serif text-forest-900 group-hover:text-cream transition-colors mb-1">
                    {item.abbr}
                  </p>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-ink-400 group-hover:text-forest-400 transition-colors font-mono">
                    {item.city}
                  </p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Who joins */}
      <section className="py-24 sm:py-32 bg-ivory">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <ScrollReveal>
            <div className="max-w-2xl mx-auto text-center mb-14">
              <p className="text-[11px] uppercase tracking-[0.3em] text-forest-500 font-mono mb-4">
                Who joins Myca
              </p>
              <h2 className="text-3xl sm:text-4xl font-serif text-forest-900">
                The people behind the brands.
              </h2>
            </div>
          </ScrollReveal>
          <div className="flex flex-wrap justify-center gap-3">
            {[
              "CPG Founders", "Food & Beverage Investors", "Brand Operators",
              "Retail Buyers", "Food Creators & Chefs", "Supply Chain Leaders",
              "Food Tech Builders", "Growth & Marketing", "Media & Editorial",
              "Sustainability & Impact",
            ].map((tag, i) => (
              <ScrollReveal key={tag} delay={i * 60}>
                <span className="px-5 py-2.5 text-[13px] text-forest-700 border border-forest-200 hover:border-forest-700 hover:bg-forest-900 hover:text-cream transition-all duration-300 cursor-default inline-block">
                  {tag}
                </span>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-forest-900">
        <div className="max-w-3xl mx-auto px-6 lg:px-8 py-24 sm:py-32 text-center">
          <ScrollReveal>
            <p className="text-[11px] uppercase tracking-[0.3em] text-forest-400 font-mono mb-6">
              Membership is by application
            </p>
            <h2 className="text-3xl sm:text-4xl font-serif text-cream mb-6">
              Ready to join the table?
            </h2>
            <p className="text-forest-300 mb-10 max-w-md mx-auto">
              We review applications on a rolling basis. If you&apos;re building
              something meaningful in food and consumer goods, we&apos;d love to
              meet you.
            </p>
            <Link
              href="/join"
              className="inline-flex items-center px-10 py-4 text-sm tracking-wide uppercase font-medium text-forest-900 bg-cream hover:bg-white transition-colors"
            >
              Apply Now
            </Link>
          </ScrollReveal>
        </div>
      </section>
    </div>
  );
}
