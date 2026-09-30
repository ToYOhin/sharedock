const assert = require("node:assert/strict");
const http = require("node:http");
const { once } = require("node:events");
const { test } = require("node:test");
const bodyParser = require("body-parser");

async function serve(t, parser) {
  const server = http.createServer((req, res) => {
    parser(req, res, (error) => {
      res.setHeader("Content-Type", "application/json");
      res.statusCode = error ? error.status || 500 : 200;
      res.end(JSON.stringify(error ? { type: error.type } : req.body));
    });
  });
  t.after(() => new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
    server.closeAllConnections();
  }));
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  return async (type, body) => fetch(`http://127.0.0.1:${server.address().port}`, {
    method: "POST",
    headers: { "Content-Type": type },
    body,
    signal: AbortSignal.timeout(5000),
  });
}

test("invalid limits fail at construction instead of disabling enforcement", () => {
  for (const factory of [bodyParser.raw, bodyParser.json, bodyParser.text, bodyParser.urlencoded]) {
    for (const limit of ["not-a-size", NaN]) {
      assert.throws(() => factory({ limit, extended: true }), /limit/i);
    }
    for (const limit of [null, undefined, 0, "64B"]) {
      assert.doesNotThrow(() => factory({ limit, extended: true }));
    }
  }
});

test("raw upload limits preserve valid bytes and reject a one-byte overflow", async (t) => {
  // Match main.ts's chunk-size syntax without a large denial-of-service payload.
  const post = await serve(t, bodyParser.raw({ type: "application/octet-stream", limit: `${64}B` }));
  const valid = await post("application/octet-stream", Buffer.alloc(64, 7));
  assert.equal(valid.status, 200);
  assert.deepEqual((await valid.json()).data, Array(64).fill(7));
  const oversized = await post("application/octet-stream", Buffer.alloc(65, 7));
  assert.equal(oversized.status, 413);
  assert.equal((await oversized.json()).type, "entity.too.large");
});

test("JSON requests parse normally and malformed JSON is rejected", async (t) => {
  const post = await serve(t, bodyParser.json());
  const valid = await post("application/json", JSON.stringify({ name: "ShareDock", count: 1 }));
  assert.equal(valid.status, 200);
  assert.deepEqual(await valid.json(), { name: "ShareDock", count: 1 });
  const malformed = await post("application/json", "{");
  assert.equal(malformed.status, 400);
  assert.equal((await malformed.json()).type, "entity.parse.failed");
});

test("URL-encoded requests preserve nested fields and UTF-8", async (t) => {
  const post = await serve(t, bodyParser.urlencoded({ extended: true }));
  const response = await post("application/x-www-form-urlencoded", "share[name]=ShareDock&share[tag]=%E6%88%AA%E5%9B%BE");
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { share: { name: "ShareDock", tag: "截图" } });
});
