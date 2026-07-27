import * as assert from "node:assert/strict";
import {
  CLEANUP_LOG_LIMIT,
  CLEANUP_LOG_STATUS_FAILURE,
  CLEANUP_LOG_STATUS_SUCCESS,
  getCleanupLogErrorMessage,
  parseCleanupLogDetails,
  serializeCleanupLogDetails,
  shouldRecordCleanupLog,
} from "../src/jobs/cleanup-log.util";

assert.equal(CLEANUP_LOG_LIMIT, 50);
assert.equal(CLEANUP_LOG_STATUS_SUCCESS, "success");
assert.equal(CLEANUP_LOG_STATUS_FAILURE, "failure");

assert.equal(shouldRecordCleanupLog(0, CLEANUP_LOG_STATUS_SUCCESS), false);
assert.equal(shouldRecordCleanupLog(2, CLEANUP_LOG_STATUS_SUCCESS), true);
assert.equal(shouldRecordCleanupLog(0, CLEANUP_LOG_STATUS_FAILURE), true);

assert.equal(
  serializeCleanupLogDetails({
    refreshTokens: 2,
    loginTokens: 1,
    resetPasswordTokens: 0,
  }),
  '{"refreshTokens":2,"loginTokens":1,"resetPasswordTokens":0}',
);

assert.deepEqual(parseCleanupLogDetails(null), null);
assert.deepEqual(parseCleanupLogDetails("{bad json"), null);
assert.deepEqual(parseCleanupLogDetails('{"deletedShares":3}'), {
  deletedShares: 3,
});

assert.equal(
  getCleanupLogErrorMessage(new Error("cleanup failed")),
  "cleanup failed",
);
assert.equal(getCleanupLogErrorMessage("plain failure"), "plain failure");

console.log("CLEANUP_LOG_UTIL_TEST_OK");
