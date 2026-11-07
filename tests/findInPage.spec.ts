import { expect, test } from "@playwright/test";
import { JSDOM } from "jsdom";
import React from "react";
import type {
  AddCommandOptions,
  OnloadArgs,
  PullBlock,
} from "roamjs-components/types";

import {
  COMMAND_LABEL,
  FIND_IN_PAGE_COMMAND_LABELS,
  FOCUS_CURRENT_MATCH_COMMAND_LABEL,
  NEXT_MATCH_COMMAND_LABEL,
  PREVIOUS_MATCH_COMMAND_LABEL,
  applyInlineHighlightsToBlock,
  createFindInPage,
  flattenTreeToEntries,
  waitForBlockElement,
  type PanelHost,
} from "../src/findInPage";
import {
  FindInPagePanel,
  handleFindInPageKeyDown,
} from "../src/components/FindInPagePanel";

type PanelActions = Parameters<PanelHost["render"]>[1];
type ExtensionApi = OnloadArgs["extensionAPI"];
type RegisteredCommand = AddCommandOptions & {
  "default-hotkey"?: string | string[];
};

const flushPromises = async (): Promise<void> => {
  await new Promise<void>((resolve) => setTimeout(resolve, 0));
};

const createDeferred = <T = void>(): {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (error: Error) => void;
} => {
  let resolve!: (value: T) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
};

const createPanelHost = (): {
  host: PanelHost;
  getActions: () => PanelActions;
  renders: Parameters<PanelHost["render"]>[0][];
  focusCalls: { select?: boolean }[];
  unmountCalls: number[];
} => {
  let actions: PanelActions | null = null;
  const renders: Parameters<PanelHost["render"]>[0][] = [];
  const focusCalls: { select?: boolean }[] = [];
  const unmountCalls: number[] = [];
  return {
    host: {
      render: (state, nextActions): void => {
        renders.push({ ...state });
        actions = nextActions;
      },
      focusInput: (options = {}): void => focusCalls.push(options),
      unmount: (): void => {
        unmountCalls.push(1);
      },
    },
    getActions: () => {
      if (!actions) throw new Error("Panel has not rendered");
      return actions;
    },
    renders,
    focusCalls,
    unmountCalls,
  };
};

const createApi = ({
  pull,
  rootUid = "root",
}: {
  pull: () => PullBlock | null;
  rootUid?: string | null;
}): {
  api: Window["roamAlphaAPI"];
  openedBlocks: string[];
  closedBlocks: string[];
  focusedBlocks: string[];
  pullCalls: number[];
} => {
  const openedBlocks: string[] = [];
  const closedBlocks: string[] = [];
  const focusedBlocks: string[] = [];
  const pullCalls: number[] = [];
  const foldStates = new Map<string, boolean>();
  const findNode = (node: PullBlock | null, uid: string): PullBlock | null => {
    if (!node) return null;
    if (node[":block/uid"] === uid) return node;
    for (const child of node[":block/children"] ?? []) {
      const found = findNode(child, uid);
      if (found) return found;
    }
    return null;
  };
  return {
    api: {
      ui: {
        mainWindow: { getOpenPageOrBlockUid: () => rootUid },
        setBlockFocusAndSelection: ({ location }): void => {
          if (location) focusedBlocks.push(location["block-uid"]);
        },
      },
      data: {
        pull: (pattern, id) => {
          pullCalls.push(1);
          if (pattern.includes(":block/children")) return pull();
          const node = findNode(pull(), Array.isArray(id) ? id[1] : String(id));
          const uid = node?.[":block/uid"];
          return node && uid && foldStates.has(uid)
            ? { ...node, ":block/open": foldStates.get(uid) }
            : node;
        },
        block: {
          update: async ({ block }): Promise<void> => {
            if (!block?.uid || block.open === undefined) return;
            foldStates.set(block.uid, block.open);
            if (block.open) openedBlocks.push(block.uid);
            else closedBlocks.push(block.uid);
          },
        },
      },
    } as unknown as Window["roamAlphaAPI"],
    openedBlocks,
    closedBlocks,
    focusedBlocks,
    pullCalls,
  };
};

const createExtensionApi = (): {
  api: ExtensionApi;
  addedCommands: RegisteredCommand[];
  removedCommands: string[];
} => {
  const addedCommands: RegisteredCommand[] = [];
  const removedCommands: string[] = [];
  return {
    api: {
      ui: {
        commandPalette: {
          addCommand: async (command): Promise<void> => {
            addedCommands.push(command as RegisteredCommand);
          },
          removeCommand: async ({ label }): Promise<void> => {
            removedCommands.push(label);
          },
        },
      },
    } as unknown as ExtensionApi,
    addedCommands,
    removedCommands,
  };
};

const makeControllerDependencies = ({
  api,
  extensionAPI = createExtensionApi().api,
  panelHost,
  getBlockElement = () => null,
  clearHighlights = (): void => undefined,
  scrollToSelection = async (): Promise<void> => undefined,
}: {
  api: Window["roamAlphaAPI"];
  extensionAPI?: ExtensionApi;
  panelHost: PanelHost;
  getBlockElement?: () => HTMLElement | null;
  clearHighlights?: () => void;
  scrollToSelection?: (args: {
    uid: string;
    signal: AbortSignal;
    selection?: { start: number; end: number };
  }) => Promise<void>;
}) => ({
  extensionAPI,
  roamApi: api,
  panelHost,
  getBlockElement,
  ensureStyles: (): void => undefined,
  removeStyles: (): void => undefined,
  renderHighlights: (): void => undefined,
  clearHighlights,
  scrollToBlock: (): void => undefined,
  scrollToSelection,
  afterHostRender: async (): Promise<void> => undefined,
  observeContentChanges: (): (() => void) => () => undefined,
  delay: async (): Promise<void> => undefined,
});

test("flattenTreeToEntries preserves tree order and deep ancestors", () => {
  const entries = flattenTreeToEntries({
    rootNode: {
      ":block/uid": "page",
      ":block/children": [
        {
          ":block/uid": "parent",
          ":block/string": "Parent",
          ":block/children": [
            {
              ":block/uid": "child",
              ":block/string": "Deep result",
            },
          ],
        },
        { ":block/uid": "sibling", ":block/string": "Sibling" },
      ],
    },
  });

  expect(entries.map(({ uid }) => uid)).toEqual(["parent", "child", "sibling"]);
  expect(entries[1]).toMatchObject({
    ancestors: ["parent"],
    order: 1,
  });
});

test("registers commands through the extension API and unloads safely", async () => {
  const panel = createPanelHost();
  const fakeApi = createApi({ pull: () => null });
  const extension = createExtensionApi();

  const controller = await createFindInPage({
    ...makeControllerDependencies({
      api: fakeApi.api,
      extensionAPI: extension.api,
      panelHost: panel.host,
    }),
  });

  expect(extension.addedCommands.map(({ label }) => label)).toEqual(
    FIND_IN_PAGE_COMMAND_LABELS,
  );
  expect(extension.addedCommands[0]["default-hotkey"]).toBe("defmod-f");
  expect(controller.getState().isInitialized).toBe(true);

  controller.unload();
  controller.unload();
  expect(panel.unmountCalls).toHaveLength(1);
  expect(controller.getState().isInitialized).toBe(false);
  expect(extension.removedCommands).toEqual([]);
});

test("uses the Roam API supplied after runExtension starts", async () => {
  const panel = createPanelHost();
  const fakeApi = createApi({ pull: () => null });
  const controller = await createFindInPage(
    makeControllerDependencies({ api: fakeApi.api, panelHost: panel.host }),
  );

  controller.unload();
  expect(panel.unmountCalls).toHaveLength(1);
});

test("opening always rebuilds the index and reflects edits and deletes", async () => {
  const panel = createPanelHost();
  let tree: PullBlock = {
    ":block/uid": "root",
    ":block/children": [
      { ":block/uid": "one", ":block/string": "Original result" },
    ],
  };
  const fakeApi = createApi({ pull: () => tree });
  const controller = await createFindInPage(
    makeControllerDependencies({
      api: fakeApi.api,
      panelHost: panel.host,
    }),
  );

  await controller.open();
  panel.getActions().onQueryChange("result");
  expect(controller.getState().matches.map(({ uid }) => uid)).toEqual(["one"]);

  tree = {
    ":block/uid": "root",
    ":block/children": [
      { ":block/uid": "two", ":block/string": "Edited fresh result" },
    ],
  };
  panel.getActions().onClose();
  await controller.open();

  expect(fakeApi.pullCalls).toHaveLength(2);
  expect(controller.getState().indexedBlocks.map(({ uid }) => uid)).toEqual([
    "two",
  ]);
  expect(controller.getState().matches.map(({ uid }) => uid)).toEqual(["two"]);
});

