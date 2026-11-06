import { expect, test } from "@playwright/test";
import type { PullBlock } from "roamjs-components/types";

import { createFoldedAncestorManager } from "~/utils/foldedAncestors";

const createFixture = (
  initial: Record<string, boolean>,
): {
  api: Window["roamAlphaAPI"];
  states: Map<string, boolean>;
  writes: { uid: string; open: boolean }[];
  watches: Map<
    string,
    (before: PullBlock | null, after: PullBlock | null) => void
  >;
  manualFold: (args: { uid: string; open: boolean }) => void;
} => {
  const states = new Map(Object.entries(initial));
  const writes: { uid: string; open: boolean }[] = [];
  const watches = new Map<
    string,
    (before: PullBlock | null, after: PullBlock | null) => void
  >();
  const manualFold = ({ uid, open }: { uid: string; open: boolean }): void => {
    const before = { ":block/uid": uid, ":block/open": states.get(uid) };
    states.set(uid, open);
    watches.get(uid)?.(before, { ":block/uid": uid, ":block/open": open });
  };
  return {
    states,
    writes,
    watches,
    manualFold,
    api: {
      data: {
        pull: (_pattern: string, id: [string, string]): PullBlock | null =>
          states.has(id[1])
            ? { ":block/uid": id[1], ":block/open": states.get(id[1]) }
            : null,
        block: {
          update: async ({
            block,
          }: {
            block: { uid: string; open: boolean };
          }): Promise<void> => {
            writes.push(block);
            manualFold(block);
          },
        },
        addPullWatch: (
          _pattern: string,
          entity: string,
          callback: (before: PullBlock | null, after: PullBlock | null) => void,
        ): boolean => {
          watches.set(JSON.parse(entity.slice(12, -1)), callback);
          return true;
        },
        removePullWatch: (_pattern: string, entity: string): boolean =>
          watches.delete(JSON.parse(entity.slice(12, -1))),
      },
    } as unknown as Window["roamAlphaAPI"],
  };
};

test("refolds only the departed branch, preserves shared ancestors, and restores children first on close", async () => {
  const f = createFixture({
    shared: false,
    a: false,
    b: false,
    expanded: true,
  });
  const folds = createFoldedAncestorManager({ api: f.api });
  await folds.reveal({ ancestors: ["expanded", "shared", "a"] });
  await folds.reveal({ ancestors: ["expanded", "shared", "b"] });
  expect(f.writes).toEqual([
    { uid: "shared", open: true },
    { uid: "a", open: true },
    { uid: "a", open: false },
    { uid: "b", open: true },
  ]);
  await folds.restore();
  expect(f.writes.slice(-2)).toEqual([
    { uid: "b", open: false },
    { uid: "shared", open: false },
  ]);
  expect(Object.fromEntries(f.states)).toEqual({
    shared: false,
    a: false,
    b: false,
    expanded: true,
  });
  expect(f.watches.size).toBe(0);
});

test("repeated occurrences in one branch do not toggle its parents", async () => {
  const f = createFixture({ a: false });
  const folds = createFoldedAncestorManager({ api: f.api });
  await folds.reveal({ ancestors: ["a"] });
  await folds.reveal({ ancestors: ["a"] });
  expect(f.writes).toEqual([{ uid: "a", open: true }]);
  await folds.restore();
});

test("manual collapse and reopen relinquishes restoration ownership", async () => {
  const f = createFixture({ a: false });
  const folds = createFoldedAncestorManager({ api: f.api });
  await folds.reveal({ ancestors: ["a"] });
  f.manualFold({ uid: "a", open: false });
  f.manualFold({ uid: "a", open: true });
  await folds.restore();
  expect(f.states.get("a")).toBe(true);
  expect(f.writes).toEqual([{ uid: "a", open: true }]);
  expect(f.watches.size).toBe(0);
});

