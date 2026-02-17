import { render as renderToast } from "roamjs-components/components/Toast";

import {
  rankEntries,
  type BlockSearchEntry,
  type RankedBlockSearchEntry,
} from "~/utils/searchRank";

const COMMAND_LABEL = "Find In Page: Open";
const PANEL_ID = "roamjs-find-in-page-panel";
const STYLE_ID = "roamjs-find-in-page-style";
const MATCH_CLASS = "roamjs-find-in-page-match";
const ACTIVE_MATCH_CLASS = "roamjs-find-in-page-active-match";
const INLINE_MATCH_CLASS = "roamjs-find-in-page-inline-match";
const ACTIVE_INLINE_MATCH_CLASS = "roamjs-find-in-page-active-inline-match";
const FLASH_MATCH_CLASS = "roamjs-find-in-page-flash-match";
const MATCH_COUNT_CLASS = "roamjs-find-in-page-count";
const HINT_ICON_CLASS = "roamjs-find-in-page-hint-icon";
const HINT_TOOLTIP = "Focus on highlighted block (Shift+Enter).";
const PULL_PATTERN = "[:block/uid :block/string {:block/children ...}]";
const MAX_HIGHLIGHTED_MATCHES = 250;

type RoamBlockNode = {
  ":block/uid"?: string;
  ":block/string"?: string;
  ":block/children"?: RoamBlockNode[];
};

type CommandPaletteDefinition = {
  label: string;
  callback: () => void | Promise<void>;
  "default-hotkey"?: string;
  "disable-hotkey"?: boolean;
};

type RoamAlphaApi = {
  ui: {
    commandPalette: {
      addCommand: (command: CommandPaletteDefinition) => Promise<void> | void;
      removeCommand: (command: { label: string }) => Promise<void> | void;
    };
    mainWindow: {
      getOpenPageOrBlockUid: () => Promise<string | null> | string | null;
    };
    setBlockFocusAndSelection: (args: {
      location?: { "block-uid": string; "window-id": string };
      selection?: { start: number; end?: number };
    }) => Promise<void> | void;
  };
  data: {
    pull: (
      pattern: string,
      eid: [":block/uid", string],
    ) => RoamBlockNode | null;
  };
  updateBlock: (args: {
    block: { uid: string; open?: boolean };
  }) => Promise<void> | void;
};

type WindowWithRoamApi = Window & {
  roamAlphaAPI?: RoamAlphaApi;
};

type PanelElements = {
  container: HTMLDivElement;
  input: HTMLInputElement;
  count: HTMLSpanElement;
  previous: HTMLButtonElement;
  next: HTMLButtonElement;
  close: HTMLButtonElement;
};

type FindInPageController = {
  unload: () => void;
};

const getRoamAlphaApi = (): RoamAlphaApi | null =>
  (window as WindowWithRoamApi).roamAlphaAPI ?? null;

const normalizeQuery = ({ query }: { query: string }): string =>
  query.trim().toLowerCase();

const logIndexedBlocks = ({
  rootUid,
  blocks,
}: {
  rootUid: string;
  blocks: BlockSearchEntry[];
}): void => {
  console.groupCollapsed(
    `[Find In Page] Indexed root ${rootUid} with ${blocks.length} searchable blocks`,
  );
  console.log("[Find In Page] Root UID:", rootUid);
  console.log(
    "[Find In Page] Indexed blocks:",
    blocks.map(({ uid, text, ancestors, order }) => ({
      uid,
      text,
      ancestors,
      order,
    })),
  );
  console.groupEnd();
};

