import { describe, it, expect } from "vitest";

import { revisions } from "./revisions";

describe("Revisions", () => {
  it("should return an empty array if there are no revisions", () => {
    const result = revisions([]);
    expect(result).toEqual({});
  });

  it("should count each file change", () => {
    const result = revisions([[{ file: "file1.txt" }, { file: "file2.txt" }]]);
    expect(result).toEqual({
      "file1.txt": 1,
      "file2.txt": 1,
    });
  });

  it("should count each file change multiple times", () => {
    const result = revisions([
      [{ file: "file1.txt" }, { file: "file2.txt" }],
      [{ file: "file1.txt" }],
    ]);
    expect(result).toEqual({
      "file1.txt": 2,
      "file2.txt": 1,
    });
  });
});
