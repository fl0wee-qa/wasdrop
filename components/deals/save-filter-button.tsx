"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

type SaveFilterButtonProps = {
  enabled: boolean;
  query: Record<string, string | number | boolean | string[]>;
};

export function SaveFilterButton({ enabled, query }: SaveFilterButtonProps) {
  const [status, setStatus] = useState("");

  async function saveFilter() {
    if (!enabled) {
      setStatus("Sign in to save filters.");
      return;
    }

    const name = window.prompt("Filter name");
    if (!name) {
      return;
    }

    const response = await fetch("/api/account/saved-filters", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        scope: "deals",
        query,
      }),
    });

    if (!response.ok) {
      setStatus("Failed to save filter.");
      return;
    }

    setStatus("Filter saved.");
  }

  return (
    <div className="flex items-center gap-3">
      <Button type="button" variant="secondary" onClick={() => void saveFilter()}>
        Save this filter
      </Button>
      {status ? <span className="text-xs text-zinc-400">{status}</span> : null}
    </div>
  );
}
