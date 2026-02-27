"use client";

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { formatMoney } from "@/lib/regions";

type Point = {
  date: string;
  priceCents: number;
  originalPriceCents: number;
  country: string;
  currency: string;
};

export function PriceHistoryChart({ points, country }: { points: Point[]; country: string }) {
  if (!points.length) {
    return <p className="text-sm text-zinc-400">No price history yet. Run daily sync jobs to populate snapshots.</p>;
  }

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer>
        <LineChart data={points}>
          <XAxis dataKey="date" tick={{ fill: "#a1a1aa", fontSize: 12 }} />
          <YAxis tick={{ fill: "#a1a1aa", fontSize: 12 }} tickFormatter={(value) => `$${(value / 100).toFixed(0)}`} />
          <Tooltip
            contentStyle={{ backgroundColor: "#111827", border: "1px solid #3f3f46", color: "#f4f4f5" }}
            formatter={(value) => formatMoney(typeof value === "number" ? value : 0, country)}
          />
          <Line type="monotone" dataKey="priceCents" stroke="#f97316" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="originalPriceCents" stroke="#52525b" strokeWidth={1.5} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