const ensureStyles = (): void => {
  if (document.getElementById(STYLE_ID)) {
    return;
  }

  const styleElement = document.createElement("style");
  styleElement.id = STYLE_ID;
  styleElement.textContent = `
    #${PANEL_ID} {
      position: fixed;
      top: 56px;
      right: 16px;
      z-index: 1100;
      display: none;
      align-items: center;
      gap: 6px;
      padding: 8px;
      border-radius: 6px;
      border: 1px solid rgba(16, 22, 26, 0.16);
      background: var(--bp3-elevation-1, #ffffff);
    }

    #${PANEL_ID} .roamjs-find-in-page-controls {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    #${PANEL_ID} .${MATCH_COUNT_CLASS} {
      min-width: 56px;
      font-size: 12px;
      color: var(--bp3-text-color-muted, #5c7080);
      text-align: center;
      user-select: none;
    }

    #${PANEL_ID} .${HINT_ICON_CLASS} {
      color: var(--bp3-text-color-muted, #5c7080);
      cursor: help;
    }

    .${MATCH_CLASS} {
      box-shadow: none;
      background: transparent;
      border-radius: 4px;
      transition: background-color 120ms ease, box-shadow 120ms ease;
    }

    .${INLINE_MATCH_CLASS} {
      background: rgba(255, 235, 59, 0.82);
      border-radius: 3px;
      padding: 0 1px;
    }

    .${ACTIVE_INLINE_MATCH_CLASS} {
      background: rgba(255, 167, 38, 0.88);
      box-shadow: inset 0 0 0 1px rgba(255, 111, 0, 0.98);
      border-radius: 4px;
    }

    .${ACTIVE_MATCH_CLASS} {
      box-shadow:
        inset 0 0 0 1px rgba(255, 111, 0, 0.92),
        0 0 0 1px rgba(255, 167, 38, 0.36);
    }

    @keyframes roamjs-find-in-page-flash {
      0% {
        background-color: rgba(255, 138, 0, 0.95);
      }
      45% {
        background-color: rgba(255, 167, 38, 0.9);
      }
      100% {
        background-color: rgba(255, 167, 38, 0.88);
      }
    }

    .${FLASH_MATCH_CLASS} {
      animation: roamjs-find-in-page-flash 560ms ease-out;
    }
  `;
  document.head.appendChild(styleElement);
};

const getExactSelection = ({
  text,
  query,
}: {
  text: string;
  query: string;
}): { start: number; end: number } | undefined => {
  const normalizedQuery = normalizeQuery({ query });
  if (!normalizedQuery) {
    return undefined;
  }

  const start = text.toLowerCase().indexOf(normalizedQuery);
  if (start < 0) {
    return undefined;
  }

  return { start, end: start + normalizedQuery.length };
};

const unwrapInlineHighlight = ({ element }: { element: HTMLElement }): void => {
  const parent = element.parentNode;
  if (!parent) {
    return;
  }

  parent.replaceChild(
    document.createTextNode(element.textContent ?? ""),
    element,
  );
  parent.normalize();
};

const clearInlineHighlights = (): void => {
  const highlighted = Array.from(
    document.querySelectorAll<HTMLElement>(`.${INLINE_MATCH_CLASS}`),
  );
  highlighted.forEach((element) => unwrapInlineHighlight({ element }));
};

const getActiveInlineElementFromBlock = ({
  blockElement,
}: {
  blockElement: HTMLElement;
}): HTMLElement | null =>
  blockElement.querySelector<HTMLElement>(`.${ACTIVE_INLINE_MATCH_CLASS}`);

const applyInlineHighlightsToBlock = ({
  blockElement,
  query,
  isActive,
}: {
  blockElement: HTMLElement;
  query: string;
  isActive: boolean;
}): HTMLElement | null => {
  const normalizedQuery = normalizeQuery({ query });
  if (!normalizedQuery) {
    return null;
  }

  const blockInputElement =
    blockElement.querySelector<HTMLElement>(".rm-block__input--view") ??
    blockElement.querySelector<HTMLElement>(".rm-block__input");

  if (!blockInputElement || blockInputElement.tagName === "TEXTAREA") {
    return null;
  }

  const textNodes: Text[] = [];
  const walker = document.createTreeWalker(
    blockInputElement,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: (node) => {
        const parentElement = node.parentElement;
        const text = node.textContent ?? "";
        if (!parentElement || !text.trim()) {
          return NodeFilter.FILTER_REJECT;
        }

        if (parentElement.closest(`.${INLINE_MATCH_CLASS}`)) {
          return NodeFilter.FILTER_REJECT;
        }

        return text.toLowerCase().includes(normalizedQuery)
          ? NodeFilter.FILTER_ACCEPT
          : NodeFilter.FILTER_REJECT;
      },
    },
  );

  let currentNode = walker.nextNode();
  while (currentNode) {
    textNodes.push(currentNode as Text);
    currentNode = walker.nextNode();
  }

  let firstInlineMatch: HTMLElement | null = null;

  textNodes.forEach((textNode) => {
    const originalText = textNode.textContent ?? "";
    const normalizedText = originalText.toLowerCase();
    let searchStartIndex = 0;
    let matchIndex = normalizedText.indexOf(normalizedQuery, searchStartIndex);

    if (matchIndex < 0) {
      return;
    }

    const fragment = document.createDocumentFragment();
    while (matchIndex >= 0) {
      const prefix = originalText.slice(searchStartIndex, matchIndex);
      if (prefix) {
        fragment.appendChild(document.createTextNode(prefix));
      }

      const matchedText = originalText.slice(
        matchIndex,
        matchIndex + normalizedQuery.length,
      );
      const span = document.createElement("span");
      span.className = isActive
        ? `${INLINE_MATCH_CLASS} ${ACTIVE_INLINE_MATCH_CLASS}`
        : INLINE_MATCH_CLASS;
      span.textContent = matchedText;
      fragment.appendChild(span);

      if (!firstInlineMatch) {
        firstInlineMatch = span;
      }

      searchStartIndex = matchIndex + normalizedQuery.length;
      matchIndex = normalizedText.indexOf(normalizedQuery, searchStartIndex);
    }

    const suffix = originalText.slice(searchStartIndex);
    if (suffix) {
      fragment.appendChild(document.createTextNode(suffix));
    }

    textNode.parentNode?.replaceChild(fragment, textNode);
  });

  return firstInlineMatch;
};

