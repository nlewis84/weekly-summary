export interface Stats {
  prs_merged: number;
  prs_total: number;
  pr_reviews: number;
  pr_comments: number;
  linear_completed: number;
  linear_worked_on: number;
  repos: string[];
}

export interface CheckIn {
  day: string;
  content: string;
}

export interface Payload {
  meta: {
    generated_at: string;
    window_start: string;
    window_end: string;
    week_ending: string;
    source_of_truth?: string;
  };
  stats: Stats;
  linear: {
    completed_issues: Array<Record<string, unknown>>;
    worked_on_issues: Array<Record<string, unknown>>;
  };
  github: {
    merged_prs: Array<{ title: string; url: string; repo: string | null; merged_at: string | null }>;
    reviews: Array<{ title: string; url: string }>;
  };
  check_ins: CheckIn[];
  terminal_output: string;
  formatted_output: string | null;
}

export interface RunSummaryResult {
  payload: Payload;
  terminalOutput: string;
  formattedOutput: string | null;
}
