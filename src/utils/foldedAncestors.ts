import type { PullBlock } from "roamjs-components/types";

const FOLD_PATTERN = "[:block/uid :block/open]";

export const createFoldedAncestorManager = ({
  api,
  afterHostRender = async (): Promise<void> => undefined,
}: {
  api: Window["roamAlphaAPI"];
  afterHostRender?: () => Promise<void>;
}): {
  reveal: (args: {
    ancestors: string[];
    signal?: AbortSignal;
  }) => Promise<void>;
  restore: (args?: { keepAncestors?: string[] }) => Promise<void>;
} => {
  type Watch = {
    entity: string;
    callback: (before: PullBlock | null, after: PullBlock | null) => void;
  };
  const openedAncestors = new Map<string, Watch>();
  let queue = Promise.resolve();

  const forget = (uid: string): void => {
    const watch = openedAncestors.get(uid);
    if (!watch) return;
    openedAncestors.delete(uid);
    api.data.removePullWatch?.(FOLD_PATTERN, watch.entity, watch.callback);
  };

  const remember = (uid: string): void => {
    if (openedAncestors.has(uid)) return;
    const entity = `[:block/uid ${JSON.stringify(uid)}]`;
    const callback = (
      _before: PullBlock | null,
      after: PullBlock | null,
    ): void => {
      // A manual collapse gives ownership back to the user, including a later reopen.
      if (!after || after[":block/open"] === false) forget(uid);
    };
    openedAncestors.set(uid, { entity, callback });
    api.data.addPullWatch?.(FOLD_PATTERN, entity, callback);
  };

  const restoreUnused = async ({
    keep,
    signal,
  }: {
    keep: Set<string>;
    signal?: AbortSignal;
  }): Promise<void> => {
    // Children first restores nested folds before their parents hide them.
    for (const uid of [...openedAncestors.keys()].reverse()) {
      if (signal?.aborted) return;
      if (keep.has(uid)) continue;
      try {
        forget(uid);
        if (
          api.data.pull(FOLD_PATTERN, [":block/uid", uid])?.[":block/open"] ===
          true
        ) {
          await api.data.block.update({ block: { uid, open: false } });
        }
      } catch {
        // Deleted or read-only blocks must not prevent the remaining restoration.
      }
    }
  };

  const enqueue = (task: () => Promise<void>): Promise<void> => {
    // Serialize only fold writes, so cancelled rendering never blocks a new match.
    queue = queue.then(task);
    return queue;
  };

  return {
    reveal: ({ ancestors, signal }): Promise<void> =>
      enqueue(async () => {
        await restoreUnused({ keep: new Set(ancestors), signal });
        for (const uid of ancestors) {
          if (signal?.aborted) return;
          try {
            if (
              api.data.pull(FOLD_PATTERN, [":block/uid", uid])?.[
                ":block/open"
              ] !== false
            )
              continue;
            remember(uid);
            await api.data.block.update({ block: { uid, open: true } });
            // Roam must mount a parent before updating a folded child inside it.
            await afterHostRender();
          } catch {
            forget(uid);
            // Pages and special block renderers may not expose an open state.
          }
        }
      }),
    restore: ({ keepAncestors = [] } = {}): Promise<void> =>
      enqueue(async () => {
        await restoreUnused({ keep: new Set(keepAncestors) });
        // Editing hands these ancestors back to Roam instead of hiding the editor.
        for (const uid of [...openedAncestors.keys()]) forget(uid);
      }),
  };
};
