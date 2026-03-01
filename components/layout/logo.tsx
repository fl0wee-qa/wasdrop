type LogoProps = {
  className?: string;
};

export function Logo({ className }: LogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 320 240"
      className={className}
      shapeRendering="crispEdges"
      role="img"
      aria-label="WASDrop logo"
    >
      <style>
        {`
          .wasdrop-logo {
            --cap:#1b1f2a;
            --cap2:#121520;
            --edge:#2a3142;
            --letter:#e8eefc;
            --shadow:#0b0e15;
            --press:6px;
            --dur:120ms;
            --gap:110ms;
          }
          .wasdrop-logo .key { cursor: default; transform-box: fill-box; transform-origin: center; }
          .wasdrop-logo .shadow { opacity:.65; }
          .wasdrop-logo .shine { opacity:.20; }
          .wasdrop-logo:hover .kW { animation: press var(--dur) ease-in-out 0ms 1 both; }
          .wasdrop-logo:hover .kA { animation: press var(--dur) ease-in-out calc(1 * var(--gap)) 1 both; }
          .wasdrop-logo:hover .kS { animation: press var(--dur) ease-in-out calc(2 * var(--gap)) 1 both; }
          .wasdrop-logo:hover .kD { animation: press var(--dur) ease-in-out calc(3 * var(--gap)) 1 both; }
          @keyframes press {
            0%   { transform: translateY(0); filter: brightness(1); }
            50%  { transform: translateY(var(--press)); filter: brightness(.92); }
            100% { transform: translateY(0); filter: brightness(1); }
          }
        `}
      </style>

      <g className="wasdrop-logo">
        <g className="key kW" transform="translate(128 20)">
          <rect className="shadow" x="6" y="62" width="52" height="10" fill="var(--shadow)" />
          <rect x="0" y="0" width="64" height="64" rx="6" fill="var(--edge)" />
          <rect x="4" y="4" width="56" height="56" rx="5" fill="var(--cap2)" />
          <rect x="8" y="8" width="48" height="48" rx="4" fill="var(--cap)" />
          <rect className="shine" x="10" y="10" width="44" height="10" rx="3" fill="#ffffff" />
          <g fill="var(--letter)" transform="translate(16 18)">
            <rect x="0" y="0" width="4" height="28" />
            <rect x="28" y="0" width="4" height="28" />
            <rect x="8" y="16" width="4" height="12" />
            <rect x="20" y="16" width="4" height="12" />
            <rect x="12" y="24" width="4" height="4" />
            <rect x="16" y="24" width="4" height="4" />
          </g>
        </g>

        <g className="key kA" transform="translate(48 104)">
          <rect className="shadow" x="6" y="62" width="52" height="10" fill="var(--shadow)" />
          <rect x="0" y="0" width="64" height="64" rx="6" fill="var(--edge)" />
          <rect x="4" y="4" width="56" height="56" rx="5" fill="var(--cap2)" />
          <rect x="8" y="8" width="48" height="48" rx="4" fill="var(--cap)" />
          <rect className="shine" x="10" y="10" width="44" height="10" rx="3" fill="#ffffff" />
          <g fill="var(--letter)" transform="translate(18 18)">
            <rect x="8" y="0" width="4" height="4" />
            <rect x="4" y="4" width="4" height="4" />
            <rect x="12" y="4" width="4" height="4" />
            <rect x="0" y="8" width="4" height="20" />
            <rect x="16" y="8" width="4" height="20" />
            <rect x="4" y="12" width="12" height="4" />
          </g>
        </g>

        <g className="key kS" transform="translate(128 104)">
          <rect className="shadow" x="6" y="62" width="52" height="10" fill="var(--shadow)" />
          <rect x="0" y="0" width="64" height="64" rx="6" fill="var(--edge)" />
          <rect x="4" y="4" width="56" height="56" rx="5" fill="var(--cap2)" />
          <rect x="8" y="8" width="48" height="48" rx="4" fill="var(--cap)" />
          <rect className="shine" x="10" y="10" width="44" height="10" rx="3" fill="#ffffff" />
          <g fill="var(--letter)" transform="translate(18 18)">
            <rect x="0" y="0" width="20" height="4" />
            <rect x="0" y="4" width="4" height="8" />
            <rect x="0" y="12" width="20" height="4" />
            <rect x="16" y="16" width="4" height="8" />
            <rect x="0" y="24" width="20" height="4" />
          </g>
        </g>

        <g className="key kD" transform="translate(208 104)">
          <rect className="shadow" x="6" y="62" width="52" height="10" fill="var(--shadow)" />
          <rect x="0" y="0" width="64" height="64" rx="6" fill="var(--edge)" />
          <rect x="4" y="4" width="56" height="56" rx="5" fill="var(--cap2)" />
          <rect x="8" y="8" width="48" height="48" rx="4" fill="var(--cap)" />
          <rect className="shine" x="10" y="10" width="44" height="10" rx="3" fill="#ffffff" />
          <g fill="var(--letter)" transform="translate(18 18)">
            <rect x="0" y="0" width="4" height="28" />
            <rect x="4" y="0" width="12" height="4" />
            <rect x="16" y="4" width="4" height="20" />
            <rect x="4" y="24" width="12" height="4" />
          </g>
        </g>
      </g>
    </svg>
  );
}
