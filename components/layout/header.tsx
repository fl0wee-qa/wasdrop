import Link from "next/link";
import Image from "next/image";

import { AuthControls } from "@/components/layout/auth-controls";
import { MobileNav } from "@/components/layout/mobile-nav";
import { RegionSelector } from "@/components/layout/region-selector";

export function Header({ country }: { country: string }) {
  return (
    <header className="fixed top-0 z-50 w-full border-b border-white/5 bg-[#0b0f16]/80 backdrop-blur-md">
      <div className="mx-auto flex h-32 max-w-7xl items-center justify-between gap-3 px-4 md:h-36 md:px-6">
        <div className="flex items-center gap-6 md:gap-12">
          <Link href="/" className="flex items-center" aria-label="WASDrop home">
            <Image src="/images/logo.png" alt="WASDrop" width={960} height={240} className="h-28 w-auto md:h-32" priority />
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
