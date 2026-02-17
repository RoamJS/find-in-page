---
name: roam-alphaapi-ui-filters
description: Get/set Roam UI filters (global filters, per-page filters, linked refs filters, right sidebar window filters) via window.roamAlphaAPI.ui.filters. Use when building extensions that programmatically apply or inspect filter state.
---

# Roam Alpha API — UI filters

Use this skill when your extension needs to **read or apply filters**.

## What to read

- Filters reference: `references/ui-filters.md`

## Practical guidance

- Filter sets distinguish between `includes` and `removes`.
- Page identification accepts `{title}` or `{uid}` depending on method.
- To clear filters, set `filters: {}` (per docs examples).

## Common tasks this skill should cover

- Apply a global include/remove filter.
- Read and modify page filters.
- Apply filters to linked references or sidebar windows.
