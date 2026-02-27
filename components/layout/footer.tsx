import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-white/5 bg-[#070a0f] pb-10 pt-16">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="mb-10 flex flex-col justify-between gap-8 md:flex-row md:items-start">
          <div>
            <Link href="/" className="mb-3 block text-2xl font-extrabold tracking-tighter text-white">
              WAS<span className="text-cyan-300">DROP</span>
            </Link>
            <p className="max-w-sm text-sm text-slate-500">
              Premium aggregator for PC game discounts, freebies, and gamer-relevant industry updates.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-10 sm:grid-cols-3">
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-white">Platform</p>
              <div className="space-y-2 text-sm text-slate-500">
                <Link href="/deals" className="block hover:text-cyan-300">
                  Deals
                </Link>
                <Link href="/freebies" className="block hover:text-cyan-300">
                  Freebies
                </Link>
                <Link href="/news" className="block hover:text-cyan-300">
                  News
                </Link>
              </div>
            </div>
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-white">Legal</p>
              <div className="space-y-2 text-sm text-slate-500">
                <Link href="/privacy" className="block hover:text-cyan-300">
                  Privacy
                </Link>
                <Link href="/terms" className="block hover:text-cyan-300">
                  Terms
                </Link>
                <Link href="/cookies" className="block hover:text-cyan-300">
                  Cookies
                </Link>
              </div>
            </div>
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-white">Support</p>
              <div className="space-y-2 text-sm text-slate-500">
                <Link href="/dmca" className="block hover:text-cyan-300">
                  DMCA
                </Link>
                <Link href="/attribution" className="block hover:text-cyan-300">
                  Attribution
                </Link>
                <Link href="/contact" className="block hover:text-cyan-300">
                  Contact
                </Link>
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-start justify-between gap-3 border-t border-white/5 pt-6 text-[10px] font-bold uppercase tracking-widest text-slate-600 md:flex-row md:items-center">
          <p>WASDrop (c) {new Date().getFullYear()} All Rights Reserved</p>
          <div className="flex gap-5">
            <span>Twitter / X</span>
            <span>Discord</span>
            <span>Steam Community</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
