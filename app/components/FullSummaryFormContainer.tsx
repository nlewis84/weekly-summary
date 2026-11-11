import { useCallback, useEffect, useState } from "react";
import { useFetcher, useNavigation } from "react-router";
import { FullSummaryForm } from "./FullSummaryForm";
import type { SnapshotDay } from "./FullSummaryForm";
import { BasecampCheckInPreviewDialog } from "./BasecampCheckInPreviewDialog";
import { useToast } from "./Toast";
import type { Payload } from "../../lib/types";
import type { WeeklyBasecampPreview } from "../../lib/checkin-types";

interface SnapshotsResponse {
  snapshots?: SnapshotDay[];
  error?: string;
}

interface FullSummaryFormContainerProps {
  basecampConfigured?: boolean;
}

export function FullSummaryFormContainer({
  basecampConfigured = false,
}: FullSummaryFormContainerProps) {
  const fetcher = useFetcher<{
    payload?: Payload;
    error?: string;
    saved?: boolean;
    basecampPreview?: WeeklyBasecampPreview;
    builtAt?: string;
    weekEnding?: string;
  }>();
  const postFetcher = useFetcher<{
    ok?: boolean;
    basecampPosted?: boolean;
    basecampError?: string;
    basecampUrl?: string;
    error?: string;
  }>();
  const navigation = useNavigation();
  const toast = useToast();
  const [preview, setPreview] = useState<WeeklyBasecampPreview | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [draft, setDraft] = useState("");

  const saveData = fetcher.data;
  useEffect(() => {
    const p = saveData?.basecampPreview;
    if (p) {
      setPreview(p);
      setDraft(p.draft);
      setPreviewOpen(true);
    }
  }, [saveData]);

  const postData = postFetcher.data;
  useEffect(() => {
    if (!postData) return;
    if (postData.error) {
      toast(postData.error);
    } else if (postData.ok) {
      setPreviewOpen(false);
      let msg = "Weekly callouts posted to Basecamp";
      if (postData.basecampError) msg += ` (${postData.basecampError})`;
      toast(msg);
    }
  }, [postData, toast]);

  const handlePost = () => {
    if (!preview) return;
    postFetcher.submit(
      { weekEnding: preview.weekEnding, body: draft },
      { method: "post", action: "/api/weekly-post" }
    );
  };

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
    <div className="w-full xl:flex xl:flex-col xl:items-stretch xl:min-h-0">
    <BasecampCheckInPreviewDialog
      open={previewOpen && !!preview}
      title="Preview weekly callouts"
      description="Edit the callouts, then post to Basecamp. The summary is already saved."
      postLabel="Post to Basecamp"
      draft={draft}
      onDraftChange={setDraft}
      writerNotes={preview?.notes}
      roster={preview?.roster}
      mentionRules={preview?.mentionRules}
      screenshots={preview?.screenshots.map((s) => ({
        url: s.dataUrl,
        name: s.name,
      }))}
      isBusy={postFetcher.state !== "idle"}
      onCancel={() => setPreviewOpen(false)}
      onPost={handlePost}
    />
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
      basecampConfigured={basecampConfigured}
    />
    </div>
  );
}
