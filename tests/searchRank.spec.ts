import { expect, test } from "@playwright/test";

import {
  getMatchScore,
  getMatchRanges,
  rankEntries,
  type BlockSearchEntry,
} from "~/utils/searchRank";

const makeEntries = (): BlockSearchEntry[] => [
  {
    uid: "a1",
    text: "Project roadmap and milestones",
    ancestors: [],
    order: 0,
  },
  {
    uid: "b1",
    text: "Archive old project notes",
    ancestors: [],
    order: 1,
  },
  {
    uid: "c1",
    text: "Progress report for sprint",
    ancestors: [],
    order: 2,
  },
];

test("getMatchScore returns null for empty query", () => {
  expect(getMatchScore({ query: "   ", text: "hello world" })).toBeNull();
});

test("getMatchScore returns the exact substring position", () => {
  expect(
    getMatchScore({
      query: "road",
      text: "Project roadmap and milestones",
    }),
  ).toBe(8);
});

test("getMatchScore does not match fuzzy subsequences", () => {
  expect(
    getMatchScore({
      query: "prgss",
      text: "Progress report for sprint",
    }),
  ).toBeNull();
});

test("rankEntries preserves page traversal order", () => {
  const ranked = rankEntries({ query: "project", entries: makeEntries() });
  expect(ranked.map((entry) => entry.uid)).toEqual(["a1", "b1"]);
});

test("character offsets do not reorder matching blocks", () => {
  const entries: BlockSearchEntry[] = [
    { uid: "bottom", text: "Target first in text", ancestors: [], order: 2 },
    {
      uid: "top",
      text: "A long prefix before target",
      ancestors: [],
      order: 0,
    },
    { uid: "middle", text: "Middle target", ancestors: [], order: 1 },
  ];

  const ranked = rankEntries({ query: "target", entries });

  expect(ranked.map(({ uid }) => uid)).toEqual(["top", "middle", "bottom"]);
  expect(ranked.map(({ score }) => score)).toEqual([21, 7, 0]);
  expect(entries.map(({ uid }) => uid)).toEqual(["bottom", "top", "middle"]);
});

test("search ignores query case and surrounding whitespace", () => {
  const ranked = rankEntries({ query: "  PROJECT  ", entries: makeEntries() });

  expect(ranked.map(({ uid }) => uid)).toEqual(["a1", "b1"]);
});

test("substring matches include text within a longer word", () => {
  const ranked = rankEntries({ query: "road", entries: makeEntries() });

  expect(ranked.map(({ uid }) => uid)).toEqual(["a1"]);
});

test("rankEntries supports exact multi-word substring matching", () => {
  const ranked = rankEntries({ query: "report for", entries: makeEntries() });
  expect(ranked.map((entry) => entry.uid)).toEqual(["c1"]);
});

test("rankEntries does not return split-term matches", () => {
  const ranked = rankEntries({
    query: "progress sprint",
    entries: makeEntries(),
  });
  expect(ranked).toEqual([]);
});

test("rankEntries returns empty when no entries match", () => {
  expect(rankEntries({ query: "xyz", entries: makeEntries() })).toEqual([]);
});

test("every occurrence has its own original-text selection range", () => {
  const text = "Lorem ipsum lorem IPSUM lorem";
  const ranked = rankEntries({
    query: "  LoReM  ",
    entries: [{ uid: "repeated", text, ancestors: ["parent"], order: 0 }],
  });

  expect(
    ranked.map(({ start, end, occurrenceIndex, score }) => ({
      start,
      end,
      occurrenceIndex,
      score,
    })),
  ).toEqual([
    { start: 0, end: 5, occurrenceIndex: 0, score: 0 },
    { start: 12, end: 17, occurrenceIndex: 1, score: 12 },
    { start: 24, end: 29, occurrenceIndex: 2, score: 24 },
  ]);
  expect(ranked.map(({ uid, ancestors }) => ({ uid, ancestors }))).toEqual([
    { uid: "repeated", ancestors: ["parent"] },
    { uid: "repeated", ancestors: ["parent"] },
    { uid: "repeated", ancestors: ["parent"] },
  ]);
  expect(ranked.map(({ start, end }) => text.slice(start, end))).toEqual([
    "Lorem",
    "lorem",
    "lorem",
  ]);
});

test("occurrences follow page order before their position within each block", () => {
  const ranked = rankEntries({
    query: "target",
    entries: [
      { uid: "bottom", text: "target target", ancestors: [], order: 2 },
      {
        uid: "top",
        text: "prefix target then target",
        ancestors: [],
        order: 0,
      },
      { uid: "middle", text: "target", ancestors: [], order: 1 },
    ],
  });

  expect(
    ranked.map(({ uid, start, occurrenceIndex }) => ({
      uid,
      start,
      occurrenceIndex,
    })),
  ).toEqual([
    { uid: "top", start: 7, occurrenceIndex: 0 },
    { uid: "top", start: 19, occurrenceIndex: 1 },
    { uid: "middle", start: 0, occurrenceIndex: 0 },
    { uid: "bottom", start: 0, occurrenceIndex: 0 },
    { uid: "bottom", start: 7, occurrenceIndex: 1 },
  ]);
});

test("substring occurrences do not overlap", () => {
  expect(getMatchRanges({ query: "aa", text: "aaaaa" })).toEqual([
    { start: 0, end: 2 },
    { start: 2, end: 4 },
  ]);
});

test("query punctuation is matched literally", () => {
  const query = "[a].*+?^${}()|\\";
  expect(getMatchRanges({ query, text: `${query} ${query}` })).toEqual([
    { start: 0, end: query.length },
    { start: query.length + 1, end: query.length * 2 + 1 },
  ]);
});

test("selection offsets use the original string after emoji and Unicode text", () => {
  const text = "😀 İ Écho éCHO";
  const ranges = getMatchRanges({ query: "écho", text });

  expect(ranges).toEqual([
    { start: 5, end: 9 },
    { start: 10, end: 14 },
  ]);
  expect(ranges.map(({ start, end }) => text.slice(start, end))).toEqual([
    "Écho",
    "éCHO",
  ]);
});

test("empty queries produce no occurrence results", () => {
  expect(getMatchRanges({ query: " \t ", text: "example" })).toEqual([]);
  expect(rankEntries({ query: "", entries: makeEntries() })).toEqual([]);
});
