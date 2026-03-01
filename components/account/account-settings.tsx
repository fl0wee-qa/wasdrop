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
  notificationPreferences: {
    emailEnabled: boolean;
    webPushEnabled: boolean;
    digestEnabled: boolean;
  };
  providers: string[];
};

const providerLabels: Record<string, string> = {
  credentials: "Email/Password",
  google: "Google",
  steam: "Steam",
};

export function AccountSettings({
  email,
  preferredCountry,
  marketingOptIn,
  notificationPreferences,
  providers,
}: AccountSettingsProps) {
  const [country, setCountry] = useState(getCountryOption(preferredCountry).code);
  const [optIn, setOptIn] = useState(marketingOptIn);
  const [emailEnabled, setEmailEnabled] = useState(notificationPreferences.emailEnabled);
  const [webPushEnabled, setWebPushEnabled] = useState(notificationPreferences.webPushEnabled);
  const [digestEnabled, setDigestEnabled] = useState(notificationPreferences.digestEnabled);
  const [status, setStatus] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  async function save(next: {
    preferredCountry?: string;
    marketingOptIn?: boolean;
    emailEnabled?: boolean;
    webPushEnabled?: boolean;
    digestEnabled?: boolean;
  }) {
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

        <div className="space-y-2 rounded-md border border-zinc-800 p-3">
          <p className="text-zinc-100">Notification Preferences</p>
          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              checked={emailEnabled}
              onChange={(event) => {
                const next = event.target.checked;
                setEmailEnabled(next);
                void save({ emailEnabled: next });
              }}
              className="mt-1"
              disabled={pending}
            />
            <span>Email notifications</span>
          </label>
          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              checked={webPushEnabled}
              onChange={(event) => {
                const next = event.target.checked;
                setWebPushEnabled(next);
                void save({ webPushEnabled: next });
              }}
              className="mt-1"
              disabled={pending}
            />
            <span>Web push notifications (UI preference placeholder)</span>
          </label>
          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              checked={digestEnabled}
              onChange={(event) => {
                const next = event.target.checked;
                setDigestEnabled(next);
                void save({ digestEnabled: next });
              }}
              className="mt-1"
              disabled={pending}
            />
            <span>Digest mode (batch notifications)</span>
          </label>
        </div>

        <p className="text-xs text-zinc-500">{status}</p>
      </CardContent>
    </Card>
  );
}
