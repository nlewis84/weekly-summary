import { data } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import { getQuotaStatus } from "../../lib/quota";

export async function loader({ request }: LoaderFunctionArgs) {
  if (request.method !== "GET") {
    return data({ error: "Method not allowed" }, { status: 405 });
  }

  const status = await getQuotaStatus();
  return data(status);
}
