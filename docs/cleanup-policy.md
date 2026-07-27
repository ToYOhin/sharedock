# ShareDock Cleanup Policy

Updated: 2026-07-07

This page documents the cleanup behavior that is visible on the admin dashboard. It is a read-only description of the existing scheduled jobs; it does not add a manual cleanup trigger and does not change upload, auth, storage, or deletion eligibility behavior.

## Defaults

- New shares default to `7 days` expiration through `share.defaultExpiration`.
- Expired-share file retention defaults to `0 days` after expiration through `share.fileRetentionPeriod`.
- `share.fileRetentionPeriod = -1` disables the expired-share cleanup path for retained files.
- Temporary `.tmp-chunk` files, stale unfinished uploads, unactivated users, reverse shares, and auth tokens use fixed cleanup windows from the scheduled jobs.

## Scheduled Jobs

| Target | Schedule | Eligibility | Default/config source | Cleanup log behavior |
| --- | --- | --- | --- | --- |
| Expired shares | Every minute | Share expiration is older than `now - share.fileRetentionPeriod`, and the share is not set to never expire | `share.defaultExpiration = 7 days`; `share.fileRetentionPeriod = 0 days` | Success is logged only when at least one share is deleted; failures are logged with an error summary |
| Unfinished uploads | Every 6 hours | Share is still unlocked and `updatedAt` or `createdAt` is older than 1 day | Fixed 1 day stale-upload window | Success is logged only when at least one share is deleted; failures are logged with an error summary |
| Expired reverse shares | Hourly | Reverse-share expiration is in the past | Expiration chosen when the reverse-share link is created | Success is logged only when at least one reverse share is deleted; failures are logged with an error summary |
| Expired auth tokens | Hourly at minute 1 | Refresh, login, or reset-password token expiration is in the past | Each token row stores its own expiration | Success is logged only when at least one token is deleted; failures are logged with an error summary |
| Unactivated users | Hourly | User account is still inactive more than 24 hours after creation | Fixed 24 hour activation window | Success is logged only when at least one user is deleted; failures are logged with an error summary |
| Temporary chunks | Daily at midnight | Local `.tmp-chunk` file was modified more than 1 day ago | Fixed 1 day temporary-chunk window | Success is logged only when at least one file is deleted; failures are logged with an error summary |

## Admin Visibility

- `GET /api/jobs/cleanup-preview` is admin-only and read-only.
- The cleanup preview groups current cleanup candidates without calling any delete/remove path.
- `GET /api/jobs/cleanup-logs` is admin-only and read-only.
- Cleanup logs retain the latest cleanup summaries, capped by the backend limit.
- The admin dashboard now shows:
  - cleanup policy summary;
  - cleanup preview;
  - cleanup logs.

## Safety Boundaries

- There is no manual "run cleanup now" button.
- Scheduled deletion conditions are unchanged by the visibility UI.
- Zero-delete successful cleanup runs are intentionally skipped in persistent logs to avoid noise.
- Failures are logged and then rethrown, so scheduler/runtime visibility remains intact.
