"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Globe } from "lucide-react";

import { COUNTRIES, getCountryOption } from "@/lib/regions";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type RegionSelectorProps = {
  country: string;
  mobile?: boolean;
};

export function RegionSelector({ country, mobile = false }: RegionSelectorProps) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const selected = getCountryOption(country);

  function onChange(nextCountry: string) {
    startTransition(async () => {
      await fetch("/api/user/region", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ country: nextCountry }),
      });
      router.refresh();
    });
  }

  return (
    <div className={mobile ? "flex w-full" : "hidden min-w-44 sm:flex"}>
      <Select value={country} onValueChange={onChange} disabled={pending}>
        <SelectTrigger
          className={
            mobile
              ? "h-10 w-full border-white/15 bg-[#0b0f16] text-slate-200"
              : "h-10 border-white/10 bg-transparent text-slate-300 hover:text-white"
          }
        >
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            <SelectValue placeholder="Region" />
          </div>
        </SelectTrigger>
        <SelectContent>
          {COUNTRIES.map((option) => (
            <SelectItem key={option.code} value={option.code}>
              {option.code} - {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <span className="sr-only">{selected.label}</span>
    </div>
  );
}
