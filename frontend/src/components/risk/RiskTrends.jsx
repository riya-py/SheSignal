import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { Pie, PieChart, Cell } from "recharts";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { FACTOR_META, DONUT_COLORS } from "@/data/mockRisk";

export function ReportTrendCard({ trend }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Report Trends</CardTitle>
      </CardHeader>
      <div className="h-40 px-2 pb-4 sm:h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={trend} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
            <XAxis
              dataKey="hour"
              tickLine={false}
              axisLine={false}
              interval={0}
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
            />
            <Tooltip
              cursor={{ fill: "hsl(var(--muted))" }}
              contentStyle={{
                background: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: 12,
                fontSize: 12,
              }}
            />
            <Bar dataKey="reports" fill="#ec4899" radius={[6, 6, 0, 0]} maxBarSize={22} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

export function TopIssuesCard({ factors }) {
  const data = factors.map((f) => ({
    name: FACTOR_META[f.factor]?.shortLabel ?? f.factor,
    factor: f.factor,
    value: Math.round(f.share * 100),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Issues</CardTitle>
      </CardHeader>
      <div className="flex flex-col items-center gap-4 px-5 pb-5 sm:flex-row">
        <div className="h-32 w-32 flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} dataKey="value" innerRadius={38} outerRadius={58} paddingAngle={2}>
                {data.map((entry, i) => (
                  <Cell key={entry.factor} fill={DONUT_COLORS[i % DONUT_COLORS.length]} stroke="none" />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
        <ul className="w-full space-y-1.5">
          {data.map((entry, i) => (
            <li key={entry.factor} className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-foreground">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: DONUT_COLORS[i % DONUT_COLORS.length] }}
                />
                {entry.name}
              </span>
              <span className="font-semibold text-foreground">{entry.value}%</span>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}