---
id: installation
---

# Installation

### Installation with Docker (recommended)

Clone the complete repository, not just `docker-compose.yml`: the Compose file
builds `sharedock:local` from the local Dockerfile and source code.

```powershell
git clone https://github.com/ToYOhin/sharedock.git
cd sharedock
docker compose up -d
```

The website is now listening on `http://localhost:3000`, have fun with ShareDock!

### Installation with Portainer

The supplied Compose file uses `build: .`; pasting it into Portainer's web
editor alone does not provide the Dockerfile and source context. First build
the image from the complete repository on the Docker engine managed by
Portainer, or supply an image that engine can access. A stack using a prebuilt
image must omit `build: .` and use an absolute host path for the data volume.
For a first local installation, use the Docker Compose instructions above.

### Stand-alone Installation

Required tools:

- [Node.js](https://nodejs.org/en/download/) 22 LTS (use the version in `.node-version`)
- npm 10.x
- [Git](https://git-scm.com/downloads)

The following source installation runs in two foreground terminals. Both use
the same Node.js/npm versions. The explicit data paths keep the database and
uploads together in the repository's `data/` directory.

Clone the repository first:

```bash
git clone https://github.com/ToYOhin/sharedock.git
cd sharedock
```

#### Windows PowerShell

In the first terminal, from the repository root:

```powershell
$env:DATA_DIRECTORY = Join-Path $PWD.Path "data"
$env:DATABASE_URL = "file:$($env:DATA_DIRECTORY.Replace('\', '/'))/sharedock.db?connection_limit=1"
cd backend
npm ci
npx prisma generate
npm run build
npm run prod
```

In the second terminal, from the same repository root:

```powershell
$env:API_URL = "http://localhost:8080"
cd frontend
npm ci
npm run build
npm run start
```

#### Linux/macOS shell

In the first terminal, from the repository root:

```bash
export DATA_DIRECTORY="$PWD/data"
export DATABASE_URL="file:$DATA_DIRECTORY/sharedock.db?connection_limit=1"
cd backend
npm ci
npx prisma generate
npm run build
npm run prod
```

In the second terminal, from the same repository root:

```bash
export API_URL=http://localhost:8080
cd frontend
npm ci
npm run build
npm run start
```

The backend startup initializes a missing SQLite file, applies the repository's
Prisma migrations, and seeds configuration. Existing database contents are not
replaced by the file-initialization step.

**Uploading Large Files**: By default, ShareDock uses a built-in reverse proxy to reduce the installation steps. However, this reverse proxy is not optimized for uploading large files. If you wish to upload larger files, you can either use the Docker installation or set up your own reverse proxy. An example configuration for Caddy can be found in `./reverse-proxy/Caddyfile`.

The website is now listening on `http://localhost:3000`, have fun with ShareDock!

### First administrator

Open `http://localhost:3000/auth/signUp` and register the first account. It
automatically becomes the administrator. No default administrator credentials
are created unless you explicitly provision a user through `config.yaml`.
