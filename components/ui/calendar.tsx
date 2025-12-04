import * as React from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

export interface CalendarProps {
  selected?: Date;
  onSelect?: (date: Date) => void;
  disabled?: (date: Date) => boolean;
  className?: string;
}

const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function Calendar({ selected, onSelect, disabled, className }: CalendarProps) {
  const [viewMonth, setViewMonth] = React.useState<Date>(selected ?? new Date());

  React.useEffect(() => {
    if (selected) {
      setViewMonth(selected);
    }
  }, [selected]);

  const handleDayClick = (day: Date) => {
    if (disabled?.(day)) return;
    onSelect?.(day);
  };

  const days = React.useMemo(() => {
    const start = startOfWeek(startOfMonth(viewMonth));
    const end = endOfWeek(endOfMonth(viewMonth));
    return eachDayOfInterval({ start, end });
  }, [viewMonth]);

  return (
    <div className={cn("w-[280px] select-none", className)}>
      <div className="flex items-center justify-between px-1 pb-3">
        <button
          type="button"
          className="inline-flex h-8 w-8 items-center justify-center rounded-full text-gray-600 hover:bg-gray-100 hover:text-gray-900"
          onClick={() => setViewMonth((prev) => subMonths(prev, 1))}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-medium text-gray-900">
          {format(viewMonth, "MMMM yyyy")}
        </span>
        <button
          type="button"
          className="inline-flex h-8 w-8 items-center justify-center rounded-full text-gray-600 hover:bg-gray-100 hover:text-gray-900"
          onClick={() => setViewMonth((prev) => addMonths(prev, 1))}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 px-1 text-center text-xs font-semibold text-gray-500">
        {weekdayLabels.map((label) => (
          <div key={label}>{label}</div>
        ))}
      </div>

      <div className="mt-2 grid grid-cols-7 gap-1 px-1">
        {days.map((day) => {
          const isOutside = !isSameMonth(day, viewMonth);
          const isDisabled = disabled?.(day) ?? false;
          const isSelected = selected ? isSameDay(day, selected) : false;

          return (
            <button
              key={day.toISOString()}
              type="button"
              disabled={isDisabled}
              onClick={() => handleDayClick(day)}
              className={cn(
                "h-9 w-9 rounded-full text-sm transition",
                "flex items-center justify-center",
                isSelected
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "text-gray-700 hover:bg-blue-100 hover:text-blue-700",
                isOutside && "text-gray-300 hover:text-gray-400",
                (isDisabled || isOutside) && "hover:bg-transparent",
                isDisabled && "cursor-not-allowed text-gray-300"
              )}
            >
              {format(day, "d")}
            </button>
          );
        })}
      </div>
    </div>
  );
}

