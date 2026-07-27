import * as assert from "node:assert/strict";
import {
  buildUploadWebhookSignature,
  getUploadWebhookUrl,
} from "../src/integrations/webhook/uploadWebhook.util";

assert.equal(
  getUploadWebhookUrl({
    SHAREDOCK_UPLOAD_WEBHOOK_URL: " https://hooks.example.test/sharedock ",
  }),
  "https://hooks.example.test/sharedock",
);
assert.equal(getUploadWebhookUrl({}), null);
assert.throws(
  () =>
    getUploadWebhookUrl({
      SHAREDOCK_UPLOAD_WEBHOOK_URL: "file:///tmp/hook",
    }),
  /must use http or https/,
);
assert.match(
  buildUploadWebhookSignature(
    "{\"event\":\"share.uploaded\"}",
    "test-secret",
  ),
  /^sha256=[0-9a-f]{64}$/,
);

console.log("UPLOAD_WEBHOOK_UTIL_TEST_OK");
