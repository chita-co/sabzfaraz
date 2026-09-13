"use client";

export default function AnalogClock({ time }: { time: Date }) {
  const hours = time.getHours() % 12;
  const minutes = time.getMinutes();
  const seconds = time.getSeconds();
  const hourDeg = hours * 30 + minutes * 0.5;
  const minuteDeg = minutes * 6 + seconds * 0.1;
  const secondDeg = seconds * 6;

  return (
    <div className="aclock">
      <svg viewBox="0 0 100 100" className="aclock-svg">
        <circle cx="50" cy="50" r="47" className="aclock-face" />
        <circle cx="50" cy="50" r="47" className="aclock-rim" />
        {Array.from({ length: 12 }, (_, i) => (
          <line key={i} x1="50" y1={i % 3 === 0 ? "8" : "10"} x2="50" y2="14" transform={`rotate(${i * 30} 50 50)`} className={i % 3 === 0 ? "aclock-tick-major" : "aclock-tick"} />
        ))}
        <line x1="50" y1="50" x2="50" y2="26" className="aclock-hand-hour" transform={`rotate(${hourDeg} 50 50)`} />
        <line x1="50" y1="50" x2="50" y2="16" className="aclock-hand-minute" transform={`rotate(${minuteDeg} 50 50)`} />
        <line x1="50" y1="54" x2="50" y2="12" className="aclock-hand-second" transform={`rotate(${secondDeg} 50 50)`} />
        <circle cx="50" cy="50" r="3" className="aclock-pin" />
      </svg>
      <style jsx>{`
        .aclock { width: 84px; height: 84px; filter: drop-shadow(0 4px 14px rgba(0,0,0,.35)); }
        .aclock-svg { width: 100%; height: 100%; }
        .aclock-face { fill: rgba(255,255,255,.07); }
        .aclock-rim { fill: none; stroke: #fbbf24; stroke-width: 2; }
        .aclock-tick { stroke: rgba(255,255,255,.4); stroke-width: 1; }
        .aclock-tick-major { stroke: #fbbf24; stroke-width: 1.8; }
        .aclock-hand-hour { stroke: #fff; stroke-width: 3.4; stroke-linecap: round; }
        .aclock-hand-minute { stroke: #fff; stroke-width: 2.4; stroke-linecap: round; }
        .aclock-hand-second { stroke: #fbbf24; stroke-width: 1.1; stroke-linecap: round; }
        .aclock-pin { fill: #fbbf24; }
      `}</style>
    </div>
  );
}