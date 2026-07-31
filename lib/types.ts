export interface Stats {
  prs_merged: number;
  prs_total: number;
  pr_reviews: number;
  pr_comments: number;
  commits_pushed: number;
  /** Issues you completed plus projects you completed */
  linear_completed: number;
  /** Projects completed — the project share of linear_completed */
  linear_projects_completed?: number;
  linear_worked_on: number;
  linear_issues_created: number;
  linear_comments: number;
  repos: string[];
  /** Sum of additions across merged PRs in the window */
  lines_added?: number;
  /** Sum of deletions across merged PRs in the window */
  lines_deleted?: number;
  /** Sum of changed_files across merged PRs in the window */
  files_changed?: number;
  /** Median hours from review_requested → first review; null if none requested */
  median_review_latency_hours?: number | null;
}

export interface CheckIn {
  day: string;
  content: string;
}

export interface MergedPr {
  title: string;
  url: string;
  repo: string | null;
  merged_at: string | null;
  additions?: number;
  deletions?: number;
  changed_files?: number;
}

export interface OpenPr {
  title: string;
  url: string;
  repo: string | null;
  state: string | null;
}

export interface ReviewEntry {
  title: string;
  url: string;
  repo?: string | null;
  requested_at?: string | null;
  reviewed_at?: string | null;
  review_state?: string | null;
  /** Hours from requested_at → reviewed_at; null for drive-by reviews */
  latency_hours?: number | null;
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
    completed_projects?: Array<Record<string, unknown>>;
    worked_on_issues: Array<Record<string, unknown>>;
    created_issues?: Array<Record<string, unknown>>;
    commented_issues?: Array<Record<string, unknown>>;
  };
  github: {
    merged_prs: MergedPr[];
    open_prs: OpenPr[];
    reviews: ReviewEntry[];
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
