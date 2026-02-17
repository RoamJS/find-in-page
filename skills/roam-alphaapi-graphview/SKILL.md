---
name: roam-alphaapi-graphview
description: Hook into Roam’s graph view (Cytoscape) from extensions using window.roamAlphaAPI.ui.graphView callbacks (and whole-graph API notes). Use when customizing or reacting to graph view rendering.
---

# Roam Alpha API — Graph view

Use this skill when working with Roam’s **graph visualization** APIs.

## What to read

- Graph view reference: `references/ui-graphview.md`

## Practical guidance

- Graph view callbacks receive a context containing `cytoscape`, `elements`, and `type` (`page` vs `all-pages`).
- The doc notes a newer `wholeGraph` API for the new graph overview; treat as experimental.

## Common tasks this skill should cover

- Register/unregister graph view listeners.
- Use the Cytoscape object to experiment with layout/styling/plugins.
