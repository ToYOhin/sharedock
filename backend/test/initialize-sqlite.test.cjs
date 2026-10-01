const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const { spawnSync } = require("node:child_process");
const { initializeSqliteFile } = require("../prisma/initialize-sqlite.cjs");

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "sharedock-sqlite-"));
  t.after(() =>
    fs.rmSync(root, {
      recursive: true,
      force: true,
      maxRetries: 5,
      retryDelay: 200,
    }),
  );
  return root;
}

test("creates only the missing schema-relative SQLite file, excluding URL parameters", (t) => {
  const root = fixture(t);
  const schema = path.join(root, "prisma");
  fs.mkdirSync(schema);
  const result = initializeSqliteFile(
    "file:../data/fresh.db?connection_limit=1",
    schema,
  );
  assert.deepEqual(result, {
    filePath: `${schema}${path.sep}../data/fresh.db`,
    created: true,
  });
  assert.equal(fs.statSync(result.filePath).size, 0);
  assert.deepEqual(fs.readdirSync(path.join(root, "data")), ["fresh.db"]);
});

test("preserves existing database bytes on repeated initialization", (t) => {
  const root = fixture(t);
  const database = path.join(root, "existing.db");
  const bytes = Buffer.from("existing database contents");
  fs.writeFileSync(database, bytes);
  const result = initializeSqliteFile(`file:${database}?connection_limit=1`);
  assert.equal(result.created, false);
  assert.deepEqual(fs.readFileSync(database), bytes);
  assert.equal(initializeSqliteFile(`file:${database}`).created, false);
  assert.deepEqual(fs.readFileSync(database), bytes);
});

test("supports an absolute database path containing spaces", (t) => {
  const root = fixture(t);
  const database = path.join(root, "path with spaces", "fresh.db");
  assert.equal(initializeSqliteFile(`file:${database}`).filePath, database);
  assert.ok(fs.statSync(database).isFile());
});

test("rejects missing/non-SQLite URLs and directory targets", (t) => {
  const root = fixture(t);
  for (const url of [undefined, "", "file:", "https://example.test/db"]) {
    assert.throws(() => initializeSqliteFile(url), /SQLite|DATABASE_URL/);
  }
  assert.throws(() => initializeSqliteFile(`file:${root}`), /not a file/);
});

test(
  "preserves filesystem resolution through a symlink followed by '..'",
  { skip: process.platform === "win32" },
  (t) => {
    const root = fixture(t);
    const schema = path.join(root, "prisma");
    const store = path.join(root, "store");
    fs.mkdirSync(schema);
    fs.mkdirSync(path.join(store, "sub"), { recursive: true });
    fs.symlinkSync(path.join(store, "sub"), path.join(schema, "link"));
    initializeSqliteFile("file:link/../fresh.db", schema);
    assert.ok(fs.statSync(path.join(store, "fresh.db")).isFile());
    assert.equal(fs.existsSync(path.join(schema, "fresh.db")), false);
  },
);

test("Prisma's initialization entry point retains .env loading and process-env priority", (t) => {
  const seed = path.resolve(__dirname, "../prisma/seed/config.seed.ts");
  const tsNode = require.resolve("ts-node");
  const prisma = require.resolve("prisma/build/index.js");
  const tsConfig = path.resolve(__dirname, "../tsconfig.json");
  for (const source of ["root", "schema", "process"]) {
    const root = fixture(t);
    const schemaDirectory = path.join(root, "prisma");
    fs.mkdirSync(schemaDirectory);
    fs.writeFileSync(
      path.join(schemaDirectory, "schema.prisma"),
      'datasource db {\n provider = "sqlite"\n url = env("DATABASE_URL")\n}\n',
    );
    fs.writeFileSync(
      path.join(root, "package.json"),
      JSON.stringify({
        name: "sharedock-initialization-fixture",
        prisma: { seed: "node seed.cjs" },
      }),
    );
    fs.writeFileSync(
      path.join(root, "seed.cjs"),
      `require(${JSON.stringify(tsNode)}).register({ project: ${JSON.stringify(tsConfig)} });\nrequire(${JSON.stringify(seed)});\n`,
    );
    const envPath =
      source === "schema"
        ? path.join(schemaDirectory, ".env")
        : path.join(root, ".env");
    const env = { ...process.env };
    env.CHECKPOINT_DISABLE = "1";
    env.PRISMA_HIDE_UPDATE_MESSAGE = "1";
    const pathKey =
      Object.keys(env).find((key) => key.toLowerCase() === "path") || "PATH";
    env[pathKey] =
      `${path.dirname(process.execPath)}${path.delimiter}${env[pathKey] || ""}`;
    delete env.DATABASE_URL;
    delete env.DATABASE_NAME;
    const expected = source === "process" ? "from-process.db" : "from-env.db";
    // The helper is deliberately schema-relative to this repository's schema.
    // Use an absolute fixture URL after dotenv expansion to avoid touching repo data.
    const data = path.join(root, "data").replace(/\\/g, "/");
    fs.writeFileSync(
      envPath,
      `DATABASE_NAME=from-env.db\nDATABASE_URL=file:${data}/\${DATABASE_NAME}?connection_limit=1\n`,
    );
    if (source === "process")
      env.DATABASE_URL = `file:${data}/from-process.db?connection_limit=1`;
    const result = spawnSync(
      process.execPath,
      [prisma, "db", "seed", "--", "--initialize-sqlite-only"],
      {
        cwd: root,
        env,
        encoding: "utf8",
        timeout: 30000,
      },
    );
    assert.equal(
      result.status,
      0,
      `${source}: ${result.stdout}\n${result.stderr}`,
    );
    assert.match(result.stdout, /SQLITE_FILE_READY: created/);
    assert.equal(fs.statSync(path.join(root, "data", expected)).size, 0);
    assert.deepEqual(fs.readdirSync(path.join(root, "data")), [expected]);
  }
});
