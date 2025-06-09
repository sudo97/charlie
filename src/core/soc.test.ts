import { describe, it, expect } from 'vitest';
import { Soc, soc, socPercentile } from './soc.js';
import { LogItem } from './revisions.js';

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
        fileEntries: [
          { fileName: 'file.txt', added: 1, removed: 1 },
          { fileName: 'file2.txt', added: 1, removed: 1 },
        ],
      },
      {
        hash: '123456',
        date: '2024-01-01',
        author: 'John Doe',
        fileEntries: [{ fileName: 'file3.txt', added: 1, removed: 1 }],
      },
      {
        hash: '123456',
        date: '2024-01-01',
        author: 'John Doe',
        fileEntries: [
          { fileName: 'file.txt', added: 1, removed: 1 },
          { fileName: 'file3.txt', added: 1, removed: 1 },
        ],
      },
      {
        hash: '123456',
        date: '2024-01-01',
        author: 'John Doe',
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
});
