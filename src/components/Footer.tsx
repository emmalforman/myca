import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-stone-900 text-stone-300">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 bg-sage-600 rounded-full flex items-center justify-center">
                <span className="text-white font-serif font-bold">m</span>
              </div>
              <span className="text-lg font-serif font-semibold text-white">
                Myca Collective
              </span>
            </div>
            <p className="text-sm text-stone-400 leading-relaxed">
              A curated community of founders, operators, and investors in the
              food & CPG space. We gather IRL, make intros, and build together.
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              Navigate
            </h3>
            <div className="space-y-2.5">
              <Link
                href="/"
                className="block text-sm text-stone-400 hover:text-white transition-colors"
              >
                Home
              </Link>
              <Link
                href="/directory"
                className="block text-sm text-stone-400 hover:text-white transition-colors"
              >
                Member Directory
              </Link>
              <Link
                href="/join"
                className="block text-sm text-stone-400 hover:text-white transition-colors"
              >
                Join Us
              </Link>
            </div>
          </div>

          {/* Connect */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              Connect
            </h3>
            <div className="space-y-2.5 text-sm text-stone-400">
              <p>New York &middot; San Francisco &middot; Los Angeles</p>
              <p>London &middot; Chicago</p>
              <a
                href="mailto:hello@mycacollective.com"
                className="block hover:text-white transition-colors"
              >
                hello@mycacollective.com
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-stone-800 mt-12 pt-8 text-center">
          <p className="text-xs text-stone-500">
            &copy; {new Date().getFullYear()} Myca Collective. All rights
            reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
