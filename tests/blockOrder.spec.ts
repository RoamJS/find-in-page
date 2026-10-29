import { expect, test } from "@playwright/test";
import type { PullBlock } from "roamjs-components/types";

import { flattenTreeToEntries } from "~/findInPage";
import { rankEntries } from "~/utils/searchRank";

test("flattening follows explicit sibling order throughout a nested page", () => {
  const rootNode: PullBlock = {
    ":block/uid": "page",
    ":block/children": [
      {
        ":block/uid": "bottom",
        ":block/string": "Target bottom",
        ":block/order": 2,
      },
      {
        ":block/uid": "parent",
        ":block/string": "A long prefix before target parent",
        ":block/order": 0,
        ":block/children": [
          {
            ":block/uid": "second-child",
            ":block/string": "Target second child",
            ":block/order": 1,
          },
          {
            ":block/uid": "first-child",
            ":block/string": "Nested target first child",
            ":block/order": 0,
          },
        ],
      },
      {
        ":block/uid": "middle",
        ":block/string": "Target middle",
        ":block/order": 1,
      },
    ],
  };

  const entries = flattenTreeToEntries({ rootNode });
  const expectedOrder = [
    "parent",
    "first-child",
    "second-child",
    "middle",
    "bottom",
  ];

  expect(entries.map(({ uid }) => uid)).toEqual(expectedOrder);
  expect(entries.map(({ order }) => order)).toEqual([0, 1, 2, 3, 4]);
  expect(entries[1].ancestors).toEqual(["parent"]);
  expect(entries[2].ancestors).toEqual(["parent"]);
  expect(
    rankEntries({ query: "target", entries }).map(({ uid }) => uid),
  ).toEqual(expectedOrder);
  expect(
    rootNode[":block/children"]?.map((child) => child[":block/uid"]),
  ).toEqual(["bottom", "parent", "middle"]);
});

test("missing sibling order preserves the supplied order at each level", () => {
  const entries = flattenTreeToEntries({
    rootNode: {
      ":block/uid": "page",
      ":block/children": [
        {
          ":block/uid": "parent",
          ":block/string": "Parent",
          ":block/children": [
            { ":block/uid": "first", ":block/string": "First" },
            { ":block/uid": "second", ":block/string": "Second" },
          ],
        },
        { ":block/uid": "sibling", ":block/string": "Sibling" },
      ],
    },
  });

  expect(entries.map(({ uid }) => uid)).toEqual([
    "parent",
    "first",
    "second",
    "sibling",
  ]);
});

test("equal sibling order remains stable", () => {
  const entries = flattenTreeToEntries({
    rootNode: {
      ":block/uid": "page",
      ":block/children": [
        { ":block/uid": "first", ":block/string": "First", ":block/order": 1 },
        {
          ":block/uid": "second",
          ":block/string": "Second",
          ":block/order": 1,
        },
        { ":block/uid": "last", ":block/string": "Last", ":block/order": 2 },
      ],
    },
  });

  expect(entries.map(({ uid }) => uid)).toEqual(["first", "second", "last"]);
});
