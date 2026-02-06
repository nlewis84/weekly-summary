# Plan 19: Search Across History

**Status: ✅ Complete** · **Priority: P1** · **Effort: Medium** · **Impact: High**

## Problem

As history grows, finding a specific week or topic becomes tedious. Search would help locate summaries by date, content, or keyword.

## Tasks

1. [ ] Add search input on History index page
2. [ ] Search across week labels and summary content (client-side or via API)
3. [ ] Filter / highlight matching weeks
4. [ ] Consider: full-text search if summaries are large (e.g. Fuse.js, or server-side search)
5. [ ] Debounce input for performance

## Success Criteria

- User can search history and see matching weeks
- Results update as user types (with debounce)
