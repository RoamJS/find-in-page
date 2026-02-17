export type BlockSearchEntry = {
  uid: string;
  text: string;
  ancestors: string[];
  order: number;
};

export type RankedBlockSearchEntry = BlockSearchEntry & {
  score: number;
};

const normalize = ({ value }: { value: string }): string =>
  value.trim().toLowerCase();

export const getMatchScore = ({
  query,
  text,
}: {
  query: string;
  text: string;
}): number | null => {
  const normalizedQuery = normalize({ value: query });
  if (!normalizedQuery) {
    return null;
  }

  const normalizedText = text.toLowerCase();
  const substringIndex = normalizedText.indexOf(normalizedQuery);
  return substringIndex >= 0 ? substringIndex : null;
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
      const score = getMatchScore({ query, text: entry.text });
      if (score !== null) {
        acc.push({ ...entry, score });
      }
      return acc;
    }, [])
    .sort((a, b) => a.score - b.score || a.order - b.order);
