import React from "react";
import ReactDOM from "react-dom";
import { render as renderToast } from "roamjs-components/components/Toast";
import type { OnloadArgs, PullBlock } from "roamjs-components/types";

import { FindInPagePanel } from "~/components/FindInPagePanel";
import {
  rankEntries,
  getMatchRanges,
  type BlockSearchEntry,
  type RankedBlockSearchEntry,
} from "~/utils/searchRank";

export const COMMAND_LABEL = "Find In Page: Open";
export const NEXT_MATCH_COMMAND_LABEL = "Find In Page: Next Match";
export const PREVIOUS_MATCH_COMMAND_LABEL = "Find In Page: Previous Match";
export const FOCUS_CURRENT_MATCH_COMMAND_LABEL =
  "Find In Page: Focus Current Match";
export const FIND_IN_PAGE_COMMAND_LABELS = [
  COMMAND_LABEL,
  NEXT_MATCH_COMMAND_LABEL,
  PREVIOUS_MATCH_COMMAND_LABEL,
  FOCUS_CURRENT_MATCH_COMMAND_LABEL,
] as const;
const PANEL_ROOT_ID = "roamjs-find-in-page-root";
const STYLE_ID = "roamjs-find-in-page-style";
const MATCH_CLASS = "roamjs-find-in-page-match";
const ACTIVE_MATCH_CLASS = "roamjs-find-in-page-active-match";
const INLINE_MATCH_CLASS = "roamjs-find-in-page-inline-match";
const ACTIVE_INLINE_MATCH_CLASS = "roamjs-find-in-page-active-inline-match";
const FLASH_MATCH_CLASS = "roamjs-find-in-page-flash-match";
const COPIED_CONTENT_SELECTOR =
  ".rm-embed-container, .rm-block-ref, .rm-query, .rm-reference-container, .rm-reference-main, .rm-mentions, .rm-reference-item";
const PULL_PATTERN =
  "[:block/uid :block/string :block/order {:block/children ...}]";
const MAX_HIGHLIGHTED_BLOCKS = 250;
const BLOCK_RENDER_TIMEOUT_MS = 3500;
const BLOCK_RENDER_POLL_INTERVAL_MS = 50;

type PanelState = {
  isOpen: boolean;
  query: string;
  currentMatch: number;
  matchCount: number;
};

type PanelActions = {
  onQueryChange: (query: string) => void;
  onPrevious: () => void;
  onNext: () => void;
  onFocusCurrent: () => void;
  onClose: () => void;
};

export type PanelHost = {
  render: (state: PanelState, actions: PanelActions) => void;
  focusInput: (options?: { select?: boolean }) => void;
  unmount: () => void;
};

export type FindInPageDependencies = {
  extensionAPI: OnloadArgs["extensionAPI"];
  roamApi?: Window["roamAlphaAPI"];
  panelHost?: PanelHost;
  getBlockElement?: (uid: string) => HTMLElement | null;
  ensureStyles?: () => void;
  removeStyles?: () => void;
  renderHighlights?: (args: {
    matches: RankedBlockSearchEntry[];
    currentMatchIndex: number;
    query: string;
  }) => void;
  clearHighlights?: () => void;
  scrollToBlock?: (element: HTMLElement) => void;
  scrollToSelection?: (args: {
    uid: string;
    signal: AbortSignal;
    selection?: { start: number; end: number };
  }) => Promise<void>;
  delay?: (milliseconds: number) => Promise<void>;
  afterHostRender?: () => Promise<void>;
  observeContentChanges?: (onChange: () => void) => () => void;
  notify?: (args: {
    id: string;
    message: string;
    intent: "warning" | "danger";
  }) => void;
};

export type FindInPageState = {
  isInitialized: boolean;
  isOpen: boolean;
  query: string;
  indexedRootUid: string | null;
  indexedBlocks: BlockSearchEntry[];
  matches: RankedBlockSearchEntry[];
  currentMatchIndex: number;
};

export type FindInPageController = {
  open: () => Promise<void>;
  unload: () => void;
  getState: () => FindInPageState;
};

type CommandPaletteCommand = Parameters<
  Window["roamAlphaAPI"]["ui"]["commandPalette"]["addCommand"]
>[0];

export const coerceChildren = ({ value }: { value: unknown }): PullBlock[] => {
  if (Array.isArray(value)) {
    return value.filter(
      (node): node is PullBlock => !!node && typeof node === "object",
    );
  }
  if (!value) return [];
  if (typeof value === "object" && Symbol.iterator in value) {
    return Array.from(value as Iterable<unknown>).filter(
      (node): node is PullBlock => !!node && typeof node === "object",
    );
  }
  if (typeof value === "object") {
    return Object.values(value as Record<string, unknown>).filter(
      (node): node is PullBlock => !!node && typeof node === "object",
    );
  }
  return [];
};

