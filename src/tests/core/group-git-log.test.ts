import { describe, it, expect } from 'vitest';
import { groupGitLog } from '../../core/group-git-log.js';
import { type LogItem } from '../../core/git-log.js';

describe('groupGitLog', () => {
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

  it('should group git log items by architectural groups', () => {
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

  it('should not group git log items if no architectural groups are provided', () => {
    const groupedGitLogItems = groupGitLog(gitLogItems, {});

    expect(groupedGitLogItems).toEqual(gitLogItems);
  });
});
