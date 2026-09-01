import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Share2, ArrowRight } from "lucide-react";
import RiskScore from "@/components/risk/RiskScore";
import RiskReasons from "@/components/risk/RiskReasons";
import { ReportTrendCard, TopIssuesCard } from "@/components/risk/RiskTrends";
import { Button } from "@/components/ui/button";
import { useRiskAssessment } from "@/hooks/useRiskAssessment";
import { DEFAULT_CENTER } from "@/data/mockReports";
import { toTrendData } from "@/data/mockRisk";

export default function ZoneDetails() {
  const navigate = useNavigate();
  const location = useLocation();

  const latitude = location.state?.latitude ?? DEFAULT_CENTER.latitude;
  const longitude = location.state?.longitude ?? DEFAULT_CENTER.longitude;

  const { data: risk, isLoading, isError } = useRiskAssessment({ latitude, longitude });

  return (
    <div className="mx-auto h-[calc(100dvh-65px)] w-full max-w-2xl overflow-y-auto px-4 py-5 md:h-[calc(100dvh-73px)] md:px-6">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            aria-label="Back"
            className="flex h-9 w-9 items-center justify-center rounded-full text-foreground hover:bg-muted"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-h2">Zone Details</h1>
        </div>
        <button
          type="button"
          aria-label="Share"
          className="flex h-9 w-9 items-center justify-center rounded-full text-foreground hover:bg-muted"
        >
          <Share2 className="h-4.5 w-4.5" />
        </button>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Loading reported risk for this area…</p>}
      {isError && <p className="text-sm text-destructive">Couldn't load risk data for this area.</p>}

      {risk && (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <RiskScore risk={risk} />
            <RiskReasons factors={risk.contributing_factors} />
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <ReportTrendCard trend={toTrendData(risk.time_of_day_breakdown)} />
            <TopIssuesCard factors={risk.contributing_factors} />
          </div>

          <Button
            variant="accent"
            size="lg"
            className="mt-4 w-full gap-2"
            onClick={() => navigate("/recommendations", { state: { latitude, longitude } })}
          >
            See Recommendations
            <ArrowRight className="h-4 w-4" />
          </Button>
        </>
      )}
    </div>
  );
}