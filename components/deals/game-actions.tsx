"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

type GameActionsProps = {
  gameId: string;
  country: string;
  currency: string;
  signedIn: boolean;
};

export function GameActions({ gameId, country, currency, signedIn }: GameActionsProps) {
  const [status, setStatus] = useState("");

  if (!signedIn) {
    return <p className="text-sm text-zinc-400">Sign in to add to wishlist and create price alerts.</p>;
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <Button
          variant="secondary"
          onClick={async () => {
            const response = await fetch("/api/wishlist", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ gameId }),
            });
            setStatus(response.ok ? "Added to wishlist" : "Failed to add wishlist item");
          }}
        >
          Add to wishlist
        </Button>
        <Button
          variant="outline"
          onClick={async () => {
            const response = await fetch("/api/alerts", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ gameId, targetPriceCents: 1000, country, currency }),
            });
            setStatus(response.ok ? "Alert created at default threshold" : "Failed to create alert");
          }}
        >
          Alert at 10.00
        </Button>
      </div>
      <p className="text-sm text-zinc-400">{status}</p>
    </div>
  );
}
