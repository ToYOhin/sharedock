import * as assert from "node:assert/strict";
import {
  CLEANUP_POLICY_ITEMS,
  getCleanupPolicyItemCount,
  hasManualCleanupTrigger,
} from "../src/utils/cleanupPolicy.util";

assert.deepEqual(
  CLEANUP_POLICY_ITEMS.map((item) => item.key),
  [
    "expiredShares",
    "unfinishedShares",
    "expiredReverseShares",
    "expiredAuthTokens",
    "unactivatedUsers",
    "temporaryFiles",
  ],
);

assert.equal(getCleanupPolicyItemCount(), 6);
assert.equal(hasManualCleanupTrigger(), false);
assert.equal(CLEANUP_POLICY_ITEMS[0].schedule, "every_minute");
assert.equal(
  CLEANUP_POLICY_ITEMS[0].defaultPolicy,
  "share_expiration_plus_retention",
);
assert.equal(
  CLEANUP_POLICY_ITEMS[0].defaultConfig,
  "default_7_days_retention_0_days",
);
assert.equal(CLEANUP_POLICY_ITEMS[5].condition, "tmp_chunk_older_than_1_day");
assert.equal(
  CLEANUP_POLICY_ITEMS[5].logBehavior,
  "success_when_deleted_failure_when_failed",
);

console.log("CLEANUP_POLICY_FRONTEND_UTIL_TEST_OK");
