import React from 'react';
import { motion } from 'framer-motion';

/**
 * SegmentedProgressCard - Renders progress bar stat cards with Motion.dev animations:
 * Features: Large primary value, subtitle, animated multi-segment colored bar, and dot legend row.
 */
export default function SegmentedProgressCard({
  title,
  value,
  subtitle,
  segments = [],
}) {
  return (
    <motion.div
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col justify-between rounded-2xl border border-gray-200 bg-white p-5 shadow-xs hover:shadow-md transition-shadow cursor-pointer"
    >
      {/* Title & Value */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700">{title}</h4>
        <p className="font-display text-3xl font-bold tracking-tight text-gray-900 mt-1 tabular-nums">
          {value}
        </p>
        <p className="text-xs text-gray-400 font-medium mt-0.5">{subtitle}</p>
      </div>

      {/* Multi-Segmented Colored Bar */}
      <div className="mt-5 mb-3">
        <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-gray-100 gap-0.5">
          {segments.map((seg, idx) => (
            <motion.div
              key={idx}
              initial={{ width: 0 }}
              animate={{ width: `${seg.percent}%` }}
              transition={{ duration: 0.8, delay: idx * 0.1, ease: 'easeOut' }}
              className="h-full"
              style={{
                backgroundColor: seg.color,
              }}
            />
          ))}
        </div>
      </div>

      {/* Dot Legend Row */}
      <div className="grid grid-cols-3 gap-2 pt-1">
        {segments.map((seg, idx) => (
          <div key={idx} className="flex flex-col">
            <span className="font-display text-xs font-bold text-gray-900 tabular-nums">
              {seg.percent}%
            </span>
            <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-0.5">
              <span
                className="h-2 w-2 rounded-full shrink-0"
                style={{ backgroundColor: seg.color }}
              />
              <span className="truncate">{seg.label}</span>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

