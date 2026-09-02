import { useState } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isAfter,
  isSameDay,
  isSameMonth,
  isToday,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const WEEKDAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

// Small self-contained month-grid date picker - no calendar/date-picker
// library in this project yet, so this keeps it dependency-free besides
// date-fns (already used elsewhere). Dates after `today` are disabled since
// the backend rejects an occurred_at in the future.
export default function MiniCalendar({ value, onChange }) {
  const selected = value ? parseISO(value) : null;
  const today = startOfDay(new Date());
  const [visibleMonth, setVisibleMonth] = useState(selected ?? today);

  const gridStart = startOfWeek(startOfMonth(visibleMonth));
  const gridEnd = endOfWeek(endOfMonth(visibleMonth));
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  const canGoNext = !isAfter(startOfMonth(addMonths(visibleMonth, 1)), today);

  return (
    <div className="w-full max-w-xs rounded-2xl border border-border bg-card p-3.5">
      <div className="mb-2.5 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setVisibleMonth((m) => subMonths(m, 1))}
          aria-label="Previous month"
          className="flex h-7 w-7 items-center justify-center rounded-full text-foreground hover:bg-muted"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <p className="text-sm font-bold text-foreground">{format(visibleMonth, "MMMM yyyy")}</p>
        <button
          type="button"
          onClick={() => canGoNext && setVisibleMonth((m) => addMonths(m, 1))}
          aria-label="Next month"
          disabled={!canGoNext}
          className="flex h-7 w-7 items-center justify-center rounded-full text-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {WEEKDAY_LABELS.map((d, i) => (
          <span key={`${d}-${i}`} className="text-[11px] font-medium text-muted-foreground">
            {d}
          </span>
        ))}

        {days.map((day) => {
          const inMonth = isSameMonth(day, visibleMonth);
          const disabled = isAfter(day, today);
          const isSelected = selected && isSameDay(day, selected);

          return (
            <button
              key={day.toISOString()}
              type="button"
              disabled={disabled}
              onClick={() => onChange(format(day, "yyyy-MM-dd"))}
              aria-pressed={isSelected}
              aria-label={format(day, "PPPP")}
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium transition-colors",
                !inMonth && "text-muted-foreground/50",
                inMonth && !isSelected && "text-foreground hover:bg-muted",
                isSelected && "bg-accent text-accent-foreground",
                !isSelected && isToday(day) && "ring-1 ring-inset ring-accent",
                disabled && "cursor-not-allowed opacity-30 hover:bg-transparent"
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