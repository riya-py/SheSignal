import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import StepIndicator from "@/components/report/StepIndicator";
import ReportForm from "@/components/report/ReportForm";
import LocationStep from "@/components/report/LocationStep";
import ReviewStep from "@/components/report/ReviewStep";

export default function Report() {
  const navigate = useNavigate();
  const routerLocation = useLocation();

  // Other pages (e.g. the route-safety "Report an issue here" menu item) can
  // hand off a starting point via navigation state: { location: { latitude, longitude, label } }.
  const incomingLocation = routerLocation.state?.location;
  const prefilledLocation = incomingLocation
    ? {
        mode: "map",
        coords: { latitude: incomingLocation.latitude, longitude: incomingLocation.longitude },
        label: incomingLocation.label ?? "",
      }
    : null;

  const [step, setStep] = useState(1);
  const [data, setData] = useState({ details: null, location: prefilledLocation });

  return (
    <div className="mx-auto h-[calc(100dvh-65px)] w-full max-w-lg overflow-y-auto px-4 py-6 md:h-[calc(100dvh-73px)] md:px-6">
      <div className="mb-6 flex items-center gap-3">
        <button
          type="button"
          onClick={() => (step === 1 ? navigate(-1) : setStep((s) => s - 1))}
          aria-label="Back"
          className="flex h-9 w-9 items-center justify-center rounded-full text-foreground hover:bg-muted"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-h2">Report a Safety Issue</h1>
      </div>

      <div className="mb-7">
        <StepIndicator current={step} />
      </div>

      {step === 1 && (
        <ReportForm
          defaultValues={data.details}
          onNext={(details) => {
            setData((d) => ({ ...d, details }));
            setStep(2);
          }}
        />
      )}

      {step === 2 && (
        <LocationStep
          defaultValues={data.location}
          onBack={() => setStep(1)}
          onNext={(location) => {
            setData((d) => ({ ...d, location }));
            setStep(3);
          }}
        />
      )}

      {step === 3 && (
        <ReviewStep data={data} onBack={() => setStep(2)} onSubmitted={() => navigate("/")} />
      )}
    </div>
  );
}