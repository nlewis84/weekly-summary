import { data } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import { getChartsData } from "../../lib/charts-data";

export async function loader({ request }: LoaderFunctionArgs) {
  if (request.method !== "GET") {
    return data({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const chartData = await getChartsData();
    return data(chartData);
  } catch (err) {
    console.error("Charts data error:", err);
    return data({ error: (err as Error).message, dataPoints: [], repoActivity: [] }, { status: 500 });
  }
}
