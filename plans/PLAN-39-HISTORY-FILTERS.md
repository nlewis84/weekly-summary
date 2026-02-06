# Plan 39: History Filters (by Repo / Project)

**Status: 🔲 Pending** · **Priority: P2** · **Effort: Medium** · **Impact: Medium**

## Problem

History shows all weeks. Users working across multiple repos or Linear projects may want to filter: "Show only weeks where I worked on apollos-admin" or "weeks with Linear project X."

## Tasks

1. [ ] Build index of repos/projects per week (from `listWeeklySummaries` + fetch payloads, or cache)
2. [ ] Add filter UI on History page: multi-select repos, multi-select Linear projects
3. [ ] Filter week list by: week must have at least one selected repo/project
4. [ ] Persist filter in URL params for shareable links
5. [ ] Consider performance: avoid fetching all payloads; may need summary index or lazy load

## Success Criteria

- User can filter history by repo and/or Linear project
- Filter state in URL for bookmarking
- Reasonable performance (no N+1 fetches)
