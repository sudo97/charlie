import { describe, it, expect } from "vitest";
import { CoupledPair, coupledPairs } from "./coupled-pairs.js";
import { LogItem } from "./revisions.js";

describe("coupledPairs", () => {
  it("should return an empty array if there are no revisions", () => {
    const revisions: LogItem[] = [];
    const result = coupledPairs(revisions);
    expect(result).toEqual([]);
  });

  it("should return an empty array if there is only one revision", () => {
    const revisions: LogItem[] = [
      {
        hash: "123456",
        date: "2024-01-01",
        author: "John Doe",
        fileEntries: [{ fileName: "file.txt", added: 1, removed: 1 }],
      },
    ];
    const result = coupledPairs(revisions);
    expect(result).toEqual([]);
  });

  it("should find a pair", () => {
    const revisions: LogItem[] = [
      {
        hash: "123456",
        date: "2024-01-01",
        author: "John Doe",
        fileEntries: [
          { fileName: "file.txt", added: 1, removed: 1 },
          { fileName: "file2.txt", added: 1, removed: 1 },
        ],
      },
    ];
    const result = coupledPairs(revisions);
    expect(result).toEqual<CoupledPair[]>([
      {
        file1: "file.txt",
        file2: "file2.txt",
        percentage: 1,
        revisions: 1,
      },
    ]);
  });

  it("should handle more than two files in a commit", () => {
    const revisions: LogItem[] = [
      {
        hash: "123456",
        date: "2024-01-01",
        author: "John Doe",
        fileEntries: [
          { fileName: "file.txt", added: 1, removed: 1 },
          { fileName: "file2.txt", added: 1, removed: 1 },
          { fileName: "file3.txt", added: 1, removed: 1 },
        ],
      },
    ];
    const result = coupledPairs(revisions);
    expect(result).toEqual<CoupledPair[]>([
      {
        file1: "file.txt",
        file2: "file2.txt",
        percentage: 1,
        revisions: 1,
      },
      {
        file1: "file.txt",
        file2: "file3.txt",
        percentage: 1,
        revisions: 1,
      },
      {
        file1: "file2.txt",
        file2: "file3.txt",
        percentage: 1,
        revisions: 1,
      },
    ]);
  });

  it("should calculate percentage", () => {
    const revisions: LogItem[] = [
      {
        hash: "123456",
        date: "2024-01-01",
        author: "John Doe",
        fileEntries: [{ fileName: "file.txt", added: 1, removed: 1 }],
      },
      {
        hash: "123456",
        date: "2024-01-01",
        author: "John Doe",
        fileEntries: [
          { fileName: "file.txt", added: 1, removed: 1 },
          { fileName: "file2.txt", added: 1, removed: 1 },
        ],
      },
    ];
    const result = coupledPairs(revisions);
    expect(result).toEqual<CoupledPair[]>([
      {
        file1: "file.txt",
        file2: "file2.txt",
        percentage: 0.5,
        revisions: 2,
      },
    ]);
  });

  it("should sort by percentage * revisions", () => {
    const revisions: LogItem[] = [
      {
        hash: "234567",
        date: "2024-01-02",
        author: "John Doe",
        fileEntries: [
          { fileName: "file2.txt", added: 1, removed: 1 },
          { fileName: "file3.txt", added: 1, removed: 1 },
        ],
      },
      {
        hash: "345678",
        date: "2024-01-03",
        author: "John Doe",
        fileEntries: [
          { fileName: "file1.txt", added: 1, removed: 1 },
          { fileName: "file2.txt", added: 1, removed: 1 },
          { fileName: "file3.txt", added: 1, removed: 1 },
        ],
      },
      {
        hash: "123456",
        date: "2024-01-01",
        author: "John Doe",
        fileEntries: [
          { fileName: "file1.txt", added: 1, removed: 1 },
          { fileName: "file2.txt", added: 1, removed: 1 },
        ],
      },
    ];

    const result = coupledPairs(revisions);

    expect(result).toEqual<CoupledPair[]>([
      {
        file1: "file2.txt",
        file2: "file3.txt",
        percentage: 2 / 3,
        revisions: 3,
      },
      {
        file1: "file1.txt",
        file2: "file2.txt",
        percentage: 2 / 3,
        revisions: 3,
      },
      {
        file1: "file1.txt",
        file2: "file3.txt",
        percentage: 1 / 3,
        revisions: 3,
      },
    ]);
  });
});
