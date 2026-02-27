"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

const CONSENT_KEY = "gdh-cookie-consent";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const id = window.requestAnimationFrame(() => {
      const value = localStorage.getItem(CONSENT_KEY);
      if (!value) {
        setVisible(true);
      }
    });

    return () => window.cancelAnimationFrame(id);
  }, []);

  if (!visible) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 rounded-lg border border-zinc-700 bg-zinc-900 p-4 shadow-xl md:left-auto md:max-w-xl">
      <p className="text-sm text-zinc-200">
        We use essential cookies for auth and region preferences, plus optional analytics cookies.
        Manage details on the <Link className="underline" href="/cookies">cookies page</Link>.
      </p>
      <div className="mt-3 flex gap-2">
        <Button
          size="sm"
          onClick={() => {
            localStorage.setItem(CONSENT_KEY, "accepted");
            setVisible(false);
          }}
        >
          Accept
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => {
            localStorage.setItem(CONSENT_KEY, "essential");
            setVisible(false);
          }}
        >
          Essential only
        </Button>
      </div>
    </div>
  );
}
