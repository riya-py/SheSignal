import { cn } from "@/lib/utils";

export default function TransportSelector({ options, value, onChange }) {
  return (
    <div className="flex gap-2 overflow-x-auto px-4 pb-1 pt-3 sm:justify-center sm:px-6">
      {options.map(({ mode, label, icon: Icon }) => {
        const selected = value === mode;
        return (
          <button
            key={mode}
            type="button"
            onClick={() => onChange(mode)}
            aria-pressed={selected}
            className={cn(
              "flex flex-shrink-0 items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-semibold transition-colors",
              selected
                ? "border-accent bg-accent/10 text-accent"
                : "border-border bg-card text-foreground hover:bg-muted"
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        );
      })}
    </div>
  );
}