for (const source of ["rendered block", "block editor"] as const) {
  test(`Open searches selected text in a ${source} and retains it with no selection`, async () => {
    const dom = new JSDOM(`
      <div class="roam-block-container">
        <span id="rendered">Before  selected phrase  after</span>
        <textarea>Before  selected phrase  after</textarea>
      </div>
      <div id="roamjs-find-in-page-root"><input value="selected phrase"></div>
    `);
    const { document } = dom.window;
    const previousDocument = global.document;
    global.document = document;
    try {
      const panel = createPanelHost();
      const extension = createExtensionApi();
      const fakeApi = createApi({
        pull: () => ({
          ":block/uid": "root",
          ":block/children": [
            { ":block/uid": "old", ":block/string": "Previous query" },
            { ":block/uid": "new", ":block/string": "The selected phrase" },
          ],
        }),
      });
      const controller = await createFindInPage(
        makeControllerDependencies({
          api: fakeApi.api,
          extensionAPI: extension.api,
          panelHost: panel.host,
        }),
      );
      const openCommand = extension.addedCommands[0].callback;
      await controller.open();
      panel.getActions().onQueryChange("Previous query");
      panel.getActions().onClose();

      const editor = document.querySelector("textarea")!;
      const selection = document.getSelection()!;
      if (source === "block editor") {
        editor.focus();
        editor.setSelectionRange(6, 25);
      } else {
        const text = document.querySelector("#rendered")!.firstChild!;
        selection.setBaseAndExtent(text, 6, text, 25);
      }
      openCommand();
      await flushPromises();

      expect(panel.renders.at(-1)).toMatchObject({
        query: "selected phrase",
        matchCount: 1,
        currentMatch: -1,
      });
      expect(controller.getState().matches.map(({ uid }) => uid)).toEqual([
        "new",
      ]);
      expect(panel.focusCalls.at(-1)).toEqual({ select: true });

      selection.removeAllRanges();
      editor.focus();
      editor.setSelectionRange(6, 8);
      await controller.open();
      expect(controller.getState().query).toBe("selected phrase");

      editor.setSelectionRange(8, 8);
      panel.getActions().onClose();
      await controller.open();
      expect(controller.getState().query).toBe("selected phrase");

      const queryInput = document.querySelector("input")!;
      queryInput.focus();
      queryInput.setSelectionRange(0, 8);
      await controller.open();
      expect(controller.getState().query).toBe("selected phrase");
      controller.unload();
    } finally {
      global.document = previousDocument;
      dom.window.close();
    }
  });
}

for (const outcome of ["render", "close", "unload", "query"] as const) {
  test(`Open repaints the retained occurrence after the editor blurs: ${outcome}`, async () => {
    const panel = createPanelHost();
    const extension = createExtensionApi();
    const dom = new JSDOM(
      '<div class="roam-block-container"><div class="rm-block__input--view">Target then target</div></div>',
    );
    const element = dom.window.document.querySelector(
      ".roam-block-container",
    ) as HTMLElement;
    const resumeHostRender = createDeferred();
    let reopening = false;
    let exitedEditor = false;
    const painted: { view: Element | null; index: number }[] = [];
    const fakeApi = createApi({
      pull: () => ({
        ":block/uid": "root",
        ":block/children": [
          { ":block/uid": "repeated", ":block/string": "Target then target" },
        ],
      }),
    });
    fakeApi.api.ui.setBlockFocusAndSelection = (): void => {
      element.innerHTML = "<textarea>Target then target</textarea>";
      element
        .querySelector("textarea")
        ?.addEventListener("keydown", (event) => {
          if (event.key === "Escape") exitedEditor = true;
        });
    };
    const controller = await createFindInPage({
      ...makeControllerDependencies({
        api: fakeApi.api,
        extensionAPI: extension.api,
        panelHost: panel.host,
        getBlockElement: () => element,
      }),
      renderHighlights: ({ currentMatchIndex }): void => {
        painted.push({
          view: element.querySelector(".rm-block__input--view"),
          index: currentMatchIndex,
        });
      },
      afterHostRender: async (): Promise<void> => {
        if (!reopening) return;
        await resumeHostRender.promise;
        if (exitedEditor)
          element.innerHTML =
            '<div class="rm-block__input--view">Target then target</div>';
      },
    });
    await controller.open();
    panel.getActions().onQueryChange("target");
    panel.getActions().onPrevious();
    await flushPromises();
    panel.getActions().onFocusCurrent();
    await flushPromises();
    expect(element.querySelector("textarea")).not.toBeNull();
    reopening = true;
    const opening = controller.open();
    // Let the simulated Roam blur finish even if Open never waits for it.
    await flushPromises();
    if (outcome === "close") panel.getActions().onClose();
    if (outcome === "unload") controller.unload();
    if (outcome === "query") panel.getActions().onQueryChange("then");
    painted.length = 0;
    resumeHostRender.resolve();
    await opening;
    expect(painted).toEqual(
      outcome === "render"
        ? [{ view: element.querySelector(".rm-block__input--view"), index: 1 }]
        : [],
    );
    if (outcome === "render") {
      expect(exitedEditor).toBe(true);
      expect(painted[0].view).not.toBeNull();
      expect(controller.getState().currentMatchIndex).toBe(1);
      expect(panel.focusCalls.at(-1)).toEqual({ select: true });
    }
    controller.unload();
  });
}

for (const occurrenceIndex of [0, 1]) {
  test(`Open preserves occurrence ${occurrenceIndex + 1} after focusing it for editing`, async () => {
    const panel = createPanelHost();
    const element = new JSDOM("<div></div>").window.document.querySelector(
      "div",
    ) as HTMLElement;
    const fakeApi = createApi({
      pull: () => ({
        ":block/uid": "root",
        ":block/children": [
          { ":block/uid": "repeated", ":block/string": "target then target" },
        ],
      }),
    });
    const extension = createExtensionApi();
    const controller = await createFindInPage(
      makeControllerDependencies({
        api: fakeApi.api,
        extensionAPI: extension.api,
        panelHost: panel.host,
        getBlockElement: () => element,
      }),
    );
    await controller.open();
    panel.getActions().onQueryChange("target");
    for (let index = 0; index <= occurrenceIndex; index += 1)
      panel.getActions().onNext();
    await flushPromises();
    panel.getActions().onFocusCurrent();
    await flushPromises();
    const selected = controller.getState().matches[occurrenceIndex];
    extension.addedCommands
      .find(({ label }) => label === COMMAND_LABEL)
      ?.callback();
    await flushPromises();
    expect(controller.getState().currentMatchIndex).toBe(occurrenceIndex);
    expect(controller.getState().matches[occurrenceIndex]).toEqual(selected);
    expect(panel.renders.at(-1)).toMatchObject({
      currentMatch: occurrenceIndex,
      matchCount: 2,
    });
    expect(panel.focusCalls.at(-1)).toEqual({ select: true });
    expect(fakeApi.pullCalls).toHaveLength(2);
    expect(fakeApi.focusedBlocks).toEqual(["repeated"]);
    controller.unload();
  });
}

test("Open follows the selected occurrence when earlier results change, and clears a deleted result", async () => {
  const panel = createPanelHost();
  const element = new JSDOM("<div></div>").window.document.querySelector(
    "div",
  ) as HTMLElement;
  let children: PullBlock[] = [
    { ":block/uid": "selected", ":block/string": "target then target" },
  ];
  const fakeApi = createApi({
    pull: () => ({ ":block/uid": "root", ":block/children": children }),
  });
  const controller = await createFindInPage(
    makeControllerDependencies({
      api: fakeApi.api,
      panelHost: panel.host,
      getBlockElement: () => element,
    }),
  );
  await controller.open();
  panel.getActions().onQueryChange("target");
  panel.getActions().onNext();
  panel.getActions().onNext();
  await flushPromises();
  children = [
    { ":block/uid": "inserted", ":block/string": "target" },
    ...children,
  ];
  await controller.open();
  const state = controller.getState();
  expect(state.currentMatchIndex).toBe(2);
  expect(state.matches[state.currentMatchIndex]).toMatchObject({
    uid: "selected",
    start: 12,
    end: 18,
  });
  children = [{ ":block/uid": "inserted", ":block/string": "target" }];
  await controller.open();
  expect(controller.getState().currentMatchIndex).toBe(-1);
  expect(controller.getState().matches).toHaveLength(1);
  controller.unload();
});

