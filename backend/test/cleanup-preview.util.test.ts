import * as assert from "node:assert/strict";
import {
  buildCleanupThresholdDate,
  CLEANUP_PREVIEW_LIMIT,
  isExpiredTemporaryFile,
  summarizeExpiredTokenCounts,
} from "../src/jobs/cleanup-preview.util";

const now = new Date("2026-07-02T10:00:00.000Z");

assert.equal(
  buildCleanupThresholdDate({ value: 2, unit: "days" }, now)?.toISOString(),
  "2026-06-30T10:00:00.000Z",
);

assert.equal(buildCleanupThresholdDate({ value: -1, unit: "days" }, now), null);

assert.equal(
  isExpiredTemporaryFile(new Date("2026-07-01T08:59:59.000Z"), now),
  true,
);

assert.equal(
  isExpiredTemporaryFile(new Date("2026-07-01T10:00:01.000Z"), now),
  false,
);

assert.deepEqual(
  summarizeExpiredTokenCounts({
    refreshTokens: 2,
    loginTokens: 1,
    resetPasswordTokens: 3,
  }),
  {
    refreshTokens: 2,
    loginTokens: 1,
    resetPasswordTokens: 3,
    total: 6,
  },
);

assert.equal(CLEANUP_PREVIEW_LIMIT, 100);

console.log("CLEANUP_PREVIEW_UTIL_TEST_OK");
