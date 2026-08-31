import { AlertTriangle, ShieldQuestion, ShieldCheck, RouteOff, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RISK_LEVEL_COPY } from "@/lib/riskCopy";

const ZONE_META = {
  high: { icon: AlertTriangle, className: "text-risk-high", countLabel: "elevated-report area" },
  moderate: { icon: ShieldQuestion, className: "text-risk-moderate", countLabel: "some-report area" },
  low: { icon: ShieldCheck, className: "text-risk-low", countLabel: "low-report area" },
};

export default function RouteRiskCard({ summary, onViewAlternative, onClose }) {
  const copy = RISK_LEVEL_COPY[summary.overall_risk_level];
  const zoneCounts = summary.segments.reduce(
    (acc, s) => ({ ...acc, [s.risk_level]: (acc[s.risk_level] ?? 0) + 1 }),
    { high: 0, moderate: 0, low: 0 }
  );

  return (
    <Card className="relative w-full bg-card/95 p-4 shadow-card backdrop-blur sm:p-5">
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Close route risk summary"
          className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      )}

      <div className="flex items-start justify-between gap-3 pr-8">
        <h2 className="text-h3">Reported Risk Along This Route</h2>
        <Badge variant={summary.overall_risk_level}>{copy.badge}</Badge>
      </div>

      <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-3xl font-extrabold text-foreground">
            {summary.overall_risk_score}
            <span className="text-base font-medium text-muted-foreground">/100</span>
          </p>
          <p className="text-xs text-muted-foreground">Based on recent reports in this area</p>
        </div>

        <ul className="space-y-1.5">
          {Object.entries(zoneCounts).map(([level, count]) => {
            const meta = ZONE_META[level];
            const Icon = meta.icon;
            return (
              <li key={level} className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Icon className={`h-4 w-4 flex-shrink-0 ${meta.className}`} />
                {count} {meta.countLabel}{count !== 1 ? "s" : ""}
              </li>
            );
          })}
        </ul>
      </div>

      <Button variant="outline" size="lg" className="mt-4 w-full gap-2" onClick={onViewAlternative}>
        <RouteOff className="h-4 w-4" />
        View Alternative With Fewer Reports
      </Button>
    </Card>
  );
}