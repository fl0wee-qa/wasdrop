import React from "react";

export function ZoneBackdrop() {
  return (
    <div className="bg-background pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div
        className="absolute inset-0 opacity-20"
        style={{
          background:
            "linear-gradient(114deg, rgba(53,203,144,0.24) 0%, rgba(53,203,144,0.03) 18%, rgba(255,44,170,0.2) 36%, rgba(255,44,170,0.03) 47%, rgba(255,148,60,0.18) 62%, rgba(255,148,60,0.03) 73%, rgba(52,204,130,0.16) 86%, rgba(95,72,255,0.2) 100%)",
        }}
      />

      <div
        className="animate-pulse-slow absolute -left-[14%] -top-[12%] h-[46vh] w-[46vw] rounded-full opacity-70 mix-blend-screen blur-[120px]"
        style={{
          background: "radial-gradient(circle, var(--zone-1) 0%, transparent 70%)",
        }}
      />
      <div
        className="animate-pulse-slow absolute -right-[7%] top-[4%] h-[38vh] w-[40vw] rounded-full opacity-65 mix-blend-screen blur-[100px]"
        style={{
          background: "radial-gradient(circle, var(--zone-2) 0%, transparent 70%)",
          animationDelay: "1.2s",
        }}
      />
      <div
        className="absolute -bottom-[9%] -left-[8%] h-[42vh] w-[44vw] rounded-full opacity-52 mix-blend-screen blur-[125px]"
        style={{
          background: "radial-gradient(circle, var(--zone-3) 0%, transparent 70%)",
        }}
      />
      <div
        className="animate-pulse-slow absolute -right-[11%] bottom-[3%] h-[46vh] w-[48vw] rounded-full opacity-62 mix-blend-screen blur-[110px]"
        style={{
          background: "radial-gradient(circle, var(--zone-4) 0%, transparent 70%)",
          animationDelay: "2.4s",
        }}
      />
      <div
        className="absolute left-[21%] top-[27%] h-[48vh] w-[54vw] rounded-full opacity-42 mix-blend-screen blur-[140px]"
        style={{
          background: "radial-gradient(circle, var(--zone-5) 0%, transparent 70%)",
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.03] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_15%,rgba(255,255,255,0.07),transparent_40%),radial-gradient(circle_at_50%_85%,rgba(255,255,255,0.04),transparent_45%)]" />
    </div>
  );
}
