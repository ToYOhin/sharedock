import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  auditDependencies,
  checkAuditResult,
  projects,
} from "../audit-dependencies.mjs";

const result = (counts = {}, status = 0) => ({
  status,
  stdout: JSON.stringify({
    metadata: {
      vulnerabilities: { low: 0, moderate: 0, high: 0, critical: 0, ...counts },
    },
  }),
});

test("reports low/moderate findings without blocking", () => {
  assert.equal(checkAuditResult(result({ moderate: 2 })).moderate, 2);
});

for (const severity of ["high", "critical"]) {
  test(`blocks ${severity}, even if npm incorrectly returns exit 0`, () => {
    assert.throws(() => checkAuditResult(result({ [severity]: 1 })), /blocked/);
  });
}

test("fails closed on registry errors, incomplete reports and process failures", () => {
  for (const failure of [
    { status: 1, stdout: JSON.stringify({ error: { code: "ECONNRESET" } }) },
    { status: 0, stdout: "not JSON" },
    { status: 0, stdout: "{}" },
    { ...result(), error: new Error("timeout") },
    { ...result(), signal: "SIGTERM", status: null },
    result({}, 1),
    result({ high: -1 }),
    result({ high: "0" }),
  ]) {
    assert.throws(() => checkAuditResult(failure));
  }
});

test("forces online audits of every lock, including dev dependencies, without installing", () => {
  const root = mkdtempSync(path.join(os.tmpdir(), "sharedock-audit-test-"));
  const previousOffline = process.env.npm_config_offline;
  const previousAudit = process.env.npm_config_audit;
  process.env.npm_config_offline = "true";
  process.env.npm_config_audit = "false";
  try {
    const npmCli = path.join(root, "npm-cli.js");
    writeFileSync(npmCli, "");
    for (const project of projects) {
      const cwd = path.join(root, project);
      mkdirSync(cwd, { recursive: true });
      writeFileSync(path.join(cwd, "package-lock.json"), "{}");
    }
    const calls = [];
    const logs = [];
    auditDependencies({
      root,
      npmCli,
      log: (line) => logs.push(line),
      run: (executable, args, options) => {
        calls.push(options.cwd);
        assert.equal(executable, process.execPath);
        assert.equal(args[0], npmCli);
        assert.equal(args[1], "audit");
        for (const flag of [
          "--offline=false",
          "--audit=true",
          "--prefer-online",
          "--package-lock-only",
          "--include=prod",
          "--include=dev",
          "--audit-level=high",
        ]) {
          assert.ok(args.includes(flag));
        }
        assert.ok(!args.some((arg) => arg.startsWith("--omit")));
        assert.ok(options.timeout > 0);
        return result();
      },
    });
    assert.deepEqual(
      calls,
      projects.map((project) => path.resolve(root, project)),
    );
    assert.equal(logs.at(-1), "SOURCE_DEPENDENCY_AUDIT_OK");
    assert.throws(
      () =>
        auditDependencies({
          root,
          npmCli,
          log: () => {},
          run: () => result({ high: 1 }, 1),
        }),
      /dependency gate blocked/,
    );
    rmSync(path.join(root, "frontend", "package-lock.json"));
    assert.throws(
      () =>
        auditDependencies({ root, npmCli, log: () => {}, run: () => result() }),
      /package-lock.json is missing/,
    );
  } finally {
    if (previousOffline === undefined) delete process.env.npm_config_offline;
    else process.env.npm_config_offline = previousOffline;
    if (previousAudit === undefined) delete process.env.npm_config_audit;
    else process.env.npm_config_audit = previousAudit;
    rmSync(root, { recursive: true, force: true });
  }
});
