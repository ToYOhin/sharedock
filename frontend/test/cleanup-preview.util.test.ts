import * as assert from "node:assert/strict";
import { CleanupPreview } from "../src/types/cleanupPreview.type";
import {
  getCleanupPreviewGroups,
  getCleanupPreviewTotal,
  hasCleanupPreviewWork,
} from "../src/utils/cleanupPreview.util";

const preview: CleanupPreview = {
  generatedAt: "2026-07-02T08:00:00.000Z",
  limit: 100,
  expiredShares: {
    reason: "expired_retention_elapsed",
    retentionDisabled: false,
    thresholdAt: "2026-07-01T08:00:00.000Z",
    total: 2,
    candidates: [],
  },
  unfinishedShares: {
    reason: "unfinished_upload_stale",
    cutoffAt: "2026-07-01T08:00:00.000Z",
    total: 1,
    candidates: [],
  },
  expiredReverseShares: {
    reason: "reverse_share_expired",
    total: 0,
    candidates: [],
  },
  expiredAuthTokens: {
    reason: "expired_auth_token",
    refreshTokens: 3,
    loginTokens: 1,
    resetPasswordTokens: 2,
    total: 6,
  },
  unactivatedUsers: {
    reason: "unactivated_user_expired",
    cutoffAt: "2026-07-01T08:00:00.000Z",
    total: 1,
    candidates: [],
  },
  temporaryFiles: {
    reason: "temporary_chunk_expired",
    total: 4,
    candidates: [],
  },
};

const groups = getCleanupPreviewGroups(preview);
const emptyPreview: CleanupPreview = {
  ...preview,
  expiredShares: { ...preview.expiredShares, total: 0 },
  unfinishedShares: { ...preview.unfinishedShares, total: 0 },
  expiredAuthTokens: {
    ...preview.expiredAuthTokens,
    refreshTokens: 0,
    loginTokens: 0,
    resetPasswordTokens: 0,
    total: 0,
  },
  unactivatedUsers: { ...preview.unactivatedUsers, total: 0 },
  temporaryFiles: { ...preview.temporaryFiles, total: 0 },
};

assert.deepEqual(
  groups.map((group) => group.key),
  [
    "expiredShares",
    "unfinishedShares",
    "expiredReverseShares",
    "expiredAuthTokens",
    "unactivatedUsers",
    "temporaryFiles",
  ],
);

assert.equal(getCleanupPreviewTotal(preview), 14);
assert.equal(hasCleanupPreviewWork(preview), true);
assert.equal(hasCleanupPreviewWork(emptyPreview), false);

console.log("CLEANUP_PREVIEW_FRONTEND_UTIL_TEST_OK");