test("closing while an opening write is pending still restores it and skips deeper ancestors", async () => {
  const f = createFixture({ a: false, b: false });
  let resume!: () => void;
  const paused = new Promise<void>((resolve) => {
    resume = resolve;
  });
  let started!: () => void;
  const starting = new Promise<void>((resolve) => {
    started = resolve;
  });
  const update = f.api.data.block.update;
  f.api.data.block.update = async (args): Promise<void> => {
    if (args.block?.open) {
      started();
      await paused;
    }
    await update(args);
  };
  const folds = createFoldedAncestorManager({ api: f.api });
  const controller = new AbortController();
  const opening = folds.reveal({
    ancestors: ["a", "b"],
    signal: controller.signal,
  });
  await starting;
  controller.abort();
  const closing = folds.restore();
  resume();
  await Promise.all([opening, closing]);
  expect(f.writes).toEqual([
    { uid: "a", open: true },
    { uid: "a", open: false },
  ]);
  expect(f.states.get("b")).toBe(false);
  expect(f.watches.size).toBe(0);
});

test("a superseded transition cannot refold the newest match's branch", async () => {
  const f = createFixture({ a: false, b: false });
  const folds = createFoldedAncestorManager({ api: f.api });
  await folds.reveal({ ancestors: ["a"] });
  const controller = new AbortController();
  const old = folds.reveal({ ancestors: ["b"], signal: controller.signal });
  controller.abort();
  const latest = folds.reveal({ ancestors: ["a"] });
  await Promise.all([old, latest]);
  expect(f.writes).toEqual([{ uid: "a", open: true }]);
  await folds.restore();
});

test("editing keeps its ancestors open and removes their watches", async () => {
  const f = createFixture({ a: false, child: false });
  const folds = createFoldedAncestorManager({ api: f.api });
  await folds.reveal({ ancestors: ["a", "child"] });
  await folds.restore({ keepAncestors: ["a", "child"] });
  await folds.restore();
  expect(Object.fromEntries(f.states)).toEqual({ a: true, child: true });
  expect(f.watches.size).toBe(0);
});

test("unsupported ancestors and a failed opening write do not stop later ancestors", async () => {
  const f = createFixture({ unsupported: false, a: false });
  const update = f.api.data.block.update;
  f.api.data.block.update = async (args): Promise<void> => {
    if (args.block?.uid === "unsupported") throw new Error("Read only");
    await update(args);
  };
  const folds = createFoldedAncestorManager({ api: f.api });
  await folds.reveal({ ancestors: ["page", "unsupported", "a"] });
  await folds.restore();
  expect(f.writes).toEqual([
    { uid: "a", open: true },
    { uid: "a", open: false },
  ]);
  expect(f.watches.size).toBe(0);
});

for (const nextAction of ["restore", "reveal"] as const) {
  test(`cancelled rendering does not block ${nextAction}`, async () => {
    test.setTimeout(2000);
    const f = createFixture({ a: false, b: false });
    let resumeRender!: () => void;
    const rendering = new Promise<void>((resolve) => {
      resumeRender = resolve;
    });
    let renderStarted!: () => void;
    const starting = new Promise<void>((resolve) => {
      renderStarted = resolve;
    });
    let renderCount = 0;
    const folds = createFoldedAncestorManager({
      api: f.api,
      afterHostRender: async (): Promise<void> => {
        renderCount += 1;
        if (renderCount > 1) return;
        renderStarted();
        await rendering;
      },
    });
    const controller = new AbortController();
    const original = folds.reveal({
      ancestors: ["a"],
      signal: controller.signal,
    });
    await starting;
    controller.abort();
    if (nextAction === "restore") await folds.restore();
    else await folds.reveal({ ancestors: ["b"] });
    expect(Object.fromEntries(f.states)).toEqual({
      a: false,
      b: nextAction === "reveal",
    });
    const writesBeforeOldRender = [...f.writes];
    resumeRender();
    await original;
    expect(f.writes).toEqual(writesBeforeOldRender);
    await folds.restore();
    expect(f.watches.size).toBe(0);
  });
}