test("Open clears the selected occurrence when the page or zoomed root changes", async () => {
  const panel = createPanelHost();
  const element = new JSDOM("<div></div>").window.document.querySelector(
    "div",
  ) as HTMLElement;
  const fakeApi = createApi({
    pull: () => ({
      ":block/uid": "root",
      ":block/children": [
        { ":block/uid": "selected", ":block/string": "target" },
      ],
    }),
  });
  let openRoot = "root";
  fakeApi.api.ui.mainWindow.getOpenPageOrBlockUid = async () => openRoot;
  const controller = await createFindInPage(
    makeControllerDependencies({
      api: fakeApi.api,
      panelHost: panel.host,
      getBlockElement: () => element,
    }),
  );
  await controller.open();
  panel.getActions().onQueryChange("target");
  panel.getActions().onNext();
  await flushPromises();
  openRoot = "different-root";
  await controller.open();
  expect(controller.getState().currentMatchIndex).toBe(-1);
  expect(controller.getState().matches).toHaveLength(1);
  controller.unload();
});

test("content changes repaint current results and observers clean up across close, reopen, and unload", async () => {
  const panel = createPanelHost();
  const element = new JSDOM("<div></div>").window.document.querySelector(
    "div",
  ) as HTMLElement;
  const fakeApi = createApi({
    pull: () => ({
      ":block/uid": "root",
      ":block/children": [
        { ":block/uid": "repeated", ":block/string": "Target then target" },
        { ":block/uid": "fresh", ":block/string": "Fresh phrase" },
      ],
    }),
  });
  const subscriptions: { onChange: () => void; stopped: boolean }[] = [];
  const activeObservers = new Set<() => void>();
  const repaints: { query: string; currentMatchIndex: number; uid?: string }[] =
    [];
  let scrollCalls = 0;
  const controller = await createFindInPage({
    ...makeControllerDependencies({
      api: fakeApi.api,
      panelHost: panel.host,
      getBlockElement: () => element,
    }),
    observeContentChanges: (onChange): (() => void) => {
      const subscription = { onChange, stopped: false };
      subscriptions.push(subscription);
      activeObservers.add(onChange);
      return (): void => {
        subscription.stopped = true;
        activeObservers.delete(onChange);
      };
    },
    renderHighlights: ({ matches, query, currentMatchIndex }): void => {
      repaints.push({
        query,
        currentMatchIndex,
        uid: matches[currentMatchIndex]?.uid,
      });
    },
    scrollToBlock: (): void => {
      scrollCalls += 1;
    },
  });
  expect(subscriptions).toEqual([]);

  await controller.open();
  panel.getActions().onQueryChange("target");
  panel.getActions().onNext();
  panel.getActions().onNext();
  await flushPromises();
  repaints.length = 0;
  const focusCallsBeforeChange = panel.focusCalls.length;
  const scrollCallsBeforeChange = scrollCalls;
  subscriptions[0].onChange();
  expect(repaints).toEqual([
    { query: "target", currentMatchIndex: 1, uid: "repeated" },
  ]);
  expect(panel.focusCalls).toHaveLength(focusCallsBeforeChange);
  expect(scrollCalls).toBe(scrollCallsBeforeChange);

  panel.getActions().onQueryChange("fresh");
  panel.getActions().onNext();
  await flushPromises();
  repaints.length = 0;
  subscriptions[0].onChange();
  expect(repaints).toEqual([
    { query: "fresh", currentMatchIndex: 0, uid: "fresh" },
  ]);

  await controller.open();
  expect(subscriptions).toHaveLength(2);
  expect(subscriptions[0].stopped).toBe(true);
  expect(activeObservers.size).toBe(1);
  panel.getActions().onNext();
  await flushPromises();
  repaints.length = 0;
  activeObservers.forEach((onChange) => onChange());
  expect(repaints).toEqual([
    { query: "fresh", currentMatchIndex: 0, uid: "fresh" },
  ]);

  panel.getActions().onClose();
  expect(subscriptions[1].stopped).toBe(true);
  expect(activeObservers.size).toBe(0);
  repaints.length = 0;
  subscriptions[1].onChange();
  expect(repaints).toEqual([]);

  await controller.open();
  expect(subscriptions).toHaveLength(3);
  expect(activeObservers.size).toBe(1);
  repaints.length = 0;
  activeObservers.forEach((onChange) => onChange());
  expect(repaints).toHaveLength(1);

  controller.unload();
  expect(activeObservers.size).toBe(0);
  expect(subscriptions.every(({ stopped }) => stopped)).toBe(true);
  repaints.length = 0;
  subscriptions.forEach(({ onChange }) => onChange());
  expect(repaints).toEqual([]);
  controller.unload();
});

test("panel navigation previews folded matches and focuses only on request", async () => {
  const panel = createPanelHost();
  const dom = new JSDOM('<div class="roam-block-container"></div>');
  const element = dom.window.document.querySelector(
    "div",
  ) as unknown as HTMLElement;
  const fakeApi = createApi({
    pull: () => ({
      ":block/uid": "root",
      ":block/children": [
        {
          ":block/uid": "a",
          ":block/string": "Ancestor",
          ":block/open": false,
          ":block/children": [
            {
              ":block/uid": "b",
              ":block/string": "Nested",
              ":block/open": false,
              ":block/children": [
                { ":block/uid": "match", ":block/string": "Target phrase" },
              ],
            },
          ],
        },
      ],
    }),
  });
  let clearCount = 0;
  const controller = await createFindInPage(
    makeControllerDependencies({
      api: fakeApi.api,
      panelHost: panel.host,
      getBlockElement: () => element,
      clearHighlights: () => {
        clearCount += 1;
      },
    }),
  );

  await controller.open();
  panel.getActions().onQueryChange("target");
  panel.getActions().onNext();
  await flushPromises();
  panel.getActions().onFocusCurrent();
  await flushPromises();

  expect(controller.getState().currentMatchIndex).toBe(0);
  expect(fakeApi.openedBlocks).toEqual(["a", "b"]);
  expect(fakeApi.focusedBlocks).toEqual(["match"]);
  expect(panel.focusCalls.at(-1)).toEqual({});
  expect(controller.getState().isOpen).toBe(true);

  panel.getActions().onClose();
  expect(controller.getState().isOpen).toBe(false);
  expect(clearCount).toBeGreaterThan(0);
});

test("global Next/Previous preview each occurrence and edit only through Focus Current Match", async () => {
  const panel = createPanelHost();
  const fakeApi = createApi({
    pull: () => ({
      ":block/uid": "root",
      ":block/children": [
        {
          ":block/uid": "first",
          ":block/string": "Target one and target again",
        },
        { ":block/uid": "second", ":block/string": "Target two" },
      ],
    }),
  });
  const extension = createExtensionApi();
  const element = new JSDOM("<div></div>").window.document.querySelector(
    "div",
  ) as HTMLElement;
  const highlightedIndices: number[] = [];
  const controller = await createFindInPage({
    ...makeControllerDependencies({
      api: fakeApi.api,
      extensionAPI: extension.api,
      panelHost: panel.host,
      getBlockElement: () => element,
    }),
    renderHighlights: ({ currentMatchIndex }): void => {
      highlightedIndices.push(currentMatchIndex);
    },
  });
  const commands = new Map(
    extension.addedCommands.map((command) => [command.label, command.callback]),
  );

  commands.get(COMMAND_LABEL)?.();
  await flushPromises();
  panel.getActions().onQueryChange("target");
  commands.get(NEXT_MATCH_COMMAND_LABEL)?.();
  await flushPromises();

  expect(controller.getState().isOpen).toBe(true);
  expect(controller.getState().currentMatchIndex).toBe(0);
  expect(fakeApi.focusedBlocks).toEqual([]);
  expect(highlightedIndices.at(-1)).toBe(0);

  commands.get(NEXT_MATCH_COMMAND_LABEL)?.();
  await flushPromises();
  expect(controller.getState().currentMatchIndex).toBe(1);
  expect(fakeApi.focusedBlocks).toEqual([]);
  expect(highlightedIndices.at(-1)).toBe(1);

  commands.get(NEXT_MATCH_COMMAND_LABEL)?.();
  await flushPromises();
  expect(controller.getState().currentMatchIndex).toBe(2);
  expect(fakeApi.focusedBlocks).toEqual([]);

  commands.get(PREVIOUS_MATCH_COMMAND_LABEL)?.();
  await flushPromises();
  expect(controller.getState().currentMatchIndex).toBe(1);
  expect(fakeApi.focusedBlocks).toEqual([]);
  expect(highlightedIndices.at(-1)).toBe(1);
  expect(panel.focusCalls).toHaveLength(5);

  commands.get(FOCUS_CURRENT_MATCH_COMMAND_LABEL)?.();
  await flushPromises();
  expect(fakeApi.focusedBlocks).toEqual(["first"]);
  expect(fakeApi.pullCalls).toHaveLength(1);
  controller.unload();
});

