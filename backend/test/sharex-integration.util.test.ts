import * as assert from "node:assert/strict";
import {
  buildShareXUploadResponse,
  extractBearerToken,
  normalizeUploadFileName,
} from "../src/integrations/sharex/sharex.util";

assert.equal(
  extractBearerToken("Bearer sdock_example"),
  "sdock_example",
);

assert.equal(
  extractBearerToken("bearer sdock_lowercase"),
  "sdock_lowercase",
);

assert.equal(extractBearerToken(undefined), null);
assert.equal(extractBearerToken("sdock_missing_scheme"), null);
assert.equal(extractBearerToken("Bearer"), null);

assert.equal(normalizeUploadFileName("C:\\temp\\screen.png"), "screen.png");
assert.equal(normalizeUploadFileName("../screen.png"), "screen.png");
assert.equal(normalizeUploadFileName("screen\u0000.png"), "screen.png");
assert.equal(normalizeUploadFileName(""), "upload.bin");

assert.deepEqual(
  buildShareXUploadResponse({
    appUrl: "https://share.example.test/",
    shareId: "abc123",
    fileName: "screen.png",
    expiresAt: new Date("2026-07-03T00:00:00.000Z"),
  }),
  {
    shareId: "abc123",
    url: "https://share.example.test/s/abc123",
    deletionUrl: "https://share.example.test/share/abc123/edit",
    fileName: "screen.png",
    expiresAt: "2026-07-03T00:00:00.000Z",
  },
);

console.log("SHAREX_INTEGRATION_UTIL_TEST_OK");
