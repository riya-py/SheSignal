import { z } from "zod";
import {
  User,
  Lightbulb,
  Bus,
  PersonStanding,
  ShieldOff,
  Eye,
  CircleEllipsis,
  Clock,
  History,
  CalendarClock,
  Sunrise,
  Sun,
  Sunset,
  Moon,
} from "lucide-react";

export const reportCategories = [
  { value: "harassment", label: "Harassment", icon: User },
  { value: "poor_lighting", label: "Poor Lighting", icon: Lightbulb },
  { value: "unsafe_transit", label: "Unsafe Transport", icon: Bus },
  { value: "isolated_area", label: "Isolated Area", icon: PersonStanding },
  { value: "lack_of_security", label: "Lack of Security", icon: ShieldOff },
  { value: "suspicious_activity", label: "Suspicious Activity", icon: Eye },
  { value: "other", label: "Other", icon: CircleEllipsis },
];

export const timingOptions = [
  { value: "just_now", label: "Just now", icon: Clock },
  { value: "earlier_today", label: "Earlier today", icon: History },
  { value: "other", label: "Other", icon: CalendarClock },
];

// Representative 24h hour used to turn a time-of-day bucket into an actual
// occurred_at timestamp when the reporter picks "Other" - no exact clock
// time is collected in this UI, just a rough part of the day.
export const timeOfDayOptions = [
  { value: "morning", label: "Morning", icon: Sunrise, hour: 8 },
  { value: "afternoon", label: "Afternoon", icon: Sun, hour: 14 },
  { value: "evening", label: "Evening", icon: Sunset, hour: 18 },
  { value: "night", label: "Night", icon: Moon, hour: 21 },
];

export const detailsSchema = z
  .object({
    category: z.string().min(1, "Pick what happened"),
    description: z
      .string()
      .min(1, "Please add a short description")
      .max(300, "Keep it under 300 characters"),
    timing: z.string().min(1, "Pick when this happened"),
    // Only required when timing === "other" - picked via the mini calendar
    // + time-of-day selector that appears in that case.
    otherDate: z.string().optional(),
    otherTimeOfDay: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.timing !== "other") return;

    if (!data.otherDate) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["otherDate"], message: "Pick a date" });
    }
    if (!data.otherTimeOfDay) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["otherTimeOfDay"],
        message: "Pick a time of day",
      });
    }
  });