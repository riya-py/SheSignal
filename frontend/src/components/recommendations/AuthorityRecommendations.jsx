import { ClipboardList } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { iconForRecommendation } from "@/data/mockRecommendations";

// "priority" values from the backend are low/medium/high; the shared Badge
// component's risk-color variants are named low/moderate/high, so map
// "medium" -> "moderate" to reuse the same amber styling as the risk score.
const PRIORITY_BADGE_VARIANT = { low: "low", medium: "moderate", high: "high" };
const PRIORITY_LABEL = { low: "Low", medium: "Medium", high: "High" };

export default function AuthorityRecommendations({ recommendations }) {
  return (
    <div className="space-y-4">
      <Card className="p-2">
        <p className="px-3 pt-3 text-sm font-bold text-foreground">Recommended Action</p>
        {recommendations.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-3 py-8 text-center">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 text-accent">
              <ClipboardList className="h-4.5 w-4.5" />
            </span>
            <p className="text-sm font-medium text-foreground">No action items for this area yet</p>
            <p className="max-w-xs text-xs text-muted-foreground">
              There aren't enough reports near here to recommend a specific intervention right now.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {recommendations.map((rec, i) => {
              const Icon = iconForRecommendation(rec);
              return (
                <li key={`${rec.type}-${i}`} className="flex items-start gap-3 px-3 py-3.5">
                  <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
                    <Icon className="h-4.5 w-4.5" />
                  </span>
                  <p className="flex-1 text-sm text-foreground">{rec.text}</p>
                  {rec.type === "priority" && rec.priority && (
                    <Badge variant={PRIORITY_BADGE_VARIANT[rec.priority] ?? "muted"} className="flex-shrink-0">
                      {PRIORITY_LABEL[rec.priority] ?? rec.priority}
                    </Badge>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <div className="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-accent/10 to-primary/10 p-4">
        <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent to-primary text-white">
          <ClipboardList className="h-5 w-5" />
        </span>
        <div>
          <p className="text-sm font-bold text-foreground">Act on patterns.</p>
          <p className="text-xs text-muted-foreground">Make every route safer.</p>
        </div>
      </div>
    </div>
  );
}