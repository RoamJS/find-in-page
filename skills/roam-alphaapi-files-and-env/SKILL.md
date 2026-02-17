---
name: roam-alphaapi-files-and-env
description: Use Roam Alpha API utilities and environment helpers: file upload/get/delete, uid/date helpers, platform and graph metadata, user metadata, Roam Depot extension inventory, and constants like the CORS-anywhere proxy URL. Use when an extension needs file IO, environment detection, or utility helpers.
---

# Roam Alpha API — Files, utils, and environment

Use this skill for the “edges” around the core data/UI APIs.

## What to read

- Reference: `references/files-and-env.md`

## Practical guidance

- Prefer `roamAlphaAPI.file.upload|get|delete` for files (handles encrypted graphs on `.get`).
- Use `util.dateToPageUid` for daily note uid generation (don’t randomize DNP uids).
- Use `graph.isEncrypted`/`graph.type` to decide when backend/off-thread methods may not be available.
- `constants.corsAnywhereProxyUrl` can help with CORS-restricted fetches from within Roam.

## Common tasks this skill should cover

- Upload a file and insert the returned URL into a block.
- Download/decrypt a hosted file.
- Detect platform (desktop/mobile/iOS/touch) and adjust UX.
- List installed Roam Depot extensions.
