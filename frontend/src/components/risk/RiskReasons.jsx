import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { FACTOR_META, timeOfDayNote } from "@/data/mockRisk";
import { cn } from "@/lib/utils";

export default function RiskReasons({ factors }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Why is this area risky?</CardTitle>
      </CardHeader>
      <ul className="space-y-3 px-5 pb-5">
        {factors.map((f) => {
          const meta = FACTOR_META[f.factor] ?? FACTOR_META.other;
          const Icon = meta.icon;
          const text = meta.reasonLabel(f.count);
          return (
            <li key={f.factor} className="flex items-center gap-3 text-sm text-foreground">
              <span
                className={cn(
                  "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full",
                  meta.tone === "high" ? "bg-risk-high-bg text-risk-high" : "bg-muted text-muted-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
              </span>
              {text}
            </li>
          );
        })}
        <li className="flex items-center gap-3 text-sm text-foreground">
          <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <timeOfDayNote.icon className="h-4 w-4" />
          </span>
          {timeOfDayNote.label}
        </li>
      </ul>
    </Card>
  );
}