import Link from "next/link";
import Image from "next/image";

import { AuthControls } from "@/components/layout/auth-controls";
import { MobileNav } from "@/components/layout/mobile-nav";
import { RegionSelector } from "@/components/layout/region-selector";

export function Header({ country }: { country: string }) {
  return (
    <header className="fixed top-0 z-50 w-full px-3 pt-3 md:px-4">
      <div className="mx-auto flex h-[5.3rem] max-w-7xl items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#070b14]/82 px-3 shadow-[0_18px_35px_-24px_rgba(0,0,0,0.9)] backdrop-blur-xl md:px-5">
        <div className="flex items-center gap-3 md:gap-5">
          <Link href="/" className="surface-card flex items-center justify-center px-2 py-1.5" aria-label="WASDrop home">
            <Image src="/images/logo-main.png" alt="WASDrop" width={672} height={465} className="block h-10 w-auto md:h-12" priority />
          </Link>
          <nav className="hud-strip hidden items-center gap-5 px-4 py-2 md:flex">
            <Link href="/deals" className="nav-link text-xs font-bold uppercase tracking-[0.14em]">
              Deals
            </Link>
            <Link href="/freebies" className="nav-link text-xs font-bold uppercase tracking-[0.14em]">
              Freebies
            </Link>
            <Link href="/news" className="nav-link text-xs font-bold uppercase tracking-[0.14em]">
              News
            </Link>
            <Link href="/chat" className="nav-link text-xs font-bold uppercase tracking-[0.14em]">
              AI Chat
            </Link>
            <Link href="/about" className="nav-link text-xs font-bold uppercase tracking-[0.14em]">
              About
            </Link>
            <Link href="/contact" className="nav-link text-xs font-bold uppercase tracking-[0.14em]">
              Contact
            </Link>
          </nav>
        </div>
        <div className="hidden items-center gap-3 md:flex">
          <RegionSelector country={country} />
          <AuthControls />
        </div>
        <MobileNav country={country} />
      </div>
    </header>
  );
}
