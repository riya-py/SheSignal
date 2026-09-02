import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { detailsSchema, timingOptions, timeOfDayOptions } from "@/lib/reportSchema";
import { Button } from "@/components/ui/button";
import IssueSelector from "@/components/report/IssueSelector";
import MiniCalendar from "@/components/report/MiniCalendar";
import { cn } from "@/lib/utils";

export default function ReportForm({ defaultValues, onNext }) {
  const {
    control,
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(detailsSchema),
    defaultValues: defaultValues ?? {
      category: "",
      description: "",
      timing: "",
      otherDate: "",
      otherTimeOfDay: "",
    },
  });

  const description = watch("description") ?? "";
  const timing = watch("timing");
  const otherDate = watch("otherDate");

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-6">
      <Controller
        name="category"
        control={control}
        render={({ field }) => (
          <IssueSelector value={field.value} onChange={field.onChange} error={errors.category?.message} />
        )}
      />

      <div>
        <label htmlFor="description" className="mb-2 block text-sm font-bold text-foreground">
          Description
        </label>
        <textarea
          id="description"
          rows={4}
          maxLength={300}
          placeholder="Describe what happened"
          {...register("description")}
          className="w-full resize-none rounded-2xl border border-border bg-card p-4 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <div className="mt-1 flex items-center justify-between">
          {errors.description ? (
            <p className="text-xs text-destructive">{errors.description.message}</p>
          ) : (
            <span />
          )}
          <span className="text-xs text-muted-foreground">{description.length}/300</span>
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-bold text-foreground">When did this happen?</p>
        <Controller
          name="timing"
          control={control}
          render={({ field }) => (
            <div className="flex flex-wrap gap-2.5">
              {timingOptions.map(({ value, label, icon: Icon }) => {
                const selected = field.value === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => field.onChange(value)}
                    aria-pressed={selected}
                    className={cn(
                      "flex items-center gap-1.5 rounded-full border px-4 py-2.5 text-sm font-medium transition-colors",
                      selected
                        ? "border-accent bg-accent/10 text-accent"
                        : "border-border bg-card text-foreground hover:bg-muted"
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {label}
                  </button>
                );
              })}
            </div>
          )}
        />
        {errors.timing && <p className="mt-1.5 text-xs text-destructive">{errors.timing.message}</p>}

        {timing === "other" && (
          <div className="mt-3 space-y-3">
            <Controller
              name="otherDate"
              control={control}
              render={({ field }) => (
                <div>
                  <MiniCalendar value={field.value} onChange={field.onChange} />
                  {otherDate && (
                    <p className="mt-1.5 text-xs text-muted-foreground">
                      Selected: {format(new Date(`${otherDate}T00:00:00`), "PPP")}
                    </p>
                  )}
                  {errors.otherDate && (
                    <p className="mt-1.5 text-xs text-destructive">{errors.otherDate.message}</p>
                  )}
                </div>
              )}
            />

            <div>
              <p className="mb-2 text-sm font-bold text-foreground">What time of day?</p>
              <Controller
                name="otherTimeOfDay"
                control={control}
                render={({ field }) => (
                  <div className="flex flex-wrap gap-2.5">
                    {timeOfDayOptions.map(({ value, label, icon: Icon }) => {
                      const selected = field.value === value;
                      return (
                        <button
                          key={value}
                          type="button"
                          onClick={() => field.onChange(value)}
                          aria-pressed={selected}
                          className={cn(
                            "flex items-center gap-1.5 rounded-full border px-4 py-2.5 text-sm font-medium transition-colors",
                            selected
                              ? "border-accent bg-accent/10 text-accent"
                              : "border-border bg-card text-foreground hover:bg-muted"
                          )}
                        >
                          <Icon className="h-3.5 w-3.5" />
                          {label}
                        </button>
                      );
                    })}
                  </div>
                )}
              />
              {errors.otherTimeOfDay && (
                <p className="mt-1.5 text-xs text-destructive">{errors.otherTimeOfDay.message}</p>
              )}
            </div>
          </div>
        )}
      </div>

      <Button type="submit" variant="accent" size="lg" className="w-full">
        Next
      </Button>
    </form>
  );
}