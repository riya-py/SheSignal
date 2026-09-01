import { useState } from "react";
import { useLocation } from "react-router-dom";
import { FileText, Waypoints, Gauge, AlertTriangle } from "lucide-react";
import StatCard from "@/components/dashboard/StatCard";
import ReportsChart from "@/components/dashboard/ReportsChart";
import IssuesChart from "@/components/dashboard/IssuesChart";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RISK_LEVEL_COPY } from "@/lib/riskCopy";
import { useRiskAssessment } from "@/hooks/useRiskAssessment";
import { DEFAULT_CENTER } from "@/data/mockReports";
import { REPORTS_OVER_TIME_BY_RANGE, RANGE_LABEL } from "@/data/mockDashboard";

const FACTOR_SHORT_LABEL = {
  harassment: "Harassment",
  poor_lighting: "Poor Lighting",
  lack_of_security: "Lack of Security",
  other: "Others",
};

export default function Dashboard() {
  const location = useLocation();
  const latitude = location.state?.latitude ?? DEFAULT_CENTER.latitude;
  const longitude = location.state?.longitude ?? DEFAULT_CENTER.longitude;

  const [range, setRange] = useState("30d");
  const { data: risk, isLoading, isError } = useRiskAssessment({ latitude, longitude });

  const issuesData = (risk?.contributing_factors ?? []).map((f) => ({
    label: FACTOR_SHORT_LABEL[f.factor] ?? f.factor,
    value: Math.round(f.share * 100),
  }));

  return (
    <div className="mx-auto h-[calc(100dvh-65px)] w-full max-w-4xl overflow-y-auto px-4 py-5 md:h-[calc(100dvh-73px)] md:px-6">
      <div className="mb-1 flex items-center justify-between gap-3">
        <h1 className="text-h2">Community Safety Insights</h1>
        <Tabs value={range} onValueChange={setRange}>
          <TabsList>
            <TabsTrigger value="24h">24H</TabsTrigger>
            <TabsTrigger value="7d">7D</TabsTrigger>
            <TabsTrigger value="30d">30D</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      <p className="mb-5 text-sm text-muted-foreground">
        Nearby area · based on community reports, not a platform-wide count
      </p>

      {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
      {isError && (
        <p className="flex items-center gap-2 text-sm text-destructive">
          <AlertTriangle className="h-4 w-4" /> Couldn't load stats for this area.
        </p>
      )}

      {risk && (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <StatCard
              label="Reports in this area"
              value={risk.based_on_reports}
              icon={FileText}
              sublabel={RANGE_LABEL[range]}
            />
            <StatCard
              label="Patterns detected"
              value={risk.based_on_patterns}
              icon={Waypoints}
              sublabel="Geographic + temporal clusters"
            />
            <StatCard
              label="Reported risk score"
              value={`${risk.risk_score}/100`}
              icon={Gauge}
              badge={<Badge variant={risk.risk_level}>{RISK_LEVEL_COPY[risk.risk_level].badge}</Badge>}
            />
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <ReportsChart data={REPORTS_OVER_TIME_BY_RANGE[range]} />
            <IssuesChart data={issuesData} />
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground/70">
            "Reports Over Time" is placeholder data — the backend doesn't expose a daily
            time-series endpoint yet, only point-in-time pattern/risk snapshots.
          </p>
        </>
      )}
    </div>
  );
}