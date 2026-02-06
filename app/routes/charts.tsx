import { useLoaderData } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import { data } from "react-router";
import { getChartsData } from "../../lib/charts-data";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from "recharts";

export async function loader({ request }: LoaderFunctionArgs) {
  if (request.method !== "GET") {
    return data({ error: "Method not allowed", dataPoints: [], repoActivity: [] });
  }

  try {
    const chartData = await getChartsData();
    return data({ ...chartData, error: null as string | null });
  } catch (err) {
    console.error("Charts loader error:", err);
    return data({
      error: (err as Error).message,
      dataPoints: [],
      repoActivity: [],
    });
  }
}

const CHART_COLORS = {
  prs_merged: "hsl(252, 70%, 60%)",
  pr_reviews: "hsl(180, 60%, 50%)",
  linear_completed: "hsl(142, 55%, 45%)",
  linear_worked_on: "hsl(45, 90%, 55%)",
  prs_total: "hsl(320, 70%, 60%)",
  repos_count: "hsl(200, 70%, 55%)",
};

const formatWeek = (w: string) => {
  const d = new Date(w);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

export default function Charts() {
  const { dataPoints, repoActivity, error } = useLoaderData<typeof loader>() as {
    dataPoints: Awaited<ReturnType<typeof getChartsData>>["dataPoints"];
    repoActivity: Awaited<ReturnType<typeof getChartsData>>["repoActivity"];
    error: string | null;
  };

  return (
    <div className="space-y-8">
      <h2 className="text-lg font-semibold text-gray-900">Progress Charts</h2>

      {error && (
        <div className="p-4 bg-[var(--color-error-bg)] border border-[var(--color-error-border)] rounded-xl text-sm text-red-400">
          {error}
        </div>
      )}

      {dataPoints.length === 0 && !error ? (
        <div className="bg-gray-50 rounded-xl shadow-[var(--shadow-skeuo-card)] p-8 text-center text-gray-500 border border-gray-200">
          No data available for charts.
        </div>
      ) : (
        <>
          <div className="bg-gray-50 rounded-xl shadow-[var(--shadow-skeuo-card)] border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-700 mb-4">PRs & Linear</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dataPoints} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,15%,25%)" />
                  <XAxis
                    dataKey="week_ending"
                    tickFormatter={formatWeek}
                    stroke="hsl(220,15%,55%)"
                    tick={{ fill: "hsl(220,15%,85%)" }}
                  />
                  <YAxis stroke="hsl(220,15%,55%)" tick={{ fill: "hsl(220,15%,85%)" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(252, 25%, 12%)",
                      border: "1px solid hsl(220,15%,25%)",
                      borderRadius: "8px",
                    }}
                    labelStyle={{ color: "hsl(220,15%,95%)" }}
                    formatter={(value: number | undefined) => [value ?? 0, ""]}
                    labelFormatter={(label: unknown) => formatWeek(String(label ?? ""))}
                  />
                  <Legend
                    wrapperStyle={{ color: "hsl(220,15%,85%)" }}
                    formatter={(value) => value.replace(/_/g, " ")}
                  />
                  <Line
                    type="monotone"
                    dataKey="prs_merged"
                    stroke={CHART_COLORS.prs_merged}
                    strokeWidth={2}
                    dot={{ fill: CHART_COLORS.prs_merged }}
                    name="PRs merged"
                  />
                  <Line
                    type="monotone"
                    dataKey="pr_reviews"
                    stroke={CHART_COLORS.pr_reviews}
                    strokeWidth={2}
                    dot={{ fill: CHART_COLORS.pr_reviews }}
                    name="PR reviews"
                  />
                  <Line
                    type="monotone"
                    dataKey="linear_completed"
                    stroke={CHART_COLORS.linear_completed}
                    strokeWidth={2}
                    dot={{ fill: CHART_COLORS.linear_completed }}
                    name="Linear completed"
                  />
                  <Line
                    type="monotone"
                    dataKey="linear_worked_on"
                    stroke={CHART_COLORS.linear_worked_on}
                    strokeWidth={2}
                    dot={{ fill: CHART_COLORS.linear_worked_on }}
                    name="Linear worked on"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl shadow-[var(--shadow-skeuo-card)] border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-700 mb-4">Repos (PRs per week)</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={repoActivity.slice(0, 10).map((r) => ({
                    repo: r.repo.split("/").pop() ?? r.repo,
                    total_prs: r.total_prs,
                  }))}
                  layout="vertical"
                  margin={{ top: 5, right: 20, left: 60, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,15%,25%)" />
                  <XAxis type="number" stroke="hsl(220,15%,55%)" tick={{ fill: "hsl(220,15%,85%)" }} />
                  <YAxis
                    type="category"
                    dataKey="repo"
                    stroke="hsl(220,15%,55%)"
                    tick={{ fill: "hsl(220,15%,85%)" }}
                    width={55}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(252, 25%, 12%)",
                      border: "1px solid hsl(220,15%,25%)",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="total_prs" fill={CHART_COLORS.prs_merged} name="PRs merged" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
