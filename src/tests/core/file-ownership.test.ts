import { fileOwnership } from '../../core/file-ownership';
import { describe, it, expect } from 'vitest';
import { LogItem } from '../../core/git-log';

describe('fileOwnership', () => {
  function mkLogItems(
    ...items: { author: string; fileNames: string[] }[]
  ): LogItem[] {
    return items.map(({ author, fileNames }) => ({
      hash: '123',
      date: '2021-01-01',
      author,
      message: 'commit message',
      fileEntries: fileNames.map(fileName => ({
        added: 1,
        removed: 0,
        fileName,
      })),
    }));
  }

  it('should return the file ownership', () => {
    expect(
      fileOwnership(
        mkLogItems(
          { author: 'Alice', fileNames: ['file1'] },
          { author: 'Bob', fileNames: ['file1'] },
          { author: 'Bob', fileNames: ['file1'] }
        )
      )
    ).toEqual({
      file1: [
        {
          name: 'Bob',
          commits: 2,
          percentage: 2 / 3,
        },
        {
          name: 'Alice',
          commits: 1,
          percentage: 1 / 3,
        },
      ],
    });
  });
});
