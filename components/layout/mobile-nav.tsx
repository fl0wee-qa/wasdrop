"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";

import { AuthControls } from "@/components/layout/auth-controls";
import { RegionSelector } from "@/components/layout/region-selector";
import { Button } from "@/components/ui/button";

const links = [
  { href: "/deals", label: "Deals" },
  { href: "/freebies", label: "Freebies" },
  { href: "/news", label: "News" },
  { href: "/chat", label: "AI Chat" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function MobileNav({ country }: { country: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <Button
        variant="outline"
        size="icon"
        className="border-white/15 bg-transparent text-zinc-100 hover:bg-white/5"
        aria-label={open ? "Close menu" : "Open menu"}
        onClick={() => setOpen((value) => !value)}
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {open ? (
        <div
          data-testid="mobile-nav-drawer"
          className="absolute left-0 top-[5.7rem] w-full border border-white/10 bg-[#070c16]/95 px-4 pb-5 pt-4 backdrop-blur-xl rounded-b-2xl shadow-[0_20px_35px_-25px_rgba(0,0,0,0.9)]"
        >
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-4">
            <nav className="grid grid-cols-2 gap-2">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-md border border-white/10 bg-black/30 px-3 py-2 text-sm font-semibold text-zinc-100"
                  onClick={() => setOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <RegionSelector country={country} mobile />
            <AuthControls mobile onNavigate={() => setOpen(false)} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
