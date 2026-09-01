import { useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";

// Picks a "nice" step (5, 10, 25, 50, 100...) so small report counts get
// small increments and large counts get large ones, instead of a fixed 0-200.
function getNiceAxisConfig(data, key) {
  const max = Math.max(0, ...data.map((d) => d[key] ?? 0));
  if (max <= 0) return { domain: [0, 20], ticks: [0, 5, 10, 15, 20] };

  const rawStep = max / 4;
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const residual = rawStep / magnitude;

  let step;
  if (residual > 5) step = 10 * magnitude;
  else if (residual > 2) step = 5 * magnitude;
  else if (residual > 1) step = 2 * magnitude;
  else step = magnitude;

  const topTick = Math.ceil(max / step) * step;
  const ticks = [];
  for (let t = 0; t <= topTick; t += step) ticks.push(t);
  return { domain: [0, topTick], ticks };
}

export default function ReportsChart({ data }) {
  const { domain, ticks } = useMemo(() => getNiceAxisConfig(data, "reports"), [data]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reports Over Time</CardTitle>
      </CardHeader>
      <div className="h-52 px-2 pb-4 sm:h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 4, right: 12, left: -12, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeDasharray="4 4" />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              interval={0}
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              domain={domain}
              ticks={ticks}
            />
            <Tooltip
              contentStyle={{
                background: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: 12,
                fontSize: 12,
              }}
            />
            <Line
              type="monotone"
              dataKey="reports"
              stroke="#8b5cf6"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}