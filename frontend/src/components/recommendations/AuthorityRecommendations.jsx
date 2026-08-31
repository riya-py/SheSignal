import { ArrowRight, MapPin } from "lucide-react";
import { Card } from "@/components/ui/card";
import { iconForRecommendation } from "@/data/mockRecommendations";

export default function AuthorityRecommendations({ recommendations }) {
  return (
    <Card className="p-2">
      <p className="px-3 pt-3 text-sm font-bold text-foreground">Recommended Action</p>
      <ul className="divide-y divide-border">
        {recommendations.map((rec) => {
          const Icon = iconForRecommendation(rec);
          return (
            <li key={rec.text} className="flex items-center gap-3 px-3 py-3.5">
              <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
                <Icon className="h-4.5 w-4.5" />
              </span>
              <p className="flex-1 text-sm text-foreground">{rec.text}</p>
              <ArrowRight className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
              <span className="flex items-center gap-1 whitespace-nowrap text-xs font-medium text-muted-foreground">
                <MapPin className="h-3 w-3" />
                This zone
              </span>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}