import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LabelList, Cell } from "recharts";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";

const COLORS = ["#ec4899", "#8b5cf6", "#c4b5fd", "#f0abfc", "#cbd5e1"];

export default function IssuesChart({ data }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Reported Issues</CardTitle>
      </CardHeader>
      <div className="h-52 px-2 pb-4 sm:h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 4, right: 28, left: 8, bottom: 0 }}>
            <XAxis type="number" hide domain={[0, 60]} />
            <YAxis
              type="category"
              dataKey="label"
              tickLine={false}
              axisLine={false}
              width={100}
              tick={{ fontSize: 11, fill: "hsl(var(--foreground))" }}
            />
            <Bar dataKey="value" radius={[0, 8, 8, 0]} maxBarSize={16}>
              {data.map((entry, i) => (
                <Cell key={entry.label} fill={COLORS[i % COLORS.length]} />
              ))}
              <LabelList
                dataKey="value"
                position="right"
                formatter={(v) => `${v}%`}
                style={{ fontSize: 11, fontWeight: 600, fill: "hsl(var(--foreground))" }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}