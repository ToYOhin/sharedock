import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";

// Run only against the fresh, disposable container started by Docker Security.
const base = new URL(process.argv[2] || "http://127.0.0.1:3000");
assert.ok(
  base.protocol === "http:" && ["127.0.0.1", "localhost"].includes(base.hostname),
  "Image smoke tests require a loopback HTTP endpoint",
);

async function request(path, options = {}, expectedStatus = 200) {
  const response = await fetch(new URL(path, base), {
    redirect: "error",
    ...options,
    signal: AbortSignal.timeout(30_000),
  });
  assert.equal(response.status, expectedStatus, `${path}: unexpected HTTP status`);
  return response;
}

function json(body, cookie) {
  return {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: JSON.stringify(body),
  };
}

const home = await request("/");
assert.match(await home.text(), /ShareDock/);
await request("/api/health");

const suffix = randomUUID().replaceAll("-", "").slice(0, 12);
const signup = await (
  await request(
    "/api/auth/signUp",
    json({
      email: `image-smoke-${suffix}@example.test`,
      username: `smoke${suffix}`,
      password: `Smoke!${randomUUID()}`,
    }),
    201,
  )
).json();
assert.ok(signup.accessToken, "Signup must return an access token");
const cookie = `access_token=${signup.accessToken}`;
const token = await (
  await request("/api/uploadTokens", json({ name: "Image smoke" }, cookie), 201)
).json();
assert.ok(token.id && token.token, "Token creation must return its ID and secret");

const png = await readFile(new URL("../frontend/public/img/logo.png", import.meta.url));
const upload = () => {
  const body = new FormData();
  body.append("file", new Blob([png], { type: "image/png" }), "smoke.png");
  return { method: "POST", headers: { Authorization: `Bearer ${token.token}` }, body };
};
const share = await (
  await request("/api/integrations/sharex/upload", upload(), 201)
).json();
assert.ok(share.shareId, "Upload must return a share ID");
assert.equal(share.fileName, "smoke.png");
assert.equal(share.url, `http://localhost:3000/s/${share.shareId}`);
const alias = await request(`/s/${share.shareId}`, { redirect: "manual" }, 307);
assert.equal(alias.headers.get("location"), `/share/${share.shareId}`);
await request(`/share/${share.shareId}`);
const saved = await (
  await request(`/api/shares/${share.shareId}/from-owner`, { headers: { Cookie: cookie } })
).json();
assert.equal(saved.files?.length, 1, "Uploaded file must be persisted in the share");
assert.equal(saved.files[0].name, "smoke.png");

await request(`/api/uploadTokens/${token.id}`, {
  method: "DELETE",
  headers: { Cookie: cookie },
});
await request("/api/integrations/sharex/upload", upload(), 401);
console.log("IMAGE_SMOKE_OK: frontend, health, SQLite signup, token upload, saved share, revoked token rejected");
