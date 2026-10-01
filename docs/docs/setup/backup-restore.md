---
id: backup-restore
---

# Backup, Restore, and Upgrade

ShareDock's local deployment stores the SQLite database and local uploaded
files below the configured data directory. The supplied Docker Compose host
mount and the explicit paths in the standalone installation guide use:

- `data/sharedock.db` — SQLite database;
- `data/uploads/shares/` — local uploaded file contents;
- `data/` — other runtime data and generated assets.

S3 objects are external and are not included in the local archive. Back up the
configured S3 bucket separately.

If you use another `DATA_DIRECTORY` or `DATABASE_URL`, confirm where both the
database and files actually live and pass that data directory to the scripts.
Backend-relative defaults are not a guarantee that a custom native deployment
uses the repository-root `data/` directory.

## Backup

Stop ShareDock before backing up a live SQLite database. The PowerShell script
does not stop services for you.

```powershell
$repoPath = "C:\path\to\sharedock"
Set-Location $repoPath
powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/backup.ps1 `
  -DataPath (Join-Path $repoPath "data") `
  -OutputPath (Join-Path $repoPath "backups")
```

The script writes a `.zip` archive and a JSON manifest containing its SHA-256
hash. The `backups/` directory is ignored by Git.

## Restore rehearsal

Restore into a disposable directory first:

```powershell
$repoPath = "C:\path\to\sharedock"
Set-Location $repoPath
powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/restore.ps1 `
  -ArchivePath (Join-Path $repoPath "backups\sharedock-backup-YYYYMMDD-HHMMSS.zip") `
  -TargetDataPath (Join-Path $repoPath "data\restore-rehearsal")
```

The script verifies file count and total byte size after extraction. Do not
use `-Force` against the live data directory until the application is stopped
and the rehearsal has been inspected.

## Upgrade flow

The upgrade script always creates a backup first. Without `-Apply` it performs
only the preflight backup:

```powershell
$repoPath = "C:\path\to\sharedock"
Set-Location $repoPath
powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/upgrade.ps1
```

Before `-Apply`, stop both services, review the backup, update the source, and
install its locked backend/frontend dependencies using the supported Node/npm
versions. See [Upgrading](upgrading.md) for the source update sequence.

Then apply pending Prisma migrations, seed configuration, and rebuild
backend/frontend:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/upgrade.ps1 -Apply
```

For a Docker deployment, stop the service, back up the host-mounted `data/`
directory, and follow the source-build or explicit-image path in
[Upgrading](upgrading.md). The container
entrypoint applies `prisma migrate deploy` and seeds configuration before
starting the backend.

## Verification boundary

- Never commit database files, uploaded files, archives, or backup manifests.
- Keep a tested backup before every schema upgrade.
- The restore script checks extracted file count and byte size. Its success
  marker is not a database integrity check, archive-manifest authentication or
  a restored-application acceptance result; inspect the manifest hash and start
  a disposable restored instance when rehearsing recovery.
- A restore rehearsal is not a production cutover; stop the service before
  replacing live data.
