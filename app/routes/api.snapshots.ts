import { data } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import {
  listDailySnapshots,
  loadDailySnapshot,
  formatSnapshotAsCheckIn,
} from "../../lib/daily-snapshot";

function getCurrentWeekEnding(): string {
  const now = new Date();
  const day = now.getDay();
  const friday = new Date(now);
  if (day === 0) {
    friday.setDate(now.getDate() - 2);
  } else if (day === 6) {
    friday.setDate(now.getDate() - 1);
  } else {
    friday.setDate(now.getDate() + (5 - day));
  }
  return friday.toISOString().slice(0, 10);
}

export interface SnapshotInfo {
  date: string;
  dayName: string;
  captured_at: string;
  checkInText: string;
}

export async function loader({ request }: LoaderFunctionArgs) {
  if (request.method !== "GET") {
    return data({ error: "Method not allowed" }, { status: 405 });
  }

  const url = new URL(request.url);
  const weekEnding =
    url.searchParams.get("weekEnding") ?? getCurrentWeekEnding();

  try {
    const entries = listDailySnapshots(weekEnding);
    const snapshots: SnapshotInfo[] = entries.map((entry) => {
      const payload = loadDailySnapshot(entry.date);
      return {
        ...entry,
        checkInText: payload
          ? formatSnapshotAsCheckIn(entry.date, payload)
          : "",
      };
    });
    return data({ snapshots, weekEnding });
  } catch (err) {
    console.error("Snapshots list error:", err);
    return data({ error: (err as Error).message }, { status: 500 });
  }
}
