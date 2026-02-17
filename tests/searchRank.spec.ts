import { expect, test } from "@playwright/test";

import {
  getMatchScore,
  rankEntries,
  type BlockSearchEntry,
} from "../src/utils/searchRank";

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

test("getMatchScore prioritizes substring matches", () => {
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

test("rankEntries sorts matches by score then original order", () => {
  const ranked = rankEntries({ query: "project", entries: makeEntries() });
  expect(ranked.map((entry) => entry.uid)).toEqual(["a1", "b1"]);
});

test("rankEntries supports exact multi-word substring matching", () => {
  const ranked = rankEntries({ query: "report for", entries: makeEntries() });
  expect(ranked.map((entry) => entry.uid)).toEqual(["c1"]);
});

test("rankEntries does not return split-term matches", () => {
  const ranked = rankEntries({ query: "progress sprint", entries: makeEntries() });
  expect(ranked).toEqual([]);
});

test("rankEntries returns empty when no entries match", () => {
  expect(rankEntries({ query: "xyz", entries: makeEntries() })).toEqual([]);
});