const coerceChildren = ({ value }: { value: unknown }): RoamBlockNode[] => {
  if (Array.isArray(value)) {
    return value.filter(
      (node): node is RoamBlockNode => !!node && typeof node === "object",
    );
  }

  if (!value) {
    return [];
  }

  if (typeof value === "object" && Symbol.iterator in value) {
    return Array.from(value as Iterable<unknown>).filter(
      (node): node is RoamBlockNode => !!node && typeof node === "object",
    );
  }

  if (typeof value === "object") {
    return Object.values(value as Record<string, unknown>).filter(
      (node): node is RoamBlockNode => !!node && typeof node === "object",
    );
  }

  return [];
};

const flattenTreeToEntries = ({
  rootNode,
}: {
  rootNode: RoamBlockNode | null;
}): BlockSearchEntry[] => {
  if (!rootNode) {
    return [];
  }

  const entries: BlockSearchEntry[] = [];

  const collectNode = ({
    node,
    ancestors,
    isRoot,
  }: {
    node: RoamBlockNode;
    ancestors: string[];
    isRoot: boolean;
  }): void => {
    const nodeUid = node[":block/uid"];
    if (!nodeUid) {
      return;
    }

    const nodeText = node[":block/string"] ?? "";
    if (nodeText.trim()) {
      entries.push({
        uid: nodeUid,
        text: nodeText,
        ancestors,
        order: entries.length,
      });
    }

    const children = coerceChildren({ value: node[":block/children"] });
    const shouldTrackAsAncestor = !isRoot || nodeText.trim().length > 0;
    const nextAncestors = shouldTrackAsAncestor
      ? [...ancestors, nodeUid]
      : ancestors;
    children.forEach((child) =>
      collectNode({
        node: child,
        ancestors: nextAncestors,
        isRoot: false,
      }),
    );
  };

  collectNode({ node: rootNode, ancestors: [], isRoot: true });
  return entries;
};

const getBlockElement = ({ uid }: { uid: string }): HTMLElement | null => {
  const mainContainer =
    document.querySelector<HTMLElement>(".roam-body-main") ?? document.body;
  const blockByUid = mainContainer.querySelector<HTMLElement>(
    `.roam-block-container[data-block-uid="${uid}"], .rm-block[data-block-uid="${uid}"]`,
  );
  if (blockByUid) {
    return blockByUid;
  }

  const dynamicBlockInput = mainContainer.querySelector<HTMLElement>(
    `textarea[id$="-${uid}"], div[id$="-${uid}"]`,
  );
  if (dynamicBlockInput) {
    return (
      dynamicBlockInput.closest<HTMLElement>(".roam-block-container") ??
      dynamicBlockInput.closest<HTMLElement>(".rm-block") ??
      dynamicBlockInput
    );
  }

  const directSelectors = [
    `#block-input-${uid}`,
    `#span-${uid}`,
    `.roam-block-container[data-block-uid="${uid}"]`,
    `.rm-block[data-block-uid="${uid}"]`,
    `.roam-block[data-uid="${uid}"]`,
    `[data-block-uid="${uid}"]`,
    `[data-uid="${uid}"]`,
  ];

  for (const selector of directSelectors) {
    const element = mainContainer.querySelector<HTMLElement>(selector);
    if (!element) {
      continue;
    }

    return (
      element.closest<HTMLElement>(".roam-block-container") ??
      element.closest<HTMLElement>(".rm-block-main") ??
      element
    );
  }

  return null;
};

