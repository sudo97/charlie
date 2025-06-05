import { describe, it, expect } from "vitest";

import { applyFilters } from "./filters";
import { type LogItem } from "./revisions";
import { type Config } from "../cli/config";

describe("applyFilters", () => {
  const createLogItem = (fileNames: string[]): LogItem => ({
    hash: "abc123",
    date: "2021-01-01",
    author: "John Doe",
    fileEntries: fileNames.map((fileName) => ({
      fileName,
      added: 10,
      removed: 5,
    })),
  });

  const createConfig = (
    include: string[] = [],
    exclude: string[] = []
  ): Config => ({
    include: include.map((pattern) => new RegExp(pattern)),
    exclude: exclude.map((pattern) => new RegExp(pattern)),
    after: new Date(),
  });

  it("should return empty array when input is empty", () => {
    const config = createConfig();
    const result = applyFilters([], config);
    expect(result).toEqual([]);
  });

  it("should return all items when no filters are applied", () => {
    const items = [
      createLogItem(["file1.js", "file2.ts"]),
      createLogItem(["file3.py", "file4.md"]),
    ];
    const config = createConfig();
    const result = applyFilters(items, config);
    expect(result).toEqual(items);
  });

  describe("include filters", () => {
    it("should include only files matching include patterns", () => {
      const items = [
        createLogItem(["src/app.js", "src/utils.js", "README.md"]),
        createLogItem(["test/app.test.js", "docs/guide.md"]),
      ];
      const config = createConfig(["\\.js$"]);
      const result = applyFilters(items, config);

      expect(result).toHaveLength(2);
      expect(result[0].fileEntries).toEqual([
        { fileName: "src/app.js", added: 10, removed: 5 },
        { fileName: "src/utils.js", added: 10, removed: 5 },
      ]);
      expect(result[1].fileEntries).toEqual([
        { fileName: "test/app.test.js", added: 10, removed: 5 },
      ]);
    });

    it("should support multiple include patterns", () => {
      const items = [
        createLogItem(["app.js", "styles.css", "README.md", "config.json"]),
      ];
      const config = createConfig(["\\.js$", "\\.css$"]);
      const result = applyFilters(items, config);

      expect(result).toHaveLength(1);
      expect(result[0].fileEntries).toEqual([
        { fileName: "app.js", added: 10, removed: 5 },
        { fileName: "styles.css", added: 10, removed: 5 },
      ]);
    });

    it("should filter out commits with no matching files", () => {
      const items = [
        createLogItem(["app.js", "utils.js"]),
        createLogItem(["README.md", "LICENSE"]),
        createLogItem(["test.js"]),
      ];
      const config = createConfig(["\\.js$"]);
      const result = applyFilters(items, config);

      expect(result).toHaveLength(2);
      expect(result[0].fileEntries.map((f) => f.fileName)).toEqual([
        "app.js",
        "utils.js",
      ]);
      expect(result[1].fileEntries.map((f) => f.fileName)).toEqual(["test.js"]);
    });
  });

  describe("exclude filters", () => {
    it("should exclude files matching exclude patterns", () => {
      const items = [
        createLogItem(["src/app.js", "src/app.test.js", "README.md"]),
      ];
      const config = createConfig([], ["\\.test\\.js$"]);
      const result = applyFilters(items, config);

      expect(result).toHaveLength(1);
      expect(result[0].fileEntries).toEqual([
        { fileName: "src/app.js", added: 10, removed: 5 },
        { fileName: "README.md", added: 10, removed: 5 },
      ]);
    });

    it("should support multiple exclude patterns", () => {
      const items = [
        createLogItem([
          "src/app.js",
          "src/app.test.js",
          "README.md",
          "package-lock.json",
        ]),
      ];
      const config = createConfig(
        [],
        ["\\.test\\.js$", "package-lock\\.json$"]
      );
      const result = applyFilters(items, config);

      expect(result).toHaveLength(1);
      expect(result[0].fileEntries).toEqual([
        { fileName: "src/app.js", added: 10, removed: 5 },
        { fileName: "README.md", added: 10, removed: 5 },
      ]);
    });

    it("should filter out commits with all files excluded", () => {
      const items = [
        createLogItem(["app.js", "utils.js"]),
        createLogItem(["test1.test.js", "test2.test.js"]),
        createLogItem(["README.md"]),
      ];
      const config = createConfig([], ["\\.test\\.js$"]);
      const result = applyFilters(items, config);

      expect(result).toHaveLength(2);
      expect(result[0].fileEntries.map((f) => f.fileName)).toEqual([
        "app.js",
        "utils.js",
      ]);
      expect(result[1].fileEntries.map((f) => f.fileName)).toEqual([
        "README.md",
      ]);
    });
  });

  describe("combined include and exclude filters", () => {
    it("should apply both include and exclude filters", () => {
      const items = [
        createLogItem([
          "src/app.js",
          "src/app.test.js",
          "src/utils.js",
          "README.md",
        ]),
      ];
      const config = createConfig(["\\.js$"], ["\\.test\\.js$"]);
      const result = applyFilters(items, config);

      expect(result).toHaveLength(1);
      expect(result[0].fileEntries).toEqual([
        { fileName: "src/app.js", added: 10, removed: 5 },
        { fileName: "src/utils.js", added: 10, removed: 5 },
      ]);
    });

    it("should exclude files even if they match include pattern", () => {
      const items = [createLogItem(["important.test.js", "regular.js"])];
      const config = createConfig(["\\.js$"], ["\\.test\\.js$"]);
      const result = applyFilters(items, config);

      expect(result).toHaveLength(1);
      expect(result[0].fileEntries).toEqual([
        { fileName: "regular.js", added: 10, removed: 5 },
      ]);
    });

    it("should filter out commits when all included files are excluded", () => {
      const items = [
        createLogItem(["app.test.js", "utils.test.js"]),
        createLogItem(["regular.js"]),
      ];
      const config = createConfig(["\\.js$"], ["\\.test\\.js$"]);
      const result = applyFilters(items, config);

      expect(result).toHaveLength(1);
      expect(result[0].fileEntries.map((f) => f.fileName)).toEqual([
        "regular.js",
      ]);
    });
  });

  describe("regex pattern matching", () => {
    it("should support complex regex patterns", () => {
      const items = [
        createLogItem([
          "src/components/Button.tsx",
          "src/components/Input.jsx",
          "src/utils/helper.js",
          "tests/Button.test.tsx",
        ]),
      ];
      const config = createConfig(["src/.*\\.(tsx|jsx)$"]);
      const result = applyFilters(items, config);

      expect(result).toHaveLength(1);
      expect(result[0].fileEntries).toEqual([
        { fileName: "src/components/Button.tsx", added: 10, removed: 5 },
        { fileName: "src/components/Input.jsx", added: 10, removed: 5 },
      ]);
    });

    it("should handle case-sensitive patterns", () => {
      const items = [createLogItem(["README.md", "readme.txt"])];
      const config = createConfig(["README"]);
      const result = applyFilters(items, config);

      expect(result).toHaveLength(1);
      expect(result[0].fileEntries).toEqual([
        { fileName: "README.md", added: 10, removed: 5 },
      ]);
    });

    it("should handle patterns with special regex characters", () => {
      const items = [
        createLogItem(["file.txt", "file(1).txt", "file[backup].txt"]),
      ];
      const config = createConfig(["file\\(1\\)\\.txt$"]);
      const result = applyFilters(items, config);

      expect(result).toHaveLength(1);
      expect(result[0].fileEntries).toEqual([
        { fileName: "file(1).txt", added: 10, removed: 5 },
      ]);
    });
  });

  describe("edge cases", () => {
    it("should handle commits with no file entries", () => {
      const items = [
        {
          hash: "abc123",
          date: "2021-01-01",
          author: "John Doe",
          fileEntries: [],
        },
      ];
      const config = createConfig();
      const result = applyFilters(items, config);

      expect(result).toEqual([]);
    });

    it("should preserve other log item properties", () => {
      const items = [
        {
          hash: "abc123",
          date: "2021-01-01",
          author: "John Doe",
          fileEntries: [{ fileName: "app.js", added: 15, removed: 3 }],
        },
      ];
      const config = createConfig();
      const result = applyFilters(items, config);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        hash: "abc123",
        date: "2021-01-01",
        author: "John Doe",
        fileEntries: [{ fileName: "app.js", added: 15, removed: 3 }],
      });
    });

    it("should handle empty include and exclude arrays", () => {
      const items = [createLogItem(["file1.js", "file2.py"])];
      const config = createConfig([], []);
      const result = applyFilters(items, config);

      expect(result).toEqual(items);
    });
  });
});
