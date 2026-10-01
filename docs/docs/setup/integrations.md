---
id: integrations
---

# Integrations

## ShareX and automation uploads

ShareDock is a private file relay, not a general-purpose drive. ShareX,
PowerShell, and small scripts can send one file directly into a normal,
expiring ShareDock share.

### Create a dedicated upload token

Open **Account -> Upload tokens** and create one token per client. Immediately
copy the one-time `sdock_...` token and choose the matching setup path:

- **ShareX:** copy or download the generated `.sxcu` file, then import that file in ShareX.
- **PowerShell:** copy the generated `curl.exe` command and replace its sample file path.
- **Scripts / CI:** copy the generated curl example and provide the build artifact path.

The full token is intentionally shown only after creation. Reloading Account
keeps the token metadata and prefix, but never recovers the plaintext token.

### Upload contract

```text
POST /api/integrations/sharex/upload
Authorization: Bearer <sdock_...>
multipart field: file
```

The endpoint returns a normal share URL plus a private deletion-management
link. Missing, invalid, or revoked tokens return HTTP `401`.

```json
{
  "shareId": "abc123",
  "url": "https://share.example.test/s/abc123",
  "deletionUrl": "https://share.example.test/share/abc123/edit"
}
```

### ShareX custom uploader

The generated `.sxcu` file uses multipart form data with `file` as the form
name and parses `{json:url}` plus `{json:deletionUrl}` from the ShareDock
response. Treat the `.sxcu` file as a credential: it contains the Bearer token
and must not be committed to source control.

For the complete operator reference and local PowerShell smoke command, see
the repository's `docs/integrations/sharex.md` guide.

## ClamAV

ClamAV is used to scan shares for malicious files and remove them if found.

Please note that ClamAV needs a lot of [resources](https://docs.clamav.net/manual/Installing/Docker.html#memory-ram-requirements).

### Docker

If you are already running ClamAV elsewhere, you can specify the `CLAMAV_HOST` environment variable to point to that instance.

Else you have to add the ClamAV container to the ShareDock Docker Compose stack:

1. Add the ClamAV container to the Docker Compose stack and start the container.

```diff
services:
  sharedock:
    image: sharedock:local
    build: .
    ...
+   depends_on:
+     clamav:
+       condition: service_healthy

+  clamav:
+    restart: unless-stopped
+    image: clamav/clamav

```

2. Docker will wait for ClamAV to start before starting ShareDock. This may take a minute or two.
3. The ShareDock logs should now log "ClamAV is active"

### Stand-Alone

1. Install ClamAV
2. Specify the `CLAMAV_HOST` environment variable for the backend and restart the ShareDock backend.
