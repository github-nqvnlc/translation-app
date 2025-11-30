"use client";

import { useState, useRef, useEffect } from "react";
import { DayPicker } from "react-day-picker";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Calendar, X, Check } from "lucide-react";
import type { DateRange } from "react-day-picker";
import "react-day-picker/dist/style.css";

interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  onRangeChange: (start: string, end: string) => void;
  onClose?: () => void;
  className?: string;
}

export function DateRangePicker({
  startDate,
  endDate,
  onRangeChange,
  onClose,
  className = "",
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Convert string dates to DateRange
  const getRangeFromProps = (): DateRange | undefined => {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    if (start && end) {
      return { from: start, to: end };
    }
    if (start) {
      return { from: start };
    }
    return undefined;
  };

  // Confirmed range (from props)
  const confirmedRange = getRangeFromProps();
  
  // Local state for temporary selection (not applied until confirm)
  // Initialize with confirmed range, but allow user to change it before confirming
  const [tempRange, setTempRange] = useState<DateRange | undefined>(
    confirmedRange,
  );

  // Sync tempRange with confirmed range when picker closes or props change
  // Only sync when picker is closed to avoid interfering with user selection
  const prevStartDateRef = useRef(startDate);
  const prevEndDateRef = useRef(endDate);
  const prevIsOpenRef = useRef(isOpen);

  // Use effect to sync when picker closes or props change
  useEffect(() => {
    if (!isOpen) {
      // Picker is closed, sync with confirmed range if props changed
      if (
        prevStartDateRef.current !== startDate ||
        prevEndDateRef.current !== endDate ||
        prevIsOpenRef.current !== isOpen
      ) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setTempRange(confirmedRange);
        prevStartDateRef.current = startDate;
        prevEndDateRef.current = endDate;
        prevIsOpenRef.current = isOpen;
      }
    } else {
      // Picker is open, just update refs
      prevIsOpenRef.current = isOpen;
    }
  }, [isOpen, startDate, endDate, confirmedRange]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        onClose?.();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen, onClose]);

  const handleSelect = (selectedRange: DateRange | undefined) => {
    // Chỉ cập nhật tempRange, không gọi API
    setTempRange(selectedRange);
  };

  const handleConfirm = () => {
    if (tempRange?.from && tempRange?.to) {
      const startISO = format(tempRange.from, "yyyy-MM-dd");
      const endISO = format(tempRange.to, "yyyy-MM-dd");
      onRangeChange(startISO, endISO);
      setIsOpen(false);
      onClose?.();
    }
  };

  const handleCancel = () => {
    // Reset về confirmed range
    setTempRange(confirmedRange);
    setIsOpen(false);
    onClose?.();
  };

  const handleClear = () => {
    setTempRange(undefined);
    onRangeChange("", "");
    setIsOpen(false);
    onClose?.();
  };

  const displayText = () => {
    // Hiển thị confirmed range (từ props), không phải tempRange
    if (confirmedRange?.from && confirmedRange?.to) {
      return `${format(confirmedRange.from, "dd/MM/yyyy", {
        locale: vi,
      })} - ${format(confirmedRange.to, "dd/MM/yyyy", { locale: vi })}`;
    }
    if (confirmedRange?.from) {
      return format(confirmedRange.from, "dd/MM/yyyy", { locale: vi });
    }
    return "Chọn khoảng thời gian";
  };

  const canConfirm = tempRange?.from && tempRange?.to;

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-slate-900 px-3 py-1.5 text-xs text-white transition hover:border-sky-400/50 hover:bg-slate-800 focus:border-sky-400 focus:outline-none"
      >
        <Calendar className="size-3.5 text-slate-400" />
        <span className="min-w-[140px] text-left">{displayText()}</span>
        {confirmedRange?.from && confirmedRange?.to && (
          <X
            className="size-3.5 text-slate-400 hover:text-white"
            onClick={(e) => {
              e.stopPropagation();
              handleClear();
            }}
          />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-max rounded-2xl border border-white/10 bg-slate-950 p-4 shadow-2xl">
          <div className="mb-3 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={handleCancel}
              className="rounded-lg border border-white/10 bg-slate-900 px-3 py-1.5 text-xs text-slate-300 transition hover:border-white/20 hover:bg-slate-800"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!canConfirm}
              className="inline-flex items-center gap-1.5 rounded-lg border border-sky-500/50 bg-sky-500/20 px-3 py-1.5 text-xs font-medium text-sky-300 transition hover:border-sky-400 hover:bg-sky-500/30 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-sky-500/50 disabled:hover:bg-sky-500/20"
            >
              <Check className="size-3.5" />
              Xác nhận
            </button>
          </div>
          <style jsx global>{`
            .rdp * {
              box-sizing: border-box;
            }
            .rdp {
              --rdp-cell-size: 36px;
              --rdp-accent-color: #0ea5e9;
              --rdp-background-color: rgba(15, 23, 42, 0.8);
              --rdp-accent-color-dark: #38bdf8;
              --rdp-outline: 2px solid var(--rdp-accent-color);
              --rdp-outline-selected: 2px solid var(--rdp-accent-color);
              margin: 0;
            }

            .rdp-months {
              display: flex;
              flex-direction: row;
              gap: 2rem;
            }

            .rdp-month {
              margin: 0;
            }

            .rdp-caption {
              display: flex;
              align-items: center;
              justify-content: space-between;
              padding: 0.5rem 0;
              margin-bottom: 0.5rem;
            }

            .rdp-caption_label {
              font-size: 0.875rem;
              font-weight: 600;
              color: #e2e8f0;
            }

            .rdp-nav {
              display: flex;
              gap: 0.25rem;
            }

            .rdp-button_previous,
            .rdp-button_next {
              display: flex;
              align-items: center;
              justify-content: center;
              width: 2rem;
              height: 2rem;
              border-radius: 0.5rem;
              border: 1px solid rgba(255, 255, 255, 0.1);
              background: rgba(15, 23, 42, 0.8);
              color: #94a3b8;
              transition: all 0.2s;
            }

            .rdp-button_previous:hover,
            .rdp-button_next:hover {
              background: rgba(30, 41, 59, 0.8);
              border-color: rgba(148, 163, 184, 0.3);
              color: #e2e8f0;
            }

            .rdp-button_previous:focus,
            .rdp-button_next:focus {
              outline: 2px solid #0ea5e9;
              outline-offset: 2px;
            }

            .rdp-head_cell {
              font-size: 0.75rem;
              font-weight: 600;
              color: #94a3b8;
              text-transform: uppercase;
              padding: 0.5rem 0;
            }

            .rdp-cell {
              padding: 0.125rem;
            }

            .rdp-button {
              width: 100%;
              height: 100%;
              border-radius: 0.5rem;
              border: 1px solid transparent;
              background: transparent;
              color: #e2e8f0;
              font-size: 0.875rem;
              transition: all 0.2s;
            }

            .rdp-button:hover:not([disabled]):not(.rdp-day_selected) {
              background: rgba(30, 41, 59, 0.8);
              border-color: rgba(148, 163, 184, 0.2);
            }

            .rdp-day_selected,
            .rdp-day_selected:focus-visible,
            .rdp-day_selected:hover {
              background: #0ea5e9;
              color: white;
              border-color: #0ea5e9;
              font-weight: 600;
            }

            .rdp-day_range_start,
            .rdp-day_range_end {
              background: #0ea5e9;
              color: white;
              border-color: #0ea5e9;
            }

            .rdp-day_range_middle {
              background: rgba(14, 165, 233, 0.2);
              color: #e2e8f0;
            }

            .rdp-day_range_middle:hover {
              background: rgba(14, 165, 233, 0.3);
            }

            .rdp-day_outside {
              color: #64748b;
            }

            .rdp-day_disabled {
              color: #475569;
              opacity: 0.5;
            }

            .rdp-day_today {
              font-weight: 600;
              border: 1px solid rgba(148, 163, 184, 0.3);
            }

            .rdp-day_today:not(.rdp-day_selected) {
              color: #38bdf8;
            }
          `}</style>
          <DayPicker
            mode="range"
            selected={tempRange}
            onSelect={handleSelect}
            locale={vi}
            numberOfMonths={2}
          />
        </div>
      )}
    </div>
  );
}

