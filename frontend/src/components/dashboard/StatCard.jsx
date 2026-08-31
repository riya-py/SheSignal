import { Card } from "@/components/ui/card";

export default function StatCard({ label, value, icon: Icon, sublabel, badge }) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-4.5 w-4.5" />
        </span>
        {badge}
      </div>
      <p className="mt-3 text-2xl font-extrabold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
      {sublabel && <p className="text-[11px] text-muted-foreground/70">{sublabel}</p>}
    </Card>
  );
}