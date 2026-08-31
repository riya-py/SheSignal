import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, MoreVertical, Circle, MapPin, LogIn } from "lucide-react";
import RouteMap from "@/components/route/RouteMap";
import TransportSelector from "@/components/route/TransportSelector";
import RouteRiskCard from "@/components/route/RouteRiskCard";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useRouteRisk } from "@/hooks/useRouteRisk";
import { transportOptions, routeDestination as demoDestination } from "@/data/mockRoute";
import { DEFAULT_CENTER } from "@/data/mockReports";

export default function RouteSafety() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [mode, setMode] = useState("walk");
  const [origin, setOrigin] = useState({ latitude: DEFAULT_CENTER.latitude, longitude: DEFAULT_CENTER.longitude });

  const { mutate: calculateRoute, data: routeRisk, isPending, isError, error } = useRouteRisk(
    session?.access_token
  );

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition((pos) => {
      setOrigin({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
    });
  }, []);

  useEffect(() => {
    if (!session) return;
    calculateRoute({
      origin: { latitude: origin.latitude, longitude: origin.longitude },
      destination: { latitude: demoDestination.latitude, longitude: demoDestination.longitude },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, origin.latitude, origin.longitude]);

  return (
    <div className="flex h-[calc(100dvh-65px)] w-full flex-col md:h-[calc(100dvh-73px)]">
      {/* header */}
      <div className="flex items-start gap-3 border-b border-border bg-background px-4 py-3 md:px-6">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="Back"
          className="mt-1 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-foreground hover:bg-muted"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        <div className="flex flex-1 flex-col gap-1.5 py-0.5">
          <div className="flex items-center gap-2.5 text-sm font-medium text-foreground">
            <Circle className="h-2.5 w-2.5 flex-shrink-0 fill-primary text-primary" />
            My Location
          </div>
          <div className="ml-[5px] h-3 w-px border-l border-dashed border-border" />
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <MapPin className="h-3.5 w-3.5 flex-shrink-0 fill-risk-high text-risk-high" />
            {demoDestination.label}
          </div>
        </div>

        <button
          type="button"
          aria-label="More options"
          className="mt-1 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-foreground hover:bg-muted"
        >
          <MoreVertical className="h-5 w-5" />
        </button>
      </div>

      <TransportSelector options={transportOptions} value={mode} onChange={setMode} />

      {/* map fills the remaining space, risk card overlays its bottom edge */}
      <div className="relative min-h-0 flex-1">
        {!session && (
          <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <LogIn className="h-5 w-5" />
            </span>
            <p className="text-sm font-semibold text-foreground">Sign in to calculate route risk</p>
            <p className="max-w-xs text-xs text-muted-foreground">
              Route calculations are rate-limited per account to prevent abuse — browsing the map
              stays open to everyone, this step just needs a session.
            </p>
            <Button variant="accent" onClick={() => navigate("/login", { state: { from: { pathname: "/route-safety" } } })}>
              Sign In
            </Button>
          </div>
        )}

        {session && isPending && (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Calculating reported risk along this route…
          </div>
        )}

        {session && isError && (
          <div className="flex h-full items-center justify-center px-6 text-center text-sm text-destructive">
            {error?.message ?? "Couldn't calculate this route."}
          </div>
        )}

        {session && routeRisk && (
          <>
            <RouteMap
              origin={routeRisk.origin}
              destination={routeRisk.destination}
              segments={routeRisk.segments}
            />
            <div className="absolute inset-x-0 bottom-0 z-10 mx-auto w-full max-w-xl px-3 pb-3 sm:px-4 sm:pb-4">
              <RouteRiskCard
                summary={routeRisk}
                onViewAlternative={() =>
                  toast.info("Alternative-route ranking isn't wired up yet", {
                    description: "The backend returns one route today — comparing alternatives needs more work.",
                  })
                }
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}