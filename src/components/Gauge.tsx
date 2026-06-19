import { motion } from 'motion/react';
import { Sparkles, BrainCircuit, Activity } from 'lucide-react';

interface GaugeProps {
  phi: number;
}

export default function Gauge({ phi }: GaugeProps) {
  // Max expected phi in these simple 3-node graphs is around 1.5 - 2.0. Let's set the max gauge value at 1.5.
  const maxPhi = 1.5;
  const percentage = Math.min((phi / maxPhi) * 100, 100);

  // SVG parameters for radial gauge
  const radius = 80;
  const strokeWidth = 14;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  // Determine state labels & styling
  let label = 'Isolated Clusters';
  let desc = 'No active feedback system. Parts behave independently.';
  let borderColors = 'from-slate-400 to-slate-500 text-slate-400 shadow-slate-100';
  let bgGradient = 'from-slate-50 to-slate-100 border-slate-200';
  let accentClass = 'text-slate-600 bg-slate-200/50';

  if (phi > 0 && phi <= 0.3) {
    label = 'Dim Whispers';
    desc = 'Weak feedback loops exist, creating a tiny unified resonance.';
    borderColors = 'from-emerald-400 to-teal-500 text-emerald-500 shadow-emerald-100';
    bgGradient = 'from-emerald-50/40 to-teal-50/40 border-emerald-100/80';
    accentClass = 'text-teal-700 bg-emerald-100/60';
  } else if (phi > 0.3 && phi < 0.9) {
    label = 'Integrated Symphony';
    desc = 'Stronger feedback and logical filters create a coherent sensory whole.';
    borderColors = 'from-sky-400 to-indigo-500 text-indigo-500 shadow-sky-100';
    bgGradient = 'from-sky-50/40 to-indigo-50/40 border-sky-100/80';
    accentClass = 'text-indigo-800 bg-indigo-100/60';
  } else if (phi >= 0.9) {
    label = 'Ethereal Cosmic Core';
    desc = 'Maximum recurrent loops and complex gates. High-unity consciousness!';
    borderColors = 'from-fuchsia-400 via-purple-500 to-pink-500 text-purple-600 shadow-fuchsia-100';
    bgGradient = 'from-fuchsia-50/50 via-purple-50/30 to-pink-50/30 border-purple-200/80';
    accentClass = 'text-purple-900 bg-purple-100/70 animate-pulse';
  }

  return (
    <div className={`p-6 rounded-2xl border transition-all duration-500 shadow-sm bg-gradient-to-b ${bgGradient} flex flex-col items-center justify-between h-full`}>
      <div className="w-full flex items-center justify-between mb-2">
        <span className="text-xs font-semibold tracking-wider text-slate-500 uppercase flex items-center gap-1.5 font-sans">
          <Activity className="w-3.5 h-3.5 animate-pulse text-indigo-500" />
          Consciousness Gauge
        </span>
        <div className={`text-[10px] px-2.5 py-1 rounded-full font-bold tracking-tight font-sans ${accentClass} flex items-center gap-1`}>
          {phi >= 0.9 && <Sparkles className="w-3 h-3 text-fuchsia-500" />}
          {phi > 0 && phi < 0.9 && <BrainCircuit className="w-3 h-3 text-indigo-500" />}
          {label}
        </div>
      </div>

      <div className="relative flex items-center justify-center my-4">
        {/* SVG Circle Gauge */}
        <svg className="w-48 h-48 transform -rotate-90" viewBox="0 0 200 200">
          {/* Background circle */}
          <circle
            cx="100"
            cy="100"
            r={radius}
            className="stroke-slate-200/60"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Dynamic Arc */}
          <motion.circle
            cx="100"
            cy="100"
            r={radius}
            className="stroke-indigo-600"
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ type: 'spring', stiffness: 60, damping: 15 }}
            strokeLinecap="round"
            style={{
              stroke: phi >= 0.9 
                ? 'url(#rainbow-grad)' 
                : phi > 0.3 
                ? 'url(#indigo-grad)' 
                : phi > 0 
                ? 'url(#teal-grad)' 
                : '#94a3b8'
            }}
          />
          {/* Gradients */}
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

        {/* Inner Text Block */}
        <div className="absolute text-center flex flex-col items-center">
          <motion.span 
            key={phi}
            initial={{ scale: 0.8, opacity: 0.5 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-4xl font-extrabold tracking-tight text-slate-800 font-mono"
          >
            Φ = {phi.toFixed(2)}
          </motion.span>
          <span className="text-[11px] font-medium text-slate-400 mt-1 uppercase tracking-widest font-sans">
            phi quantity
          </span>
        </div>
      </div>

      <p className="text-center text-xs text-slate-500 leading-relaxed font-sans max-w-xs px-2 mt-2 h-10 flex items-center justify-center">
        {desc}
      </p>
    </div>
  );
}
