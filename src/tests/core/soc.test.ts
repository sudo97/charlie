import { describe, it, expect } from 'vitest';
import { Soc, soc, socPercentile } from '../../core/soc.js';
import { LogItem } from '../../core/git-log.js';

describe('soc', () => {
  it('should not count the soc if there are no revisions', () => {
    const gitRevisions: LogItem[] = [];
    const result = soc(gitRevisions);
    expect(result).toEqual([]);
  });

  it('should count files which appear together', () => {
    const gitRevisions: LogItem[] = [
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
      {
        hash: '123456',
        date: '2024-01-01',
        author: 'John Doe',
        message: 'Initial commit',
        fileEntries: [{ fileName: 'file3.txt', added: 1, removed: 1 }],
      },
      {
        hash: '123456',
        date: '2024-01-01',
        author: 'John Doe',
        message: 'Initial commit',
        fileEntries: [
          { fileName: 'file.txt', added: 1, removed: 1 },
          { fileName: 'file3.txt', added: 1, removed: 1 },
        ],
      },
      {
        hash: '123456',
        date: '2024-01-01',
        author: 'John Doe',
        message: 'Initial commit',
        fileEntries: [{ fileName: 'file4.txt', added: 1, removed: 1 }],
      },
    ];
    const result = soc(gitRevisions);
    expect(result).toEqual<Soc[]>([
      {
        file: 'file.txt',
        soc: 2,
      },
      {
        file: 'file2.txt',
        soc: 1,
      },
      {
        file: 'file3.txt',
        soc: 1,
      },
    ]);
  });

  it('should calculate coupling strength correctly - each file should be coupled with n-1 other files', () => {
    const gitRevisions: LogItem[] = [
      {
        hash: '123456',
        date: '2024-01-01',
        author: 'John Doe',
        message: 'Change three files together',
        fileEntries: [
          { fileName: 'fileA.txt', added: 1, removed: 1 },
          { fileName: 'fileB.txt', added: 1, removed: 1 },
          { fileName: 'fileC.txt', added: 1, removed: 1 },
        ],
      },
    ];

    const result = soc(gitRevisions);

    expect(result).toEqual<Soc[]>([
      { file: 'fileA.txt', soc: 2 },
      { file: 'fileB.txt', soc: 2 },
      { file: 'fileC.txt', soc: 2 },
    ]);
  });
});

describe('socPercentile', () => {
  it('should return the top n% of the data', () => {
    const length = 10;
    const data: Soc[] = Array.from({ length }).map((_, i) => ({
      file: `file${i}.txt`,
      soc: 10 - i,
    }));

    for (let i = 1; i < length; i++) {
      const result = socPercentile(data, i / length);
      const min = data[length - i].soc;

      for (const item of result) {
        expect(item.soc).toBeGreaterThanOrEqual(min);
      }
    }
  });

  it('should return data sorted by soc in descending order', () => {
    // Create unsorted test data
    const data: Soc[] = [
      { file: 'file1.txt', soc: 5 },
      { file: 'file2.txt', soc: 10 },
      { file: 'file3.txt', soc: 2 },
      { file: 'file4.txt', soc: 8 },
      { file: 'file5.txt', soc: 1 },
    ];

    const result = socPercentile(data, 0.6); // Get top 60%

    // Verify that the result is sorted in descending order by soc
    for (let i = 1; i < result.length; i++) {
      expect(result[i - 1].soc).toBeGreaterThanOrEqual(result[i].soc);
    }

    // Also verify the actual sorting is correct
    expect(result).toEqual([
      { file: 'file2.txt', soc: 10 },
      { file: 'file4.txt', soc: 8 },
    ]);
  });
});
