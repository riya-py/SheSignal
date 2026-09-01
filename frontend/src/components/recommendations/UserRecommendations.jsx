import { HeartHandshake, ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { iconForRecommendation } from "@/data/mockRecommendations";

export default function UserRecommendations({ recommendations }) {
  return (
    <div className="space-y-4">
      <Card className="p-2">
        <p className="px-3 pt-3 text-sm font-bold text-foreground">What you can do</p>
        {recommendations.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-3 py-8 text-center">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <ShieldCheck className="h-4.5 w-4.5" />
            </span>
            <p className="text-sm font-medium text-foreground">No specific tips for this area yet</p>
            <p className="max-w-xs text-xs text-muted-foreground">
              There aren't enough reports near here for tailored recommendations. General safety
              habits still apply — stay aware of your surroundings and share your live location
              with someone you trust.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {recommendations.map((rec, i) => {
              const Icon = iconForRecommendation(rec);
              return (
                <li key={`${rec.type}-${i}`} className="flex items-start gap-3 px-3 py-3.5">
                  <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Icon className="h-4.5 w-4.5" />
                  </span>
                  <p className="text-sm text-foreground">{rec.text}</p>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <div className="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-primary/10 to-accent/10 p-4">
        <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-white">
          <HeartHandshake className="h-5 w-5" />
        </span>
        <div>
          <p className="text-sm font-bold text-foreground">Your safety matters.</p>
          <p className="text-xs text-muted-foreground">Trust your instincts.</p>
        </div>
      </div>
    </div>
  );
}