test("navigation visits repeated occurrences and focuses their exact selection ranges", async () => {
  const panel = createPanelHost();
  const dom = new JSDOM('<div class="roam-block-container"></div>');
  const element = dom.window.document.querySelector("div") as HTMLElement;
  const fakeApi = createApi({
    pull: () => ({
      ":block/uid": "root",
      ":block/children": [
        {
          ":block/uid": "repeated",
          ":block/string": "Target one target two TARGET",
        },
        { ":block/uid": "following", ":block/string": "Target after" },
      ],
    }),
  });
  const focusRequests: Parameters<
    Window["roamAlphaAPI"]["ui"]["setBlockFocusAndSelection"]
  >[0][] = [];
  fakeApi.api.ui.setBlockFocusAndSelection = (request): void => {
    focusRequests.push(request);
  };
  const controller = await createFindInPage(
    makeControllerDependencies({
      api: fakeApi.api,
      panelHost: panel.host,
      getBlockElement: () => element,
    }),
  );
  const getActiveOccurrence = (): {
    uid: string;
    start: number;
    end: number;
  } => {
    const { matches, currentMatchIndex } = controller.getState();
    const { uid, start, end } = matches[currentMatchIndex];
    return { uid, start, end };
  };

  await controller.open();
  panel.getActions().onQueryChange("target");
  expect(panel.renders.at(-1)?.matchCount).toBe(4);

  panel.getActions().onNext();
  await flushPromises();
  expect(getActiveOccurrence()).toEqual({ uid: "repeated", start: 0, end: 6 });
  expect(focusRequests).toEqual([]);

  panel.getActions().onNext();
  await flushPromises();
  expect(getActiveOccurrence()).toEqual({
    uid: "repeated",
    start: 11,
    end: 17,
  });
  panel.getActions().onFocusCurrent();
  await flushPromises();
  expect(focusRequests.at(-1)).toEqual({
    location: { "block-uid": "repeated", "window-id": "main-window" },
    selection: { start: 11, end: 17 },
  });

  panel.getActions().onNext();
  await flushPromises();
  expect(getActiveOccurrence()).toEqual({
    uid: "repeated",
    start: 22,
    end: 28,
  });
  panel.getActions().onFocusCurrent();
  await flushPromises();
  expect(focusRequests.at(-1)).toEqual({
    location: { "block-uid": "repeated", "window-id": "main-window" },
    selection: { start: 22, end: 28 },
  });

  panel.getActions().onNext();
  await flushPromises();
  expect(getActiveOccurrence()).toEqual({ uid: "following", start: 0, end: 6 });

  panel.getActions().onNext();
  await flushPromises();
  expect(getActiveOccurrence()).toEqual({ uid: "repeated", start: 0, end: 6 });

  panel.getActions().onPrevious();
  await flushPromises();
  expect(getActiveOccurrence()).toEqual({ uid: "following", start: 0, end: 6 });

  panel.getActions().onPrevious();
  await flushPromises();
  expect(getActiveOccurrence()).toEqual({
    uid: "repeated",
    start: 22,
    end: 28,
  });

  panel.getActions().onPrevious();
  await flushPromises();
  expect(getActiveOccurrence()).toEqual({
    uid: "repeated",
    start: 11,
    end: 17,
  });
  expect(focusRequests).toHaveLength(2);
  controller.unload();
});

test("rapid navigation supersedes a slow match while retaining the requested occurrence index", async () => {
  const panel = createPanelHost();
  const waitingForOldMatch = createDeferred();
  const resumeOldMatch = createDeferred();
  const dom = new JSDOM('<div id="old"></div><div id="fresh"></div>');
  const oldElement = dom.window.document.getElementById("old") as HTMLElement;
  const freshElement = dom.window.document.getElementById(
    "fresh",
  ) as HTMLElement;
  const scrolledElements: HTMLElement[] = [];
  const highlightedIndices: number[] = [];
  let oldMatchIsRendered = false;
  const fakeApi = createApi({
    pull: () => ({
      ":block/uid": "root",
      ":block/children": [
        { ":block/uid": "old", ":block/string": "Target pending" },
        { ":block/uid": "fresh", ":block/string": "Target then target" },
      ],
    }),
  });
  const controller = await createFindInPage({
    ...makeControllerDependencies({ api: fakeApi.api, panelHost: panel.host }),
    getBlockElement: (uid): HTMLElement | null =>
      uid === "fresh" ? freshElement : oldMatchIsRendered ? oldElement : null,
    renderHighlights: ({ currentMatchIndex }): void => {
      highlightedIndices.push(currentMatchIndex);
    },
    scrollToBlock: (element): void => {
      scrolledElements.push(element);
    },
    delay: (milliseconds): Promise<void> => {
      if (milliseconds === 0) return Promise.resolve();
      waitingForOldMatch.resolve();
      return resumeOldMatch.promise;
    },
  });

  await controller.open();
  panel.getActions().onQueryChange("target");
  highlightedIndices.length = 0;
  panel.getActions().onFocusCurrent();
  await waitingForOldMatch.promise;

  panel.getActions().onNext();
  panel.getActions().onNext();
  panel.getActions().onPrevious();
  panel.getActions().onFocusCurrent();
  await flushPromises();

  const state = controller.getState();
  expect(state.currentMatchIndex).toBe(1);
  expect(state.matches[state.currentMatchIndex]).toMatchObject({
    uid: "fresh",
    occurrenceIndex: 0,
  });
  expect(fakeApi.focusedBlocks).toEqual(["fresh"]);
  expect(scrolledElements).toEqual([freshElement]);
  expect(highlightedIndices.length).toBeGreaterThan(0);
  expect(highlightedIndices.every((index) => index === 1)).toBe(true);
  const highlightsBeforeOldMatchResumes = [...highlightedIndices];

  oldMatchIsRendered = true;
  resumeOldMatch.resolve();
  await flushPromises();

  expect(fakeApi.focusedBlocks).toEqual(["fresh"]);
  expect(scrolledElements).toEqual([freshElement]);
  expect(highlightedIndices).toEqual(highlightsBeforeOldMatchResumes);
  controller.unload();
});

test("focus scrolls the rendered occurrence before editing without recentering a tall textarea", async () => {
  const panel = createPanelHost();
  const text = `Target ${"long paragraph ".repeat(500)}Target`;
  const dom = new JSDOM(
    '<div class="roam-block-container"><div class="rm-block__input--view"></div></div>',
  );
  const element = dom.window.document.querySelector(
    ".roam-block-container",
  ) as HTMLElement;
  element.querySelector(".rm-block__input--view")!.textContent = text;
  const fakeApi = createApi({
    pull: () => ({
      ":block/uid": "root",
      ":block/children": [{ ":block/uid": "long", ":block/string": text }],
    }),
  });
  const focusRequests: Parameters<
    Window["roamAlphaAPI"]["ui"]["setBlockFocusAndSelection"]
  >[0][] = [];
  const scrollsWhileEditing: boolean[] = [];
  fakeApi.api.ui.setBlockFocusAndSelection = (request): void => {
    focusRequests.push(request);
    if (!element.querySelector("textarea")) {
      const textarea = dom.window.document.createElement("textarea");
      textarea.className = "rm-block__input";
      textarea.value = text;
      textarea.style.height = "4000px";
      element.replaceChildren(textarea);
    }
  };
  const controller = await createFindInPage({
    ...makeControllerDependencies({
      api: fakeApi.api,
      panelHost: panel.host,
      getBlockElement: () => element,
    }),
    scrollToBlock: (block): void => {
      scrollsWhileEditing.push(!!block.querySelector("textarea"));
    },
  });

  await controller.open();
  panel.getActions().onQueryChange("target");
  panel.getActions().onFocusCurrent();
  await flushPromises();

  expect(scrollsWhileEditing).toEqual([false]);
  expect(focusRequests[0].selection).toEqual({ start: 0, end: 6 });

  panel.getActions().onNext();
  panel.getActions().onFocusCurrent();
  await flushPromises();

  expect(focusRequests.at(-1)?.selection).toEqual({
    start: text.length - 6,
    end: text.length,
  });
  expect(scrollsWhileEditing).toEqual([false]);
  controller.unload();
});

