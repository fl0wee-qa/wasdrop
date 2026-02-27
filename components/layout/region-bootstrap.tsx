"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

const COUNTRY_COOKIE_KEY = "gdh-country";

function getCookieValue(name: string) {
  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
  return match?.[2];
}

export function RegionBootstrap() {
  const router = useRouter();
  const { data } = useSession();

  useEffect(() => {
    const hasPreference = getCookieValue(COUNTRY_COOKIE_KEY) || data?.user?.preferredCountry;
    if (hasPreference) {
      return;
    }

    let cancelled = false;

    async function bootstrap() {
      const response = await fetch("/api/region/suggest");
      if (!response.ok || cancelled) {
        return;
      }

      const payload = (await response.json()) as { country?: string };
      if (!payload.country || cancelled) {
        return;
      }

      await fetch("/api/user/region", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ country: payload.country }),
      });

      if (!cancelled) {
        router.refresh();
      }
    }

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, [data?.user?.preferredCountry, router]);

  return null;
}
