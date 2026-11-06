# Find In Page

<a href="https://roamjs.com/">
    <img src="https://avatars.githubusercontent.com/u/138642184" alt="RoamJS Logo" title="RoamJS" align="right" height="60" />
</a>

**Find text across the current page, including folded blocks. Preview highlighted matches, jump into editing, and navigate with keyboard shortcuts.**

[![RoamJS](https://roamjs.com/badges/website.svg)](https://roamjs.com/) [![DeepWiki](https://roamjs.com/badges/deepwiki.svg)](https://deepwiki.com/RoamJS/find-in-page) [![Slack](https://roamjs.com/badges/slack.svg)](https://roamresearch.slack.com/archives/C016N2B66JU)

https://github.com/user-attachments/assets/b34d12c6-c8b0-452e-b62e-973ce693fee4

## Features

- Search a page or zoomed-in block and its descendants, including folded blocks.
- Find words and phrases regardless of capitalization, with highlights that preserve the text layout.
- Visit every occurrence in page order, including repeated matches within the same block.
- Reveal folded ancestors as you navigate, then select the exact phrase when you want to edit.
- Reopen search after editing and keep your selected occurrence when it is still available.
- Assign global shortcuts to open search, move between matches, and focus the current match.

## Getting started

1. Open a page or zoom into a block in Roam’s main window.
2. Press **Cmd+F** on macOS or **Ctrl+F** on Windows/Linux, or run **Find In Page: Open** from the command palette.
3. Type a word or phrase. Matches are highlighted and counted as you type.
4. Press **Enter** to preview a match. Use **Enter** or **Down arrow** to move forward, and **Shift+Enter** or **Up arrow** to move backward.
5. Press **Cmd/Ctrl+Enter** to select the current occurrence in its block for editing. The search panel stays open. Run **Find In Page: Open** again to return to search and refresh the results.

The panel also has buttons for previous, next, focus and close. Navigation wraps around at either end of the results.

## Keyboard shortcuts

These shortcuts apply while the search field has focus:

| Shortcut                | Action                                    |
| ----------------------- | ----------------------------------------- |
| Enter or Down arrow     | Preview the next occurrence               |
| Shift+Enter or Up arrow | Preview the previous occurrence           |
| Cmd/Ctrl+Enter          | Select the current occurrence for editing |
| Escape                  | Close the panel and clear highlights      |

Escape also closes the panel when one of its buttons has focus. Enter in the outliner keeps Roam’s usual editing behavior.

### Global commands

Assign shortcuts in **Settings → Hotkeys** to use these commands while editing a block:

| Command                               | Action                                                                                                         |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| **Find In Page: Open**                | Open or refocus search and refresh its results; retain the selected occurrence on the same page when available |
| **Find In Page: Next Match**          | Preview the next occurrence and focus the search field                                                         |
| **Find In Page: Previous Match**      | Preview the previous occurrence and focus the search field                                                     |
| **Find In Page: Focus Current Match** | Select the current occurrence in its block, or the first result if none is selected                            |

The navigation commands use the current search while its panel is open. If **Cmd/Ctrl+F** is already assigned, choose another shortcut for **Find In Page: Open** in **Settings → Hotkeys**.

## Search scope

- Search covers the current main-window page or block tree. It does not search the whole graph, the right sidebar, linked references, or text resolved from block references and embeds.
- Queries match contiguous text, ignoring capitalization and surrounding spaces. Regular expressions and fuzzy matching are not supported.
- The counter and navigation track individual, non-overlapping occurrences. Before navigating, the counter shows the total; afterward, it shows a position such as **3 of 4**.
- Search uses saved block text. Matches in hidden markup, such as link destinations, can be selected for editing even when they have no visible inline highlight.
- After changing block text or navigating to another page, run **Find In Page: Open** to refresh the search.
- Folded ancestors opened during navigation fold back when you leave that branch or close the panel. Shared ancestors stay open between matches in the same branch. Originally expanded blocks and manual fold changes are preserved. Selecting a match for editing keeps its ancestors open when you close search.
- On large result sets, inline highlighting covers the first 250 matching blocks plus the selected block. Every occurrence remains navigable.

An empty query shows **Type to search**. A query with no results shows **No matches**. If search reports that no page is open, open an individual page or zoom into a block rather than using the Daily Notes feed.

## Demo

<details>
<summary>Watch the walkthrough</summary>

Search for a phrase, navigate repeated matches and folded notes, then return to search after selecting text for editing.

https://github.com/user-attachments/assets/d13563d4-4aa4-4429-ba69-49717df4a167

</details>

## License

MIT