const createPanelElements = (): PanelElements => {
  const container = document.createElement("div");
  container.id = PANEL_ID;
  container.className = "bp3-card bp3-elevation-2";
  container.setAttribute("role", "dialog");
  container.setAttribute("aria-label", "Find in page");

  const controlsRow = document.createElement("div");
  controlsRow.className = "roamjs-find-in-page-controls";

  const input = document.createElement("input");
  input.type = "text";
  input.className = "bp3-input";
  input.placeholder = "Find in page";
  input.autocomplete = "off";
  input.spellcheck = false;

  const count = document.createElement("span");
  count.className = MATCH_COUNT_CLASS;
  count.textContent = "0/0";

  const previous = document.createElement("button");
  previous.type = "button";
  previous.className = "bp3-button bp3-minimal bp3-icon-arrow-up";
  previous.setAttribute("aria-label", "arrow-up");
  previous.title = "Previous match (ArrowUp)";

  const next = document.createElement("button");
  next.type = "button";
  next.className = "bp3-button bp3-minimal bp3-icon-arrow-down";
  next.setAttribute("aria-label", "arrow-down");
  next.title = "Next match (Enter or ArrowDown)";

  const hintIcon = document.createElement("button");
  hintIcon.type = "button";
  hintIcon.className = `bp3-button bp3-minimal bp3-icon-select ${HINT_ICON_CLASS}`;
  hintIcon.setAttribute("aria-label", HINT_TOOLTIP);
  hintIcon.title = HINT_TOOLTIP;

  const close = document.createElement("button");
  close.type = "button";
  close.className = "bp3-button bp3-minimal bp3-icon-cross";
  close.setAttribute("aria-label", "close");
  close.title = "Close (Esc)";

  controlsRow.append(input, count, previous, next, hintIcon, close);
  container.append(controlsRow);
  document.body.appendChild(container);

  return { container, input, count, previous, next, close };
};

