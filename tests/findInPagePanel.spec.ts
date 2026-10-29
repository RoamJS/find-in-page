import { expect, test } from "@playwright/test";
import React from "react";

import {
  FindInPagePanel,
  handleFindInPageKeyDown,
  handleFindInPagePanelKeyDown,
} from "../src/components/FindInPagePanel";

type ElementNode = {
  type: unknown;
  props: Record<string, unknown>;
  children?: unknown;
};

const isElementNode = (value: unknown): value is ElementNode =>
  typeof value === "object" &&
  value !== null &&
  "type" in value &&
  "props" in value;

const getElementChildren = (value: unknown): unknown[] => {
  if (!isElementNode(value)) return [];
  // Playwright's JSX transform stores children beside props; React uses props.children.
  const children = value.children ?? value.props.children;
  return Array.isArray(children) ? children : [children];
};

const createKeyboardActions = (): {
  calls: string[];
  onPrevious: () => void;
  onNext: () => void;
  onFocusCurrent: () => void;
  onClose: () => void;
} => {
  const calls: string[] = [];
  return {
    calls,
    onPrevious: (): void => {
      calls.push("previous");
    },
    onNext: (): void => {
      calls.push("next");
    },
    onFocusCurrent: (): void => {
      calls.push("focus");
    },
    onClose: (): void => {
      calls.push("close");
    },
  };
};

for (const key of ["Enter", "ArrowUp", "ArrowDown", "Escape"]) {
  test(`IME ${key} remains available to the input method`, () => {
    const actions = createKeyboardActions();
    let prevented = false;
    let stopped = false;
    let stoppedNative = false;
    const event = {
      key,
      shiftKey: false,
      metaKey: false,
      ctrlKey: false,
      nativeEvent: {
        isComposing: true,
        stopImmediatePropagation: (): void => {
          stoppedNative = true;
        },
      },
      preventDefault: (): void => {
        prevented = true;
      },
      stopPropagation: (): void => {
        stopped = true;
      },
    };

    handleFindInPageKeyDown({ event, ...actions });
    handleFindInPagePanelKeyDown({ event, onClose: actions.onClose });

    expect(actions.calls).toEqual([]);
    expect(prevented).toBe(false);
    expect(stopped).toBe(false);
    expect(stoppedNative).toBe(false);
  });
}

for (const shortcut of [
  { key: "Enter", action: "next" },
  { key: "Enter", shiftKey: true, action: "previous" },
  { key: "Enter", metaKey: true, action: "focus" },
  { key: "Enter", ctrlKey: true, action: "focus" },
  { key: "ArrowUp", action: "previous" },
  { key: "ArrowDown", action: "next" },
  { key: "Escape", action: "close" },
]) {
  test(`handled ${JSON.stringify(shortcut)} cannot trigger Roam shortcuts`, () => {
    const actions = createKeyboardActions();
    const calls = actions.calls;
    handleFindInPageKeyDown({
      event: {
        shiftKey: false,
        metaKey: false,
        ctrlKey: false,
        ...shortcut,
        preventDefault: (): void => {
          calls.push("prevent-default");
        },
        stopPropagation: (): void => {
          calls.push("stop-propagation");
        },
        nativeEvent: {
          stopImmediatePropagation: (): void => {
            calls.push("stop-native-listeners");
          },
        },
      },
      ...actions,
    });
    expect(calls).toEqual([
      "prevent-default",
      "stop-propagation",
      "stop-native-listeners",
      shortcut.action,
    ]);
  });
}

test("typing and text-editing keys remain available to the input", () => {
  const actions = createKeyboardActions();
  for (const key of [
    "a",
    " ",
    "Backspace",
    "Delete",
    "ArrowLeft",
    "ArrowRight",
  ]) {
    handleFindInPageKeyDown({
      event: {
        key,
        shiftKey: false,
        metaKey: false,
        ctrlKey: false,
        preventDefault: (): void => {
          actions.calls.push("prevent-default");
        },
        stopPropagation: (): void => {
          actions.calls.push("stop-propagation");
        },
        nativeEvent: {
          stopImmediatePropagation: (): void => {
            actions.calls.push("stop-native-listeners");
          },
        },
      },
      ...actions,
    });
  }
  expect(actions.calls).toEqual([]);
});

