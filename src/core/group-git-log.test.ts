import { describe, it, expect } from 'vitest';
import { groupGitLog } from './group-git-log.js';
import { type LogItem } from './git-log.js';

describe('groupGitLog', () => {
  it('should group git log items by architectural groups', () => {
    const gitLogItems: LogItem[] = [
      {
        hash: '123',
        date: '2021-01-01',
        author: 'John Doe',
        message: 'Initial commit',
        fileEntries: [
          {
            added: 1,
            removed: 0,
            fileName: 'src/components/Button.tsx',
          },
          {
            added: 1,
            removed: 0,
            fileName: 'src/components/Header.tsx',
          },
          {
            added: 1,
            removed: 0,
            fileName: 'src/pages/Home.tsx',
          },
        ],
      },
    ];

    const groupedGitLogItems = groupGitLog(gitLogItems, {
      '^src/components': 'UI Components',
      '^src/pages': 'Pages',
    });

    expect(groupedGitLogItems).toEqual([
      {
        hash: '123',
        date: '2021-01-01',
        author: 'John Doe',
        message: 'Initial commit',
        fileEntries: [
          { added: 2, removed: 0, fileName: 'UI Components' },
          { added: 1, removed: 0, fileName: 'Pages' },
        ],
      },
    ]);
  });
});
