---
id: structure
---

# Project Structure

ShareDock keeps its existing Next.js + NestJS + Prisma/SQLite implementation.
This map organizes the current framework; it does not introduce a new service
architecture, move source files, or change APIs. Product scope and pending work
belong in the [roadmap](roadmap.md), not in another phase plan.

## Repository map

```text
frontend/                 Next.js Pages Router, Mantine UI and frontend i18n
  src/pages/              Upload, share, authentication, Account and Admin routes
  src/components/         Shared UI and feature components
  src/pages/api/          Same-origin API proxy to the Nest backend
backend/                  NestJS application and storage integrations
  src/                    Domain modules, controllers and services
  prisma/                 Schema, immutable migrations, configuration seed
  test/                   Focused regressions and Newman collection
docs/                     Docusaurus documentation project
  docs/project/           One public roadmap and this structure map
  docs/setup/             Installation, configuration, integrations and operations
  integrations/           Detailed ShareX reference
scripts/                  Verification, dependency audit, smoke and backup tools
  docker/                 Container user/bootstrap and runtime entrypoints
  test/                   Source dependency gate regression tests
reverse-proxy/            Container Caddy routing
.github/workflows/        Quality, image-security and explicit release workflows
data/, backups/, temp/    Local generated state; not committed product source
```

Installed dependencies, database files, uploaded files, logs and build outputs
are not additional project modules. Keep them out of source commits.

## Feature locations

Paths below are relative to the repository root.

| Area | Frontend entry | Backend entry |
| --- | --- | --- |
| Application shell/API | `frontend/src/pages/_app.tsx`, `frontend/src/pages/api/[...all].tsx` | `backend/src/main.ts`, `backend/src/app.module.ts` |
| Authentication/account | `frontend/src/pages/auth/`, `frontend/src/pages/account/` | `backend/src/auth/`, `backend/src/user/`, `backend/src/oauth/` |
| Shares and personal management | `frontend/src/pages/upload/index.tsx`, `frontend/src/pages/account/shares.tsx` | `backend/src/share/share.controller.ts` |
| Files, preview and downloads | `frontend/src/pages/share/[shareId]/index.tsx`, `frontend/src/components/share/FileList.tsx` | `backend/src/file/file.controller.ts`, `backend/src/file/file.module.ts` |
| Reverse receiving | `frontend/src/pages/upload/[reverseShareToken].tsx` | `backend/src/reverseShare/reverseShare.controller.ts` |
| Upload tokens/ShareX/webhook | `frontend/src/components/account/UploadTokenManager.tsx` | `backend/src/uploadToken/`, `backend/src/integrations/` |
| Admin configuration/users | `frontend/src/pages/admin/config/[category].tsx`, `frontend/src/pages/admin/users.tsx` | `backend/src/config/`, `backend/src/user/user.controller.ts` |
| Overview and cleanup visibility | `frontend/src/pages/admin/index.tsx` | `backend/src/system/`, `backend/src/jobs/` |

The file layer uses the existing local/S3 storage implementations. Cleanup
previews and logs expose scheduled behavior; they are not a new deletion trigger.
See the [cleanup policy](https://github.com/ToYOhin/sharedock/blob/main/docs/cleanup-policy.md).

## Runtime and data contracts

- Node22.x and npm10.x are the project contract. `.node-version` pins the tested
  Node version; package engines, CI and Docker must agree. Do not change the
  global machine runtime just to run this project.
- Standalone default frontend/backend ports are3000/8080. Next's API proxy reads
  `API_URL`; Nest controllers share the `/api` prefix.
- The source Compose image uses Caddy on3000, a standalone frontend on3333 and
  the backend on8080. Compose builds `sharedock:local` from the full repository.
- When changing backend ports, configure `API_URL` and any reverse-proxy routes
  together. A healthy custom backend port alone does not prove frontend routing
  works. The default-port smoke does not verify every custom topology.
- Prisma resolves SQLite file URLs against the schema directory, while
  `DATA_DIRECTORY` is a filesystem path relative to the backend working directory
  unless absolute. Use the explicit paths in [installation](../setup/installation.md)
  to keep the native database and uploads together.
- `backend/prisma/initialize-sqlite.cjs` only creates an absent file, without
  overwriting existing bytes. Native `npm run prod` uses Prisma's seed CLI to load
  environment files, runs this initialization-only branch, then migration/seed
  and the compiled server. `scripts/smoke-db.ps1` uses a disposable data path.
- Container startup remains in `scripts/docker/entrypoint.sh`; it migrates and
  invokes the compiled configuration seed before running Nest. Do not assume the
  native npm startup wrapper is the container entrypoint.
- `config.yaml` defaults to the repository root for a native backend started in
  `backend/`, or `/opt/app/config.yaml` in the supplied container layout. YAML and
  UI configuration behavior is described in [configuration](../setup/configuration.md).

## Verification map

| Check | Entry | What it proves / does not prove |
| --- | --- | --- |
| Aggregate local checks | Root `npm run verify`; `scripts/verify.ps1` | Calls source audits, focused tests and builds; not necessary for every prose-only edit |
| Disposable SQLite | `scripts/smoke-db.ps1` | Fresh migration/seed and native initialization; not a restored production database |
| API upload closure | `scripts/smoke-sharex.ps1`, `scripts/smoke-image.mjs` | Token/upload/link/persisted-share/revocation behavior; not ShareX desktop capture |
| Source gate | `scripts/audit-dependencies.mjs`, `scripts/test/audit-dependencies.test.mjs` | All five lockfiles, including dev dependencies, and gate failure handling |
| Focused backend regressions | `backend/test/` | Module-specific assertions; mocks and in-memory composition are not external provider acceptance |
| Quality Gates CI | `.github/workflows/quality-gates.yml` | Frontend/backend lint/build, docs typecheck/build, source audit and fresh SQLite smoke; focused test coverage is a selected subset of the local verifier |
| Actual-image CI | `.github/workflows/docker-security.yml` | Builds and loads the image, runs real HTTP smoke and scans it; never publishes the image |
| Backend system tests | `.github/workflows/backend-system-tests.yml` | Newman API collection on PR/tag/manual runs; a normal main push does not trigger this workflow |

`backend/test/newman-system-tests.json` checks core API paths, but an HTTP200
download assertion is not a file-byte/ZIP integrity test or a browser UX test.
Quality Gates currently runs focused Logo, SQLite, request-body, i18n and email
tests; token/ShareX/webhook/cleanup regressions also exist in the local verifier.
When changing a module, verify its affected behavior and test entry rather than
equating an aggregate build result with exhaustive coverage.

For documentation edits, check affected links/Markdown/MDX and sidebar/type
contracts; build the documentation when navigation or rendered routes change.
Keep heavy checks serial, use cached dependencies, and avoid unrelated full
application or image rebuilds. Always run `git diff --check` before delivery.

## Document roles

README files describe the product and link to this map and the roadmap.
`docs/README.md` indexes documentation; `docs/sidebars.ts` registers rendered
routes. User guides own executable installation/upgrade instructions.
`CHANGELOG.md`, `SECURITY.md`, `NOTICE.md` and `LICENSE` have separate history,
security and attribution roles; do not use them as duplicated task plans.

Private continuation prompts and machine verification records stay outside the
published documentation. A new checkout should be understandable from the public
overview, roadmap, structure and setup guides alone.
