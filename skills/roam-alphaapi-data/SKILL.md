---
name: roam-alphaapi-data
description: Query and read Roam Research graphs from extensions using window.roamAlphaAPI.data (datalog q/pull/pull_many, search, roamQuery, async/fast/backend variants, pull watches, undo/redo). Use when writing or explaining Roam extension code that needs to find pages/blocks, fetch attributes, or monitor changes.
---

# Roam Alpha API — Data (read/query)

Use this skill when implementing **read access** to a Roam graph from an extension.

## What to read

- API reference for this skill: `references/data.md`
- Shared parameter schemas (uids, location, etc.): `references/schema.md`

## Practical guidance

- Prefer `window.roamAlphaAPI.data.async.*` in new extensions (future-proofing).
- For large reads, prefer `pull_many` over many individual `pull` calls.
- `data.q`, `data.pull`, and variants time out at ~20s (error: `Query and/or pull expression took too long to run.`). Keep queries tight.
- `data.backend.q` can avoid blocking the UI thread, but may lag a bit behind the frontend while syncing.

## Common tasks this skill should cover

- Build a datalog query (`data.q`) to find blocks/pages by attribute.
- Use pull patterns to fetch nested children (`data.pull`, `data.pull_many`).
- Use `data.search` vs `data.roamQuery` (UI-like search vs native query syntax).
- Add/remove pull watches to react to changes (`addPullWatch` / `removePullWatch`).