test("selection scrolling waits for Roam to focus the requested occurrence", async () => {
  const panel = createPanelHost();
  const focusStarted = createDeferred();
  const resumeFocus = createDeferred();
  const element = new JSDOM("<div></div>").window.document.querySelector(
    "div",
  ) as HTMLElement;
  const fakeApi = createApi({
    pull: () => ({
      ":block/uid": "root",
      ":block/children": [
        { ":block/uid": "repeated", ":block/string": "Target then target" },
        { ":block/uid": "following", ":block/string": "Target after" },
      ],
    }),
  });
  const focusRequests: Parameters<
    Window["roamAlphaAPI"]["ui"]["setBlockFocusAndSelection"]
  >[0][] = [];
  let focusCompleted = false;
  fakeApi.api.ui.setBlockFocusAndSelection = async (request): Promise<void> => {
    focusCompleted = false;
    focusRequests.push(request);
    focusStarted.resolve();
    await resumeFocus.promise;
    focusCompleted = true;
  };
  const selectionScrolls: {
    uid: string;
    signal: AbortSignal;
    afterFocus: boolean;
  }[] = [];
  const controller = await createFindInPage(
    makeControllerDependencies({
      api: fakeApi.api,
      panelHost: panel.host,
      getBlockElement: () => element,
      scrollToSelection: async ({ uid, signal }): Promise<void> => {
        selectionScrolls.push({ uid, signal, afterFocus: focusCompleted });
      },
    }),
  );

  await controller.open();
  panel.getActions().onQueryChange("target");
  panel.getActions().onNext();
  panel.getActions().onNext();
  panel.getActions().onFocusCurrent();
  await focusStarted.promise;

  expect(focusRequests).toEqual([
    {
      location: { "block-uid": "repeated", "window-id": "main-window" },
      selection: { start: 12, end: 18 },
    },
  ]);
  expect(selectionScrolls).toEqual([]);
  resumeFocus.resolve();
  await flushPromises();

  expect(selectionScrolls).toHaveLength(1);
  expect(selectionScrolls[0]).toMatchObject({
    uid: "repeated",
    afterFocus: true,
  });
  expect(selectionScrolls[0].signal.aborted).toBe(false);

  panel.getActions().onNext();
  panel.getActions().onFocusCurrent();
  await flushPromises();

  expect(focusRequests.at(-1)).toEqual({
    location: { "block-uid": "following", "window-id": "main-window" },
    selection: { start: 0, end: 6 },
  });
  expect(
    selectionScrolls.map(({ uid, afterFocus }) => ({ uid, afterFocus })),
  ).toEqual([
    { uid: "repeated", afterFocus: true },
    { uid: "following", afterFocus: true },
  ]);
  expect(selectionScrolls[1].signal.aborted).toBe(false);
  controller.unload();
});

for (const invalidation of ["close", "unload", "query"] as const) {
  test(`${invalidation} suppresses selection scrolling after a pending focus resolves`, async () => {
    const panel = createPanelHost();
    const focusStarted = createDeferred();
    const resumeFocus = createDeferred();
    const element = new JSDOM("<div></div>").window.document.querySelector(
      "div",
    ) as HTMLElement;
    const fakeApi = createApi({
      pull: () => ({ ":block/uid": "target", ":block/string": "Target" }),
    });
    fakeApi.api.ui.setBlockFocusAndSelection = (): Promise<void> => {
      focusStarted.resolve();
      return resumeFocus.promise;
    };
    const selectionScrolls: string[] = [];
    const controller = await createFindInPage(
      makeControllerDependencies({
        api: fakeApi.api,
        panelHost: panel.host,
        getBlockElement: () => element,
        scrollToSelection: async ({ uid }): Promise<void> => {
          selectionScrolls.push(uid);
        },
      }),
    );

    await controller.open();
    panel.getActions().onQueryChange("target");
    panel.getActions().onFocusCurrent();
    await focusStarted.promise;
    if (invalidation === "close") panel.getActions().onClose();
    if (invalidation === "unload") controller.unload();
    if (invalidation === "query") panel.getActions().onQueryChange("different");
    resumeFocus.resolve();
    await flushPromises();

    expect(selectionScrolls).toEqual([]);
    controller.unload();
  });
}

for (const outcome of ["complete", "close", "unload", "query"] as const) {
  test(`preview positions a retained textarea selection without taking input focus: ${outcome}`, async () => {
    const panel = createPanelHost();
    const positioningSelection = createDeferred();
    const resumeSelection = createDeferred();
    const dom = new JSDOM(
      '<input id="query" /><div class="roam-block-container"><div class="rm-block__input--view">Target then target</div></div>',
    );
    const element = dom.window.document.querySelector(
      ".roam-block-container",
    ) as HTMLElement;
    const queryInput = dom.window.document.getElementById(
      "query",
    ) as HTMLInputElement;
    const fakeApi = createApi({
      pull: () => ({
        ":block/uid": "root",
        ":block/children": [
          { ":block/uid": "repeated", ":block/string": "Target then target" },
        ],
      }),
    });
    fakeApi.api.ui.setBlockFocusAndSelection = ({ selection }): void => {
      const textarea = dom.window.document.createElement("textarea");
      textarea.className = "rm-block__input";
      textarea.value = "Target then target";
      element.replaceChildren(textarea);
      textarea.focus();
      textarea.setSelectionRange(selection?.start ?? 0, selection?.end ?? 0);
    };
    const highlighted: { element: HTMLElement; currentMatchIndex: number }[] =
      [];
    const scrolled: HTMLElement[] = [];
    const selectionRequests: {
      uid: string;
      signal: AbortSignal;
      selection: { start: number; end: number };
    }[] = [];
    const positionedSelections: { start: number; end: number }[] = [];
    const controller = await createFindInPage({
      ...makeControllerDependencies({
        api: fakeApi.api,
        panelHost: {
          ...panel.host,
          focusInput: (options): void => {
            panel.host.focusInput(options);
            queryInput.focus();
          },
        },
        getBlockElement: () => element,
        scrollToSelection: async ({
          uid,
          signal,
          selection,
        }): Promise<void> => {
          if (!selection) return;
          selectionRequests.push({ uid, signal, selection });
          positioningSelection.resolve();
          await resumeSelection.promise;
          if (signal.aborted) return;
          element
            .querySelector("textarea")!
            .setSelectionRange(selection.start, selection.end);
          positionedSelections.push(selection);
        },
      }),
      renderHighlights: ({ currentMatchIndex }): void => {
        highlighted.push({ element, currentMatchIndex });
      },
      scrollToBlock: (block): void => {
        scrolled.push(block);
      },
    });

    await controller.open();
    panel.getActions().onQueryChange("target");
    panel.getActions().onFocusCurrent();
    await flushPromises();
    expect(element.querySelector("textarea")).not.toBeNull();
    highlighted.length = 0;
    scrolled.length = 0;
    const focusCallsBeforePreview = panel.focusCalls.length;

    panel.getActions().onNext();
    await positioningSelection.promise;

    expect(panel.focusCalls).toHaveLength(focusCallsBeforePreview + 1);
    expect(panel.focusCalls.at(-1)).toEqual({});
    expect(controller.getState().currentMatchIndex).toBe(1);
    expect(highlighted).toEqual([{ element, currentMatchIndex: 1 }]);
    expect(scrolled).toEqual([]);
    expect(selectionRequests).toHaveLength(1);
    expect(selectionRequests[0]).toMatchObject({
      uid: "repeated",
      selection: { start: 12, end: 18 },
    });
    expect(positionedSelections).toEqual([]);
    expect(dom.window.document.activeElement).toBe(queryInput);

    if (outcome === "close") panel.getActions().onClose();
    if (outcome === "unload") controller.unload();
    if (outcome === "query") panel.getActions().onQueryChange("different");
    const highlightsBeforeResume = [...highlighted];
    const focusCallsBeforeResume = panel.focusCalls.length;
    expect(selectionRequests[0].signal.aborted).toBe(outcome !== "complete");
    resumeSelection.resolve();
    await flushPromises();

    const textarea = element.querySelector("textarea")!;
    if (outcome === "complete") {
      expect(positionedSelections).toEqual([{ start: 12, end: 18 }]);
      expect([textarea.selectionStart, textarea.selectionEnd]).toEqual([
        12, 18,
      ]);
    } else {
      expect(positionedSelections).toEqual([]);
      expect([textarea.selectionStart, textarea.selectionEnd]).toEqual([0, 6]);
    }
    expect(highlighted).toEqual(highlightsBeforeResume);
    expect(scrolled).toEqual([]);
    expect(panel.focusCalls).toHaveLength(focusCallsBeforeResume);
    expect(dom.window.document.activeElement).toBe(queryInput);
    controller.unload();
  });
}

