import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';

/**
 * MicroStatCard - Premium Micro Stat Card with dynamic graphics,
 * Framer Motion bounce physics, and JayJef theme color palettes.
 */
export default function MicroStatCard({ title, subtitle, value, change, isNegative, type = 'bar', color = 'red' }) {
  const numValue = parseFloat(String(value).replace(/[^0-9.-]+/g, '')) || 0;

  return (
    <motion.div
      whileHover={{ y: -4, transition: { duration: 0.2, ease: 'easeOut' } }}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="group flex flex-col justify-between rounded-2xl border border-gray-200/90 bg-white p-5 shadow-xs hover:border-gray-300 hover:shadow-md transition-all cursor-pointer relative overflow-hidden"
    >
      {/* Title Header */}
      <div>
        <h4 className="font-heading text-sm font-bold text-gray-900 group-hover:text-red-600 transition-colors">{title}</h4>
        <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
      </div>

      {/* Visual Micro Graphic */}
      <div className="my-3 flex items-center justify-center h-14 w-full">
        {type === 'bar' && <MicroBarGraphic value={numValue} color={color} />}
        {type === 'area' && <MicroAreaGraphic color={color} />}
        {type === 'dots' && <MicroDotsGraphic color={color} />}
        {type === 'step' && <MicroStepGraphic color={color} />}
        {type === 'gauge' && <MicroGaugeGraphic numValue={numValue} valueText={value} isNegative={isNegative} />}
      </div>

      {/* Metric & Change Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        <span className="font-display text-xl font-bold text-gray-900 tabular-nums">{value}</span>
        {change && (
          <span
            className={`inline-flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-full ${
              isNegative
                ? 'text-red-600 bg-red-50 border border-red-200/60'
                : 'text-emerald-700 bg-emerald-50 border border-emerald-200/60'
            }`}
          >
            {isNegative ? <TrendingDown size={12} /> : <TrendingUp size={12} />}
            {change}
          </span>
        )}
      </div>
    </motion.div>
  );
}

// 1. Dynamic Bar Graphic
function MicroBarGraphic({ value = 50, color = 'red' }) {
  const barColor = color === 'red' ? '#DC2626' : color === 'emerald' ? '#10B981' : '#3B82F6';
  // Generate proportional bar heights based on value
  const baseHeights = [35, 65, 45, 80, 55, 90, 70];
  const scaleFactor = Math.min(1.2, Math.max(0.6, value / 50));
  const bars = baseHeights.map((h) => Math.min(100, Math.max(20, Math.round(h * scaleFactor))));

  return (
    <div className="flex items-end justify-between gap-1.5 h-10 w-full max-w-[150px]">
      {bars.map((h, i) => (
        <div key={i} className="flex-1 bg-gray-100 rounded-full h-full flex items-end overflow-hidden">
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: `${h}%` }}
            transition={{ duration: 0.5, delay: i * 0.04, ease: 'easeOut' }}
            className="w-full rounded-full transition-colors"
            style={{ backgroundColor: barColor }}
          />
        </div>
      ))}
    </div>
  );
}

// 2. Glowing Area Curve Graphic
function MicroAreaGraphic({ color = 'emerald' }) {
  const strokeColor = color === 'emerald' ? '#10B981' : '#DC2626';
  const gradId = `areaGrad-${color}`;

  return (
    <svg viewBox="0 0 130 40" className="w-full h-10 overflow-visible">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={strokeColor} stopOpacity="0.35" />
          <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
        </linearGradient>
      </defs>
      <motion.path
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        d="M 0,30 C 20,25 35,35 50,15 C 65,-2 85,25 105,12 L 130,18 L 130,40 L 0,40 Z"
        fill={`url(#${gradId})`}
      />
      <motion.path
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.8, ease: 'easeInOut' }}
        d="M 0,30 C 20,25 35,35 50,15 C 65,-2 85,25 105,12 L 130,18"
        fill="none"
        stroke={strokeColor}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

// 3. Connected Dots Data Graphic
function MicroDotsGraphic({ color = 'blue' }) {
  const strokeColor = color === 'blue' ? '#2563EB' : '#10B981';
  const points = [
    { x: 5, y: 32 },
    { x: 30, y: 18 },
    { x: 55, y: 24 },
    { x: 80, y: 10 },
    { x: 105, y: 20 },
    { x: 125, y: 8 },
  ];
  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  return (
    <svg viewBox="0 0 130 40" className="w-full h-10 overflow-visible">
      {[20, 45, 70, 95, 120].map((x) => (
        <line key={x} x1={x} y1="0" x2={x} y2="40" stroke="#F3F4F6" strokeDasharray="2 2" strokeWidth="1" />
      ))}
      <motion.path
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        d={pathD}
        fill="none"
        stroke={strokeColor}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {points.map((p, i) => (
        <motion.circle
          key={i}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3 + i * 0.08, type: 'spring' }}
          cx={p.x}
          cy={p.y}
          r="3.5"
          fill={strokeColor}
        />
      ))}
    </svg>
  );
}

// 4. Stepped Line Graphic
function MicroStepGraphic({ color = 'red' }) {
  const strokeColor = color === 'red' ? '#DC2626' : '#2563EB';

  return (
    <svg viewBox="0 0 130 40" className="w-full h-10 overflow-visible">
      <motion.path
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        d="M 0,30 L 25,30 L 25,20 L 55,20 L 55,26 L 80,26 L 80,10 L 105,10 L 105,5 L 130,5"
        fill="none"
        stroke={strokeColor}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// 5. Dynamic Donut Gauge Graphic
function MicroGaugeGraphic({ numValue = 0, valueText, isNegative }) {
  const gaugeColor = numValue > 0 ? '#DC2626' : '#10B981';
  // Arc calculation: circumference = 2 * PI * 14 ≈ 88
  const pct = Math.min(100, Math.max(10, numValue > 0 ? numValue * 25 : 90));
  const dashOffset = 88 - (88 * pct) / 100;

  return (
    <div className="relative flex items-center justify-center size-12">
      <svg className="size-full -rotate-90" viewBox="0 0 36 36">
        <circle cx="18" cy="18" r="14" fill="none" className="stroke-gray-100" strokeWidth="3.5" />
        <motion.circle
          initial={{ strokeDashoffset: 88 }}
          animate={{ strokeDashoffset: dashOffset }}
          transition={{ duration: 1, ease: 'easeOut' }}
          cx="18"
          cy="18"
          r="14"
          fill="none"
          stroke={gaugeColor}
          strokeWidth="3.5"
          strokeDasharray="88"
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute text-center">
        <span className="block text-xs font-extrabold text-gray-900 leading-none">{valueText}</span>
        <span className="block text-[8px] font-bold text-gray-400 uppercase mt-0.5">Alerts</span>
      </div>
    </div>
  );
}
