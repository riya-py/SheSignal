import { reportCategories } from "@/lib/reportSchema";
import { cn } from "@/lib/utils";

export default function IssueSelector({ value, onChange, error }) {
  return (
    <div>
      <p className="mb-2 text-sm font-bold text-foreground">What happened?</p>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        {reportCategories.map(({ value: v, label, icon: Icon }) => {
          const selected = value === v;
          return (
            <button
              key={v}
              type="button"
              onClick={() => onChange(v)}
              aria-pressed={selected}
              className={cn(
                "flex items-center gap-2 rounded-xl border px-3 py-3 text-left text-sm font-medium transition-colors",
                selected
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-border bg-card text-foreground hover:bg-muted"
              )}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              <span className="leading-tight">{label}</span>
            </button>
          );
        })}
      </div>
      {error && <p className="mt-1.5 text-xs text-destructive">{error}</p>}
    </div>
  );
}