test("selection positioning uses the fresh rendered view when Roam replaces the textarea", async () => {
  const panel = createPanelHost();
  const positioningSelection = createDeferred();
  const resumeSelection = createDeferred();
  const dom = new JSDOM(
    '<div class="roam-block-container"><textarea class="rm-block__input">Target then target</textarea></div>',
  );
  let element = dom.window.document.querySelector(
    ".roam-block-container",
  ) as HTMLElement;
  const originalElement = element;
  const fakeApi = createApi({
    pull: () => ({
      ":block/uid": "root",
      ":block/children": [
        { ":block/uid": "repeated", ":block/string": "Target then target" },
      ],
    }),
  });
  const highlighted: { element: HTMLElement; currentMatchIndex: number }[] = [];
  const scrolled: HTMLElement[] = [];
  const controller = await createFindInPage({
    ...makeControllerDependencies({
      api: fakeApi.api,
      panelHost: panel.host,
      getBlockElement: () => element,
    }),
    scrollToSelection: undefined,
    renderHighlights: ({ currentMatchIndex }): void => {
      highlighted.push({ element, currentMatchIndex });
    },
    scrollToBlock: (block): void => {
      scrolled.push(block);
    },
    delay: (): Promise<void> => {
      if (!highlighted.length) return Promise.resolve();
      positioningSelection.resolve();
      return resumeSelection.promise;
    },
  });

  await controller.open();
  panel.getActions().onQueryChange("target");
  highlighted.length = 0;
  panel.getActions().onNext();
  panel.getActions().onNext();
  await positioningSelection.promise;
  expect(scrolled).toEqual([]);

  const freshView = dom.window.document.createElement("div");
  freshView.className = "roam-block-container";
  freshView.innerHTML =
    '<div class="rm-block__input--view">Target then target</div>';
  element.replaceWith(freshView);
  element = freshView;
  resumeSelection.resolve();
  await flushPromises();

  expect(highlighted).toEqual([
    { element: originalElement, currentMatchIndex: 1 },
    { element: freshView, currentMatchIndex: 1 },
  ]);
  expect(scrolled).toEqual([freshView]);
  expect(fakeApi.focusedBlocks).toEqual([]);
  controller.unload();
});

for (const outcome of ["render", "close"] as const) {
  test(`preview waits for the focus-triggered host render before highlighting the previous occurrence: ${outcome}`, async () => {
    const panel = createPanelHost();
    const hostRenderStarted = createDeferred();
    const resumeHostRender = createDeferred();
    const dom = new JSDOM(
      '<div class="roam-block-container"><div class="rm-block__input--view">Target then target</div></div>',
    );
    let element = dom.window.document.querySelector(
      ".roam-block-container",
    ) as HTMLElement;
    const freshView = element.cloneNode(true) as HTMLElement;
    let previewStarted = false;
    let hostRenderPending = false;
    const fakeApi = createApi({
      pull: () => ({
        ":block/uid": "root",
        ":block/children": [
          { ":block/uid": "repeated", ":block/string": "Target then target" },
        ],
      }),
    });
    const highlighted: { element: HTMLElement; currentMatchIndex: number }[] =
      [];
    const scrolled: HTMLElement[] = [];
    const controller = await createFindInPage({
      ...makeControllerDependencies({
        api: fakeApi.api,
        panelHost: {
          ...panel.host,
          focusInput: (options): void => {
            panel.host.focusInput(options);
            if (previewStarted) hostRenderPending = true;
          },
        },
        getBlockElement: () => element,
      }),
      renderHighlights: ({ currentMatchIndex }): void => {
        highlighted.push({ element, currentMatchIndex });
      },
      scrollToBlock: (block): void => {
        scrolled.push(block);
      },
      afterHostRender: async (): Promise<void> => {
        if (!previewStarted) return;
        hostRenderStarted.resolve();
        await resumeHostRender.promise;
        if (hostRenderPending) {
          element.replaceWith(freshView);
          element = freshView;
          hostRenderPending = false;
        }
      },
    });

    await controller.open();
    panel.getActions().onQueryChange("target");
    highlighted.length = 0;
    previewStarted = true;
    panel.getActions().onPrevious();
    await hostRenderStarted.promise;
    expect(highlighted).toEqual([]);
    expect(scrolled).toEqual([]);
    if (outcome === "close") panel.getActions().onClose();
    resumeHostRender.resolve();
    await flushPromises();

    expect(controller.getState().currentMatchIndex).toBe(1);
    expect(hostRenderPending).toBe(false);
    expect(highlighted).toEqual(
      outcome === "render"
        ? [{ element: freshView, currentMatchIndex: 1 }]
        : [],
    );
    expect(scrolled).toEqual(outcome === "render" ? [freshView] : []);
    expect(fakeApi.focusedBlocks).toEqual([]);
    controller.unload();
  });
}

for (const invalidation of ["close", "unload", "query", "reopen"] as const) {
  test(`${invalidation} cancels pending navigation after a focus request`, async () => {
    const panel = createPanelHost();
    const waitingForRender = createDeferred();
    const resumeRender = createDeferred();
    const element = new JSDOM("<div></div>").window.document.querySelector(
      "div",
    ) as unknown as HTMLElement;
    let isRendered = false;
    const effects: string[] = [];
    const fakeApi = createApi({
      pull: () => ({
        ":block/uid": "root",
        ":block/children": [
          { ":block/uid": "match", ":block/string": "Target phrase" },
        ],
      }),
    });
    const controller = await createFindInPage({
      ...makeControllerDependencies({
        api: fakeApi.api,
        panelHost: panel.host,
      }),
      getBlockElement: () => {
        effects.push("read-block");
        return isRendered ? element : null;
      },
      renderHighlights: (): void => {
        effects.push("highlight");
      },
      scrollToBlock: (): void => {
        effects.push("scroll");
      },
      delay: (milliseconds): Promise<void> => {
        if (milliseconds === 0) return Promise.resolve();
        waitingForRender.resolve();
        return resumeRender.promise;
      },
    });

    await controller.open();
    panel.getActions().onQueryChange("target");
    panel.getActions().onNext();
    panel.getActions().onFocusCurrent();
    await waitingForRender.promise;

    if (invalidation === "close") panel.getActions().onClose();
    if (invalidation === "unload") controller.unload();
    if (invalidation === "query") panel.getActions().onQueryChange("different");
    if (invalidation === "reopen") await controller.open();
    const effectsAfterInvalidation = [...effects];
    const focusCountAfterInvalidation = panel.focusCalls.length;
    const rendersAfterInvalidation = panel.renders.length;

    isRendered = true;
    resumeRender.resolve();
    await flushPromises();

    expect(effects).toEqual(effectsAfterInvalidation);
    expect(panel.focusCalls).toHaveLength(focusCountAfterInvalidation);
    expect(panel.renders).toHaveLength(rendersAfterInvalidation);
    expect(fakeApi.focusedBlocks).toEqual([]);
    if (invalidation === "close" || invalidation === "unload") {
      expect(controller.getState().isOpen).toBe(false);
    }
    controller.unload();
  });
}

