import { describe, it, expect } from 'vitest';
import {
  CoupledPair,
  coupledPairs,
  sortCoupledPairs,
} from '../../core/coupled-pairs.js';
import { LogItem } from '../../core/git-log.js';

describe('coupledPairs', () => {
  it('should return an empty array if there is only one revision', () => {
    const revisions: LogItem[] = [
      {
        hash: '123456',
        message: 'Initial commit',
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
        message: 'Initial commit',
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
        message: 'Initial commit',
        date: '2024-01-01',
        author: 'John Doe',
        fileEntries: [
          { fileName: 'file.txt', added: 1, removed: 1 },
          { fileName: 'file2.txt', added: 1, removed: 1 },
        ],
      },
      {
        hash: '123456',
        message: 'Initial commit',
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
        message: 'Initial commit',
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
        message: 'Initial commit',
        fileEntries: [{ fileName: 'file.txt', added: 1, removed: 1 }],
      },
      {
        hash: '123456',
        date: '2024-01-01',
        author: 'John Doe',
        message: 'Initial commit',
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

describe('sortCoupledPairs', () => {
  it('should return an empty array when given an empty array', () => {
    const data: CoupledPair[] = [];
    const result = sortCoupledPairs(data);
    expect(result).toEqual([]);
  });

  it('should return a single item unchanged when given a single item', () => {
    const data: CoupledPair[] = [
      {
        file1: 'file1.txt',
        file2: 'file2.txt',
        percentage: 0.5,
        revisions: 10,
      },
    ];
    const result = sortCoupledPairs(data);
    expect(result).toEqual(data);
  });

  it('should sort by combined normalized score in descending order', () => {
    const data: CoupledPair[] = [
      {
        file1: 'low.txt',
        file2: 'score.txt',
        percentage: 0.2, // Low percentage
        revisions: 5, // Low revisions
      },
      {
        file1: 'high.txt',
        file2: 'score.txt',
        percentage: 0.8, // High percentage
        revisions: 15, // High revisions
      },
      {
        file1: 'medium.txt',
        file2: 'score.txt',
        percentage: 0.5, // Medium percentage
        revisions: 10, // Medium revisions
      },
    ];

    const result = sortCoupledPairs(data);

    // High percentage + high revisions should be first
    expect(result[0]).toEqual(data[1]);
    // Medium should be second
    expect(result[1]).toEqual(data[2]);
    // Low should be last
    expect(result[2]).toEqual(data[0]);
  });

  it('should handle edge case where all percentages are the same', () => {
    const data: CoupledPair[] = [
      {
        file1: 'low-rev.txt',
        file2: 'file.txt',
        percentage: 0.5,
        revisions: 5,
      },
      {
        file1: 'high-rev.txt',
        file2: 'file.txt',
        percentage: 0.5,
        revisions: 15,
      },
    ];

    const result = sortCoupledPairs(data);

    // When percentages are equal (normalized to 0), both items get score 0
    // The sort is stable, so original order is maintained
    expect(result[0]).toEqual(data[0]); // first item stays first
    expect(result[1]).toEqual(data[1]); // second item stays second
  });

  it('should handle edge case where all revisions are the same', () => {
    const data: CoupledPair[] = [
      {
        file1: 'low-perc.txt',
        file2: 'file.txt',
        percentage: 0.3,
        revisions: 10,
      },
      {
        file1: 'high-perc.txt',
        file2: 'file.txt',
        percentage: 0.7,
        revisions: 10,
      },
    ];

    const result = sortCoupledPairs(data);

    // When revisions are equal (normalized to 0), both items get score 0
    // The sort is stable, so original order is maintained
    expect(result[0]).toEqual(data[0]); // first item stays first
    expect(result[1]).toEqual(data[1]); // second item stays second
  });

  it('should handle edge case where all values are identical', () => {
    const data: CoupledPair[] = [
      {
        file1: 'file1.txt',
        file2: 'file.txt',
        percentage: 0.5,
        revisions: 10,
      },
      {
        file1: 'file2.txt',
        file2: 'file.txt',
        percentage: 0.5,
        revisions: 10,
      },
    ];

    const result = sortCoupledPairs(data);

    // Should maintain the order when scores are identical
    expect(result).toHaveLength(2);
    expect(result).toEqual(expect.arrayContaining(data));
  });

  it('should not mutate the original array', () => {
    const data: CoupledPair[] = [
      {
        file1: 'file1.txt',
        file2: 'file2.txt',
        percentage: 0.2,
        revisions: 5,
      },
      {
        file1: 'file3.txt',
        file2: 'file4.txt',
        percentage: 0.8,
        revisions: 15,
      },
    ];

    const originalData = [...data]; // Create a copy to compare
    const result = sortCoupledPairs(data);

    // Original array should be unchanged
    expect(data).toEqual(originalData);
    // Result should be a different array
    expect(result).not.toBe(data);
  });

  it('should correctly normalize when min and max are different', () => {
    const data: CoupledPair[] = [
      {
        file1: 'a.txt',
        file2: 'b.txt',
        percentage: 0.1, // min percentage
        revisions: 20, // max revisions
      },
      {
        file1: 'c.txt',
        file2: 'd.txt',
        percentage: 0.9, // max percentage
        revisions: 5, // min revisions
      },
      {
        file1: 'e.txt',
        file2: 'f.txt',
        percentage: 0.5, // mid percentage
        revisions: 10, // mid revisions
      },
    ];

    const result = sortCoupledPairs(data);

    // First item: 0.9 percentage (normalized to 1.0) * 5 revisions (normalized to 0.0) = 0.0
    // Second item: 0.5 percentage (normalized to 0.5) * 10 revisions (normalized to 0.33) = 0.165
    // Third item: 0.1 percentage (normalized to 0.0) * 20 revisions (normalized to 1.0) = 0.0

    // The middle item should have the highest score
    expect(result[0]).toEqual(data[2]); // mid values give best combined score
  });
});
