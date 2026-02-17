---
name: roam-alphaapi-ui-rendering-react
description: Render Roam blocks/pages/search results/strings inside custom DOM nodes, or use provided React components, via window.roamAlphaAPI.ui.components and window.roamAlphaAPI.ui.react. Use when building extension UIs that embed Roam-native content.
---

# Roam Alpha API — Rendering & React helpers

Use this skill when you need to **embed Roam content into your extension UI**.

## What to read

- Rendering/React reference: `references/ui-rendering-react.md`

## Practical guidance

- `ui.components.*` mounts React into a provided DOM node; keep track of nodes so you can `unmountNode`.
- `renderString` renders Roam-flavored markdown; links to non-existent pages won’t work.
- Use `ui.react.*` for declarative JSX usage when you’re already in React.

## Common tasks this skill should cover

- Render a block/page into a sidebar panel.
- Render a search view.
- Render Roam-markdown strings safely.
