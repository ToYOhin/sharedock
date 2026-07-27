---
id: introduction
---

# Introduction

ShareDock is a private file relay for personal developers and small teams.
It is built for short-lived file handoff, screenshot uploads, reverse uploads, and a small admin surface for keeping a self-hosted instance understandable.

It is intentionally narrower than a full cloud drive. ShareDock should make temporary sharing and automation easy without turning into a file manager.

## What ShareDock focuses on

- Expiring share links for quick handoff.
- Reverse-share links for receiving files from others.
- Share notes and tags for finding recent handoffs.
- ShareX and script-friendly upload entry points.
- Admin visibility for storage, expiring shares, cleanup candidates, cleanup logs, and cleanup policy.
- Optional deployment integrations such as S3-compatible storage, OpenID Connect, and ClamAV.

## Design boundaries

- Keep the upload, authentication, and storage paths stable unless a focused slice requires changing them.
- Prefer small, reversible improvements over broad rewrites.
- Keep upstream attribution and license notices intact while giving ShareDock its own product direction.
