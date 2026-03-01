"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

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
  minDiscountPercent?: number | null;
  notifyOnHistoricalLow: boolean;
  notifyOnFreebie: boolean;
  notifyOnNewDeal: boolean;
  country: string;
  currency: string;
};

type SavedFilter = {
  id: string;
  name: string;
  scope: string;
  queryJson: Record<string, string | number | boolean | string[]>;
  isDefault: boolean;
};

type NotificationEvent = {
  id: string;
  type: string;
  title: string;
  body?: string | null;
  linkUrl?: string | null;
  isRead: boolean;
  createdAt: string;
};

export function AccountPanel({ country }: AccountPanelProps) {
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);
  const [notifications, setNotifications] = useState<NotificationEvent[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [status, setStatus] = useState("");
  const [alertMinDiscount, setAlertMinDiscount] = useState<number | "">("");
  const [notifyOnHistoricalLow, setNotifyOnHistoricalLow] = useState(false);
  const [notifyOnFreebie, setNotifyOnFreebie] = useState(false);
  const [notifyOnNewDeal, setNotifyOnNewDeal] = useState(true);

  useEffect(() => {
    void Promise.all([
      fetch("/api/wishlist").then((r) => r.json()),
      fetch("/api/alerts").then((r) => r.json()),
      fetch("/api/account/saved-filters").then((r) => r.json()),
      fetch("/api/account/notifications?limit=20").then((r) => r.json()),
    ]).then(([wishlistPayload, alertsPayload, filtersPayload, notificationsPayload]) => {
      setWishlist(wishlistPayload.items ?? []);
      setAlerts(alertsPayload.alerts ?? []);
      setSavedFilters(filtersPayload.filters ?? []);
      setNotifications(notificationsPayload.events ?? []);
      setUnreadCount(notificationsPayload.unreadCount ?? 0);
    });
  }, []);

  async function createAlert(gameId: string, target: number) {
    const response = await fetch("/api/alerts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        gameId,
        targetPriceCents: target,
        minDiscountPercent: alertMinDiscount === "" ? undefined : alertMinDiscount,
        notifyOnHistoricalLow,
        notifyOnFreebie,
        notifyOnNewDeal,
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

  async function deleteAlert(id: string) {
    const response = await fetch("/api/alerts", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });

    if (!response.ok) {
      setStatus("Failed to delete alert");
      return;
    }

    setAlerts((prev) => prev.filter((item) => item.id !== id));
    setStatus("Alert deleted.");
  }

  async function markAllNotificationsRead() {
    const response = await fetch("/api/account/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAllRead: true }),
    });

    if (!response.ok) {
      setStatus("Failed to mark notifications as read.");
      return;
    }

    setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
    setUnreadCount(0);
    setStatus("Notifications marked as read.");
  }

  async function deleteSavedFilter(id: string) {
    const response = await fetch("/api/account/saved-filters", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (!response.ok) {
      setStatus("Failed to remove saved filter.");
      return;
    }
    setSavedFilters((prev) => prev.filter((item) => item.id !== id));
    setStatus("Saved filter removed.");
  }

  async function setDefaultSavedFilter(id: string) {
    const response = await fetch("/api/account/saved-filters", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, isDefault: true }),
    });
    if (!response.ok) {
      setStatus("Failed to set default filter.");
      return;
    }
    setSavedFilters((prev) => prev.map((item) => ({ ...item, isDefault: item.id === id })));
    setStatus("Default filter updated.");
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
          <div className="grid gap-2 rounded-md border border-zinc-800 p-3 text-xs text-zinc-300 sm:grid-cols-2">
            <label className="flex items-center gap-2">
              Min discount %
              <Input
                type="number"
                min={0}
                max={100}
                value={alertMinDiscount}
                onChange={(event) => setAlertMinDiscount(event.target.value ? Number(event.target.value) : "")}
                className="h-8 w-20"
              />
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={notifyOnHistoricalLow}
                onChange={(event) => setNotifyOnHistoricalLow(event.target.checked)}
              />
              Historical low
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={notifyOnFreebie} onChange={(event) => setNotifyOnFreebie(event.target.checked)} />
              Freebie
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={notifyOnNewDeal} onChange={(event) => setNotifyOnNewDeal(event.target.checked)} />
              New deal
            </label>
          </div>
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
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p>
                  {alert.game?.title} at {formatMoney(alert.targetPriceCents, alert.country, alert.currency)}
                </p>
                <Button variant="outline" size="sm" onClick={() => void deleteAlert(alert.id)}>
                  Remove
                </Button>
              </div>
              <p className="mt-1 text-xs text-zinc-500">
                {alert.minDiscountPercent ? `Min discount: ${alert.minDiscountPercent}% • ` : ""}
                {alert.notifyOnHistoricalLow ? "Historical low • " : ""}
                {alert.notifyOnFreebie ? "Freebie • " : ""}
                {alert.notifyOnNewDeal ? "New deal" : ""}
              </p>
            </div>
          ))}
          <p className="text-zinc-400">{status}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Saved Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-zinc-300">
          {savedFilters.length === 0 ? <p className="text-zinc-400">No saved filters yet. Save one from Deals page.</p> : null}
          {savedFilters.map((filter) => {
            const params = new URLSearchParams();
            for (const [key, value] of Object.entries(filter.queryJson ?? {})) {
              if (Array.isArray(value)) {
                for (const item of value) params.append(key, item);
              } else {
                params.set(key, String(value));
              }
            }
            return (
              <div key={filter.id} className="rounded-md border border-zinc-800 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-medium">
                      {filter.name} {filter.isDefault ? <span className="text-xs text-cyan-300">(Default)</span> : null}
                    </p>
                    <Link href={`/deals?${params.toString()}`} className="text-xs text-cyan-300 hover:underline">
                      Open filter
                    </Link>
                  </div>
                  <div className="flex gap-2">
                    {!filter.isDefault ? (
                      <Button variant="outline" size="sm" onClick={() => void setDefaultSavedFilter(filter.id)}>
                        Set default
                      </Button>
                    ) : null}
                    <Button variant="outline" size="sm" onClick={() => void deleteSavedFilter(filter.id)}>
                      Remove
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notification Center ({unreadCount} unread)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-zinc-300">
          <Button variant="outline" size="sm" onClick={() => void markAllNotificationsRead()}>
            Mark all as read
          </Button>
          {notifications.length === 0 ? <p className="text-zinc-400">No notifications yet.</p> : null}
          {notifications.map((item) => (
            <div key={item.id} className="rounded-md border border-zinc-800 p-3">
              <p className={`${item.isRead ? "text-zinc-400" : "text-zinc-100"}`}>{item.title}</p>
              {item.body ? <p className="mt-1 text-xs text-zinc-500">{item.body}</p> : null}
              {item.linkUrl ? (
                <Link href={item.linkUrl} className="mt-1 inline-block text-xs text-cyan-300 hover:underline">
                  Open
                </Link>
              ) : null}
            </div>
          ))}
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
