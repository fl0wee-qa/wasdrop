"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatMoney } from "@/lib/regions";

type AccountPanelProps = {
  country: string;
};

type WishlistItem = {
  id: string;
  game: {
    id: string;
    title: string;
    deals?: Array<{ priceCents: number; currency: string }>;
  };
};

type PriceAlert = {
  id: string;
  game?: { title: string } | null;
  targetPriceCents: number;
  country: string;
  currency: string;
};

export function AccountPanel({ country }: AccountPanelProps) {
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [status, setStatus] = useState("");

  useEffect(() => {
    void Promise.all([
      fetch("/api/wishlist").then((r) => r.json()),
      fetch("/api/alerts").then((r) => r.json()),
    ]).then(([wishlistPayload, alertsPayload]) => {
      setWishlist(wishlistPayload.items ?? []);
      setAlerts(alertsPayload.alerts ?? []);
    });
  }, []);

  async function createAlert(gameId: string, target: number) {
    const response = await fetch("/api/alerts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        gameId,
        targetPriceCents: target,
        country,
        currency: "USD",
      }),
    });

    if (!response.ok) {
      setStatus("Failed to create alert");
      return;
    }

    const data = await response.json();
    setAlerts([data.alert, ...alerts]);
    setStatus("Alert created. Email sends only if alerts are enabled in your account settings.");
  }

  async function exportData() {
    const response = await fetch("/api/account/export");
    const data = await response.json();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "wasdrop-export.json";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function deleteAccount() {
    if (!confirm("Delete your account and all saved data?")) {
      return;
    }

    const response = await fetch("/api/account/delete", { method: "DELETE" });
    if (response.ok) {
      window.location.href = "/";
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Wishlist</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {wishlist.length === 0 ? <p className="text-sm text-zinc-400">No games in wishlist yet.</p> : null}
          {wishlist.map((item) => {
            const bestDeal = item.game.deals?.[0];
            return (
              <div key={item.id} className="rounded-md border border-zinc-800 p-3">
                <p className="font-medium text-zinc-100">{item.game.title}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-zinc-400">
                  <span>{bestDeal ? formatMoney(bestDeal.priceCents, country, bestDeal.currency) : "No current deal"}</span>
                  <Input
                    type="number"
                    min={0}
                    defaultValue={bestDeal ? Math.floor(bestDeal.priceCents / 100) : 10}
                    className="w-24"
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        const value = Number((event.currentTarget as HTMLInputElement).value || "0") * 100;
                        void createAlert(item.game.id, value);
                      }
                    }}
                  />
                  <Button size="sm" variant="secondary" onClick={() => void createAlert(item.game.id, 1000)}>
                    Alert at $10
                  </Button>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Price Alerts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-zinc-300">
          {alerts.length === 0 ? <p className="text-zinc-400">No active alerts.</p> : null}
          {alerts.map((alert) => (
            <div key={alert.id} className="rounded-md border border-zinc-800 p-3">
              {alert.game?.title} at {formatMoney(alert.targetPriceCents, alert.country, alert.currency)}
            </div>
          ))}
          <p className="text-zinc-400">{status}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>GDPR Controls</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => void exportData()}>
            Export my data
          </Button>
          <Button variant="destructive" onClick={() => void deleteAccount()}>
            Delete my account
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
