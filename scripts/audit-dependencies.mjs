import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const projects = [".", "frontend", "backend", "docs", "scripts"];
const repositoryRoot = fileURLToPath(new URL("../", import.meta.url));

export function checkAuditResult(result) {
  if (result.error || result.signal || result.status === null) {
    throw new Error("npm audit could not complete");
  }
  let report;
  try {
    report = JSON.parse(result.stdout);
  } catch {
    throw new Error("npm audit returned invalid JSON");
  }
  if (report.error) {
    throw new Error(
      `npm audit failed: ${report.error.code ?? "registry error"}`,
    );
  }
  const counts = report.metadata?.vulnerabilities;
  if (
    !counts ||
    !["low", "moderate", "high", "critical"].every(
      (severity) => Number.isInteger(counts[severity]) && counts[severity] >= 0,
    )
  ) {
    throw new Error("npm audit returned no valid vulnerability summary");
  }
  if (counts.high > 0 || counts.critical > 0) {
    throw new Error(
      `HIGH=${counts.high}, CRITICAL=${counts.critical}; dependency gate blocked`,
    );
  }
  if (result.status !== 0) {
    throw new Error(
      `npm audit exited ${result.status} without a passing result`,
    );
  }
  return counts;
}

export function auditDependencies({
  root = repositoryRoot,
  npmCli = process.env.npm_execpath,
  run = spawnSync,
  log = console.log,
} = {}) {
  if (!npmCli || !existsSync(npmCli)) {
    throw new Error("Run this check through npm run security:audit");
  }
  for (const project of projects) {
    const cwd = path.resolve(root, project);
    if (!existsSync(path.join(cwd, "package-lock.json"))) {
      throw new Error(`${project}: package-lock.json is missing`);
    }
    log(`Auditing ${project} (including development dependencies)`);
    const result = run(
      process.execPath,
      [
        npmCli,
        "audit",
        "--offline=false",
        "--audit=true",
        "--prefer-online",
        "--package-lock-only",
        "--include=prod",
        "--include=dev",
        "--include=optional",
        "--include=peer",
        "--audit-level=high",
        "--json",
      ],
      { cwd, encoding: "utf8", timeout: 120_000, maxBuffer: 10 * 1024 * 1024 },
    );
    try {
      const counts = checkAuditResult(result);
      log(
        `${project}: HIGH=0 CRITICAL=0 MODERATE=${counts.moderate} LOW=${counts.low}`,
      );
    } catch (error) {
      throw new Error(`${project}: ${error.message}`);
    }
  }
  log("SOURCE_DEPENDENCY_AUDIT_OK");
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  try {
    auditDependencies();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