test("IME key code protects confirmation when isComposing is already false", () => {
  const actions = createKeyboardActions();
  let prevented = false;
  for (const compositionMarker of [
    { nativeEvent: { isComposing: false, keyCode: 229 } },
    { keyCode: 229 },
  ]) {
    handleFindInPageKeyDown({
      event: {
        key: "Enter",
        shiftKey: false,
        metaKey: false,
        ctrlKey: false,
        ...compositionMarker,
        preventDefault: (): void => {
          prevented = true;
        },
      },
      ...actions,
    });
  }
  expect(actions.calls).toEqual([]);
  expect(prevented).toBe(false);
});

test("Escape bubbles from panel buttons to close once without reaching the outliner", () => {
  const actions = createKeyboardActions();
  const panel = FindInPagePanel({
    inputRef: React.createRef<HTMLInputElement>(),
    query: "target",
    currentMatch: 0,
    matchCount: 2,
    onQueryChange: (): void => undefined,
    ...actions,
  });
  let stopped = false;
  const event = {
    key: "Escape",
    defaultPrevented: false,
    preventDefault: (): void => {
      event.defaultPrevented = true;
    },
    stopPropagation: (): void => {
      stopped = true;
    },
  };

  panel.props.onKeyDown(event);
  expect(actions.calls).toEqual(["close"]);
  expect(stopped).toBe(true);
  expect(event.defaultPrevented).toBe(true);
});

test("Escape handled by the input is not handled twice by the panel", () => {
  const actions = createKeyboardActions();
  const event = {
    key: "Escape",
    shiftKey: false,
    metaKey: false,
    ctrlKey: false,
    defaultPrevented: false,
    preventDefault: (): void => {
      event.defaultPrevented = true;
    },
  };

  handleFindInPageKeyDown({ event, ...actions });
  handleFindInPagePanelKeyDown({ event, onClose: actions.onClose });

  expect(actions.calls).toEqual(["close"]);
});

test("panel-level handling leaves button activation and arrows alone", () => {
  const actions = createKeyboardActions();
  let prevented = false;
  for (const key of ["Enter", " ", "ArrowUp", "ArrowDown"]) {
    handleFindInPagePanelKeyDown({
      event: {
        key,
        preventDefault: (): void => {
          prevented = true;
        },
      },
      onClose: actions.onClose,
    });
  }
  expect(actions.calls).toEqual([]);
  expect(prevented).toBe(false);
});

for (const state of [
  { query: "", currentMatch: -1, matchCount: 0, text: "Type to search" },
  { query: "   ", currentMatch: -1, matchCount: 0, text: "Type to search" },
  { query: "missing", currentMatch: -1, matchCount: 0, text: "No matches" },
  { query: "target", currentMatch: -1, matchCount: 1, text: "1 match" },
  { query: "target", currentMatch: -1, matchCount: 2, text: "2 matches" },
  { query: "target", currentMatch: 0, matchCount: 2, text: "1 of 2" },
  { query: "target", currentMatch: 1, matchCount: 2, text: "2 of 2" },
]) {
  test(`counter announces ${state.text} for query '${state.query}'`, () => {
    const panel = FindInPagePanel({
      ...state,
      inputRef: React.createRef<HTMLInputElement>(),
      onQueryChange: (): void => undefined,
      ...createKeyboardActions(),
    });
    const elements = getElementChildren(panel).filter(isElementNode);
    const status = elements.find((child) => child.props.role === "status");
    const input = elements.find(
      (child) => child.props["aria-label"] === "Find in page query",
    );

    expect(status).toBeDefined();
    expect(status?.type).toBe("span");
    expect(getElementChildren(status).join("").trim()).toBe(state.text);
    expect(status?.props["aria-live"]).toBe("polite");
    expect(status?.props["aria-atomic"]).toBe("true");
    expect(status?.props["aria-label"]).toBe(
      state.currentMatch >= 0 ? `Match ${state.text}` : state.text,
    );
    expect(input).toBeDefined();
    expect(input?.props["aria-describedby"]).toBe(status?.props.id);
  });
}

test("focus control identifies and focuses the selected occurrence", () => {
  const actions = createKeyboardActions();
  const panel = FindInPagePanel({
    inputRef: React.createRef<HTMLInputElement>(),
    query: "target",
    currentMatch: 2,
    matchCount: 3,
    onQueryChange: (): void => undefined,
    ...actions,
  });
  const hint = "Focus the selected match (Cmd/Ctrl+Enter)";
  const tooltip = getElementChildren(panel)
    .filter(isElementNode)
    .find((child) => child.props.content === hint);
  const button = getElementChildren(tooltip).find(isElementNode);

  expect(button?.props["aria-label"]).toBe(hint);
  expect(button?.props.title).toBe(hint);
  expect(button?.props.disabled).toBe(false);
  expect(button?.props.onClick).toBe(actions.onFocusCurrent);
});
