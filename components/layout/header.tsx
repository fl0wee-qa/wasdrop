import Link from "next/link";

import { AuthControls } from "@/components/layout/auth-controls";
import { MobileNav } from "@/components/layout/mobile-nav";
import { RegionSelector } from "@/components/layout/region-selector";

export function Header({ country }: { country: string }) {
  return (
    <header className="fixed top-0 z-50 w-full border-b border-white/5 bg-[#0b0f16]/80 backdrop-blur-md">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-3 px-4 md:px-6">
        <div className="flex items-center gap-6 md:gap-12">
          <Link href="/" className="text-2xl font-extrabold tracking-tighter text-white">
            WAS<span className="text-cyan-300">DROP</span>
          </Link>
          <nav className="hidden items-center gap-8 md:flex">
            <Link href="/deals" className="nav-link text-sm font-semibold">
              Deals
            </Link>
            <Link href="/freebies" className="nav-link text-sm font-semibold">
              Freebies
            </Link>
            <Link href="/news" className="nav-link text-sm font-semibold">
              News
            </Link>
            <Link href="/chat" className="nav-link text-sm font-semibold">
              AI Chat
            </Link>
            <Link href="/about" className="nav-link text-sm font-semibold">
              About
            </Link>
            <Link href="/contact" className="nav-link text-sm font-semibold">
              Contact
            </Link>
          </nav>
        </div>
        <div className="hidden items-center gap-6 md:flex">
          <RegionSelector country={country} />
          <AuthControls />
        </div>
        <MobileNav country={country} />
      </div>
    </header>
  );
}
