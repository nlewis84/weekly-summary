import { useCallback, useEffect, useState } from "react";
import { useFetcher, useNavigation } from "react-router";
import { FullSummaryForm } from "./FullSummaryForm";
import type { SnapshotDay } from "./FullSummaryForm";
import type { Payload } from "../../lib/types";

interface SnapshotsResponse {
  snapshots?: SnapshotDay[];
  error?: string;
}

export function FullSummaryFormContainer() {
  const fetcher = useFetcher<{
    payload?: Payload;
    error?: string;
    saved?: boolean;
    builtAt?: string;
    weekEnding?: string;
  }>();
  const navigation = useNavigation();

  const [snapshots, setSnapshots] = useState<SnapshotDay[]>([]);
  const [snapshotsLoading, setSnapshotsLoading] = useState(true);
  const [fetchCount, setFetchCount] = useState(0);

  const refreshSnapshots = useCallback(() => {
    setFetchCount((c) => c + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (fetchCount === 0) setSnapshotsLoading(true);
    fetch("/api/snapshots")
      .then((res) => res.json() as Promise<SnapshotsResponse>)
      .then((data) => {
        if (!cancelled && data.snapshots) {
          setSnapshots(data.snapshots);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setSnapshotsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [fetchCount]);

  useEffect(() => {
    if (navigation.state === "idle") {
      refreshSnapshots();
    }
  }, [navigation.state, refreshSnapshots]);

  return (
    <div className="xl:w-96 xl:h-full xl:flex xl:flex-col xl:flex-nowrap xl:items-stretch xl:min-h-0">
    <FullSummaryForm
      Form={fetcher.Form}
      action="/api/summary"
      isSubmitting={fetcher.state !== "idle"}
      error={fetcher.data?.error}
      saved={fetcher.data?.saved}
      builtAt={fetcher.data?.builtAt}
      weekEnding={fetcher.data?.weekEnding}
      payload={fetcher.data?.payload ?? null}
      snapshots={snapshots}
      snapshotsLoading={snapshotsLoading}
    />
    </div>
  );
}
