import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-ink-900 text-ink-400">
      <div className="max-w-6xl mx-auto px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="md:col-span-2">
            <p className="text-2xl font-serif text-white mb-3">myca</p>
            <p className="text-sm leading-relaxed max-w-sm">
              A members-only collective for the people shaping the future of
              food, beverage, and consumer goods.
            </p>
          </div>

          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-ink-500 mb-4">
              Navigate
            </p>
            <div className="space-y-2.5">
              {[
                { href: "/", label: "Home" },
                { href: "/directory", label: "Directory" },
                { href: "/join", label: "Apply" },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block text-sm text-ink-400 hover:text-white transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-ink-500 mb-4">
              Cities
            </p>
            <div className="space-y-2.5 text-sm">
              <p>New York</p>
              <p>San Francisco</p>
              <p>Los Angeles</p>
              <p>London</p>
              <p>Chicago</p>
            </div>
          </div>
        </div>

        <div className="border-t border-ink-800 mt-14 pt-8 flex items-center justify-between">
          <p className="text-xs text-ink-600">
            &copy; {new Date().getFullYear()} Myca Collective
          </p>
          <p className="text-xs text-ink-600 font-mono">
            By invitation & application
          </p>
        </div>
      </div>
    </footer>
  );
}
