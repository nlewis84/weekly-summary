import { useFetcher } from "react-router";
import { FullSummaryForm } from "./FullSummaryForm";
import type { Payload } from "../../lib/types";

export function FullSummaryFormContainer() {
  const fetcher = useFetcher<{ payload?: Payload; error?: string; saved?: boolean }>();

  return (
    <FullSummaryForm
      Form={fetcher.Form}
      action="/api/summary"
      isSubmitting={fetcher.state !== "idle"}
      error={fetcher.data?.error}
      saved={fetcher.data?.saved}
      payload={fetcher.data?.payload ?? null}
    />
  );
}
