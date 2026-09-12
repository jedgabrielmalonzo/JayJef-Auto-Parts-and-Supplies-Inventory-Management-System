import * as React from 'react';
import { format, subDays, startOfMonth, endOfMonth, isSameDay } from 'date-fns';
import { Calendar as CalendarIcon, X, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './ui/button.jsx';
import { Popover, PopoverTrigger, PopoverContent } from './ui/popover.jsx';

export function DatePickerWithRange({ date, setDate, className }) {
  const [open, setOpen] = React.useState(false);

  const today = new Date();

  const handleSelectPreset = (presetKey) => {
    if (presetKey === 'today') {
      setDate({ from: today, to: today });
    } else if (presetKey === '7days') {
      setDate({ from: subDays(today, 6), to: today });
    } else if (presetKey === '30days') {
      setDate({ from: subDays(today, 29), to: today });
    } else if (presetKey === 'month') {
      setDate({ from: startOfMonth(today), to: endOfMonth(today) });
    } else if (presetKey === 'all') {
      setDate(undefined);
    }
  };

  const isPresetActive = (presetKey) => {
    if (!date) return presetKey === 'all';
    if (presetKey === 'today') return date.from && date.to && isSameDay(date.from, today) && isSameDay(date.to, today);
    if (presetKey === '7days') return date.from && date.to && isSameDay(date.from, subDays(today, 6)) && isSameDay(date.to, today);
    if (presetKey === '30days') return date.from && date.to && isSameDay(date.from, subDays(today, 29)) && isSameDay(date.to, today);
    return false;
  };

  const formatDateText = () => {
    if (!date || (!date.from && !date.to)) {
      return 'All Dates';
    }
    if (date.from && (!date.to || isSameDay(date.from, date.to))) {
      if (isSameDay(date.from, today)) return 'Today';
      return format(date.from, 'MMM dd, yyyy');
    }
    if (date.from && date.to) {
      return `${format(date.from, 'MMM dd')} - ${format(date.to, 'MMM dd, yyyy')}`;
    }
    return 'Pick a date range';
  };

  return (
    <div className={className}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              variant="outline"
              size="sm"
              className={`justify-start gap-2 text-xs font-semibold rounded-xl border-gray-200 bg-white hover:bg-gray-50 shadow-2xs ${
                date ? 'text-red-600 border-red-200 bg-red-50/40 font-bold' : 'text-gray-700'
              }`}
            >
              <CalendarIcon size={14} className={date ? 'text-red-600' : 'text-gray-400'} />
              <span>{formatDateText()}</span>
              {date && (
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    setDate(undefined);
                  }}
                  className="ml-1 rounded-full p-0.5 hover:bg-red-200/60 text-red-600"
                  title="Clear Date Filter"
                >
                  <X size={12} />
                </span>
              )}
            </Button>
          }
        />
        <PopoverContent align="end" className="p-3 w-80 space-y-3">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Filter By Date
            </span>
            {date && (
              <button
                type="button"
                onClick={() => {
                  setDate(undefined);
                  setOpen(false);
                }}
                className="text-[11px] font-bold text-red-600 hover:underline"
              >
                Reset Filter
              </button>
            )}
          </div>

          {/* Quick Presets */}
          <div className="grid grid-cols-2 gap-1.5">
            {[
              { key: 'today', label: 'Today' },
              { key: '7days', label: 'Last 7 Days' },
              { key: '30days', label: 'Last 30 Days' },
              { key: 'all', label: 'All Dates' },
            ].map((p) => {
              const active = isPresetActive(p.key);
              return (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => {
                    handleSelectPreset(p.key);
                    setOpen(false);
                  }}
                  className={`flex items-center justify-between rounded-xl px-3 py-2 text-xs font-bold transition-all ${
                    active
                      ? 'bg-red-600 text-white shadow-xs'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span>{p.label}</span>
                  {active && <Check size={14} />}
                </button>
              );
            })}
          </div>

          {/* Manual Date Input Range */}
          <div className="pt-2 border-t border-gray-100 space-y-2">
            <span className="text-[11px] font-semibold text-gray-500 block">Custom Date Range:</span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="text-[10px] text-gray-400 block mb-0.5">From</label>
                <input
                  type="date"
                  value={date?.from ? format(date.from, 'yyyy-MM-dd') : ''}
                  onChange={(e) => {
                    const val = e.target.valueAsDate;
                    if (val) {
                      setDate((prev) => ({ from: val, to: prev?.to || val }));
                    }
                  }}
                  className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-xs text-gray-900 focus:border-red-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] text-gray-400 block mb-0.5">To</label>
                <input
                  type="date"
                  value={date?.to ? format(date.to, 'yyyy-MM-dd') : ''}
                  onChange={(e) => {
                    const val = e.target.valueAsDate;
                    if (val) {
                      setDate((prev) => ({ from: prev?.from || val, to: val }));
                    }
                  }}
                  className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-xs text-gray-900 focus:border-red-600 focus:outline-none"
                />
              </div>
            </div>
            <Button
              size="sm"
              onClick={() => setOpen(false)}
              className="w-full mt-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold h-8"
            >
              Apply Filter
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
