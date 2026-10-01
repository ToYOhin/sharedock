# ShareDock

[简体中文](README.zh-CN.md)

ShareDock is a self-hosted file relay for personal developers and small teams.
It makes temporary file sharing, screenshot delivery, reverse uploads, and
automation uploads straightforward while keeping data under your control.

ShareDock is deliberately not a cloud drive or a file-manager replacement. It
is for short-lived transfers that need a clean link, clear expiration, and a
small operational surface.

## Highlights

- Create expiring share links with passwords, visitor limits, and deletion
  controls.
- Receive files through reverse-share links without exposing a full drive.
- Organize recent shares with notes, tags, and account-level management.
- Inspect storage, expiring shares, and scheduled-cleanup status from Admin.
- Create personal upload tokens for ShareX, PowerShell, and scripts.
- Send successful automation uploads to an optional HMAC-SHA256-signed webhook.
- Deploy with local filesystem storage or S3-compatible object storage.

## Project Status

The core relay and automation baseline is implemented. Current work is limited
to reproducible setup, a bounded local demonstration, and maintenance—not a
cloud-drive expansion or a production-service certification. See the
[roadmap](docs/docs/project/roadmap.md) for verified boundaries and deferred work,
and the [project structure](docs/docs/project/structure.md) for module ownership.

This README follows `main`. Changes under `Unreleased` in the changelog are not
automatically included in the latest tagged Release.

## Quick Start

### Prerequisites

- Docker Engine with Docker Compose v2
- A writable directory for ShareDock data

Standalone installations use Node.js 22 LTS and npm 10.x; the repository pins
the tested Node.js version in `.node-version`.

### Run with Docker Compose

```powershell
git clone https://github.com/ToYOhin/sharedock.git
cd sharedock
docker compose up -d
```

After the service becomes healthy, open `http://localhost:3000`. The Compose
setup persists application data in the local `data/` directory.

Before exposing an instance to a network, review
[`config.example.yaml`](config.example.yaml), set an appropriate reverse-proxy
configuration, and protect the first administrator account.

## First Steps

1. Open `/auth/signUp` and register the first account; it becomes the
   administrator automatically. There are no default administrator credentials
   unless you explicitly provision an account through `config.yaml`.
2. Open **Admin → Configuration** to review expiration, storage, and service
   settings.
3. Use **Upload** to create a temporary share link or a reverse-share link.
4. Create a dedicated upload token in **Account → Upload tokens** for each
   ShareX client or automation workflow.
5. Back up `data/` before storage or database changes.

## Automation Uploads

ShareDock accepts a ShareX-compatible multipart upload endpoint:

```text
POST /api/integrations/sharex/upload
Authorization: Bearer <sdock_...>
multipart field: file
```

The response contains a normal share URL and a private management URL. Treat
the upload token, generated `.sxcu` file, and management URL as credentials.
The full integration guide covers ShareX import, PowerShell, and scripts.

## Data, Backup, and Security

- Local deployments store the SQLite database and uploaded files under `data/`.
- S3 object storage requires provider-side backup and retention controls.
- Rehearse restores into a disposable directory before replacing live data.
- Keep deployment secrets, upload tokens, deletion URLs, database files, and
  backup archives out of source control.
- Use a reverse proxy with HTTPS for any Internet-facing deployment.

## Documentation

- [Installation](docs/docs/setup/installation.md)
- [Configuration](docs/docs/setup/configuration.md)
- [Backup, restore, and upgrade](docs/docs/setup/backup-restore.md)
- [ShareX integration](docs/integrations/sharex.md)
- [Storage and S3](docs/docs/setup/s3.md)
- [Cleanup policy](docs/cleanup-policy.md)
- [Security policy](SECURITY.md)
- [Changelog](CHANGELOG.md)

## Project Relationship and License

ShareDock is derived from Pingvin Share X and the original Pingvin Share
codebase. It is an independent project and is not affiliated with or endorsed
by the upstream projects.

ShareDock retains the BSD-2-Clause license, original copyright notice, and
disclaimer. Distributed Docker images include `/opt/app/LICENSE` and
`/opt/app/NOTICE.md` for the applicable license and attribution materials.
See [LICENSE](LICENSE) and [NOTICE.md](NOTICE.md).
