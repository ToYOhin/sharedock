---
id: roadmap
---

# Roadmap and Current Status

ShareDock is a focused, self-hosted file relay. The current phase is **functional
baseline complete; bounded demonstration and maintenance**, not expansion into a
cloud drive or a commercial service platform.

This is the single public roadmap. The [project structure](structure.md) explains
where the implementation lives; the [changelog](https://github.com/ToYOhin/sharedock/blob/main/CHANGELOG.md)
records changes rather than defining another plan.

## Existing baseline

| Area | Implemented | Verification boundary |
| --- | --- | --- |
| File relay | Expiring shares, receiving links, notes/tags, local storage | Container smoke checks a persisted upload; not every optional storage integration |
| Automation | Personal upload tokens, one-time `.sxcu`/script onboarding, token revocation | API smoke covers token creation, upload/link and rejection after revocation; desktop ShareX import is a separate manual check |
| Integration extension | Optional signed upload webhook | Targeted tests exist; delivery is best-effort, not a durable queue |
| Account/Admin | Account settings and share management; user/config/storage/cleanup visibility | Local authenticated APIs have been checked; final visual acceptance is manual |
| Reliability | Node22/npm10 contract, Prisma migration/seed, safe native SQLite initialization, backup/restore/upgrade tools | CI covers builds, initialization and fresh-database smoke; recovery tooling is not an automated disaster-recovery guarantee |
| Security | Source-lock audit plus actual-container Trivy gate | Source HIGH/CRITICAL findings block; image gate blocks fixable HIGH/CRITICAL findings. Neither means every development dependency or optional integration is vulnerability-free |

Use the [GitHub workflow results](https://github.com/ToYOhin/sharedock/actions)
for the exact revision being reviewed. Results from an earlier commit do not
verify later changes.

## Revised route

### 1. Keep the baseline reproducible

Maintain one installation/upgrade path, matching configuration names and data
locations. Keep the Node version, migrations, lockfiles and verification commands
consistent. Fix concrete startup or usage defects without rewriting stable
upload, authentication, storage or cleanup behavior.

The documentation now distinguishes source builds from pulling a published image
and links to the same installation and backup instructions instead of duplicating
old process-manager commands.

### 2. One bounded local demonstration, when needed

Use the existing environment to register the first administrator, create and
download one share, inspect Account/Admin, and revoke one upload token. If the
desktop screenshot workflow is being presented, import the generated `.sxcu` in
ShareX and capture one actual screenshot. Record the observation separately from
API smoke evidence.

This is a small acceptance pass, not a load test, public deployment, S3/provider
matrix or certification exercise. Do not repeat builds/scans solely because an
already verified workflow was described in a new document.

### 3. Freeze feature expansion and maintain on demand

The optional webhook already provides an integration extension. Upload-history
auditing, team quotas, billing, high availability, durable webhook queues and
full-drive features are deferred; there is no commitment to implement them.

Further work should be triggered by a reproducible defect, an applicable security
advisory or an explicit change request. Existing cleanup eligibility and token
semantics remain unchanged unless the requested fix requires it.

## Remaining limitations

- Automated HTTP checks do not establish desktop ShareX import, screenshot
  capture, visual quality or accessibility acceptance.
- Backup/restore scripts exist, but the current CI does not run a full restored
  application rehearsal. Rehearse in disposable data before relying on recovery
  after a data or schema change; do not add a large recovery matrix by default.
- Optional S3, SMTP, OAuth/LDAP and ClamAV deployments require their own configured
  environment; local SQLite smoke is not proof of those integrations.
- Quality Gates runs a selected set of focused tests, not every regression in
  the local verifier. Changes to token/webhook/cleanup behavior should run the
  relevant existing tests; a green lint/build result is not exhaustive coverage.

These limits do not prevent a local demonstration of the existing core relay.

## Source versus Release

Root, frontend and backend package versions currently identify the `0.9.1` line;
`main` also contains changes listed under `Unreleased`, including Node22 alignment
and native SQLite startup fixes. A `v0.9.1` Release/tag is a historical snapshot,
not evidence that those later changes were included in that release.

Local source Docker builds default their OCI version label to the `0.9.1`
package line. The release workflow can override it with the release tag. Use the
Git revision to identify which unreleased changes are present in a source build.

There is no automatic next Release or release deadline in this roadmap. A future
release requires an explicit decision, consistent package/tag/image metadata,
exact-commit quality and image checks, and the retained attribution in the
[Release template](https://github.com/ToYOhin/sharedock/blob/main/docs/releases/GITHUB_RELEASE_TEMPLATE.md).

## Documentation ownership

- README files: product overview, quick start and links.
- This roadmap: current phase, next bounded acceptance and deferred work.
- Project structure: code/module locations and runtime contracts.
- Setup and integration guides: user-facing commands and configuration.
- CHANGELOG: shipped and unreleased change history.
- SECURITY and cleanup policy: their respective gates and behavior boundaries.

Machine-specific logs, credentials, chat history and private continuation notes
are not part of the public product documentation.
