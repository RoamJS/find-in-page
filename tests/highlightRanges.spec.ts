import { expect, test } from "@playwright/test";
import { JSDOM } from "jsdom";
import {
  clearFindInPageHighlights,
  renderFindInPageHighlights,
} from "../src/findInPage";
import { rankEntries } from "../src/utils/searchRank";

const withDocument = (run: (doc: Document, dom: JSDOM) => void): void => {
  const dom = new JSDOM(
    '<div class="roam-body-main"><div class="roam-block-container" data-block-uid="repeated"><div class="rm-block__input--view">target <strong>target</strong> tar<em>get</em></div></div></div>',
  );
  const previous = {
    document: global.document,
    window: global.window,
    NodeFilter: global.NodeFilter,
  };
  Object.assign(global, {
    document: dom.window.document,
    window: dom.window,
    NodeFilter: dom.window.NodeFilter,
  });
  try {
    run(dom.window.document, dom);
  } finally {
    Object.assign(global, previous);
    dom.window.close();
  }
};
const matches = rankEntries({
  query: "target",
  entries: [
    {
      uid: "repeated",
      text: "target **target** target",
      ancestors: [],
      order: 0,
    },
  ],
});

test("native ranges preserve DOM and mark only the selected occurrence, including across inline formatting", () => {
  withDocument((doc, dom) => {
    class Highlight extends Set<Range> {
      priority = 0;
    }
    const registry = new Map<string, Highlight>();
    const foreign = new Highlight();
    registry.set("another-extension", foreign);
    Object.defineProperty(dom.window, "Highlight", { value: Highlight });
    Object.defineProperty(dom.window, "CSS", {
      value: { highlights: registry },
    });
    const input = doc.querySelector(".rm-block__input--view")!;
    const before = input.innerHTML;
    const firstText = input.firstChild;
    renderFindInPageHighlights({
      matches,
      currentMatchIndex: 1,
      query: "target",
    });
    const all = registry.get("roamjs-find-in-page-inline-match")!;
    const active = registry.get("roamjs-find-in-page-active-inline-match")!;
    expect([...all].map((range) => range.toString())).toEqual([
      "target",
      "target",
      "target",
    ]);
    expect([...active][0].startContainer.parentElement?.tagName).toBe("STRONG");
    expect(active.size).toBe(1);
    expect(active.priority).toBeGreaterThan(all.priority);
    expect(input.innerHTML).toBe(before);
    expect(input.firstChild).toBe(firstText);
    renderFindInPageHighlights({
      matches,
      currentMatchIndex: 2,
      query: "target",
    });
    const last = [
      ...registry.get("roamjs-find-in-page-active-inline-match")!,
    ][0];
    expect(last.toString()).toBe("target");
    expect(last.endContainer.parentElement?.tagName).toBe("EM");
    clearFindInPageHighlights();
    expect([...registry.keys()]).toEqual(["another-extension"]);
    expect(input.innerHTML).toBe(before);
  });
});

test("fallback spans are rebuilt once per block and retain formatting for a split occurrence", () => {
  withDocument((doc) => {
    renderFindInPageHighlights({
      matches,
      currentMatchIndex: 1,
      query: "target",
    });
    expect(
      doc.querySelectorAll(".roamjs-find-in-page-inline-match"),
    ).toHaveLength(4);
    expect(
      doc.querySelectorAll(".roamjs-find-in-page-active-inline-match"),
    ).toHaveLength(1);
    renderFindInPageHighlights({
      matches,
      currentMatchIndex: 2,
      query: "target",
    });
    expect(
      [...doc.querySelectorAll(".roamjs-find-in-page-active-inline-match")]
        .map((e) => e.textContent)
        .join(""),
    ).toBe("target");
    expect(
      doc.querySelectorAll(
        ".roamjs-find-in-page-inline-match .roamjs-find-in-page-inline-match",
      ),
    ).toHaveLength(0);
    clearFindInPageHighlights();
    expect(doc.querySelector("strong")?.textContent).toBe("target");
    expect(doc.querySelector("em")?.textContent).toBe("get");
    expect(doc.querySelector(".rm-block__input--view")?.textContent).toBe(
      "target target target",
    );
  });
});

const installNativeHighlights = (dom: JSDOM): Map<string, Set<Range>> => {
  class Highlight extends Set<Range> {
    priority = 0;
  }
  const registry = new Map<string, Highlight>();
  Object.defineProperty(dom.window, "Highlight", { value: Highlight });
  Object.defineProperty(dom.window, "CSS", {
    value: { highlights: registry },
  });
  return registry;
};

