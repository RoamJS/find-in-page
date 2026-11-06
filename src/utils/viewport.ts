const VIEWPORT_MARGIN = 48;
const COPIED_CONTENT_SELECTOR =
  ".rm-embed-container, .rm-block-ref, .rm-query, .rm-reference-container, .rm-reference-main, .rm-mentions, .rm-reference-item";

const getScrollContainer = (element: HTMLElement): HTMLElement | null => {
  const view = element.ownerDocument.defaultView;
  for (
    let parent = element.parentElement;
    parent;
    parent = parent.parentElement
  ) {
    if (
      parent.clientHeight &&
      /auto|scroll|overlay/.test(view?.getComputedStyle(parent).overflowY ?? "")
    )
      return parent;
  }
  return element.ownerDocument.scrollingElement as HTMLElement | null;
};

const getViewport = ({
  element,
  rect,
}: {
  element: HTMLElement;
  rect: DOMRect;
}): {
  container: HTMLElement | null;
  top: number;
  bottom: number;
} => {
  const doc = element.ownerDocument;
  const container = getScrollContainer(element);
  const view = doc.defaultView;
  const bounds =
    container && container !== doc.scrollingElement
      ? container.getBoundingClientRect()
      : null;
  const top = Math.max(0, bounds?.top ?? 0);
  const bottom = Math.min(
    view?.innerHeight ?? 0,
    bounds?.bottom ?? view?.innerHeight ?? 0,
  );
  const margin = Math.min(VIEWPORT_MARGIN, Math.max(0, bottom - top) / 5);
  const panel = doc
    .getElementById("roamjs-find-in-page-panel")
    ?.getBoundingClientRect();
  const panelOverlaps =
    panel &&
    rect.right > panel.left &&
    rect.left < panel.right &&
    panel.top < top + margin;
  return {
    container,
    top: Math.max(top + margin, panelOverlaps ? panel.bottom + 16 : top),
    bottom: bottom - margin,
  };
};

export const scrollTextRectIntoView = ({
  element,
  rect,
}: {
  element: HTMLElement;
  rect: DOMRect;
}): void => {
  const { container, top, bottom } = getViewport({ element, rect });
  if (bottom <= top || (rect.top >= top && rect.bottom <= bottom)) return;
  const delta =
    rect.top < top || rect.height > bottom - top
      ? rect.top - top
      : rect.bottom - bottom;
  if (container)
    container.scrollTo({
      top: container.scrollTop + delta,
      behavior: "smooth",
    });
  else
    element.ownerDocument.defaultView?.scrollBy({
      top: delta,
      behavior: "smooth",
    });
};

export const anchorViewport = ({
  target,
  signal,
}: {
  target?: HTMLElement | null;
  signal?: AbortSignal;
} = {}): (() => void) => {
  const doc =
    target?.ownerDocument ??
    (typeof document === "undefined" ? null : document);
  const view = doc?.defaultView;
  if (!doc || !view || signal?.aborted || doc.hidden) return () => undefined;
  const main = doc.querySelector(".roam-body-main") ?? doc.body;
  const getRow = (element: HTMLElement): HTMLElement =>
    element.querySelector<HTMLElement>(":scope > .rm-block-main") ?? element;
  const isVisible = (block: HTMLElement): boolean => {
    const rect = getRow(block).getBoundingClientRect();
    const { top, bottom } = getViewport({ element: block, rect });
    return rect.height > 0 && rect.bottom > top && rect.top < bottom;
  };
  const anchor =
    target && isVisible(target)
      ? target
      : Array.from(
          main.querySelectorAll<HTMLElement>(
            ".roam-block-container[data-block-uid]",
          ),
        ).find(
          (block) =>
            !block.parentElement?.closest(".roam-block-container") &&
            !block.closest(COPIED_CONTENT_SELECTOR) &&
            isVisible(block),
        );
  if (!anchor) return () => undefined;
  const container = getScrollContainer(anchor);
  if (!container) return () => undefined;
  const uid = anchor.getAttribute("data-block-uid");
  const escapedUid = uid?.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  const initialTop = getRow(anchor).getBoundingClientRect().top;
  const originalAnchor = container.style.getPropertyValue("overflow-anchor");
  const originalAnchorPriority =
    container.style.getPropertyPriority("overflow-anchor");
  const originalBehavior = container.style.getPropertyValue("scroll-behavior");
  const originalBehaviorPriority =
    container.style.getPropertyPriority("scroll-behavior");
  container.style.setProperty("overflow-anchor", "none");
  container.style.setProperty("scroll-behavior", "auto");
  // Stop an earlier smooth scroll before measuring layout changes for a new match.
  container.scrollTo({ top: container.scrollTop, behavior: "auto" });
  let stopped = false;
  let frame: number | null = null;
  const adjust = (): void => {
    if (stopped) return;
    const current = uid
      ? Array.from(
          main.querySelectorAll<HTMLElement>(
            `[data-block-uid="${escapedUid}"]`,
          ),
        ).find((block) => !block.closest(COPIED_CONTENT_SELECTOR))
      : anchor;
    if (!current?.isConnected) return;
    const delta = getRow(current).getBoundingClientRect().top - initialTop;
    if (Math.abs(delta) > 0.5) container.scrollTop += delta;
  };
  const observer = new view.MutationObserver(adjust);
  observer.observe(main, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
    attributeFilter: ["class"],
  });
  const tick = (): void => {
    adjust();
    if (!stopped) frame = view.requestAnimationFrame(tick);
  };
  frame = view.requestAnimationFrame(tick);
  const stop = (): void => {
    if (stopped) return;
    adjust();
    stopped = true;
    observer.disconnect();
    if (frame !== null) view.cancelAnimationFrame(frame);
    container.style.setProperty(
      "overflow-anchor",
      originalAnchor,
      originalAnchorPriority,
    );
    container.style.setProperty(
      "scroll-behavior",
      originalBehavior,
      originalBehaviorPriority,
    );
    signal?.removeEventListener("abort", stop);
    container.removeEventListener("wheel", stop);
    container.removeEventListener("touchstart", stop);
    doc.removeEventListener("visibilitychange", onVisibilityChange);
  };
  const onVisibilityChange = (): void => {
    if (doc.hidden) stop();
  };
  signal?.addEventListener("abort", stop, { once: true });
  container.addEventListener("wheel", stop, { passive: true });
  container.addEventListener("touchstart", stop, { passive: true });
  doc.addEventListener("visibilitychange", onVisibilityChange);
  return stop;
};
