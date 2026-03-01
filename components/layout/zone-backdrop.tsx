import React from "react";

export function ZoneBackdrop() {
  return (
    <div className="bg-background pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* 
        5 Zones Blended Visually
        1) Terraria (Teal bioluminescence) 
        2) Cyberpunk (Neon pink edge)
        3) Battlefield (Amber grit)
        4) Adventure (Emerald nature)
        5) Mythic (Crimson/Purple depth)
      */}

      {/* Zone 1: Terraria - Top Left */}
      <div
        className="animate-pulse-slow absolute -top-[10%] -left-[10%] h-[50vh] w-[50vw] rounded-full opacity-70 mix-blend-screen blur-[120px]"
        style={{
          background:
            "radial-gradient(circle, var(--zone-1) 0%, transparent 70%)",
        }}
      />

      {/* Zone 2: Cyberpunk - Top Right Edge */}
      <div
        className="absolute top-[5%] -right-[5%] h-[40vh] w-[40vw] rounded-full opacity-60 mix-blend-screen blur-[100px]"
        style={{
          background:
            "radial-gradient(circle, var(--zone-2) 0%, transparent 70%)",
        }}
      />

      {/* Zone 3: Battlefield - Bottom Left */}
      <div
        className="absolute bottom-[10%] -left-[10%] h-[45vh] w-[45vw] rounded-full opacity-50 mix-blend-screen blur-[130px]"
        style={{
          background:
            "radial-gradient(circle, var(--zone-3) 0%, transparent 70%)",
        }}
      />

      {/* Zone 4: Adventure - Bottom Right */}
      <div
        className="animate-pulse-slow absolute -right-[10%] bottom-[5%] h-[50vh] w-[50vw] rounded-full opacity-60 mix-blend-screen blur-[110px]"
        style={{
          background:
            "radial-gradient(circle, var(--zone-4) 0%, transparent 70%)",
        }}
      />

      {/* Zone 5: Mythic - Center Core */}
      <div
        className="absolute top-[35%] left-[25%] h-[50vh] w-[50vw] rounded-full opacity-40 mix-blend-screen blur-[140px]"
        style={{
          background:
            "radial-gradient(circle, var(--zone-5) 0%, transparent 70%)",
        }}
      />

      {/* Unified Grit Texture Overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />
    </div>
  );
}
