import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';

/**
 * MicroStatCard - Fully responsive KPI Stat Card.
 * Graph-free design with auto-truncating header badges and dynamic text sizing.
 */
export default function MicroStatCard({ title, subtitle, value, change, isNegative }) {
  const strVal = String(value ?? '0');
  const valLen = strVal.length;

  // Responsive font size calculation based on string length to prevent card overflow
  const fontSizeClass =
    valLen > 10
      ? 'text-xl sm:text-2xl'
      : valLen > 6
      ? 'text-2xl sm:text-3xl'
      : 'text-3xl sm:text-4xl xl:text-4xl';

  return (
    <motion.div
      whileHover={{ y: -3, transition: { duration: 0.18, ease: 'easeOut' } }}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="group relative flex flex-col justify-between rounded-2xl border border-gray-200/90 bg-white p-4 sm:p-5 shadow-xs hover:border-gray-300 hover:shadow-md transition-all overflow-hidden min-w-0"
    >
      {/* Top Header Row with Truncated Title & Responsive Badge */}
      <div className="space-y-1 min-w-0">
        <div className="flex items-center justify-between gap-1.5 min-w-0">
          <h4 className="font-heading text-[11px] sm:text-xs font-extrabold uppercase tracking-wider text-gray-500 group-hover:text-red-600 transition-colors truncate min-w-0 flex-1" title={title}>
            {title}
          </h4>
          {change && (
            <span
              title={String(change)}
              className={`inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-extrabold px-2 py-0.5 rounded-full shrink-0 max-w-[110px] sm:max-w-[130px] ${
                isNegative
                  ? 'text-red-700 bg-red-50 border border-red-200/70'
                  : 'text-emerald-700 bg-emerald-50 border border-emerald-200/70'
              }`}
            >
              {isNegative ? <TrendingDown size={11} className="shrink-0" /> : <TrendingUp size={11} className="shrink-0" />}
              <span className="truncate">{change}</span>
            </span>
          )}
        </div>

        {subtitle && (
          <p className="text-xs font-medium text-gray-400 truncate" title={subtitle}>
            {subtitle}
          </p>
        )}
      </div>

      {/* Noticeable Responsive Big Number Metric */}
      <div className="mt-3 pt-2 border-t border-gray-100 flex items-baseline min-w-0">
        <span
          title={strVal}
          className={`font-display font-black tracking-tight text-gray-900 tabular-nums leading-none truncate w-full ${fontSizeClass}`}
        >
          {value}
        </span>
      </div>
    </motion.div>
  );
}
