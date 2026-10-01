---
id: upgrading
---

# Upgrading

Review the changelog and compatibility notes for the revision you intend to
use. `main` can contain unreleased changes; pulling it is not the same as
installing the latest tagged Release. Preserve any local source modifications
before updating, and keep the database and uploaded files together.

## Docker Compose source build

The supplied Compose file uses `sharedock:local` with `build: .`. It must be
rebuilt from the repository; `docker compose pull` alone does not update that
source-built image.

1. From the repository root, stop the application with `docker compose stop`.
2. Back up the host-mounted `data/` directory using the
   [backup guide](backup-restore.md). Do not delete the data volume.
3. For a source-main update, fast-forward the source and build the local image:

   ```powershell
   git pull --ff-only origin main
   docker compose build sharedock
   docker compose up -d
   ```

4. Check the service health and confirm an existing share is still accessible.

The container entrypoint applies pending migrations and seeds configuration
before starting the backend. Updating documentation alone does not require
rebuilding an otherwise unchanged local demonstration image.

## Explicit prebuilt image / Portainer

Only use re-pull/recreate when the deployment actually references an accessible,
prebuilt image. Choose a specific image version, back up the existing data, keep
the same volume mapping, and then recreate the service. Pasting the source-build
Compose file into a web editor does not supply its Dockerfile/context; see
[installation](installation.md#installation-with-portainer).

## Standalone source installation

The supported source guide uses Node22/npm10 and two foreground terminals, not
a mandatory process manager.

1. Stop both services in their terminals and back up the configured data directory.
2. From the repository root, run `git pull --ff-only origin main` for a source-main
   update, then repeat the locked install, Prisma generation and build steps in
   [standalone installation](installation.md#stand-alone-installation), without
   cloning again. Keep the same `DATA_DIRECTORY`, `DATABASE_URL` and configuration.
3. Restart the backend with `npm run prod` and the frontend with `npm run start`
   in their respective directories. Backend startup initializes only a missing
   SQLite file, applies migrations, and seeds configuration before listening.

On Windows, after dependencies and Prisma Client are prepared, the existing
`scripts/upgrade.ps1 -Apply` can perform the pre-upgrade backup, migration, seed
and backend/frontend builds. It does not install dependencies or stop/restart
services. Its default data path is the repository-root `data/`; pass `-DataPath`
and, where needed, `-DatabaseUrl` for another layout. See the
[upgrade-script guide](backup-restore.md#upgrade-flow).

Do not run both the manual build sequence and script rebuilds without a reason.
Do not use `-SkipBuild` after application source changes unless the matching
outputs are already built. A backup script success marker is not a complete
restored-application rehearsal.
