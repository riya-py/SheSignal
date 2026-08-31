import { z } from "zod";
import { User, Lightbulb, Bus, PersonStanding, ShieldOff, Eye, CircleEllipsis, Clock, History, CalendarClock } from "lucide-react";

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

export const detailsSchema = z.object({
  category: z.string().min(1, "Pick what happened"),
  description: z
    .string()
    .min(1, "Please add a short description")
    .max(300, "Keep it under 300 characters"),
  timing: z.string().min(1, "Pick when this happened"),
});