import { describe, it, expect } from 'vitest';

import { countRevisions } from '../../core/count-revisions';

describe('countRevisions', () => {
  it('should return an empty array if there are no revisions', () => {
    const result = countRevisions([]);
    expect(result).toEqual({});
  });

  it('should count each file change', () => {
    const result = countRevisions([
      {
        hash: '123',
        date: '2021-01-01',
        author: 'John Doe',
        message: 'Initial commit',
        fileEntries: [
          { fileName: 'file1.txt', added: 1, removed: 0 },
          { fileName: 'file2.txt', added: 1, removed: 0 },
        ],
      },
    ]);
    expect(result).toEqual({
      'file1.txt': 1,
      'file2.txt': 1,
    });
  });

  it('should count each file change multiple times', () => {
    const result = countRevisions([
      {
        fileEntries: [
          { fileName: 'file1.txt', added: 1, removed: 0 },
          { fileName: 'file2.txt', added: 1, removed: 0 },
        ],
        hash: '123',
        date: '2021-01-01',
        author: 'John Doe',
        message: 'Initial commit',
      },
      {
        fileEntries: [{ fileName: 'file1.txt', added: 1, removed: 0 }],
        hash: '123',
        date: '2021-01-01',
        author: 'John Doe',
        message: 'Initial commit',
      },
    ]);
    expect(result).toEqual({
      'file1.txt': 2,
      'file2.txt': 1,
    });
  });
});
