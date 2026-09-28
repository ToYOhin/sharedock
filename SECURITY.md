# Security Policy

## Supported Versions

Security fixes are applied to the latest ShareDock release line. When reviewing
dependencies or vulnerabilities, maintainers also review relevant Pingvin
Share X updates because ShareDock is derived from that project.

## Security Expectations

- Do not publish an image with an unresolved fixable critical or high
  vulnerability, or with a confirmed secret exposure.
- Keep deployment secrets, including `SHAREDOCK_UPLOAD_WEBHOOK_SECRET`, out of
  configuration examples, screenshots, logs, and source control.
- Keep upload tokens and deletion URLs out of recipient-facing messages.
- Back up data before applying releases that change migrations or storage.

## Automated Container Scanning

The Docker Security workflow builds and scans the local container image on
pushes and pull requests to `main`, weekly, and on manual runs.

Before scanning, it starts that same image with a disposable SQLite database and
checks the frontend, health endpoint, signup, token upload, saved share, and
rejection of a revoked token. Test data is removed with the container; the image
is not published by this workflow.

- Reporting scans cover medium, high, and critical vulnerabilities and secrets,
  ignoring vulnerabilities without an available fix. These scans use
  `exit-code: "0"`, so findings alone do not fail the job. SARIF generation and
  best-effort upload to GitHub Security run only outside pull requests.
- A separate blocking scan runs after reporting on all workflow triggers. It
  scans vulnerabilities with `severity: HIGH,CRITICAL`, `ignore-unfixed: true`,
  and `exit-code: "1"`. Any detected fixable high or critical vulnerability fails
  the job. Neither the gate nor the job uses `continue-on-error`; the report
  upload cannot mask a gate failure.
- Medium vulnerabilities and secret findings are reported, not blocked by this
  vulnerability gate. Confirmed secret exposures still prohibit publication
  under the expectations above.

## Reporting a Vulnerability

Do not include exploit details, credentials, or private data in a public issue.
Use GitHub private vulnerability reporting when it is available for the
repository; otherwise contact the repository owner directly through GitHub.
