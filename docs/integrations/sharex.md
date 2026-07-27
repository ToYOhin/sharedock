# ShareX Integration

ShareDock exposes a first automation upload endpoint for ShareX and scripts:

```text
POST /api/integrations/sharex/upload
Authorization: Bearer <sdock_...>
multipart field: file
```

The endpoint creates a normal ShareDock share, uploads one file, completes the share, and returns JSON:

```json
{
  "shareId": "abc123",
  "url": "https://share.example.test/s/abc123",
  "deletionUrl": "https://share.example.test/share/abc123/edit",
  "fileName": "screenshot.png",
  "expiresAt": "2026-07-09T03:33:58.905Z"
}
```

## Create A Token

Open `Account -> Upload tokens`, create a token, and copy the `sdock_...` value immediately. ShareDock only shows the plaintext token once.

Revoked tokens stop working immediately.

## Optional Upload Webhook

For a deployment-level automation hook, set these environment variables before
starting the backend:

```text
SHAREDOCK_UPLOAD_WEBHOOK_URL=https://automation.example.test/hooks/sharedock
SHAREDOCK_UPLOAD_WEBHOOK_SECRET=replace-with-a-long-random-secret
```

After a successful ShareX/script upload, ShareDock sends one `POST` request
with the following event shape:

```json
{
  "event": "share.uploaded",
  "shareId": "abc123",
  "fileName": "screenshot.png",
  "url": "https://share.example.test/s/abc123",
  "deletionUrl": "https://share.example.test/share/abc123/edit",
  "expiresAt": "2026-07-09T03:33:58.905Z"
}
```

When a secret is configured, the raw JSON body is signed with HMAC-SHA256 in
the `x-sharedock-signature: sha256=<hex>` header. Webhook delivery is
best-effort: an invalid URL, timeout, non-2xx response, or receiver outage is
logged and does not turn a successful upload into an upload failure. The
webhook is deployment-configured, not user-configurable, and the token is
never included in the payload.

## One-Time Automation Onboarding

After creating a token, ShareDock keeps the plaintext token only in the current Account page state. Use the onboarding panel before refreshing the page:

1. Copy the Bearer token if another local tool needs it.
2. For ShareX, use `Copy .sxcu` or `Download .sxcu`.
3. Import the downloaded `.sxcu` file in ShareX by opening it. When using `Copy .sxcu`, save the copied JSON as a `.sxcu` file first, then import that file.
4. For a one-off upload, copy the PowerShell command and replace its sample file path.
5. For a script or CI job, copy the generic `curl` example and replace its file path.

The `.sxcu` file contains the plaintext token. Store it like a credential and do not commit it. Reloading Account does not recover old token values; existing token rows intentionally show only a prefix. Create a new token whenever you need a new ShareX, PowerShell, or script configuration.

## ShareX Custom Uploader

Create a ShareX custom uploader with these values:

- Destination type: Image uploader or File uploader
- Request method: `POST`
- Request URL: `https://your-sharedock.example/api/integrations/sharex/upload`
- Headers:
  - `Authorization`: `Bearer <sdock_...>`
- Body: Multipart form data
- File form name: `file`
- URL field from response: `url`
- Deletion URL field from response: `deletionUrl`

ShareDock's generated `.sxcu` uses the [official ShareX Custom Uploader JSON schema](https://getsharex.com/docs/custom-uploader):

```json
{
  "Version": "17.0.0",
  "Name": "ShareDock",
  "DestinationType": "ImageUploader, FileUploader",
  "RequestMethod": "POST",
  "RequestURL": "https://your-sharedock.example/api/integrations/sharex/upload",
  "Headers": {
    "Authorization": "Bearer <sdock_...>"
  },
  "Body": "MultipartFormData",
  "FileFormName": "file",
  "URL": "{json:url}",
  "DeletionURL": "{json:deletionUrl}"
}
```

For a local development server, use:

```text
http://localhost:3000/api/integrations/sharex/upload
```

If you call the backend directly during local API smoke, use the backend port:

```text
http://localhost:8080/api/integrations/sharex/upload
```

## PowerShell Smoke

For a repeatable end-to-end acceptance run against a local backend, use the
repository smoke script. It creates a disposable user/token session, checks
the `.sxcu` contract, uploads the rendered screenshot, revokes the token, and
expects the revoked token to return HTTP `401`:

```powershell
$repoPath = "C:\path\to\sharedock"
Set-Location $repoPath
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/smoke-sharex.ps1 `
  -BackendUrl http://localhost:18080
```

The script removes its temporary output by default. Use `-KeepArtifacts` only
for local diagnosis; the generated `.sxcu` contains a plaintext token.

```powershell
$token = "sdock_replace_me"
$file = "C:\path\to\screen.png"

curl.exe -X POST "http://localhost:3000/api/integrations/sharex/upload" `
  -H "Authorization: Bearer $token" `
  -F "file=@$file"
```

Expected result: HTTP `201` with a JSON response containing `shareId` and `url`.

Invalid, missing, or revoked tokens return HTTP `401`.

## Current Scope

This first integration slice intentionally supports only one multipart file per request. It reuses the existing ShareDock share/file/storage services and does not replace the browser upload flow.
