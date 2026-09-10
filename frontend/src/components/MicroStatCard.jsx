import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

/**
 * MicroStatCard - Renders card designs matching Image 2:
 * Types: 'bar' | 'area' | 'dots' | 'step' | 'gauge'
 */
export default function MicroStatCard({ title, subtitle, value, change, isNegative, type = 'bar' }) {
  return (
    <div className="flex flex-col justify-between rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:shadow-md">
      {/* Title Header */}
      <div>
        <h4 className="font-heading text-sm font-bold text-black-900">{title}</h4>
        <p className="text-xs text-black-500">{subtitle}</p>
      </div>

      {/* Visual Micro Chart */}
      <div className="my-4 flex items-center justify-center h-16 w-full">
        {type === 'bar' && <MicroBarGraphic />}
        {type === 'area' && <MicroAreaGraphic />}
        {type === 'dots' && <MicroDotsGraphic />}
        {type === 'step' && <MicroStepGraphic />}
        {type === 'gauge' && <MicroGaugeGraphic valueText={value} />}
      </div>

      {/* Metric & Change Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        <span className="font-display text-xl font-bold text-black-900 tabular-nums">{value}</span>
        {change && (
          <span
            className={`inline-flex items-center gap-0.5 text-xs font-semibold ${
              isNegative ? 'text-red-600' : 'text-green-700'
            }`}
          >
            {isNegative ? <TrendingDown size={12} /> : <TrendingUp size={12} />}
            {change}
          </span>
        )}
      </div>
    </div>
  );
}

// 1. Vertical pill bar chart
function MicroBarGraphic() {
  const bars = [40, 90, 50, 50, 85, 55, 65];
  return (
    <div className="flex items-end justify-between gap-1.5 h-12 w-full max-w-[160px]">
      {bars.map((h, i) => (
        <div key={i} className="flex-1 bg-gray-100 rounded-full h-full flex items-end">
          <div
            className="w-full bg-[#F95700] rounded-full transition-all"
            style={{ height: `${h}%` }}
          />
        </div>
      ))}
    </div>
  );
}

// 2. Smooth gradient curve area
function MicroAreaGraphic() {
  return (
    <svg viewBox="0 0 120 40" className="w-full h-12 overflow-visible">
      <defs>
        <linearGradient id="yellowArea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.0" />
        </linearGradient>
      </defs>
      <path
        d="M 0,25 C 20,20 30,30 45,10 C 60,-5 80,20 100,15 L 120,20 L 120,40 L 0,40 Z"
        fill="url(#yellowArea)"
      />
      <path
        d="M 0,25 C 20,20 30,30 45,10 C 60,-5 80,20 100,15 L 120,20"
        fill="none"
        stroke="#F59E0B"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

// 3. Green dots connected line chart
function MicroDotsGraphic() {
  const points = [
    { x: 5, y: 35 },
    { x: 30, y: 18 },
    { x: 55, y: 26 },
    { x: 80, y: 10 },
    { x: 105, y: 20 },
    { x: 125, y: 5 },
  ];
  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  return (
    <svg viewBox="0 0 130 40" className="w-full h-12 overflow-visible">
      {/* Dashed vertical gridlines */}
      {[20, 45, 70, 95, 120].map((x) => (
        <line
          key={x}
          x1={x}
          y1="0"
          x2={x}
          y2="40"
          stroke="#E5E7EB"
          strokeDasharray="2 2"
          strokeWidth="1"
        />
      ))}
      <path d={pathD} fill="none" stroke="#10B981" strokeWidth="2" />
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3.5" fill="#10B981" />
      ))}
    </svg>
  );
}

// 4. Stepped line chart
function MicroStepGraphic() {
  return (
    <svg viewBox="0 0 120 40" className="w-full h-12 overflow-visible">
      <path
        d="M 0,28 L 25,28 L 25,18 L 50,18 L 50,25 L 75,25 L 75,35 L 90,35 L 90,10 L 120,10"
        fill="none"
        stroke="#F95700"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// 5. Donut Ring Gauge
function MicroGaugeGraphic({ valueText }) {
  return (
    <div className="relative flex items-center justify-center size-14">
      <svg className="size-full -rotate-90" viewBox="0 0 36 36">
        {/* Background Circle */}
        <circle
          cx="18"
          cy="18"
          r="14"
          fill="none"
          className="stroke-gray-200"
          strokeWidth="3.5"
        />
        {/* Gauge Arc */}
        <circle
          cx="18"
          cy="18"
          r="14"
          fill="none"
          className="stroke-[#F95700]"
          strokeWidth="3.5"
          strokeDasharray="88"
          strokeDashoffset="26"
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute text-center">
        <span className="block text-[10px] font-bold text-black-900 leading-tight">
          {valueText}
        </span>
        <span className="block text-[8px] text-black-500 uppercase">Items</span>
      </div>
    </div>
  );
}
