"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";

type GameActionsProps = {
  gameId: string;
  country: string;
  currency: string;
  signedIn: boolean;
};

export function GameActions({ gameId, country, currency, signedIn }: GameActionsProps) {
  const [status, setStatus] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [targetPrice, setTargetPrice] = useState("10.00");
  const [minDiscount, setMinDiscount] = useState("");
  const [notifyOnHistoricalLow, setNotifyOnHistoricalLow] = useState(false);
  const [notifyOnNewDeal, setNotifyOnNewDeal] = useState(true);

  if (!signedIn) {
    return <p className="text-sm text-zinc-400">Sign in to add to wishlist and create price alerts.</p>;
  }

  const handleCreateAlert = async () => {
    setStatus("Creating alert...");
    const targetCents = Math.floor(parseFloat(targetPrice) * 100) || 1000;
    const body: Record<string, string | number | boolean> = { 
      gameId, 
      targetPriceCents: targetCents, 
      country, 
      currency, 
      notifyOnHistoricalLow, 
      notifyOnNewDeal 
    };
    if (minDiscount) body.minDiscountPercent = parseInt(minDiscount);

    const response = await fetch("/api/alerts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    
    setStatus(response.ok ? "Price alert created successfully" : "Failed to create alert");
    if (response.ok) setShowAdvanced(false);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Button
          variant="secondary"
          className="bg-zinc-800 text-white hover:bg-zinc-700"
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
          className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 hover:text-cyan-300"
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          {showAdvanced ? "Cancel Alert" : "Create Alert"}
        </Button>
      </div>

      {showAdvanced && (
        <div className="rounded-xl border border-white/10 bg-black/40 p-4 space-y-4 animate-in fade-in slide-in-from-top-2">
          <div className="grid grid-cols-2 gap-4">
            <label className="flex flex-col gap-1.5 text-xs text-zinc-400">
              <span className="font-semibold text-zinc-300">Target Price ({currency})</span>
              <Input 
                type="number" 
                step="0.01" 
                min="0"
                value={targetPrice} 
                onChange={(e) => setTargetPrice(e.target.value)} 
                className="h-8 border-white/10 bg-black/60"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-xs text-zinc-400">
              <span className="font-semibold text-zinc-300">Min Discount %</span>
              <Input 
                type="number" 
                step="1" 
                min="0"
                max="100"
                placeholder="e.g. 50"
                value={minDiscount} 
                onChange={(e) => setMinDiscount(e.target.value)} 
                className="h-8 border-white/10 bg-black/60"
              />
            </label>
          </div>
          
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer">
              <input 
                type="checkbox" 
                checked={notifyOnNewDeal} 
                onChange={(e) => setNotifyOnNewDeal(e.target.checked)} 
                className="rounded border-white/20 bg-black/40 accent-cyan-400"
              />
              Notify on any new store listing
            </label>
            <label className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer">
              <input 
                type="checkbox" 
                checked={notifyOnHistoricalLow} 
                onChange={(e) => setNotifyOnHistoricalLow(e.target.checked)} 
                className="rounded border-white/20 bg-black/40 accent-cyan-400"
              />
              Notify if price hits historical low
            </label>
          </div>
          
          <Button 
            className="w-full bg-cyan-500 text-black shadow-[0_0_15px_rgba(59,232,255,0.4)] hover:bg-cyan-400 hover:shadow-[0_0_20px_rgba(59,232,255,0.6)] font-bold transition-all"
            onClick={handleCreateAlert}
          >
            Save Alert
          </Button>
        </div>
      )}
      <p className="text-sm text-zinc-400">{status}</p>
    </div>
  );
}
