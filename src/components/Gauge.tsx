import { motion } from 'motion/react';
import { Sparkles, BrainCircuit, Activity, Info } from 'lucide-react';

/**
 * Highest Φ this toy measure can produce for a 3-element network with the
 * available gates (fully recurrent, all NOT/NOR, quiescent state). Verified by
 * exhaustive search over all wirings, gates and states.
 */
export const MAX_PHI = 1.75;

interface GaugeProps {
  phi: number;
  /** Explanation shown when Φ is pinned to zero for a structural reason. */
  note?: string | null;
}

export default function Gauge({ phi, note }: GaugeProps) {
  const percentage = Math.max(0, Math.min((phi / MAX_PHI) * 100, 100));

  const radius = 80;
  const strokeWidth = 14;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  let label = 'Isolated Parts';
  let desc = 'No irreducible whole here: the system splits along a free seam.';
  let accentClass = 'text-slate-400 bg-slate-800/70';
  let arcStroke = '#64748b';

  if (phi > 0 && phi <= 0.5) {
    label = 'Dim Whispers';
    desc = 'A weak loop exists. The parts constrain each other, but only barely.';
    accentClass = 'text-teal-300 bg-teal-950/60';
    arcStroke = 'url(#teal-grad)';
  } else if (phi > 0.5 && phi < 1.5) {
    label = 'Integrated Whole';
    desc = 'Recurrent wiring plus differentiated gates: no cheap way to cut this apart.';
    accentClass = 'text-indigo-300 bg-indigo-950/60';
    arcStroke = 'url(#indigo-grad)';
  } else if (phi >= 1.5) {
    label = 'Maximally Irreducible';
    desc = 'Every possible split is expensive. This is as unified as three elements get.';
    accentClass = 'text-fuchsia-300 bg-fuchsia-950/60';
    arcStroke = 'url(#rainbow-grad)';
  }

  return (
    <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900 transition-all duration-500 flex flex-col items-center justify-between h-full">
      <div className="w-full flex items-center justify-between gap-2 mb-2">
        <span className="text-[10px] font-bold tracking-widest text-slate-500 uppercase flex items-center gap-1.5 font-mono">
          <Activity className="w-3.5 h-3.5 text-indigo-400" aria-hidden="true" />
          Integration Gauge
        </span>
        <div
          className={`text-[10px] px-2.5 py-1 rounded-full font-bold tracking-tight font-sans ${accentClass} flex items-center gap-1 shrink-0`}
        >
          {phi >= 1.5 && <Sparkles className="w-3 h-3" aria-hidden="true" />}
          {phi > 0 && phi < 1.5 && <BrainCircuit className="w-3 h-3" aria-hidden="true" />}
          {label}
        </div>
      </div>

      <div
        className="relative flex items-center justify-center my-4"
        role="img"
        aria-label={`Phi equals ${phi.toFixed(2)} out of a maximum of ${MAX_PHI}. ${label}.`}
      >
        <svg className="w-48 h-48 -rotate-90" viewBox="0 0 200 200" aria-hidden="true">
          <circle
            cx="100"
            cy="100"
            r={radius}
            className="stroke-slate-800"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          <motion.circle
            cx="100"
            cy="100"
            r={radius}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ type: 'spring', stiffness: 60, damping: 15 }}
            strokeLinecap="round"
            /* Set as an attribute, not via `style`: motion caches inline styles
               and would keep the colour from the first render forever. */
            stroke={arcStroke}
          />
          <defs>
            <linearGradient id="teal-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#2dd4bf" />
              <stop offset="100%" stopColor="#0d9488" />
            </linearGradient>
            <linearGradient id="indigo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#60a5fa" />
              <stop offset="100%" stopColor="#4f46e5" />
            </linearGradient>
            <linearGradient id="rainbow-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#e879f9" />
              <stop offset="50%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#ec4899" />
            </linearGradient>
          </defs>
        </svg>

        <div className="absolute text-center flex flex-col items-center">
          <motion.span
            key={phi}
            initial={{ scale: 0.85, opacity: 0.6 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white font-mono leading-none"
          >
            {phi.toFixed(2)}
          </motion.span>
          <span className="text-[11px] font-bold text-indigo-300 font-mono tracking-widest mt-1">
            Φ
          </span>
          <span className="text-[9px] font-medium text-slate-500 mt-1.5 uppercase tracking-widest font-sans">
            max {MAX_PHI}
          </span>
        </div>
      </div>

      <p className="text-center text-[11px] text-slate-400 leading-relaxed font-sans max-w-xs px-2 mt-2 min-h-10 flex items-center justify-center">
        {desc}
      </p>

      {note && (
        <div className="mt-3 w-full flex items-start gap-2 rounded-xl border border-slate-800 bg-slate-950/60 p-2.5">
          <Info className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" aria-hidden="true" />
          <p className="text-[10px] leading-relaxed text-slate-400">{note}</p>
        </div>
      )}
    </div>
  );
}
