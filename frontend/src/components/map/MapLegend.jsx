import { useState } from "react";
import { Info, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { RISK_LEVEL_COPY } from "@/lib/riskCopy";

const LEVELS = [
  { level: "high", dot: "bg-risk-high" },
  { level: "moderate", dot: "bg-risk-moderate" },
  { level: "low", dot: "bg-risk-low" },
];

export default function MapLegend() {
  const [open, setOpen] = useState(true);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Show reported-risk legend"
        className="absolute left-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card/95 text-foreground shadow-card backdrop-blur"
      >
        <Info className="h-4 w-4" />
      </button>
    );
  }

  return (
    <Card className="absolute left-3 top-3 z-10 w-44 bg-card/95 p-3 shadow-card backdrop-blur sm:w-52 sm:p-4">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-bold text-foreground sm:text-sm">Reported Concerns</p>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Hide legend"
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <ul className="space-y-1.5">
        {LEVELS.map((l) => (
          <li key={l.level} className="flex items-center gap-2 text-xs text-foreground sm:text-sm">
            <span className={`h-2.5 w-2.5 rounded-full ${l.dot}`} />
            {RISK_LEVEL_COPY[l.level].legend}
          </li>
        ))}
      </ul>
      <button
        type="button"
        className="mt-2 flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
      >
        <Info className="h-3 w-3" />
        Based on recent community reports, not a safety guarantee
      </button>
    </Card>
  );
}