test("a new query can navigate without waiting for cancelled navigation", async () => {
  const panel = createPanelHost();
  const waitingForOldMatch = createDeferred();
  const resumeOldMatch = createDeferred();
  const freshElement = new JSDOM("<div></div>").window.document.querySelector(
    "div",
  ) as unknown as HTMLElement;
  const scrolledElements: HTMLElement[] = [];
  const fakeApi = createApi({
    pull: () => ({
      ":block/uid": "root",
      ":block/children": [
        { ":block/uid": "old", ":block/string": "Old result" },
        { ":block/uid": "fresh", ":block/string": "Fresh result" },
      ],
    }),
  });
  const controller = await createFindInPage({
    ...makeControllerDependencies({ api: fakeApi.api, panelHost: panel.host }),
    getBlockElement: (uid): HTMLElement | null =>
      uid === "fresh" ? freshElement : null,
    scrollToBlock: (element): void => {
      scrolledElements.push(element);
    },
    delay: (milliseconds): Promise<void> => {
      if (milliseconds === 0) return Promise.resolve();
      waitingForOldMatch.resolve();
      return resumeOldMatch.promise;
    },
  });

  await controller.open();
  panel.getActions().onQueryChange("old");
  panel.getActions().onNext();
  panel.getActions().onFocusCurrent();
  await waitingForOldMatch.promise;
  panel.getActions().onQueryChange("fresh");
  panel.getActions().onFocusCurrent();
  await flushPromises();

  expect(fakeApi.focusedBlocks).toEqual(["fresh"]);
  expect(scrolledElements).toEqual([freshElement]);
  resumeOldMatch.resolve();
  await flushPromises();
  expect(fakeApi.focusedBlocks).toEqual(["fresh"]);
  expect(scrolledElements).toEqual([freshElement]);
  controller.unload();
});

test("closing during ancestor expansion stops further block updates", async () => {
  const panel = createPanelHost();
  const updatingAncestor = createDeferred();
  const resumeAncestor = createDeferred();
  const fakeApi = createApi({
    pull: () => ({
      ":block/uid": "root",
      ":block/children": [
        {
          ":block/uid": "parent",
          ":block/string": "Parent",
          ":block/open": false,
          ":block/children": [
            {
              ":block/uid": "child",
              ":block/string": "Child",
              ":block/children": [
                { ":block/uid": "match", ":block/string": "Target" },
              ],
            },
          ],
        },
      ],
    }),
  });
  fakeApi.api.data.block.update = ({ block }): Promise<void> => {
    if (block?.uid) fakeApi.openedBlocks.push(block.uid);
    updatingAncestor.resolve();
    return resumeAncestor.promise;
  };
  const controller = await createFindInPage(
    makeControllerDependencies({ api: fakeApi.api, panelHost: panel.host }),
  );

  await controller.open();
  panel.getActions().onQueryChange("target");
  panel.getActions().onFocusCurrent();
  await updatingAncestor.promise;
  panel.getActions().onClose();
  resumeAncestor.resolve();
  await flushPromises();

  expect(fakeApi.openedBlocks).toEqual(["parent"]);
  expect(fakeApi.focusedBlocks).toEqual([]);
  controller.unload();
});

test("unloading during block focus prevents subsequent DOM work", async () => {
  const panel = createPanelHost();
  const focusingBlock = createDeferred();
  const resumeFocus = createDeferred();
  const effects: string[] = [];
  const element = new JSDOM("<div></div>").window.document.querySelector(
    "div",
  ) as unknown as HTMLElement;
  const fakeApi = createApi({
    pull: () => ({
      ":block/uid": "root",
      ":block/children": [{ ":block/uid": "match", ":block/string": "Target" }],
    }),
  });
  fakeApi.api.ui.setBlockFocusAndSelection = (): Promise<void> => {
    focusingBlock.resolve();
    return resumeFocus.promise;
  };
  const controller = await createFindInPage({
    ...makeControllerDependencies({ api: fakeApi.api, panelHost: panel.host }),
    getBlockElement: (): HTMLElement => {
      effects.push("read-block");
      return element;
    },
    renderHighlights: (): void => {
      effects.push("highlight");
    },
    scrollToBlock: (): void => {
      effects.push("scroll");
    },
  });

  await controller.open();
  panel.getActions().onQueryChange("target");
  panel.getActions().onFocusCurrent();
  await focusingBlock.promise;
  controller.unload();
  const effectsAfterUnload = [...effects];
  resumeFocus.resolve();
  await flushPromises();

  expect(effects).toEqual(effectsAfterUnload);
  expect(panel.unmountCalls).toHaveLength(1);
  expect(controller.getState().isOpen).toBe(false);
});

test("unloading during an open request never remounts or indexes the page", async () => {
  const panel = createPanelHost();
  const rootUid = createDeferred<string | null>();
  const fakeApi = createApi({ pull: () => null });
  fakeApi.api.ui.mainWindow.getOpenPageOrBlockUid = () => rootUid.promise;
  const controller = await createFindInPage(
    makeControllerDependencies({ api: fakeApi.api, panelHost: panel.host }),
  );

  const opening = controller.open();
  controller.unload();
  rootUid.resolve("root");
  await opening;

  expect(fakeApi.pullCalls).toEqual([]);
  expect(panel.renders).toEqual([]);
  expect(panel.focusCalls).toEqual([]);
  expect(panel.unmountCalls).toHaveLength(1);
  expect(controller.getState().isOpen).toBe(false);
});

test("a rejected focus reports a recoverable error and the queue still works", async () => {
  const panel = createPanelHost();
  const messages: string[] = [];
  const fakeApi = createApi({
    pull: () => ({
      ":block/uid": "root",
      ":block/children": [{ ":block/uid": "match", ":block/string": "Target" }],
    }),
  });
  let focusAttempts = 0;
  fakeApi.api.ui.setBlockFocusAndSelection = async (): Promise<void> => {
    focusAttempts += 1;
    if (focusAttempts === 1) throw new Error("Block is unavailable");
  };
  const element = new JSDOM("<div></div>").window.document.querySelector(
    "div",
  ) as unknown as HTMLElement;
  const controller = await createFindInPage({
    ...makeControllerDependencies({
      api: fakeApi.api,
      panelHost: panel.host,
      getBlockElement: () => element,
    }),
    notify: ({ message }): void => {
      messages.push(message);
    },
  });
  await controller.open();
  panel.getActions().onQueryChange("target");
  panel.getActions().onFocusCurrent();
  await flushPromises();
  expect(messages).toHaveLength(1);
  expect(messages[0]).toContain("Find In Page: Open");
  panel.getActions().onFocusCurrent();
  await flushPromises();
  expect(focusAttempts).toBe(2);
  expect(messages).toHaveLength(1);
  controller.unload();
});

for (const invalidation of ["close", "unload", "query"] as const) {
  test(`${invalidation} suppresses errors from a rejected obsolete focus`, async () => {
    const panel = createPanelHost();
    const focus = createDeferred();
    const messages: string[] = [];
    const fakeApi = createApi({
      pull: () => ({ ":block/uid": "root", ":block/string": "Target" }),
    });
    fakeApi.api.ui.setBlockFocusAndSelection = (): Promise<void> =>
      focus.promise;
    const element = new JSDOM("<div></div>").window.document.querySelector(
      "div",
    ) as unknown as HTMLElement;
    const controller = await createFindInPage({
      ...makeControllerDependencies({
        api: fakeApi.api,
        panelHost: panel.host,
        getBlockElement: () => element,
      }),
      notify: ({ message }): void => {
        messages.push(message);
      },
    });
    await controller.open();
    panel.getActions().onQueryChange("target");
    panel.getActions().onFocusCurrent();
    await flushPromises();
    if (invalidation === "close") panel.getActions().onClose();
    if (invalidation === "unload") controller.unload();
    if (invalidation === "query") panel.getActions().onQueryChange("fresh");
    focus.reject(new Error("Delayed failure"));
    await flushPromises();
    expect(messages).toEqual([]);
    controller.unload();
  });
}

test("a missing rendered match reports an error without focusing it", async () => {
  const panel = createPanelHost();
  const messages: string[] = [];
  const fakeApi = createApi({
    pull: () => ({ ":block/uid": "root", ":block/string": "Target" }),
  });
  const controller = await createFindInPage({
    ...makeControllerDependencies({ api: fakeApi.api, panelHost: panel.host }),
    notify: ({ message }): void => {
      messages.push(message);
    },
  });
  await controller.open();
  panel.getActions().onQueryChange("target");
  panel.getActions().onFocusCurrent();
  await flushPromises();
  expect(messages).toHaveLength(1);
  expect(fakeApi.focusedBlocks).toEqual([]);
  controller.unload();
});

