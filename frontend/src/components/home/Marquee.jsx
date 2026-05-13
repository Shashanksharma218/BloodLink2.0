const WORDS = ['DONATE', 'SAVE', 'HEAL', 'CARE', 'GIVE LIFE', 'DONATE', 'SAVE', 'HEAL', 'CARE', 'GIVE LIFE']

export default function Marquee() {
  const text = WORDS.join(' • ') + ' • '

  return (
    <div className="overflow-hidden bg-brand-600 py-3" aria-hidden="true">
      <div
        className="marquee-inner flex whitespace-nowrap"
        style={{ animation: 'marquee 28s linear infinite', willChange: 'transform' }}
      >
        {/* duplicated for seamless loop */}
        <span className="px-4 text-sm font-semibold uppercase tracking-widest text-white">
          {text}
        </span>
        <span className="px-4 text-sm font-semibold uppercase tracking-widest text-white">
          {text}
        </span>
        <span className="px-4 text-sm font-semibold uppercase tracking-widest text-white">
          {text}
        </span>
      </div>

      <style>{`
        @keyframes marquee {
          from { transform: translateX(0); }
          to   { transform: translateX(-33.333%); }
        }
        @media (prefers-reduced-motion: reduce) {
          .marquee-inner { animation: none; }
        }
      `}</style>
    </div>
  )
}