for (const native of [true, false]) {
  const mode = native ? "native ranges" : "fallback spans";

  test(`${mode} keep hidden link destinations from shifting later visible matches`, () => {
    withDocument((doc, dom) => {
      const registry = native ? installNativeHighlights(dom) : null;
      const input = doc.querySelector(".rm-block__input--view")!;
      input.innerHTML = '<a href="https://target.example">target</a> target';
      const linkMatches = rankEntries({
        query: "target",
        entries: [
          {
            uid: "repeated",
            text: "[target](https://target.example) target",
            ancestors: [],
            order: 0,
          },
        ],
      });
      expect(linkMatches).toHaveLength(3);
      renderFindInPageHighlights({
        matches: linkMatches,
        currentMatchIndex: 1,
        query: "target",
      });
      if (registry) {
        expect(registry.get("roamjs-find-in-page-inline-match")?.size).toBe(2);
        expect(
          registry.get("roamjs-find-in-page-active-inline-match")?.size,
        ).toBe(0);
      } else {
        expect(
          input.querySelectorAll(".roamjs-find-in-page-inline-match"),
        ).toHaveLength(2);
        expect(
          input.querySelectorAll(".roamjs-find-in-page-active-inline-match"),
        ).toHaveLength(0);
      }

      renderFindInPageHighlights({
        matches: linkMatches,
        currentMatchIndex: 2,
        query: "target",
      });
      if (registry) {
        const active = [
          ...registry.get("roamjs-find-in-page-active-inline-match")!,
        ];
        expect(active).toHaveLength(1);
        expect(active[0].toString()).toBe("target");
        expect(active[0].startContainer.parentElement).toBe(input);
        expect(active[0].startOffset).toBe(1);
      } else {
        const active = input.querySelectorAll(
          ".roamjs-find-in-page-active-inline-match",
        );
        expect(active).toHaveLength(1);
        expect(active[0].textContent).toBe("target");
        expect(active[0].parentElement).toBe(input);
      }
      clearFindInPageHighlights();
      expect(input.textContent).toBe("target target");
    });
  });

  test(`${mode} never use a child's view for a parent being edited`, () => {
    withDocument((doc, dom) => {
      const registry = native ? installNativeHighlights(dom) : null;
      const parent = doc.querySelector('[data-block-uid="repeated"]')!;
      parent.innerHTML =
        '<textarea class="rm-block__input">target target</textarea><div class="roam-block-container" data-block-uid="child"><div class="rm-block__input--view">target</div></div>';
      const parentAndChildMatches = rankEntries({
        query: "target",
        entries: [
          {
            uid: "repeated",
            text: "target target",
            ancestors: [],
            order: 0,
          },
          {
            uid: "child",
            text: "target",
            ancestors: ["repeated"],
            order: 1,
          },
        ],
      });
      renderFindInPageHighlights({
        matches: parentAndChildMatches,
        currentMatchIndex: 1,
        query: "target",
      });
      if (registry) {
        const all = [...registry.get("roamjs-find-in-page-inline-match")!];
        expect(all).toHaveLength(1);
        expect(
          all[0].startContainer.parentElement
            ?.closest(".roam-block-container")
            ?.getAttribute("data-block-uid"),
        ).toBe("child");
        expect(
          registry.get("roamjs-find-in-page-active-inline-match")?.size,
        ).toBe(0);
      } else {
        expect(
          doc.querySelectorAll(".roamjs-find-in-page-inline-match"),
        ).toHaveLength(1);
        expect(
          doc.querySelectorAll(".roamjs-find-in-page-active-inline-match"),
        ).toHaveLength(0);
      }
      expect(parent.querySelector("textarea")?.value).toBe("target target");
      clearFindInPageHighlights();
    });
  });

  test(`${mode} ignore generated reference and embed text before a literal match`, () => {
    withDocument((doc, dom) => {
      const registry = native ? installNativeHighlights(dom) : null;
      const input = doc.querySelector(".rm-block__input--view")!;
      input.innerHTML =
        '<span class="rm-block-ref">target</span><span class="rm-embed-container">target</span> target';
      const referenceMatches = rankEntries({
        query: "target",
        entries: [
          {
            uid: "repeated",
            text: "((refuid123)) {{[[embed]]: ((embed1234))}} target",
            ancestors: [],
            order: 0,
          },
        ],
      });
      expect(referenceMatches).toHaveLength(1);
      renderFindInPageHighlights({
        matches: referenceMatches,
        currentMatchIndex: 0,
        query: "target",
      });
      if (registry) {
        const all = [...registry.get("roamjs-find-in-page-inline-match")!];
        const active = [
          ...registry.get("roamjs-find-in-page-active-inline-match")!,
        ];
        expect(all).toHaveLength(1);
        expect(active).toHaveLength(1);
        expect(active[0].toString()).toBe("target");
        expect(active[0].startContainer.parentElement).toBe(input);
      } else {
        const active = input.querySelectorAll(
          ".roamjs-find-in-page-active-inline-match",
        );
        expect(active).toHaveLength(1);
        expect(active[0].parentElement).toBe(input);
        expect(
          input.querySelectorAll(".roamjs-find-in-page-inline-match"),
        ).toHaveLength(1);
      }
      clearFindInPageHighlights();
      expect(input.querySelector(".rm-block-ref")?.textContent).toBe("target");
      expect(input.querySelector(".rm-embed-container")?.textContent).toBe(
        "target",
      );
    });
  });

  test(`${mode} map an adjacent formatted match past a hidden link destination`, () => {
    withDocument((doc, dom) => {
      const registry = native ? installNativeHighlights(dom) : null;
      const input = doc.querySelector(".rm-block__input--view")!;
      for (const destination of [
        "https://target.example",
        "https://example.com/(target)",
      ]) {
        input.innerHTML = `<a href="${destination}">target</a><strong>target</strong>`;
        const adjacentMatches = rankEntries({
          query: "target",
          entries: [
            {
              uid: "repeated",
              text: `[target](${destination})**target**`,
              ancestors: [],
              order: 0,
            },
          ],
        });
        expect(adjacentMatches).toHaveLength(3);
        renderFindInPageHighlights({
          matches: adjacentMatches,
          currentMatchIndex: 1,
          query: "target",
        });
        if (registry) {
          expect(
            registry.get("roamjs-find-in-page-active-inline-match")?.size,
          ).toBe(0);
        } else {
          expect(
            input.querySelectorAll(".roamjs-find-in-page-active-inline-match"),
          ).toHaveLength(0);
        }
        renderFindInPageHighlights({
          matches: adjacentMatches,
          currentMatchIndex: 2,
          query: "target",
        });
        if (registry) {
          expect(registry.get("roamjs-find-in-page-inline-match")?.size).toBe(
            2,
          );
          const active = [
            ...registry.get("roamjs-find-in-page-active-inline-match")!,
          ];
          expect(active).toHaveLength(1);
          expect(active[0].toString()).toBe("target");
          expect(active[0].startContainer.parentElement?.tagName).toBe(
            "STRONG",
          );
        } else {
          const active = input.querySelectorAll(
            ".roamjs-find-in-page-active-inline-match",
          );
          expect(active).toHaveLength(1);
          expect(active[0].parentElement?.tagName).toBe("STRONG");
          expect(
            input.querySelectorAll(".roamjs-find-in-page-inline-match"),
          ).toHaveLength(2);
        }
        clearFindInPageHighlights();
      }
    });
  });

  test(`${mode} still highlight literal link syntax inside code`, () => {
    withDocument((doc, dom) => {
      const registry = native ? installNativeHighlights(dom) : null;
      const input = doc.querySelector(".rm-block__input--view")!;
      input.innerHTML = "<code>[target](https://target.example)</code> target";
      const codeMatches = rankEntries({
        query: "target",
        entries: [
          {
            uid: "repeated",
            text: "`[target](https://target.example)` target",
            ancestors: [],
            order: 0,
          },
        ],
      });
      renderFindInPageHighlights({
        matches: codeMatches,
        currentMatchIndex: 1,
        query: "target",
      });
      if (registry) {
        expect(registry.get("roamjs-find-in-page-inline-match")?.size).toBe(3);
        const active = [
          ...registry.get("roamjs-find-in-page-active-inline-match")!,
        ];
        expect(active).toHaveLength(1);
        expect(active[0].toString()).toBe("target");
        expect(active[0].startContainer.parentElement?.tagName).toBe("CODE");
        expect(active[0].startOffset).toBe(17);
      } else {
        expect(
          input.querySelectorAll(".roamjs-find-in-page-inline-match"),
        ).toHaveLength(3);
        const active = input.querySelectorAll(
          ".roamjs-find-in-page-active-inline-match",
        );
        expect(active).toHaveLength(1);
        expect(active[0].parentElement?.tagName).toBe("CODE");
      }
      clearFindInPageHighlights();
    });
  });
}