test("a failed root lookup can be retried without an unhandled rejection", async () => {
  const panel = createPanelHost();
  const messages: string[] = [];
  const fakeApi = createApi({
    pull: () => ({ ":block/uid": "root", ":block/string": "Target" }),
  });
  fakeApi.api.ui.mainWindow.getOpenPageOrBlockUid =
    async (): Promise<string> => {
      throw new Error("Lookup failed");
    };
  const controller = await createFindInPage({
    ...makeControllerDependencies({ api: fakeApi.api, panelHost: panel.host }),
    notify: ({ message }): void => {
      messages.push(message);
    },
  });
  await controller.open();
  expect(messages).toHaveLength(1);
  expect(controller.getState().isOpen).toBe(false);
  fakeApi.api.ui.mainWindow.getOpenPageOrBlockUid = (): string => "root";
  await controller.open();
  expect(controller.getState().isOpen).toBe(true);
  expect(controller.getState().indexedBlocks).toHaveLength(1);
  controller.unload();
});

test("unload suppresses a pending root lookup failure", async () => {
  const panel = createPanelHost();
  const lookup = createDeferred<string | null>();
  const messages: string[] = [];
  const fakeApi = createApi({ pull: () => null });
  fakeApi.api.ui.mainWindow.getOpenPageOrBlockUid = () => lookup.promise;
  const controller = await createFindInPage({
    ...makeControllerDependencies({ api: fakeApi.api, panelHost: panel.host }),
    notify: ({ message }): void => {
      messages.push(message);
    },
  });
  const opening = controller.open();
  controller.unload();
  lookup.reject(new Error("Lookup failed"));
  await opening;
  expect(messages).toEqual([]);
  expect(panel.renders).toEqual([]);
});

test("waitForBlockElement polls until a folded target renders", async () => {
  const element = {} as HTMLElement;
  let reads = 0;
  let waits = 0;
  const found = await waitForBlockElement({
    uid: "target",
    getBlockElement: () => (++reads === 3 ? element : null),
    delay: async () => {
      waits += 1;
    },
    timeoutMs: 100,
    pollIntervalMs: 10,
  });

  expect(found).toBe(element);
  expect(reads).toBe(3);
  expect(waits).toBe(2);
});

test("inline highlighting marks every occurrence and can be rebuilt", () => {
  const dom = new JSDOM(
    '<div id="block"><div class="rm-block__input--view">Alpha target and TARGET again</div></div>',
  );
  const previousDocument = global.document;
  const previousNodeFilter = global.NodeFilter;
  global.document = dom.window.document;
  global.NodeFilter = dom.window.NodeFilter;
  try {
    const block = dom.window.document.querySelector(
      "#block",
    ) as unknown as HTMLElement;
    const first = applyInlineHighlightsToBlock({
      blockElement: block,
      query: "target",
      activeOccurrenceIndex: 1,
    });
    expect(first?.textContent).toBe("target");
    expect(
      block.querySelectorAll(".roamjs-find-in-page-inline-match"),
    ).toHaveLength(2);
    expect(
      block.querySelectorAll(".roamjs-find-in-page-active-inline-match"),
    ).toHaveLength(1);
  } finally {
    global.document = previousDocument;
    global.NodeFilter = previousNodeFilter;
  }
});

test("React panel exposes accessible controls and keyboard actions", () => {
  const calls: string[] = [];
  const inputRef = React.createRef<HTMLInputElement>();
  const actions = {
    onQueryChange: (query: string): void => calls.push(`query:${query}`),
    onPrevious: (): void => calls.push("previous"),
    onNext: (): void => calls.push("next"),
    onFocusCurrent: (): void => calls.push("focus"),
    onClose: (): void => calls.push("close"),
  };
  const panel = FindInPagePanel({
    inputRef,
    query: "target",
    currentMatch: 0,
    matchCount: 2,
    ...actions,
  });
  expect(panel.props.role).toBe("dialog");
  expect(panel.props["aria-label"]).toBe("Find in page");
  actions.onQueryChange("fresh");
  const keyDown = ({
    key,
    shiftKey = false,
    metaKey = false,
    ctrlKey = false,
  }: {
    key: string;
    shiftKey?: boolean;
    metaKey?: boolean;
    ctrlKey?: boolean;
  }): void =>
    handleFindInPageKeyDown({
      event: {
        key,
        shiftKey,
        metaKey,
        ctrlKey,
        preventDefault: (): void => undefined,
      },
      ...actions,
    });
  keyDown({ key: "Enter" });
  keyDown({ key: "Enter", shiftKey: true });
  keyDown({ key: "ArrowDown" });
  keyDown({ key: "ArrowUp" });
  keyDown({ key: "Enter", metaKey: true });
  keyDown({ key: "Enter", ctrlKey: true });
  keyDown({ key: "Escape" });
  expect(calls).toEqual([
    "query:fresh",
    "next",
    "previous",
    "next",
    "previous",
    "focus",
    "focus",
    "close",
  ]);
});

test("navigation waits for the actual folded outline block instead of an existing reference copy", async () => {
  const dom = new JSDOM(
    '<div class="roam-body-main"><div class="rm-reference-main"><div id="copy" class="roam-block-container" data-block-uid="match"><div class="rm-block__input--view">target</div></div></div></div>',
  );
  const previous = { document: global.document, window: global.window };
  Object.assign(global, { document: dom.window.document, window: dom.window });
  try {
    const panel = createPanelHost();
    const fakeApi = createApi({
      pull: () => ({
        ":block/uid": "root",
        ":block/children": [
          {
            ":block/uid": "parent",
            ":block/string": "Folded",
            ":block/open": false,
            ":block/children": [
              { ":block/uid": "match", ":block/string": "target" },
            ],
          },
        ],
      }),
    });
    let renderWaits = 0;
    const scrolled: HTMLElement[] = [];
    const controller = await createFindInPage({
      ...makeControllerDependencies({
        api: fakeApi.api,
        panelHost: panel.host,
      }),
      getBlockElement: undefined,
      scrollToBlock: (element): void => {
        scrolled.push(element);
      },
      delay: async (milliseconds): Promise<void> => {
        if (!milliseconds) return;
        renderWaits += 1;
        const outline = dom.window.document.createElement("div");
        outline.id = "actual-outline";
        outline.className = "roam-block-container";
        outline.setAttribute("data-block-uid", "match");
        const input = dom.window.document.createElement("div");
        input.className = "rm-block__input--view";
        input.textContent = "target";
        outline.appendChild(input);
        dom.window.document
          .querySelector(".roam-body-main")!
          .appendChild(outline);
      },
    });
    await controller.open();
    panel.getActions().onQueryChange("target");
    panel.getActions().onNext();
    await flushPromises();
    expect(renderWaits).toBe(1);
    expect(fakeApi.openedBlocks).toEqual(["parent"]);
    expect(scrolled.map((element) => element.id)).toEqual(["actual-outline"]);
    controller.unload();
  } finally {
    Object.assign(global, previous);
    dom.window.close();
  }
});

for (const exit of ["close", "unload", "query", "page", "edit"] as const) {
  test(`temporary folds are restored on ${exit}, keeping an edited match visible`, async () => {
    const panel = createPanelHost();
    const element = new JSDOM("<div></div>").window.document.querySelector(
      "div",
    ) as HTMLElement;
    const fakeApi = createApi({
      pull: () => ({
        ":block/uid": "root",
        ":block/children": [
          {
            ":block/uid": "parent",
            ":block/string": "Parent",
            ":block/open": false,
            ":block/children": [
              { ":block/uid": "match", ":block/string": "Target" },
            ],
          },
        ],
      }),
    });
    const controller = await createFindInPage(
      makeControllerDependencies({
        api: fakeApi.api,
        panelHost: panel.host,
        getBlockElement: () => element,
      }),
    );
    await controller.open();
    panel.getActions().onQueryChange("target");
    if (exit === "edit") panel.getActions().onFocusCurrent();
    else panel.getActions().onNext();
    await flushPromises();
    expect(fakeApi.openedBlocks).toEqual(["parent"]);
    if (exit === "close" || exit === "edit") panel.getActions().onClose();
    if (exit === "unload") controller.unload();
    if (exit === "query") panel.getActions().onQueryChange("different");
    if (exit === "page") {
      fakeApi.api.ui.mainWindow.getOpenPageOrBlockUid = () => "other-page";
      await controller.open();
    }
    await flushPromises();
    expect(fakeApi.closedBlocks).toEqual(exit === "edit" ? [] : ["parent"]);
    controller.unload();
  });
}
