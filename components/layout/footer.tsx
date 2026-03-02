import Link from "next/link";
import Image from "next/image";

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[linear-gradient(180deg,#060912_0%,#03050b_100%)] pb-10 pt-14">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="section-frame mb-8 p-5 md:p-7">
          <div className="mb-8 flex flex-col justify-between gap-8 md:flex-row md:items-start">
            <div>
              <Link href="/" className="mb-3 inline-flex items-center justify-center" aria-label="WASDrop home">
                <Image src="/images/logo-main.png" alt="WASDrop" width={672} height={465} className="block h-12 w-auto md:h-14" />
              </Link>
              <p className="max-w-sm text-sm text-slate-400">
                Premium aggregator for PC game discounts, freebies, and gamer-relevant industry updates.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="zone-badge">Terraria</span>
                <span className="zone-badge">Cyberpunk</span>
                <span className="zone-badge">Shooter</span>
                <span className="zone-badge">Adventure</span>
                <span className="zone-badge">Mythic</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-10 sm:grid-cols-3">
              <div>
                <p className="mb-3 text-xs font-bold uppercase tracking-widest text-white">Platform</p>
                <div className="space-y-2 text-sm text-slate-400">
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
                <div className="space-y-2 text-sm text-slate-400">
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
                <div className="space-y-2 text-sm text-slate-400">
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

          <div className="flex flex-col items-start justify-between gap-3 border-t border-white/10 pt-5 text-[10px] font-bold uppercase tracking-widest text-slate-500 md:flex-row md:items-center">
            <p>WASDrop (c) {new Date().getFullYear()} All Rights Reserved</p>
            <div className="flex gap-5">
              <span>Twitter / X</span>
              <span>Discord</span>
              <span>Steam Community</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
