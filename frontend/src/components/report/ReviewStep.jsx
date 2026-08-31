import { toast } from "sonner";
import { ShieldCheck, MapPin, Clock3, FileText } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { reportCategories, timingOptions } from "@/lib/reportSchema";
import { useCreateReport } from "@/hooks/useCreateReport";
import { useAuth } from "@/contexts/AuthContext";

function Row({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3 py-3">
      <Icon className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium text-foreground">{value}</p>
      </div>
    </div>
  );
}

export default function ReviewStep({ data, onBack, onSubmitted }) {
  const { session } = useAuth();
  const { mutate: createReport, isPending } = useCreateReport(session?.access_token);

  const category = reportCategories.find((c) => c.value === data.details?.category);
  const timing = timingOptions.find((t) => t.value === data.details?.timing);
  const locationLabel = data.location?.label
    ? data.location.label
    : data.location?.mode === "current"
    ? "Current location"
    : data.location?.coords
    ? `${data.location.coords.latitude.toFixed(4)}, ${data.location.coords.longitude.toFixed(4)}`
    : "Not set";

  const handleSubmit = () => {
    if (!data.details?.category || !data.location?.coords) return;

    // Only "just now" maps to a real timestamp — "earlier today"/"other" don't
    // collect a precise time in this UI, so we don't fabricate one; the
    // backend defaults occurred_at to submission time when it's omitted.
    const occurredAt = data.details.timing === "just_now" ? new Date().toISOString() : undefined;

    createReport(
      {
        category: data.details.category,
        description: data.details.description,
        latitude: data.location.coords.latitude,
        longitude: data.location.coords.longitude,
        occurredAt,
      },
      {
        onSuccess: () => {
          toast.success("Report submitted anonymously", {
            description: "Thank you — this helps make the map more accurate for everyone.",
          });
          onSubmitted?.();
        },
        onError: (error) => {
          toast.error("Couldn't submit report", { description: error.message });
        },
      }
    );
  };

  return (
    <div className="space-y-5">
      <Card className="divide-y divide-border p-2">
        <Row icon={category?.icon ?? FileText} label="Issue" value={category?.label ?? "Not set"} />
        <Row icon={MapPin} label="Location" value={locationLabel} />
        <Row icon={Clock3} label="Time" value={timing?.label ?? "Not set"} />
        <Row icon={FileText} label="Description" value={data.details?.description || "Not set"} />
      </Card>

      <div className="flex items-start gap-2.5 rounded-2xl bg-muted p-3.5 text-xs text-muted-foreground">
        <ShieldCheck className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
        Your report is submitted anonymously. Other users only see aggregated patterns, never
        your identity.
      </div>

      <div className="flex gap-3">
        <Button type="button" variant="outline" size="lg" className="flex-1" onClick={onBack} disabled={isPending}>
          Back
        </Button>
        <Button
          type="button"
          variant="accent"
          size="lg"
          className="flex-1"
          onClick={handleSubmit}
          disabled={isPending}
        >
          {isPending ? "Submitting…" : "Submit Report"}
        </Button>
      </div>
    </div>
  );
}