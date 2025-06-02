import { describe, it, expect } from "vitest";
import { treeData } from "./tree-data";
import { Hotspot } from "./hotspots";

describe("treeData", () => {
  it("should return the tree data", () => {
    {
      const hotspots: Hotspot[] = [
        { file: "file1.txt", complexity: 1, revisions: 1 },
        { file: "file2.txt", complexity: 2, revisions: 2 },
      ];
      const result = treeData(hotspots);

      expect(result).toEqual({
        name: "Root",
        children: [
          { name: "file1.txt", complexity: 1, revisions: 1 },
          { name: "file2.txt", complexity: 2, revisions: 2 },
        ],
      });
    }
    {
      const hotspots: Hotspot[] = [
        { file: "file1.txt", complexity: 1, revisions: 1 },
      ];
      const result = treeData(hotspots);

      expect(result).toEqual({
        name: "Root",
        children: [{ name: "file1.txt", complexity: 1, revisions: 1 }],
      });
    }
  });

  it("should handle folders", () => {
    const hotspots: Hotspot[] = [
      { file: "src/file1.txt", complexity: 1, revisions: 1 },
    ];

    const result = treeData(hotspots);

    expect(result).toEqual({
      name: "Root",
      children: [
        {
          name: "src",
          children: [{ name: "file1.txt", complexity: 1, revisions: 1 }],
        },
      ],
    });
  });
});
