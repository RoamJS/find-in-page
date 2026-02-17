---
name: roam-alphaapi-write-blocks-pages
description: Create, update, move, delete, reorder, and import Markdown into Roam blocks/pages using window.roamAlphaAPI.data.block and window.roamAlphaAPI.data.page (plus related page shortcuts). Use when writing Roam extension code that mutates the graph.
---

# Roam Alpha API — Write blocks & pages

Use this skill when implementing **write/mutation** behavior in a Roam extension.

## What to read

- Mutation reference: `references/write.md`
- Shared parameter schemas (location/block/page/window): `references/schema.md`

## Practical guidance / sharp edges

- `location.order` is **0-indexed**; `'last'` appends.
- Use stable identifiers:
  - blocks: `block.uid`
  - pages: `page.uid` (daily notes often use date-based uid)
- `fromMarkdown` uses Roam’s import parser (nested lists → nested blocks). Great for bulk inserts.
- `reorderBlocks` requires **all direct children** uids, exactly once, in the desired order.

## Common tasks this skill should cover

- Create a block under a given parent (page uid or block uid).
- Update a block string + formatting (heading, alignment, view types).
- Move a block and/or reorder siblings.
- Create a page (including daily notes) and seed content.
- Delete blocks/pages safely (know it deletes descendants).
