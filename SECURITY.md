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

## Reporting a Vulnerability

Do not include exploit details, credentials, or private data in a public issue.
Use GitHub private vulnerability reporting when it is available for the
repository; otherwise contact the repository owner directly through GitHub.
