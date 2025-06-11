import { describe, it, expect } from 'vitest';
import {
  CoupledPair,
  coupledPairs,
  significantCoupledPairs,
} from './coupled-pairs.js';
import { LogItem } from './revisions.js';

describe('coupledPairs', () => {
  it('should return an empty array if there is only one revision', () => {
    const revisions: LogItem[] = [
      {
        hash: '123456',
        date: '2024-01-01',
        author: 'John Doe',
        fileEntries: [{ fileName: 'file.txt', added: 1, removed: 1 }],
      },
    ];
    const result = coupledPairs(revisions);
    expect(result).toEqual([]);
  });

  it('should find a pair', () => {
    const revisions: LogItem[] = [
      {
        hash: '123456',
        date: '2024-01-01',
        author: 'John Doe',
        fileEntries: [
          { fileName: 'file.txt', added: 1, removed: 1 },
          { fileName: 'file2.txt', added: 1, removed: 1 },
        ],
      },
    ];
    const result = coupledPairs(revisions);
    expect(result).toEqual<CoupledPair[]>([
      {
        file1: 'file.txt',
        file2: 'file2.txt',
        percentage: 1,
        revisions: 1,
      },
    ]);
  });

  it('should count two files as a pair independent of the order they appear in the commit', () => {
    const revisions: LogItem[] = [
      {
        hash: '123456',
        date: '2024-01-01',
        author: 'John Doe',
        fileEntries: [
          { fileName: 'file.txt', added: 1, removed: 1 },
          { fileName: 'file2.txt', added: 1, removed: 1 },
        ],
      },
      {
        hash: '123456',
        date: '2024-01-01',
        author: 'John Doe',
        fileEntries: [
          { fileName: 'file2.txt', added: 1, removed: 1 },
          { fileName: 'file.txt', added: 1, removed: 1 },
        ],
      },
    ];
    const result = coupledPairs(revisions);
    expect(result).toEqual<CoupledPair[]>([
      {
        file1: 'file2.txt',
        file2: 'file.txt',
        percentage: 1,
        revisions: 2,
      },
    ]);
  });

  it('should handle more than two files in a commit', () => {
    const revisions: LogItem[] = [
      {
        hash: '123456',
        date: '2024-01-01',
        author: 'John Doe',
        fileEntries: [
          { fileName: 'file.txt', added: 1, removed: 1 },
          { fileName: 'file2.txt', added: 1, removed: 1 },
          { fileName: 'file3.txt', added: 1, removed: 1 },
        ],
      },
    ];
    const result = coupledPairs(revisions);
    expect(result).toEqual<CoupledPair[]>([
      {
        file1: 'file.txt',
        file2: 'file2.txt',
        percentage: 1,
        revisions: 1,
      },
      {
        file1: 'file.txt',
        file2: 'file3.txt',
        percentage: 1,
        revisions: 1,
      },
      {
        file1: 'file2.txt',
        file2: 'file3.txt',
        percentage: 1,
        revisions: 1,
      },
    ]);
  });

  it('should calculate percentage', () => {
    const revisions: LogItem[] = [
      {
        hash: '123456',
        date: '2024-01-01',
        author: 'John Doe',
        fileEntries: [{ fileName: 'file.txt', added: 1, removed: 1 }],
      },
      {
        hash: '123456',
        date: '2024-01-01',
        author: 'John Doe',
        fileEntries: [
          { fileName: 'file.txt', added: 1, removed: 1 },
          { fileName: 'file2.txt', added: 1, removed: 1 },
        ],
      },
    ];
    const result = coupledPairs(revisions);
    expect(result).toEqual<CoupledPair[]>([
      {
        file1: 'file.txt',
        file2: 'file2.txt',
        percentage: 0.5,
        revisions: 2,
      },
    ]);
  });
});

describe('significantCoupledPairs', () => {
  it('should return all pairs when they meet minimum coupling percentage', () => {
    const data: CoupledPair[] = [
      { file1: 'a.ts', file2: 'b.ts', percentage: 0.6, revisions: 5 },
      { file1: 'c.ts', file2: 'd.ts', percentage: 0.8, revisions: 3 },
    ];
    const result = significantCoupledPairs(data, 0.0, 0.5);
    expect(result).toEqual(data);
  });

  it('should return pairs that meet revision threshold', () => {
    const data: CoupledPair[] = [
      { file1: 'a.ts', file2: 'b.ts', percentage: 0.2, revisions: 10 },
      { file1: 'c.ts', file2: 'd.ts', percentage: 0.3, revisions: 8 },
      { file1: 'e.ts', file2: 'f.ts', percentage: 0.1, revisions: 2 },
    ];

    const result = significantCoupledPairs(data, 0.8, 0.0);

    expect(result).toEqual([
      { file1: 'a.ts', file2: 'b.ts', percentage: 0.2, revisions: 10 },
    ]);
  });

  it('should return pairs that meet both coupling percentage AND revision threshold', () => {
    const data: CoupledPair[] = [
      { file1: 'a.ts', file2: 'b.ts', percentage: 0.7, revisions: 5 },
      { file1: 'c.ts', file2: 'd.ts', percentage: 0.2, revisions: 15 },
      { file1: 'e.ts', file2: 'f.ts', percentage: 0.9, revisions: 20 }, // meets both
      { file1: 'g.ts', file2: 'h.ts', percentage: 0.1, revisions: 3 },
    ];
    const result = significantCoupledPairs(data, 0.8, 0.6);
    // 80th percentile of [3, 5, 15, 20] is index 3 (Math.floor(4 * 0.8) = 3), so threshold is 20
    // Only pairs with percentage >= 0.6 OR revisions >= 20 are included
    expect(result).toEqual([
      { file1: 'e.ts', file2: 'f.ts', percentage: 0.9, revisions: 20 },
    ]);
  });

  it('should return empty array when no pairs meet criteria', () => {
    const data: CoupledPair[] = [
      { file1: 'a.ts', file2: 'b.ts', percentage: 0.2, revisions: 5 },
      { file1: 'c.ts', file2: 'd.ts', percentage: 0.3, revisions: 3 },
    ];
    const result = significantCoupledPairs(data, 0.8, 0.8);
    // 80th percentile of [3, 5] is index 1 (Math.floor(2 * 0.8) = 1), so threshold is 5
    // Neither pair meets 0.8 coupling percentage, and only one meets revision threshold
    expect(result).toEqual([]);
  });

  it('should handle single pair correctly', () => {
    const data: CoupledPair[] = [
      { file1: 'a.ts', file2: 'b.ts', percentage: 0.4, revisions: 10 },
    ];
    const result = significantCoupledPairs(data, 0.8, 0.3);

    expect(result).toEqual([
      { file1: 'a.ts', file2: 'b.ts', percentage: 0.4, revisions: 10 },
    ]);
  });
});
