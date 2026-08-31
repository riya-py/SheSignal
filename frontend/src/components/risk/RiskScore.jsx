import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RISK_LEVEL_COPY } from "@/lib/riskCopy";

export default function RiskScore({ risk }) {
  const copy = RISK_LEVEL_COPY[risk.risk_level];

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-h3">{copy.zoneHeading}</h2>
        <Badge variant={risk.risk_level}>{copy.badge}</Badge>
      </div>

      <p className="mt-4 text-eyebrow">Reported Risk Score</p>
      <p className="text-4xl font-extrabold text-foreground">
        {risk.risk_score}
        <span className="text-lg font-medium text-muted-foreground">/100</span>
      </p>

      <p className="mt-2 text-sm text-muted-foreground">
        Based on {risk.based_on_reports} reports in the last 30 days
      </p>
    </Card>
  );
}