import { redirect } from "react-router";
import type { LoaderFunctionArgs } from "react-router";

/**
 * Redirect /history/annual to /charts?view=annual for unified Charts experience.
 * Preserves year and compare query params.
 */
export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const year = url.searchParams.get("year");
  const compare = url.searchParams.get("compare");
  const params = new URLSearchParams({ view: "annual" });
  if (year) params.set("year", year);
  if (compare) params.set("compare", compare);
  return redirect(`/charts?${params.toString()}`);
}

export default function HistoryAnnual() {
  return null;
}