export const flattenTreeToEntries = ({
  rootNode,
}: {
  rootNode: PullBlock | null;
}): BlockSearchEntry[] => {
  if (!rootNode) return [];
  const entries: BlockSearchEntry[] = [];
  const collectNode = ({
    node,
    ancestors,
    isRoot,
  }: {
    node: PullBlock;
    ancestors: string[];
    isRoot: boolean;
  }): void => {
    const uid = node[":block/uid"];
    if (!uid) return;
    const text = node[":block/string"] ?? "";
    if (text.trim()) {
      entries.push({ uid, text, ancestors, order: entries.length });
    }
    const nextAncestors =
      !isRoot || text.trim() ? [...ancestors, uid] : ancestors;
    coerceChildren({ value: node[":block/children"] })
      .map((child, index) => ({ child, index }))
      .sort(
        (a, b) =>
          (a.child[":block/order"] ?? a.index) -
            (b.child[":block/order"] ?? b.index) || a.index - b.index,
      )
      .forEach(({ child }) =>
        collectNode({ node: child, ancestors: nextAncestors, isRoot: false }),
      );
  };
  collectNode({ node: rootNode, ancestors: [], isRoot: true });
  return entries;
};

const ensureDefaultStyles = (): void => {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    #${PANEL_ROOT_ID} { position: fixed; top: 56px; right: 16px; z-index: 1100; width: min(540px, calc(100vw - 32px)); }
    .roamjs-find-in-page-panel { display: flex; align-items: center; gap: 6px; padding: 8px; border: 1px solid rgba(16, 22, 26, 0.16); }
    .roamjs-find-in-page-panel .bp3-input-group { flex: 1 1 180px; min-width: 0; }
    .roamjs-find-in-page-count { flex: 0 0 auto; min-width: 72px; color: inherit; font-size: 12px; text-align: center; user-select: none; }
    @media (max-width: 520px) {
      .roamjs-find-in-page-panel { flex-wrap: wrap; }
      .roamjs-find-in-page-panel .bp3-input-group { flex: 1 0 100%; }
      .roamjs-find-in-page-count { flex: 1; text-align: left; }
    }
    .${MATCH_CLASS} { border-radius: 4px; transition: background-color 120ms ease, box-shadow 120ms ease; }
    .${INLINE_MATCH_CLASS} { padding: 0; border-radius: 3px; color: #182026; background: rgba(255, 235, 59, 0.82); }
    .${ACTIVE_INLINE_MATCH_CLASS} { border-radius: 4px; background: rgba(255, 167, 38, 0.88); box-shadow: inset 0 0 0 1px rgba(255, 111, 0, 0.98); }
    ::highlight(${INLINE_MATCH_CLASS}) { color: #182026; background-color: rgba(255, 235, 59, 0.82); }
    ::highlight(${ACTIVE_INLINE_MATCH_CLASS}) { color: #182026; background-color: rgba(255, 167, 38, 0.88); }
    .${ACTIVE_MATCH_CLASS} { box-shadow: inset 0 0 0 1px rgba(255, 111, 0, 0.92), 0 0 0 1px rgba(255, 167, 38, 0.36); }
    @keyframes roamjs-find-in-page-flash { 0% { background-color: rgba(255, 138, 0, 0.95); } 100% { background-color: rgba(255, 167, 38, 0.88); } }
    .${FLASH_MATCH_CLASS} { animation: roamjs-find-in-page-flash 560ms ease-out; }
  `;
  document.head.appendChild(style);
};

const createReactPanelHost = (): PanelHost => {
  const root = document.createElement("div");
  root.id = PANEL_ROOT_ID;
  document.body.appendChild(root);
  const inputRef = React.createRef<HTMLInputElement>();
  return {
    render: (state, actions): void => {
      ReactDOM.render(
        state.isOpen
          ? React.createElement(FindInPagePanel, {
              inputRef,
              query: state.query,
              currentMatch: state.currentMatch,
              matchCount: state.matchCount,
              ...actions,
            })
          : React.createElement(React.Fragment),
        root,
      );
    },
    focusInput: ({ select = false } = {}): void => {
      inputRef.current?.focus();
      if (select) inputRef.current?.select();
    },
    unmount: (): void => {
      ReactDOM.unmountComponentAtNode(root);
      root.remove();
    },
  };
};

const getDefaultBlockElement = (uid: string): HTMLElement | null => {
  const main =
    document.querySelector<HTMLElement>(".roam-body-main") ?? document.body;
  const escapedUid = window.CSS?.escape ? window.CSS.escape(uid) : uid;
  const selectors = [
    `.roam-block-container[data-block-uid="${escapedUid}"]`,
    `.rm-block[data-block-uid="${escapedUid}"]`,
    `#block-input-${escapedUid}`,
    `#span-${escapedUid}`,
    `[data-block-uid="${escapedUid}"]`,
    `[data-uid="${escapedUid}"]`,
    `textarea[id$="-${escapedUid}"]`,
    `div[id$="-${escapedUid}"]`,
  ];
  for (const selector of selectors) {
    const found = Array.from(main.querySelectorAll<HTMLElement>(selector)).find(
      (candidate) => !candidate.closest(COPIED_CONTENT_SELECTOR),
    );
    if (found) {
      return (
        found.closest<HTMLElement>(".roam-block-container") ??
        found.closest<HTMLElement>(".rm-block-main") ??
        found
      );
    }
  }
  return null;
};

const unwrapInlineHighlight = (element: HTMLElement): void => {
  const parent = element.parentNode;
  if (!parent) return;
  parent.replaceChild(
    document.createTextNode(element.textContent ?? ""),
    element,
  );
  parent.normalize();
};

type TextHighlight = { add: (range: Range) => void; priority: number };
type HighlightApi = {
  Highlight: new () => TextHighlight;
  registry: {
    set: (name: string, highlight: TextHighlight) => void;
    delete: (name: string) => void;
  };
};

const getHighlightApi = (): HighlightApi | null => {
  const host = window as unknown as {
    Highlight?: HighlightApi["Highlight"];
    CSS?: { highlights?: HighlightApi["registry"] };
  };
  return host.Highlight && host.CSS?.highlights
    ? { Highlight: host.Highlight, registry: host.CSS.highlights }
    : null;
};

let activeMatchRange: Range | null = null;

export const clearFindInPageHighlights = (): void => {
  const highlightApi = getHighlightApi();
  highlightApi?.registry.delete(INLINE_MATCH_CLASS);
  highlightApi?.registry.delete(ACTIVE_INLINE_MATCH_CLASS);
  activeMatchRange = null;
  document
    .querySelectorAll<HTMLElement>(`.${INLINE_MATCH_CLASS}`)
    .forEach(unwrapInlineHighlight);
  document
    .querySelectorAll<HTMLElement>(
      `.${MATCH_CLASS}, .${ACTIVE_MATCH_CLASS}, .${FLASH_MATCH_CLASS}`,
    )
    .forEach((element) =>
      element.classList.remove(
        MATCH_CLASS,
        ACTIVE_MATCH_CLASS,
        FLASH_MATCH_CLASS,
      ),
    );
};

const getBlockTextNodes = (blockElement: HTMLElement): Text[] => {
  const owner = blockElement.closest(".roam-block-container");
  const input = Array.from(
    blockElement.querySelectorAll<HTMLElement>(
      ".rm-block__input--view, .rm-block__input",
    ),
  ).find((candidate) => candidate.closest(".roam-block-container") === owner);
  if (!input || input.tagName === "TEXTAREA") return [];
  const textNodes: Text[] = [];
  const walker = document.createTreeWalker(input, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) => {
      const parent = node.parentElement;
      return parent &&
        parent.closest(".roam-block-container") === owner &&
        !parent.closest(COPIED_CONTENT_SELECTOR)
        ? NodeFilter.FILTER_ACCEPT
        : NodeFilter.FILTER_REJECT;
    },
  });
  for (let node = walker.nextNode(); node; node = walker.nextNode())
    textNodes.push(node as Text);
  return textNodes;
};

