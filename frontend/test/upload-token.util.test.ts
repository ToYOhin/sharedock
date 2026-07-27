import * as assert from "node:assert/strict";
import {
  getUploadTokenStatus,
  isUploadTokenRevoked,
  sortUploadTokensByCreatedAt,
} from "../src/utils/uploadToken.util";

const activeToken = {
  id: "active",
  createdAt: "2026-07-02T08:00:00.000Z",
  name: "ShareX",
  tokenPrefix: "sdock_active",
  scope: "upload",
  revokedAt: null,
  lastUsedAt: null,
};

const revokedToken = {
  id: "revoked",
  createdAt: "2026-07-02T07:00:00.000Z",
  name: "Old token",
  tokenPrefix: "sdock_oldto",
  scope: "upload",
  revokedAt: "2026-07-02T09:00:00.000Z",
  lastUsedAt: null,
};

assert.equal(getUploadTokenStatus(activeToken), "active");
assert.equal(isUploadTokenRevoked(activeToken), false);

assert.equal(getUploadTokenStatus(revokedToken), "revoked");
assert.equal(isUploadTokenRevoked(revokedToken), true);

const sortedTokens = sortUploadTokensByCreatedAt([
  revokedToken,
  activeToken,
]);

assert.deepEqual(
  sortedTokens.map((token) => token.id),
  ["active", "revoked"],
);

console.log("UPLOAD_TOKEN_FRONTEND_UTIL_TEST_OK");