export const createFindInPage = (): FindInPageController => {
  const roamAlphaApi = getRoamAlphaApi();
  const isMacPlatform = /Mac|iPhone|iPad|iPod/.test(navigator.platform);
  let panelElements: PanelElements | null = null;
  let indexedRootUid: string | null = null;
  let indexedBlocks: BlockSearchEntry[] = [];
  let matches: RankedBlockSearchEntry[] = [];
  let currentMatchIndex = -1;
  let isNavigating = false;
  let flashTimeout: ReturnType<typeof setTimeout> | null = null;
  const highlightedElements = new Set<HTMLElement>();
  const expandedAncestors = new Set<string>();

  const clearFlashTimeout = (): void => {
    if (flashTimeout) {
      clearTimeout(flashTimeout);
      flashTimeout = null;
    }
  };

  const clearHighlights = (): void => {
    clearFlashTimeout();
    clearInlineHighlights();
    highlightedElements.forEach((element) => {
      element.classList.remove(
        MATCH_CLASS,
        ACTIVE_MATCH_CLASS,
        FLASH_MATCH_CLASS,
      );
    });
    highlightedElements.clear();
  };

  const flashBlockElement = ({ element }: { element: HTMLElement }): void => {
    element.classList.remove(FLASH_MATCH_CLASS);
    // Restart the animation if navigation happens rapidly.
    void element.offsetWidth;
    element.classList.add(FLASH_MATCH_CLASS);

    clearFlashTimeout();
    flashTimeout = setTimeout(() => {
      element.classList.remove(FLASH_MATCH_CLASS);
      flashTimeout = null;
    }, 700);
  };

  const getCurrentRootUid = async (): Promise<string | null> =>
    roamAlphaApi
      ? Promise.resolve(roamAlphaApi.ui.mainWindow.getOpenPageOrBlockUid())
      : null;

  const refreshMatchCount = (): void => {
    if (!panelElements) {
      return;
    }

    panelElements.count.textContent = matches.length
      ? `${currentMatchIndex + 1}/${matches.length}`
      : "0/0";
  };

  const refreshButtons = (): void => {
    if (!panelElements) {
      return;
    }

    const hasMatches = matches.length > 0;
    panelElements.previous.disabled = !hasMatches;
    panelElements.next.disabled = !hasMatches;
  };

  const refreshHighlights = (): void => {
    clearHighlights();

    if (!panelElements || !matches.length) {
      return;
    }

    const query = panelElements.input.value;
    matches.slice(0, MAX_HIGHLIGHTED_MATCHES).forEach((match, index) => {
      const blockElement = getBlockElement({ uid: match.uid });
      if (!blockElement) {
        return;
      }

      const firstInline = applyInlineHighlightsToBlock({
        blockElement,
        query,
        isActive: index === currentMatchIndex,
      });
      if (!firstInline && index === currentMatchIndex) {
        blockElement.classList.add(ACTIVE_MATCH_CLASS);
        highlightedElements.add(blockElement);
      }
    });
  };

  const refreshSearch = (): void => {
    if (!panelElements) {
      return;
    }

    const query = panelElements.input.value;
    matches = rankEntries({ query, entries: indexedBlocks });
    currentMatchIndex = -1;
    refreshMatchCount();
    refreshButtons();
    refreshHighlights();
  };

  const revealAncestors = async ({
    ancestors,
  }: {
    ancestors: string[];
  }): Promise<void> => {
    if (!roamAlphaApi) {
      return;
    }

    for (const uid of ancestors) {
      if (expandedAncestors.has(uid)) {
        continue;
      }

      try {
        await Promise.resolve(
          roamAlphaApi.updateBlock({
            block: { uid, open: true },
          }),
        );
        expandedAncestors.add(uid);
      } catch {
        // Ignore update failures; block may not support open state.
      }
    }
  };

  const focusMatch = async ({
    match,
    shouldRefreshHighlights,
    shouldFlash,
  }: {
    match: RankedBlockSearchEntry;
    shouldRefreshHighlights?: boolean;
    shouldFlash?: boolean;
  }): Promise<void> => {
    if (!roamAlphaApi) {
      return;
    }

    const shouldRefresh = shouldRefreshHighlights ?? true;
    const shouldFlashTarget = shouldFlash ?? true;

    await revealAncestors({ ancestors: match.ancestors });

    const selection = panelElements
      ? getExactSelection({
          text: match.text,
          query: panelElements.input.value,
        })
      : undefined;

    await Promise.resolve(
      roamAlphaApi.ui.setBlockFocusAndSelection({
        location: {
          "block-uid": match.uid,
          "window-id": "main-window",
        },
        selection,
      }),
    );

    const blockElement = getBlockElement({ uid: match.uid });
    blockElement?.scrollIntoView({ behavior: "smooth", block: "center" });
    if (shouldRefresh) {
      refreshHighlights();
    }
    if (!shouldFlashTarget) {
      return;
    }

    const activeInlineElement = blockElement
      ? getActiveInlineElementFromBlock({ blockElement })
      : null;
    if (activeInlineElement) {
      flashBlockElement({ element: activeInlineElement });
      return;
    }

    if (blockElement) {
      blockElement.classList.add(ACTIVE_MATCH_CLASS);
      highlightedElements.add(blockElement);
      flashBlockElement({ element: blockElement });
    }
  };

  const moveActiveMatch = ({ direction }: { direction: 1 | -1 }): void => {
    if (!matches.length) {
      return;
    }

    currentMatchIndex =
      currentMatchIndex === -1
        ? direction === 1
          ? 0
          : matches.length - 1
        : (currentMatchIndex + direction + matches.length) % matches.length;
    refreshMatchCount();
    refreshHighlights();

    const activeMatch = matches[currentMatchIndex];
    const activeBlockElement = getBlockElement({ uid: activeMatch.uid });
    if (!activeBlockElement) {
      return;
    }

    const activeInlineElement = getActiveInlineElementFromBlock({
      blockElement: activeBlockElement,
    });
    if (activeInlineElement) {
      flashBlockElement({ element: activeInlineElement });
      activeInlineElement.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      return;
    }

    activeBlockElement.classList.add(ACTIVE_MATCH_CLASS);
    highlightedElements.add(activeBlockElement);
    flashBlockElement({ element: activeBlockElement });
    activeBlockElement.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const commitActiveMatch = async (): Promise<void> => {
    if (!matches.length || isNavigating) {
      return;
    }

    if (currentMatchIndex === -1) {
      currentMatchIndex = 0;
      refreshMatchCount();
      refreshHighlights();
    }

    isNavigating = true;
    try {
      await focusMatch({
        match: matches[currentMatchIndex],
        shouldRefreshHighlights: false,
        shouldFlash: false,
      });
      hidePanel();
    } finally {
      isNavigating = false;
    }
  };

  const hidePanel = (): void => {
    if (!panelElements) {
      return;
    }

    panelElements.container.style.display = "none";
    clearHighlights();
  };

  const ensurePanel = (): PanelElements => {
    if (panelElements) {
      return panelElements;
    }

    panelElements = createPanelElements();

    panelElements.input.addEventListener("input", () => {
      refreshSearch();
    });

    panelElements.input.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        hidePanel();
        return;
      }

      if (event.key === "Enter") {
        event.preventDefault();
        if (event.shiftKey) {
          void commitActiveMatch();
          return;
        }

        moveActiveMatch({ direction: 1 });
        return;
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        moveActiveMatch({ direction: -1 });
        return;
      }

      if (event.key === "ArrowDown") {
        event.preventDefault();
        moveActiveMatch({ direction: 1 });
      }
    });

    panelElements.previous.addEventListener("click", () => {
      moveActiveMatch({ direction: -1 });
    });

    panelElements.next.addEventListener("click", () => {
      moveActiveMatch({ direction: 1 });
    });

    panelElements.close.addEventListener("click", () => {
      hidePanel();
    });

    return panelElements;
  };

  const rebuildIndex = async ({
    rootUid,
  }: {
    rootUid: string;
  }): Promise<void> => {
    if (!roamAlphaApi) {
      return;
    }

    const rootNode = roamAlphaApi.data.pull(PULL_PATTERN, [
      ":block/uid",
      rootUid,
    ]);
    indexedBlocks = flattenTreeToEntries({ rootNode });
    logIndexedBlocks({ rootUid, blocks: indexedBlocks });
    indexedRootUid = rootUid;
    matches = [];
    currentMatchIndex = -1;
    expandedAncestors.clear();
  };

  const openFindInPage = async (): Promise<void> => {
    if (!roamAlphaApi) {
      return;
    }

    const rootUid = await getCurrentRootUid();
    if (!rootUid) {
      renderToast({
        id: "find-in-page-no-open-page",
        content: "Find In Page only works in an open page or block view.",
        intent: "warning",
      });
      return;
    }

    ensureStyles();
    const panel = ensurePanel();
    panel.container.style.display = "flex";

    if (indexedRootUid !== rootUid) {
      try {
        await rebuildIndex({ rootUid });
      } catch {
        indexedBlocks = [];
        matches = [];
        currentMatchIndex = -1;
        renderToast({
          id: "find-in-page-query-failure",
          content: "Failed to index this page for Find In Page.",
          intent: "danger",
        });
      }
    }

    refreshSearch();
    panel.input.focus();
    panel.input.select();
  };

  const isPrimaryFindShortcut = ({
    event,
  }: {
    event: KeyboardEvent;
  }): boolean => {
    const key = event.key.toLowerCase();
    if (key !== "f" || event.altKey || event.shiftKey) {
      return false;
    }

    if (isMacPlatform) {
      return event.metaKey;
    }

    return event.ctrlKey;
  };

  const onGlobalKeyDown = (event: KeyboardEvent): void => {
    if (event.defaultPrevented || !isPrimaryFindShortcut({ event })) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    void openFindInPage();
  };

  if (roamAlphaApi) {
    window.addEventListener("keydown", onGlobalKeyDown, true);
    void Promise.resolve(
      roamAlphaApi.ui.commandPalette.addCommand({
        label: COMMAND_LABEL,
        callback: () => openFindInPage(),
        "default-hotkey": "defmod-f",
      }),
    ).catch(() => undefined);
  }

  return {
    unload: (): void => {
      clearHighlights();
      panelElements?.container.remove();
      panelElements = null;
      document.getElementById(STYLE_ID)?.remove();
      window.removeEventListener("keydown", onGlobalKeyDown, true);

      if (roamAlphaApi) {
        void Promise.resolve(
          roamAlphaApi.ui.commandPalette.removeCommand({
            label: COMMAND_LABEL,
          }),
        ).catch(() => undefined);
      }
    },
  };
};