const getRenderedMatches = ({
  nodes,
  query,
  sourceText,
}: {
  nodes: Text[];
  query: string;
  sourceText?: string;
}): {
  start: number;
  end: number;
  sourceStart: number;
}[] => {
  const text = nodes.map((node) => node.data).join("");
  const renderedMatches = getMatchRanges({ text, query });
  if (sourceText === undefined || sourceText === text)
    return renderedMatches.map((match) => ({
      ...match,
      sourceStart: match.start,
    }));
  const hiddenSourceRanges: { start: number; end: number }[] = [];
  for (let index = 0; index < sourceText.length - 1; index += 1) {
    if (sourceText[index] === "\\") {
      index += 1;
      continue;
    }
    if (sourceText.startsWith("((", index)) {
      const end = sourceText.indexOf("))", index + 2);
      if (end >= 0 && /^[\w-]{9}$/.test(sourceText.slice(index + 2, end))) {
        hiddenSourceRanges.push({ start: index, end: end + 2 });
        index = end + 1;
        continue;
      }
    }
    if (
      sourceText.startsWith("{{", index) &&
      /^\{\{\s*(?:\[\[)?(?:embed|query)(?:\]\])?\s*:/i.test(
        sourceText.slice(index),
      )
    ) {
      let depth = 2;
      for (let cursor = index + 2; cursor < sourceText.length; cursor += 1) {
        if (sourceText[cursor] === "\\") {
          cursor += 1;
          continue;
        }
        if (sourceText[cursor] === "{") depth += 1;
        if (sourceText[cursor] === "}") depth -= 1;
        if (depth !== 0) continue;
        hiddenSourceRanges.push({ start: index, end: cursor + 1 });
        index = cursor;
        break;
      }
      continue;
    }
    if (sourceText[index] !== "]" || sourceText[index + 1] !== "(") continue;
    let depth = 1;
    for (let cursor = index + 2; cursor < sourceText.length; cursor += 1) {
      if (sourceText[cursor] === "\\") {
        cursor += 1;
        continue;
      }
      if (sourceText[cursor] === "(") depth += 1;
      if (sourceText[cursor] === ")") depth -= 1;
      if (depth !== 0) continue;
      hiddenSourceRanges.push({ start: index + 1, end: cursor + 1 });
      index = cursor;
      break;
    }
  }
  let sourceCursor = 0;
  let renderedCursor = 0;
  const segments = nodes.map((node) => {
    // Match complete text nodes so hidden markup/URLs do not shift later occurrences.
    let sourceStart = sourceText.indexOf(node.data, sourceCursor);
    if (!node.parentElement?.closest("code, pre")) {
      while (sourceStart >= 0) {
        const hiddenRange = hiddenSourceRanges.find(
          ({ start, end }) =>
            sourceStart < end && sourceStart + node.length > start,
        );
        if (!hiddenRange) break;
        sourceStart = sourceText.indexOf(node.data, hiddenRange.end);
      }
    }
    const start = renderedCursor;
    renderedCursor += node.length;
    if (sourceStart >= 0) sourceCursor = sourceStart + node.length;
    return { start, end: renderedCursor, sourceStart };
  });
  const sourceMatches = new Map(
    getMatchRanges({ text: sourceText, query }).map((match) => [
      match.start,
      match.end,
    ]),
  );
  return renderedMatches.flatMap((match) => {
    const first = segments.find(
      (segment) => segment.start <= match.start && segment.end > match.start,
    );
    const last = segments.find(
      (segment) => segment.start < match.end && segment.end >= match.end,
    );
    if (!first || !last || first.sourceStart < 0 || last.sourceStart < 0)
      return [];
    const sourceStart = first.sourceStart + match.start - first.start;
    const sourceEnd = last.sourceStart + match.end - last.start;
    return sourceMatches.get(sourceStart) === sourceEnd
      ? [{ ...match, sourceStart }]
      : [];
  });
};

const getBlockMatchRanges = ({
  blockElement,
  query,
  sourceText,
}: {
  blockElement: HTMLElement;
  query: string;
  sourceText: string;
}): { range: Range; sourceStart: number }[] => {
  const nodes = getBlockTextNodes(blockElement);
  return getRenderedMatches({ nodes, query, sourceText }).map(
    ({ start, end, sourceStart }) => {
      const range = document.createRange();
      let offset = 0;
      let started = false;
      for (const node of nodes) {
        const nextOffset = offset + node.length;
        if (!started && start < nextOffset) {
          range.setStart(node, start - offset);
          started = true;
        }
        if (started && end <= nextOffset) {
          range.setEnd(node, end - offset);
          break;
        }
        offset = nextOffset;
      }
      return { range, sourceStart };
    },
  );
};

// Older browsers fall back to spans with no padding or font changes.
export const applyInlineHighlightsToBlock = ({
  blockElement,
  query,
  activeOccurrenceIndex = -1,
  sourceText,
  activeSourceStart,
}: {
  blockElement: HTMLElement;
  query: string;
  activeOccurrenceIndex?: number;
  sourceText?: string;
  activeSourceStart?: number;
}): HTMLElement | null => {
  const nodes = getBlockTextNodes(blockElement);
  const matches = getRenderedMatches({ nodes, query, sourceText });
  let offset = 0;
  let firstMatch: HTMLElement | null = null;
  nodes.forEach((node) => {
    const nodeStart = offset;
    offset += node.length;
    const fragments = matches
      .map((match, index) => ({
        start: Math.max(match.start, nodeStart) - nodeStart,
        end: Math.min(match.end, offset) - nodeStart,
        index,
        sourceStart: match.sourceStart,
      }))
      .filter(({ start, end }) => end > start);
    if (!fragments.length) return;
    const fragment = document.createDocumentFragment();
    let cursor = 0;
    fragments.forEach(({ start, end, index, sourceStart }) => {
      fragment.append(node.data.slice(cursor, start));
      const span = document.createElement("span");
      span.className = (
        activeSourceStart === undefined
          ? index === activeOccurrenceIndex
          : sourceStart === activeSourceStart
      )
        ? `${INLINE_MATCH_CLASS} ${ACTIVE_INLINE_MATCH_CLASS}`
        : INLINE_MATCH_CLASS;
      span.textContent = node.data.slice(start, end);
      fragment.appendChild(span);
      firstMatch ??= span;
      cursor = end;
    });
    fragment.append(node.data.slice(cursor));
    node.parentNode?.replaceChild(fragment, node);
  });
  return firstMatch;
};

export const renderFindInPageHighlights = ({
  matches,
  currentMatchIndex,
  query,
}: {
  matches: RankedBlockSearchEntry[];
  currentMatchIndex: number;
  query: string;
}): void => {
  clearFindInPageHighlights();
  const activeMatch = matches[currentMatchIndex];
  const blocks = new Map<string, RankedBlockSearchEntry>();
  for (const match of matches) {
    if (!blocks.has(match.uid)) blocks.set(match.uid, match);
    if (blocks.size === MAX_HIGHLIGHTED_BLOCKS) break;
  }
  if (activeMatch) blocks.set(activeMatch.uid, activeMatch);
  const highlightApi = getHighlightApi();
  const highlights = highlightApi ? new highlightApi.Highlight() : null;
  const activeHighlights = highlightApi ? new highlightApi.Highlight() : null;
  if (activeHighlights) activeHighlights.priority = 1;
  for (const match of blocks.values()) {
    const block = getDefaultBlockElement(match.uid);
    if (!block) continue;
    const isActive = activeMatch?.uid === match.uid;
    block.classList.add(MATCH_CLASS);
    if (isActive) block.classList.add(ACTIVE_MATCH_CLASS);
    if (highlights && activeHighlights) {
      getBlockMatchRanges({
        blockElement: block,
        query,
        sourceText: match.text,
      }).forEach(({ range, sourceStart }) => {
        highlights.add(range);
        if (isActive && sourceStart === activeMatch.start) {
          activeHighlights.add(range);
          activeMatchRange = range;
        }
      });
    } else {
      applyInlineHighlightsToBlock({
        blockElement: block,
        query,
        sourceText: match.text,
        activeSourceStart: isActive ? activeMatch.start : -1,
      });
    }
  }
  if (highlightApi && highlights && activeHighlights) {
    highlightApi.registry.set(INLINE_MATCH_CLASS, highlights);
    highlightApi.registry.set(ACTIVE_INLINE_MATCH_CLASS, activeHighlights);
  }
};

const scrollTextRectIntoView = ({
  element,
  rect,
}: {
  element: HTMLElement;
  rect: DOMRect;
}): void => {
  for (
    let parent: HTMLElement | null = element;
    parent;
    parent = parent.parentElement
  ) {
    if (
      parent.scrollHeight > parent.clientHeight &&
      /auto|scroll|overlay/.test(getComputedStyle(parent).overflowY)
    ) {
      const bounds = parent.getBoundingClientRect();
      parent.scrollTo({
        top:
          parent.scrollTop +
          rect.top -
          bounds.top -
          parent.clientHeight / 2 +
          rect.height / 2,
        behavior: "smooth",
      });
      return;
    }
  }
  window.scrollBy({
    top: rect.top - window.innerHeight / 2 + rect.height / 2,
    behavior: "smooth",
  });
};

const scrollToActiveMatch = (element: HTMLElement): void => {
  if (!activeMatchRange || !element.contains(activeMatchRange.startContainer)) {
    const target =
      element.querySelector<HTMLElement>(`.${ACTIVE_INLINE_MATCH_CLASS}`) ??
      element;
    target.scrollIntoView({ behavior: "smooth", block: "center" });
    return;
  }
  const rect = activeMatchRange.getClientRects()[0];
  if (!rect) return;
  scrollTextRectIntoView({ element, rect });
};

const getBlockEditor = (element: HTMLElement): HTMLTextAreaElement | null => {
  const owner = element.closest(".roam-block-container");
  const editors = element.matches("textarea")
    ? [element as HTMLTextAreaElement]
    : Array.from(element.querySelectorAll<HTMLTextAreaElement>("textarea"));
  return (
    editors.find(
      (editor) => editor.closest(".roam-block-container") === owner,
    ) ?? null
  );
};

const scrollEditorSelectionIntoView = (editor: HTMLTextAreaElement): void => {
  const mirror = document.createElement("div");
  const style = getComputedStyle(editor);
  for (const property of Array.from(style))
    mirror.style.setProperty(property, style.getPropertyValue(property));
  const bounds = editor.getBoundingClientRect();
  Object.assign(mirror.style, {
    position: "fixed",
    visibility: "hidden",
    pointerEvents: "none",
    top: `${bounds.top - editor.scrollTop}px`,
    left: `${bounds.left - editor.scrollLeft}px`,
    margin: "0",
    height: "auto",
    minHeight: "0",
    maxHeight: "none",
    overflow: "visible",
    transform: "none",
    whiteSpace: "pre-wrap",
    overflowWrap: "break-word",
  });
  const selected = document.createElement("span");
  selected.textContent =
    editor.value.slice(editor.selectionStart, editor.selectionEnd) || "\u200b";
  mirror.append(
    editor.value.slice(0, editor.selectionStart),
    selected,
    editor.value.slice(editor.selectionEnd),
  );
  document.body.appendChild(mirror);
  try {
    // Textareas expose selection offsets but no character rectangles. A hidden
    // mirror measures the same wrapping without changing the actual editor.
    const range = document.createRange();
    range.selectNodeContents(selected);
    const rect = range.getClientRects()[0];
    if (rect && editor.parentElement)
      scrollTextRectIntoView({ element: editor.parentElement, rect });
  } finally {
    mirror.remove();
  }
};

const defaultDelay = (milliseconds: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

export const waitForBlockElement = async ({
  uid,
  getBlockElement,
  delay = defaultDelay,
  timeoutMs = BLOCK_RENDER_TIMEOUT_MS,
  pollIntervalMs = BLOCK_RENDER_POLL_INTERVAL_MS,
  signal,
  isReady = () => true,
}: {
  uid: string;
  getBlockElement: (uid: string) => HTMLElement | null;
  delay?: (milliseconds: number) => Promise<void>;
  timeoutMs?: number;
  pollIntervalMs?: number;
  signal?: AbortSignal;
  isReady?: (element: HTMLElement) => boolean;
}): Promise<HTMLElement | null> => {
  const attempts = Math.max(1, Math.ceil(timeoutMs / pollIntervalMs));
  for (let attempt = 0; attempt <= attempts; attempt += 1) {
    if (signal?.aborted) return null;
    const element = getBlockElement(uid);
    if (element && isReady(element)) return element;
    if (attempt < attempts) await delay(pollIntervalMs);
  }
  return null;
};

export const revealAncestorBlocks = async ({
  api,
  ancestors,
  signal,
}: {
  api: Window["roamAlphaAPI"];
  ancestors: string[];
  signal?: AbortSignal;
}): Promise<void> => {
  for (const uid of ancestors) {
    if (signal?.aborted) return;
    try {
      await Promise.resolve(api.updateBlock({ block: { uid, open: true } }));
    } catch {
      // Pages and special block renderers may not expose an open state.
    }
  }
};

const observeDefaultContentChanges = (onChange: () => void): (() => void) => {
  const main = document.querySelector(".roam-body-main");
  if (!main) return () => undefined;
  let frame: number | null = null;
  let stopped = false;
  const options = { childList: true, subtree: true, characterData: true };
  const observer = new MutationObserver(() => {
    if (frame !== null) return;
    frame = requestAnimationFrame(() => {
      frame = null;
      if (stopped) return;
      // Roam replaces rendered text nodes when entering/leaving its editor.
      // Disconnect while painting so fallback span changes cannot recurse.
      observer.disconnect();
      try {
        onChange();
      } finally {
        if (!stopped) observer.observe(main, options);
      }
    });
  });
  observer.observe(main, options);
  return () => {
    stopped = true;
    observer.disconnect();
    if (frame !== null) cancelAnimationFrame(frame);
  };
};

export const createFindInPage = async (
  dependencies: FindInPageDependencies,
): Promise<FindInPageController> => {
  const { extensionAPI } = dependencies;
  const panelHost = dependencies.panelHost ?? createReactPanelHost();
  const getBlockElement =
    dependencies.getBlockElement ?? getDefaultBlockElement;
  const ensureStyles = dependencies.ensureStyles ?? ensureDefaultStyles;
  const removeStyles =
    dependencies.removeStyles ??
    (() => document.getElementById(STYLE_ID)?.remove());
  const renderHighlights =
    dependencies.renderHighlights ?? renderFindInPageHighlights;
  const clearHighlights =
    dependencies.clearHighlights ?? clearFindInPageHighlights;
  const scrollToBlock = dependencies.scrollToBlock ?? scrollToActiveMatch;
  const delay = dependencies.delay ?? defaultDelay;
  const afterHostRender =
    dependencies.afterHostRender ??
    (() =>
      new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
      }));
  const scrollToSelection =
    dependencies.scrollToSelection ??
    (async ({
      uid,
      signal,
      selection,
    }: {
      uid: string;
      signal: AbortSignal;
      selection?: { start: number; end: number };
    }): Promise<void> => {
      const element = await waitForBlockElement({
        uid,
        getBlockElement,
        delay,
        signal,
        isReady: (candidate) => Boolean(selection || getBlockEditor(candidate)),
      });
      if (signal.aborted) return;
      if (!element) throw new Error("Match editor is not available");
      await delay(0);
      if (signal.aborted) return;
      const currentElement = getBlockElement(uid) ?? element;
      const editor = getBlockEditor(currentElement);
      if (editor) {
        if (selection) editor.setSelectionRange(selection.start, selection.end);
        scrollEditorSelectionIntoView(editor);
      } else if (selection) {
        showMatch({ element: currentElement });
      }
    });
  const notify: NonNullable<FindInPageDependencies["notify"]> =
    dependencies.notify ??
    (({ id, message, intent }): void => {
      renderToast({
        id,
        content: message,
        intent,
        position: "bottom",
        timeout: 6000,
      });
    });
  let api: Window["roamAlphaAPI"] | null =
    dependencies.roamApi ?? window.roamAlphaAPI;
  let isInitialized = true;
  let isUnloaded = false;
  let navigationQueue = Promise.resolve();
  let navigationController = new AbortController();
  let isOpen = false;
  let query = "";
  let indexedRootUid: string | null = null;
  let indexedBlocks: BlockSearchEntry[] = [];
  let matches: RankedBlockSearchEntry[] = [];
  let currentMatchIndex = -1;
  let stopObservingContent = (): void => undefined;

  const cancelNavigation = (): void => {
    navigationController.abort();
    navigationController = new AbortController();
    navigationQueue = Promise.resolve();
  };

  const getState = (): FindInPageState => ({
    isInitialized,
    isOpen,
    query,
    indexedRootUid,
    indexedBlocks: [...indexedBlocks],
    matches: [...matches],
    currentMatchIndex,
  });

  let panelActions: PanelActions;
  const renderPanel = (): void => {
    panelHost.render(
      {
        isOpen,
        query,
        currentMatch: currentMatchIndex,
        matchCount: matches.length,
      },
      panelActions,
    );
  };
  const refreshHighlights = (): void =>
    renderHighlights({ matches, currentMatchIndex, query });
  const refreshSearch = ({
    selectedMatch,
  }: { selectedMatch?: RankedBlockSearchEntry } = {}): void => {
    matches = rankEntries({ query, entries: indexedBlocks });
    currentMatchIndex = selectedMatch
      ? matches.findIndex(
          (match) =>
            match.uid === selectedMatch.uid &&
            match.start === selectedMatch.start &&
            match.end === selectedMatch.end,
        )
      : -1;
    renderPanel();
    refreshHighlights();
  };
  const hidePanel = (): void => {
    if (isUnloaded) return;
    cancelNavigation();
    stopObservingContent();
    isOpen = false;
    clearHighlights();
    renderPanel();
  };

  const revealMatch = async ({
    match,
    signal,
  }: {
    match: RankedBlockSearchEntry;
    signal: AbortSignal;
  }): Promise<HTMLElement | null> => {
    if (!api || signal.aborted) return null;
    await revealAncestorBlocks({ api, ancestors: match.ancestors, signal });
    const element = await waitForBlockElement({
      uid: match.uid,
      getBlockElement,
      delay,
      signal,
    });
    if (!element && !signal.aborted) throw new Error("Match is not available");
    return element;
  };

  const showMatch = ({ element }: { element: HTMLElement | null }): void => {
    refreshHighlights();
    if (!element) return;
    scrollToBlock(element);
    const active =
      element.querySelector<HTMLElement>(`.${ACTIVE_INLINE_MATCH_CLASS}`) ??
      element;
    if (!activeMatchRange) active.classList.add(FLASH_MATCH_CLASS);
  };

  const previewMatch = async ({
    match,
    signal,
  }: {
    match: RankedBlockSearchEntry;
    signal: AbortSignal;
  }): Promise<void> => {
    const element = await revealMatch({ match, signal });
    if (signal.aborted) return;
    panelHost.focusInput();
    await afterHostRender();
    if (signal.aborted) return;
    const currentElement = getBlockElement(match.uid) ?? element;
    if (currentElement && getBlockEditor(currentElement)) {
      refreshHighlights();
      await scrollToSelection({
        uid: match.uid,
        signal,
        selection: { start: match.start, end: match.end },
      });
    } else {
      showMatch({ element: currentElement });
    }
  };

  const focusMatch = async ({
    match,
    signal,
  }: {
    match: RankedBlockSearchEntry;
    signal: AbortSignal;
  }): Promise<void> => {
    const activeApi = api;
    if (!activeApi || signal.aborted) return;
    const revealedElement = await revealMatch({ match, signal });
    if (signal.aborted) return;
    if (revealedElement && !getBlockEditor(revealedElement)) {
      showMatch({ element: revealedElement });
    }
    await Promise.resolve(
      activeApi.ui.setBlockFocusAndSelection({
        location: { "block-uid": match.uid, "window-id": "main-window" },
        selection: { start: match.start, end: match.end },
      }),
    );
    if (signal.aborted) return;
    await scrollToSelection({ uid: match.uid, signal });
    if (signal.aborted) return;
    refreshHighlights();
  };

  const enqueueNavigation = ({
    navigate,
    signal,
  }: {
    navigate: () => Promise<void>;
    signal: AbortSignal;
  }): Promise<void> => {
    navigationQueue = navigationQueue.then(async (): Promise<void> => {
      if (signal.aborted) return;
      try {
        await navigate();
      } catch {
        if (!signal.aborted) {
          notify({
            id: "find-in-page-navigation-failure",
            message:
              "Could not reach this match. Run Find In Page: Open to refresh the results and try again.",
            intent: "warning",
          });
        }
      }
    });
    return navigationQueue;
  };

  const moveActiveMatch = async ({
    direction,
  }: {
    direction: 1 | -1;
  }): Promise<void> => {
    if (!isOpen || !matches.length) return;
    currentMatchIndex =
      currentMatchIndex < 0
        ? direction === 1
          ? 0
          : matches.length - 1
        : (currentMatchIndex + direction + matches.length) % matches.length;
    renderPanel();
    const match = matches[currentMatchIndex];
    cancelNavigation();
    const { signal } = navigationController;
    return enqueueNavigation({
      signal,
      navigate: async (): Promise<void> => {
        if (!isOpen || signal.aborted) return;
        await previewMatch({ match, signal });
      },
    });
  };

  const focusActiveMatch = async (): Promise<void> => {
    if (!isOpen || !matches.length) return;
    if (currentMatchIndex < 0) {
      currentMatchIndex = 0;
      renderPanel();
    }
    const match = matches[currentMatchIndex];
    cancelNavigation();
    const { signal } = navigationController;
    return enqueueNavigation({
      signal,
      navigate: async (): Promise<void> => {
        if (!isOpen || signal.aborted) return;
        await focusMatch({ match, signal });
      },
    });
  };

  panelActions = {
    onQueryChange: (nextQuery): void => {
      if (!isOpen || isUnloaded) return;
      cancelNavigation();
      query = nextQuery;
      refreshSearch();
    },
    onPrevious: (): void => void moveActiveMatch({ direction: -1 }),
    onNext: (): void => void moveActiveMatch({ direction: 1 }),
    onFocusCurrent: (): void => void focusActiveMatch(),
    onClose: hidePanel,
  };

  const rebuildIndex = async ({
    rootUid,
  }: {
    rootUid: string;
  }): Promise<void> => {
    if (!api) return;
    const rootNode = api.data.pull(PULL_PATTERN, [":block/uid", rootUid]);
    indexedBlocks = flattenTreeToEntries({ rootNode });
    indexedRootUid = rootUid;
    matches = [];
    currentMatchIndex = -1;
  };

  const open = async (): Promise<void> => {
    if (!api || isUnloaded) return;
    const previousRootUid = indexedRootUid;
    const selectedMatch = matches[currentMatchIndex];
    cancelNavigation();
    const { signal } = navigationController;
    try {
      const rootUid = await Promise.resolve(
        api.ui.mainWindow.getOpenPageOrBlockUid(),
      );
      if (signal.aborted) return;
      if (!rootUid) {
        hidePanel();
        notify({
          id: "find-in-page-no-open-page",
          message: "Find In Page only works in an open page or block view.",
          intent: "warning",
        });
        return;
      }
      ensureStyles();
      isOpen = true;
      renderPanel();
      await rebuildIndex({ rootUid });
      if (signal.aborted) return;
      refreshSearch({
        selectedMatch: rootUid === previousRootUid ? selectedMatch : undefined,
      });
      stopObservingContent();
      stopObservingContent = (
        dependencies.observeContentChanges ?? observeDefaultContentChanges
      )(() => {
        if (isOpen && !isUnloaded) refreshHighlights();
      });
      const retainedMatch = matches[currentMatchIndex];
      const retainedBlock = retainedMatch && getBlockElement(retainedMatch.uid);
      const editor = retainedBlock && getBlockEditor(retainedBlock);
      const KeyboardEvent = editor?.ownerDocument.defaultView?.KeyboardEvent;
      if (editor && KeyboardEvent) {
        // Roam retains its editor after blur; Escape restores rendered text.
        editor.dispatchEvent(
          new KeyboardEvent("keydown", {
            key: "Escape",
            code: "Escape",
            keyCode: 27,
            which: 27,
            bubbles: true,
          }),
        );
      }
      panelHost.focusInput({ select: true });
      await afterHostRender();
      if (signal.aborted) return;
      refreshHighlights();
    } catch {
      if (signal.aborted) return;
      indexedBlocks = [];
      indexedRootUid = null;
      matches = [];
      currentMatchIndex = -1;
      clearHighlights();
      if (isOpen) renderPanel();
      notify({
        id: "find-in-page-query-failure",
        message:
          "Could not search this page. Run Find In Page: Open to try again.",
        intent: "danger",
      });
    }
  };

  const commands: CommandPaletteCommand[] = [
    {
      label: COMMAND_LABEL,
      callback: (): void => void open(),
      "default-hotkey": "defmod-f",
    },
    {
      label: NEXT_MATCH_COMMAND_LABEL,
      callback: (): void => void moveActiveMatch({ direction: 1 }),
    },
    {
      label: PREVIOUS_MATCH_COMMAND_LABEL,
      callback: (): void => void moveActiveMatch({ direction: -1 }),
    },
    {
      label: FOCUS_CURRENT_MATCH_COMMAND_LABEL,
      callback: (): void => void focusActiveMatch(),
    },
  ];
  await Promise.all(
    commands.map((command) =>
      extensionAPI.ui.commandPalette.addCommand(command),
    ),
  );

  return {
    open,
    getState,
    unload: (): void => {
      if (isUnloaded) return;
      isUnloaded = true;
      stopObservingContent();
      isOpen = false;
      cancelNavigation();
      clearHighlights();
      panelHost.unmount();
      removeStyles();
      isInitialized = false;
      api = null;
    },
  };
};
