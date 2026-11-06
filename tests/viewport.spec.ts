import { expect, test } from "@playwright/test";
import { JSDOM } from "jsdom";

import { anchorViewport, scrollTextRectIntoView } from "~/utils/viewport";

const createFixture = () => {
  const dom = new JSDOM(
    '<div class="roam-body-main"><div id="scroll" style="overflow-y: auto"><div class="roam-block-container" data-block-uid="a"><div class="rm-block-main">A</div></div><div class="roam-block-container" data-block-uid="b"><div class="rm-block-main">B</div></div></div></div>',
    { pretendToBeVisual: true },
  );
  const doc = dom.window.document;
  const container = doc.getElementById("scroll") as HTMLElement;
  const a = doc.querySelector('[data-block-uid="a"]') as HTMLElement;
  const b = doc.querySelector('[data-block-uid="b"]') as HTMLElement;
  const positions = { a: 380, b: 500 };
  const rect = ({
    top,
    height = 20,
    left = 100,
    width = 100,
  }: {
    top: number;
    height?: number;
    left?: number;
    width?: number;
  }): DOMRect => ({
    x: left,
    y: top,
    left,
    top,
    width,
    height,
    right: left + width,
    bottom: top + height,
    toJSON: () => ({ left, top, width, height }),
  });
  Object.defineProperty(container, "clientHeight", { value: 500 });
  Object.defineProperty(container, "scrollHeight", { value: 2000 });
  container.getBoundingClientRect = () =>
    rect({ top: 40, height: 500, left: 0, width: 800 });
  container.scrollTop = 300;
  const scrolls: ScrollToOptions[] = [];
  container.scrollTo = ((options: ScrollToOptions): void => {
    scrolls.push(options);
    container.scrollTop = options.top ?? container.scrollTop;
  }) as typeof container.scrollTo;
  for (const [uid, block] of [
    ["a", a],
    ["b", b],
  ] as const) {
    const measure = (): DOMRect =>
      rect({ top: positions[uid] - container.scrollTop });
    block.getBoundingClientRect = measure;
    (block.firstElementChild as HTMLElement).getBoundingClientRect = measure;
  }
  const changeLayout = async (): Promise<void> => {
    container.appendChild(doc.createElement("span"));
    await Promise.resolve();
  };
  return { dom, doc, container, a, b, positions, rect, scrolls, changeLayout };
};

for (const sample of [
  { name: "already comfortably visible", top: 200, height: 20, expected: null },
  { name: "above the comfortable area", top: 60, height: 20, expected: 272 },
  { name: "below the comfortable area", top: 500, height: 20, expected: 328 },
  { name: "taller than the viewport", top: 100, height: 600, expected: 312 },
]) {
  test(`scrolls only as needed when a match is ${sample.name}`, () => {
    const f = createFixture();
    scrollTextRectIntoView({ element: f.b, rect: f.rect(sample) });
    expect(f.scrolls).toEqual(
      sample.expected === null
        ? []
        : [{ top: sample.expected, behavior: "smooth" }],
    );
    f.dom.window.close();
  });
}

test("keeps a match clear of the search panel only when it overlaps horizontally", () => {
  const f = createFixture();
  const panel = f.doc.createElement("div");
  panel.id = "roamjs-find-in-page-panel";
  panel.getBoundingClientRect = () =>
    f.rect({ top: 56, height: 48, left: 0, width: 800 });
  f.doc.body.appendChild(panel);
  scrollTextRectIntoView({ element: f.b, rect: f.rect({ top: 105 }) });
  expect(f.scrolls).toEqual([{ top: 285, behavior: "smooth" }]);
  f.scrolls.length = 0;
  panel.getBoundingClientRect = () =>
    f.rect({ top: 56, height: 48, left: 600, width: 200 });
  scrollTextRectIntoView({ element: f.b, rect: f.rect({ top: 105 }) });
  expect(f.scrolls).toEqual([]);
  f.dom.window.close();
});

for (const shift of [180, -180]) {
  test(`compensates a ${shift}px layout shift without moving the visible target`, async () => {
    const f = createFixture();
    const stop = anchorViewport({ target: f.b });
    expect(f.scrolls).toEqual([{ top: 300, behavior: "auto" }]);
    f.positions.b += shift;
    await f.changeLayout();
    expect(f.container.scrollTop).toBe(300 + shift);
    expect(f.b.getBoundingClientRect().top).toBe(200);
    stop();
    expect(f.container.style.getPropertyValue("overflow-anchor")).toBe("");
    expect(f.container.style.getPropertyValue("scroll-behavior")).toBe("");
    f.dom.window.close();
  });
}

test("follows a replacement Roam block with the same UID", async () => {
  const f = createFixture();
  const stop = anchorViewport({ target: f.b });
  const replacement = f.b.cloneNode(true) as HTMLElement;
  (replacement.firstElementChild as HTMLElement).getBoundingClientRect = () =>
    f.rect({ top: 660 - f.container.scrollTop });
  f.b.replaceWith(replacement);
  await Promise.resolve();
  expect(f.container.scrollTop).toBe(460);
  stop();
  f.dom.window.close();
});

for (const interruption of ["abort", "wheel", "touch", "hidden"] as const) {
  test(`releases anchoring on ${interruption} and restores existing scroll styles`, async () => {
    const f = createFixture();
    f.container.style.setProperty("overflow-anchor", "auto", "important");
    f.container.style.setProperty("scroll-behavior", "smooth", "important");
    const originalAnchor =
      f.container.style.getPropertyValue("overflow-anchor");
    const originalAnchorPriority =
      f.container.style.getPropertyPriority("overflow-anchor");
    const controller = new AbortController();
    const stop = anchorViewport({ target: f.b, signal: controller.signal });
    if (interruption === "abort") controller.abort();
    if (interruption === "wheel")
      f.container.dispatchEvent(new f.dom.window.Event("wheel"));
    if (interruption === "touch")
      f.container.dispatchEvent(new f.dom.window.Event("touchstart"));
    if (interruption === "hidden") {
      Object.defineProperty(f.doc, "hidden", { value: true });
      f.doc.dispatchEvent(new f.dom.window.Event("visibilitychange"));
    }
    f.positions.b += 180;
    f.container.scrollTop = 350;
    await f.changeLayout();
    expect(f.container.scrollTop).toBe(350);
    expect(f.container.style.getPropertyValue("overflow-anchor")).toBe(
      originalAnchor,
    );
    expect(f.container.style.getPropertyPriority("overflow-anchor")).toBe(
      originalAnchorPriority,
    );
    expect(f.container.style.getPropertyValue("scroll-behavior")).toBe(
      "smooth",
    );
    expect(f.container.style.getPropertyPriority("scroll-behavior")).toBe(
      "important",
    );
    stop();
    f.dom.window.close();
  });
}

test("anchors visible content instead of an offscreen destination", async () => {
  const f = createFixture();
  f.positions.b = 1300;
  const stop = anchorViewport({ target: f.b });
  f.positions.b -= 180;
  await f.changeLayout();
  expect(f.container.scrollTop).toBe(300);
  f.positions.a += 100;
  await f.changeLayout();
  expect(f.container.scrollTop).toBe(400);
  stop();
  f.dom.window.close();
});
