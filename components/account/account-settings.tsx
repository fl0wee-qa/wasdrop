"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { COUNTRIES, getCountryOption } from "@/lib/regions";

type AccountSettingsProps = {
  email: string | null;
  preferredCountry: string;
  marketingOptIn: boolean;
  providers: string[];
};

const providerLabels: Record<string, string> = {
  credentials: "Email/Password",
  google: "Google",
  steam: "Steam",
};

export function AccountSettings({ email, preferredCountry, marketingOptIn, providers }: AccountSettingsProps) {
  const [country, setCountry] = useState(getCountryOption(preferredCountry).code);
  const [optIn, setOptIn] = useState(marketingOptIn);
  const [status, setStatus] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  async function save(next: { preferredCountry?: string; marketingOptIn?: boolean }) {
    setStatus("Saving...");
    const response = await fetch("/api/account/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(next),
    });

    if (!response.ok) {
      setStatus("Failed to save settings");
      return;
    }

    setStatus("Settings saved");
    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Account Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm text-zinc-300">
        <div className="space-y-1">
          <p className="text-zinc-100">Email</p>
          <p>{email ?? "Not set (Steam-only account)"}</p>
        </div>

        <div className="space-y-2">
          <p className="text-zinc-100">Connected providers</p>
          <div className="flex flex-wrap gap-2">
            {providers.length === 0 ? <span className="text-zinc-500">No providers linked</span> : null}
            {providers.map((provider) => (
              <span key={provider} className="rounded border border-zinc-700 px-2 py-1 text-xs">
                {providerLabels[provider] ?? provider}
              </span>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-zinc-100">Preferred region</p>
          <Select
            value={country}
            onValueChange={(value) => {
              setCountry(value);
              void save({ preferredCountry: value });
            }}
            disabled={pending}
          >
            <SelectTrigger className="max-w-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {COUNTRIES.map((option) => (
                <SelectItem key={option.code} value={option.code}>
                  {option.code} - {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <label className="flex items-start gap-2">
          <input
            type="checkbox"
            checked={optIn}
            onChange={(event) => {
              const next = event.target.checked;
              setOptIn(next);
              void save({ marketingOptIn: next });
            }}
            className="mt-1"
            disabled={pending}
          />
          <span>Receive email alerts / newsletter</span>
        </label>

        <p className="text-xs text-zinc-500">{status}</p>
      </CardContent>
    </Card>
  );
}
