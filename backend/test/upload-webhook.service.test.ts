import * as assert from "node:assert/strict";
import { UploadWebhookService } from "../src/integrations/webhook/uploadWebhook.service";

const originalFetch = globalThis.fetch;
const originalUrl = process.env.SHAREDOCK_UPLOAD_WEBHOOK_URL;
const originalSecret = process.env.SHAREDOCK_UPLOAD_WEBHOOK_SECRET;
let request: { input: RequestInfo | URL; init?: RequestInit } | undefined;

async function main() {
  globalThis.fetch = (async (input, init) => {
    request = { input, init };
    return { ok: true, status: 204 } as Response;
  }) as typeof fetch;
  process.env.SHAREDOCK_UPLOAD_WEBHOOK_URL = "https://hooks.example.test/sharedock";
  process.env.SHAREDOCK_UPLOAD_WEBHOOK_SECRET = "test-secret";

  try {
    await new UploadWebhookService().notifyUploaded({
      event: "share.uploaded",
      shareId: "abc123",
      fileName: "screen.png",
      url: "https://share.example.test/s/abc123",
      deletionUrl: "https://share.example.test/share/abc123/edit",
      expiresAt: "2026-07-11T00:00:00.000Z",
    });

    assert.ok(request);
    assert.equal(request.input.toString(), "https://hooks.example.test/sharedock");
    assert.equal(request.init?.method, "POST");
    assert.equal(request.init?.headers?.["content-type"], "application/json");
    assert.match(
      String(request.init?.headers?.["x-sharedock-signature"]),
      /^sha256=[0-9a-f]{64}$/,
    );
    assert.deepEqual(JSON.parse(String(request.init?.body)), {
      event: "share.uploaded",
      shareId: "abc123",
      fileName: "screen.png",
      url: "https://share.example.test/s/abc123",
      deletionUrl: "https://share.example.test/share/abc123/edit",
      expiresAt: "2026-07-11T00:00:00.000Z",
    });
  } finally {
    globalThis.fetch = originalFetch;
    if (originalUrl === undefined) delete process.env.SHAREDOCK_UPLOAD_WEBHOOK_URL;
    else process.env.SHAREDOCK_UPLOAD_WEBHOOK_URL = originalUrl;
    if (originalSecret === undefined) delete process.env.SHAREDOCK_UPLOAD_WEBHOOK_SECRET;
    else process.env.SHAREDOCK_UPLOAD_WEBHOOK_SECRET = originalSecret;
  }
}

main().then(() => console.log("UPLOAD_WEBHOOK_SERVICE_TEST_OK"));
