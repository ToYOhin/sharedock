import * as assert from "node:assert/strict";
import {
  getCleanupLogDetailsText,
  getCleanupLogStatusColor,
  getCleanupLogTotalDeleted,
} from "../src/utils/cleanupLog.util";
import { CleanupLog } from "../src/types/cleanupLog.type";

const logs: CleanupLog[] = [
  {
    id: "log-1",
    createdAt: "2026-07-03T00:00:00.000Z",
    jobName: "expired_shares",
    status: "success",
    deletedCount: 2,
    errorMessage: null,
    details: null,
  },
  {
    id: "log-2",
    createdAt: "2026-07-03T01:00:00.000Z",
    jobName: "expired_tokens",
    status: "failure",
    deletedCount: 0,
    errorMessage: "cleanup failed",
    details: {
      refreshTokens: 2,
      loginTokens: 1,
    },
  },
];

assert.equal(getCleanupLogStatusColor("success"), "green");
assert.equal(getCleanupLogStatusColor("failure"), "red");
assert.equal(getCleanupLogStatusColor("unknown"), "gray");
assert.equal(getCleanupLogTotalDeleted(logs), 2);
assert.equal(
  getCleanupLogDetailsText(logs[1].details),
  "refreshTokens: 2, loginTokens: 1",
);
assert.equal(getCleanupLogDetailsText(null), "");

console.log("CLEANUP_LOG_FRONTEND_UTIL_TEST_OK");
