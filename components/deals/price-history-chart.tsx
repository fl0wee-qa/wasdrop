"use client";

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, ReferenceLine } from "recharts";

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

  const lowestPrice = Math.min(...points.map(p => p.priceCents));

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer>
        <LineChart data={points}>
          <XAxis dataKey="date" tick={{ fill: "#a1a1aa", fontSize: 12 }} stroke="#27272a" />
          <YAxis tick={{ fill: "#a1a1aa", fontSize: 12 }} tickFormatter={(value) => `$${(value / 100).toFixed(0)}`} stroke="#27272a" />
          <Tooltip
            contentStyle={{ backgroundColor: "rgba(0,0,0,0.8)", border: "1px solid rgba(59,232,255,0.3)", color: "#f4f4f5", borderRadius: "8px", backdropFilter: "blur(8px)" }}
            formatter={(value) => formatMoney(typeof value === "number" ? value : 0, country)}
            labelStyle={{ color: "#a1a1aa", marginBottom: "4px" }}
          />
          {lowestPrice > 0 && lowestPrice !== Infinity && (
            <ReferenceLine 
              y={lowestPrice} 
              stroke="#10b981" 
              strokeDasharray="3 3" 
              opacity={0.5}
            />
          )}
          <Line type="monotone" dataKey="priceCents" name="Price" stroke="#22d3ee" strokeWidth={3} dot={false} activeDot={{ r: 6, fill: "#22d3ee", stroke: "#000", strokeWidth: 2 }} />
          <Line type="monotone" dataKey="originalPriceCents" name="Regular Price" stroke="#52525b" strokeWidth={1.5} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
