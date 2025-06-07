import { describe, it, expect } from "vitest";
import { hotspots } from "./hotspots";

describe("Hotspots", () => {
  it("should return an empty array if there are no hotspots", async () => {
    const result = await hotspots({}, async () => "");
    expect(result).toEqual([]);
  });

  it("should read each file", async () => {
    const files: string[] = [];

    await hotspots({ "file1.txt": 1, "file2.txt": 1 }, async (file) => {
      files.push(file);
      return file;
    });

    expect(files).toEqual(["file1.txt", "file2.txt"]);
  });

  it("should return the complexity of each file and sort them by `complexity * revisions`", async () => {
    const fileSystem = {
      "file1.txt": "line1\nline2",
      "file2.txt": "line1\nline2\nline3",
    };

    const result = await hotspots(
      { "file1.txt": 1, "file2.txt": 1 },
      async (file) => fileSystem[file]
    );

    expect(result).toEqual([
      { file: "file2.txt", complexity: 3, revisions: 1 },
      { file: "file1.txt", complexity: 2, revisions: 1 },
    ]);
  });
});
