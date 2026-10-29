export type BlockSearchEntry = {
  uid: string;
  text: string;
  ancestors: string[];
  order: number;
};

export type RankedBlockSearchEntry = BlockSearchEntry & {
  score: number;
  start: number;
  end: number;
  occurrenceIndex: number;
};

export type MatchRange = {
  start: number;
  end: number;
};

export const getMatchRanges = ({
  query,
  text,
}: {
  query: string;
  text: string;
}): MatchRange[] => {
  const trimmedQuery = query.trim();
  if (!trimmedQuery) return [];

  const literalQuery = trimmedQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(literalQuery, "giu");
  return Array.from(text.matchAll(pattern), (match) => ({
    start: match.index,
    end: match.index + match[0].length,
  }));
};

export const getMatchScore = ({
  query,
  text,
}: {
  query: string;
  text: string;
}): number | null => {
  return getMatchRanges({ query, text })[0]?.start ?? null;
};

export const rankEntries = ({
  query,
  entries,
}: {
  query: string;
  entries: BlockSearchEntry[];
}): RankedBlockSearchEntry[] =>
  entries
    .reduce<RankedBlockSearchEntry[]>((acc, entry) => {
      getMatchRanges({ query, text: entry.text }).forEach(
        ({ start, end }, occurrenceIndex) =>
          acc.push({ ...entry, score: start, start, end, occurrenceIndex }),
      );
      return acc;
    }, [])
    .sort((a, b) => a.order - b.order);
