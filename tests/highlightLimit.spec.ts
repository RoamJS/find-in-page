import { expect, test } from "@playwright/test";
import { JSDOM } from "jsdom";
import {
  clearFindInPageHighlights,
  renderFindInPageHighlights,
} from "../src/findInPage";

test("the active result stays highlighted beyond the general highlight limit", () => {
  const matches = Array.from({ length: 251 }, (_, order) => ({
    uid: `match-${order}`,
    text: "Target",
    order,
    score: 0,
    start: 0,
    end: 6,
    occurrenceIndex: 0,
    ancestors: [],
  }));
  const dom = new JSDOM(
    `<div class="roam-body-main">${matches
      .map(
        ({ uid }) =>
          `<div class="roam-block-container" data-block-uid="${uid}"><div class="rm-block__input--view">Target</div></div>`,
      )
      .join("")}</div>`,
  );
  const previous = {
    document: global.document,
    window: global.window,
    NodeFilter: global.NodeFilter,
  };
  global.document = dom.window.document;
  global.window = dom.window as unknown as Window & typeof globalThis;
  global.NodeFilter = dom.window.NodeFilter;
  try {
    renderFindInPageHighlights({
      matches,
      currentMatchIndex: 250,
      query: "target",
    });
    const active = dom.window.document.querySelector(
      '[data-block-uid="match-250"]',
    );
    expect(active?.classList.contains("roamjs-find-in-page-active-match")).toBe(
      true,
    );
    expect(
      active?.querySelector(".roamjs-find-in-page-active-inline-match")
        ?.textContent,
    ).toBe("Target");
    expect(
      dom.window.document.querySelectorAll(".roamjs-find-in-page-match"),
    ).toHaveLength(251);
    renderFindInPageHighlights({
      matches,
      currentMatchIndex: 0,
      query: "target",
    });
    expect(active?.classList.contains("roamjs-find-in-page-match")).toBe(false);
    expect(
      active?.querySelector(".roamjs-find-in-page-inline-match"),
    ).toBeNull();
    clearFindInPageHighlights();
    expect(
      dom.window.document.querySelectorAll(
        ".roamjs-find-in-page-match, .roamjs-find-in-page-inline-match",
      ),
    ).toHaveLength(0);
  } finally {
    Object.assign(global, previous);
    dom.window.close();
  }
});
