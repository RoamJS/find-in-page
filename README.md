# Find In Page

<a href="https://roamjs.com/">
    <img src="https://avatars.githubusercontent.com/u/138642184" alt="RoamJS Logo" title="RoamJS" align="right" height="60" />
</a>

**Find text across the current page, including folded blocks. Preview highlighted matches, jump into editing, and navigate with keyboard shortcuts.**

[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/RoamJS/find-in-page)

## Features

- Search the current page or zoomed-in block and its descendants, including folded blocks.
- Find text and phrases without worrying about capitalization.
- Highlight matching text and see how many occurrences there are.
- Preview each match while keeping your cursor in the search field, then select that text in its block when you want to edit.
- Reveal folded ancestors automatically when navigating to a match.
- Assign global shortcuts to four commands through **Settings → Hotkeys**.

## Usage

1. Open a page or zoom into a block in the main window.
2. Press **Cmd+F** on macOS or **Ctrl+F** on Windows/Linux, or run **Find In Page: Open** from the command palette.
3. Type a word or phrase. Individual matches are counted and visible matches are highlighted.
4. Press **Enter** to preview a match. Continue with **Enter** or **Shift+Enter** to move forward or backward.
5. Press **Cmd/Ctrl+Enter** to focus the selected match for editing. That occurrence is selected in its block, and the search panel stays open.

If the default shortcut is already assigned, choose a shortcut for **Find In Page: Open** in **Settings → Hotkeys**.

### Search field shortcuts

These shortcuts apply while the search field has focus.

| Shortcut                | Action                               |
| ----------------------- | ------------------------------------ |
| Enter or Down arrow     | Preview the next match               |
| Shift+Enter or Up arrow | Preview the previous match           |
| Cmd/Ctrl+Enter          | Focus the selected match for editing |
| Escape                  | Close the panel and clear highlights |

The panel also has buttons for previous, next, focus, and close. Escape closes the panel when either the search field or a panel button has focus. Navigation visits each occurrence within a block before continuing to the next block, follows page order, and wraps around at either end of the results.

Before selecting a result, the counter shows the number of matches. After navigation it shows your position, such as **1 of 2**. An empty search shows **Type to search**, and a search with no results shows **No matches**.

### Global commands

Assign shortcuts in **Settings → Hotkeys** to use these commands while editing a block:

- **Find In Page: Open** — open or refocus the search panel and refresh its results, keeping the selected occurrence on the same page when it is still available.
- **Find In Page: Next Match** — preview the next occurrence and keep the search field focused.
- **Find In Page: Previous Match** — preview the previous occurrence and keep the search field focused.
- **Find In Page: Focus Current Match** — focus the selected occurrence, or the first result if none is selected.

The navigation commands use the current search while its panel is open. Ordinary Enter in the outliner keeps its usual editing behavior.

## Search scope

- Search covers the current main-window page or block tree. It does not search the whole graph, the right sidebar, linked references, or text resolved from block references and embeds.
- Matches are contiguous text, ignoring capitalization and surrounding spaces in the query. Regular expressions and fuzzy matching are not supported.
- The counter and navigation operate on individual, non-overlapping occurrences. Repeated matches within one block are separate results.
- Search uses saved block text. Matches in hidden markup, such as link destinations, can be selected with **Cmd/Ctrl+Enter** even when they have no visible inline highlight.
- Results are refreshed whenever you run **Find In Page: Open**. After editing text or moving to another page, run it again to search the current content.
- Folded ancestors opened during navigation remain expanded when the panel closes.
- On large result sets, inline highlighting covers the first 250 matching blocks plus the block containing the selected result. Navigation still includes every match.

## License

MIT
