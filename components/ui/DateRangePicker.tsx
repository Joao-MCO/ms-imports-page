"use client";

import { useState } from "react";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { Input } from "./Input";

interface DateRangePickerProps {
  startDate: Date | null;
  endDate: Date | null;
  onChange: (start: Date | null, end: Date | null) => void;
  presets?: Array<{ label: string; days: number }>;
  className?: string;
}

const defaultPresets = [
  { label: "Últimos 7 dias", days: 7 },
  { label: "Últimos 30 dias", days: 30 },
  { label: "Últimos 90 dias", days: 90 },
];

export function DateRangePicker({
  startDate,
  endDate,
  onChange,
  presets = defaultPresets,
  className = "",
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handlePresetClick = (days: number) => {
    const end = endOfDay(new Date());
    const start = startOfDay(subDays(new Date(), days));
    onChange(start, end);
    setIsOpen(false);
  };

  const handleCustomApply = (start: Date | null, end: Date | null) => {
    onChange(start, end);
    setIsOpen(false);
  };

  const formattedStart = startDate ? format(startDate, "dd/MM/yyyy") : "";
  const formattedEnd = endDate ? format(endDate, "dd/MM/yyyy") : "";
  const displayValue = startDate && endDate ? `${formattedStart} - ${formattedEnd}` : "Selecione um período";

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-left text-gray-900 dark:text-white hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors flex items-center justify-between gap-2"
      >
        <span className={!startDate || !endDate ? "text-gray-500 dark:text-gray-400" : ""}>
          {displayValue}
        </span>
        <svg className="w-5 h-5 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-lg p-4">
          <div className="space-y-2 mb-4">
            {presets.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => handlePresetClick(preset.days)}
                className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                {preset.label}
              </button>
            ))}
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Período personalizado</p>
            <div className="grid grid-cols-2 gap-3">
              <Input
                type="date"
                value={startDate ? format(startDate, "yyyy-MM-dd") : ""}
                onChange={(e) => {
                  const date = e.target.value ? new Date(e.target.value) : null;
                  if (date && endDate && date > endDate) return;
                  handleCustomApply(date, endDate);
                }}
                label="Início"
              />
              <Input
                type="date"
                value={endDate ? format(endDate, "yyyy-MM-dd") : ""}
                onChange={(e) => {
                  const date = e.target.value ? new Date(e.target.value) : null;
                  if (date && startDate && date < startDate) return;
                  handleCustomApply(startDate, date);
                }}
                label="Fim"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}