---
name: roam-alphaapi-ui-navigation-sidebar
description: Navigate and manipulate Roam’s UI from extensions using window.roamAlphaAPI.ui (focus/selection, main window open state, left sidebar, right sidebar windows). Use when an extension needs to open pages/blocks, focus blocks, or manage sidebar windows.
---

# Roam Alpha API — UI navigation & sidebars

Use this skill for **UI state** operations (not graph queries).

## What to read

- UI navigation/sidebar reference: `references/ui-navigation-sidebar.md`

## Practical guidance

- Use `ui.getFocusedBlock()` rather than DOM selectors; it’s more robust and works from callbacks.
- `ui.setBlockFocusAndSelection` can target either a real `window-id` or the string `"main-window"`.
- `ui.mainWindow.openBlock` returns `true` even if the uid doesn’t exist (per docs) — don’t treat it as a guarantee.
- Right sidebar windows are addressed by `{type, block-uid}` (or `search-query-str` for type `search-query`).

## Common tasks this skill should cover

- Focus a block and set cursor/selection.
- Open a page or zoom into a block in the main window.
- Add/remove/pin/reorder right sidebar windows.
