import * as assert from "node:assert/strict";
import {
  createUploadTokenSecret,
  getUploadTokenPrefix,
  hashUploadTokenSecret,
  UPLOAD_TOKEN_PREFIX,
  UPLOAD_TOKEN_SCOPE,
} from "../src/uploadToken/uploadToken.util";

const token = createUploadTokenSecret();
const secondToken = createUploadTokenSecret();

assert.equal(UPLOAD_TOKEN_PREFIX, "sdock_");
assert.equal(UPLOAD_TOKEN_SCOPE, "upload");
assert.match(token, /^sdock_[A-Za-z0-9_-]+$/);
assert.ok(token.length >= 40);
assert.notEqual(token, secondToken);

const tokenHash = hashUploadTokenSecret(token);

assert.match(tokenHash, /^[a-f0-9]{64}$/);
assert.equal(hashUploadTokenSecret(token), tokenHash);
assert.notEqual(tokenHash, token);

const tokenPrefix = getUploadTokenPrefix(token);

assert.equal(tokenPrefix, token.slice(0, 12));
assert.ok(token.startsWith(tokenPrefix));
assert.ok(tokenPrefix.length < token.length);

console.log("UPLOAD_TOKEN_UTIL_TEST_OK");
