import { describe, it, expect } from "vitest";
import { parseLogItem } from "./parse-log.js";

const sampleLog1 = `
'--6d0f6d10a--2024-06-03--John Doe'
1       0       .docker/backend/file
17      0       backend/src/app/api.ts
17      0       backend/src/app/config/dashboard.ts
1       0       backend/src/package.json
4       1       frontend/src/app/app.svelte
1       1       frontend/src/package.json
48      45      package-lock.json
`.trim();

const sampleLog2 = `
'--6d0f6d14b--2024-06-04--Jededaia'
`.trim();

describe("parse logitem", () => {
  it("parses hash", () => {
    expect(parseLogItem(sampleLog1).hash).toEqual("6d0f6d10a");
    expect(parseLogItem(sampleLog2).hash).toEqual("6d0f6d14b");
  });

  it("parses date", () => {
    expect(parseLogItem(sampleLog1).date).toEqual("2024-06-03");
    expect(parseLogItem(sampleLog2).date).toEqual("2024-06-04");
  });

  it("parses author", () => {
    expect(parseLogItem(sampleLog1).author).toEqual("John Doe");
    expect(parseLogItem(sampleLog2).author).toEqual("Jededaia");
  });

  it("parses file entries", () => {
    expect(parseLogItem(sampleLog1).fileEntries).toEqual([
      {
        added: 1,
        removed: 0,
        fileName: ".docker/backend/file",
      },
      { added: 17, removed: 0, fileName: "backend/src/app/api.ts" },
      {
        added: 17,
        removed: 0,
        fileName: "backend/src/app/config/dashboard.ts",
      },
      { added: 1, removed: 0, fileName: "backend/src/package.json" },
      { added: 4, removed: 1, fileName: "frontend/src/app/app.svelte" },
      { added: 1, removed: 1, fileName: "frontend/src/package.json" },
      { added: 48, removed: 45, fileName: "package-lock.json" },
    ]);
  });
});
