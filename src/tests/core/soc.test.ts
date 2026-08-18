import { describe, it, expect } from 'vitest';
import { soc } from '../../core/soc.js';
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

  it('should return results sorted by soc score in descending order', () => {
    const gitRevisions: LogItem[] = [
      {
        hash: '123456',
        date: '2024-01-01',
        author: 'John Doe',
        message: 'First commit',
        fileEntries: [
          { fileName: 'fileA.txt', added: 1, removed: 1 },
          { fileName: 'fileB.txt', added: 1, removed: 1 },
        ],
      },
      {
        hash: '234567',
        date: '2024-01-02',
        author: 'John Doe',
        message: 'Second commit',
        fileEntries: [
          { fileName: 'fileB.txt', added: 1, removed: 1 },
          { fileName: 'fileC.txt', added: 1, removed: 1 },
        ],
      },
      {
        hash: '345678',
        date: '2024-01-03',
        author: 'John Doe',
        message: 'Third commit',
        fileEntries: [
          { fileName: 'fileB.txt', added: 1, removed: 1 },
          { fileName: 'fileC.txt', added: 1, removed: 1 },
        ],
      },
    ];

    const result = soc(gitRevisions);

    expect(result).toEqual<Soc[]>([
      { file: 'fileB.txt', soc: 3 },
      { file: 'fileC.txt', soc: 2 },
      { file: 'fileA.txt', soc: 1 },
    ]);
  });
});
