# ShareDock Documentation

This directory contains the public project, setup and operation documentation.
It does not contain chat history, machine-specific test logs or private handoffs.

## Project Map

- [Roadmap and current status](docs/project/roadmap.md): one current route and its
  verification boundaries; do not maintain a duplicate phase plan.
- [Project structure](docs/project/structure.md): module locations, runtime/data
  contracts and available checks.
- [Changelog](../CHANGELOG.md): change history, including unreleased main changes.

## Start Here

- [Installation](docs/setup/installation.md)
- [Configuration](docs/setup/configuration.md)
- [Storage and S3](docs/setup/s3.md)
- [Backup, restore, and upgrade](docs/setup/backup-restore.md)
- [Upgrade instructions](docs/setup/upgrading.md)
- [ShareX integration](integrations/sharex.md)
- [Cleanup policy](cleanup-policy.md)

The Docusaurus sources live in `docs/`; `sidebars.ts` controls navigation. From
this directory, use `npm run start` for preview, or `npm run typecheck` and
`npm run build` to check documentation changes. Use Node22/npm10 and existing
dependencies where available. Building the site does not publish or deploy it.

## License and Security

- [BSD-2-Clause license](../LICENSE)
- [Upstream attribution](../NOTICE.md)
- [Security policy](../SECURITY.md)
