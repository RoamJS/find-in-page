---
name: roam-alphaapi-ui-commands-menus
description: Add Roam extension UI entry points: command palette commands, slash commands, context menu items (block/page/page-ref/block-ref/multiselect), and read selection state. Use when implementing user-triggered actions in Roam.
---

# Roam Alpha API — Commands & menus

Use this skill when you need **ways for the user to invoke your extension**.

## What to read

- Commands/menus reference: `references/ui-commands-menus.md`

## Practical guidance

- Command Palette commands should be globally unique; prefix labels (e.g. `"MyExt: Do Thing"`).
- Avoid setting `default-hotkey` unless you *really* mean it; users can configure hotkeys.
- Slash command callbacks can return a string (auto-insert) or `null` to handle insertion manually.
- Context menu callbacks get a rich context object; use `display-conditional` to show actions only when relevant.

## Common tasks this skill should cover

- Register a Command Palette command.
- Add a slash command that inserts text or runs logic.
- Add block/page context menu actions.
- Detect multiselected blocks and act on them.
