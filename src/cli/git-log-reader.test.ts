import { describe, it, expect } from 'vitest';
import { GitLogEmitter, produceGitLog } from './git-log-reader.js';
import type { LogItem } from '../core/git-log.js';

describe('git-log parser', () => {
  it('should reject if the git log emits an error', async () => {
    const mockGitLogEmitter: GitLogEmitter = {
      onData: () => {},
      onError: listener => {
        listener(new Error('abc'));
      },
      onErrorData: () => {},
      onClose: () => {},
    };

    await expect(produceGitLog(mockGitLogEmitter)).rejects.toThrow('abc');
  });

  it('should reject if process ends with non 0', async () => {
    const mockGitLogEmitter: GitLogEmitter = {
      onData: () => {},
      onError: () => {},
      onErrorData: () => {},
      onClose: listener => {
        listener(1);
      },
    };

    await expect(produceGitLog(mockGitLogEmitter)).rejects.toThrow();
  });

  it('should produce a log item for each commit', async () => {
    const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));
    let done: (code: number) => void;

    const expectedLogItems: LogItem[] = [
      {
        hash: '123456',
        date: '2024-01-01',
        author: 'John Doe',
        fileEntries: [{ fileName: 'file.txt', added: 1, removed: 1 }],
      },
      {
        hash: 'abcdef',
        date: '2024-01-02',
        author: 'Dohn Joe',
        fileEntries: [{ fileName: 'file2.txt', added: 1, removed: 1 }],
      },
    ];

    const expectedLogItemString = [
      ...(expectedLogItems
        .map(item => {
          return `'--${item.hash}--${item.date}--${
            item.author
          }'\n${item.fileEntries
            .map(file => `${file.added} ${file.removed} ${file.fileName}`)
            .join('\n')}`;
        })
        .join('\n') + '\n\n'),
    ];

    const mockGitLogEmitter: GitLogEmitter = {
      onData: listener => {
        (async () => {
          while (expectedLogItemString.length > 0) {
            const randomChunkSize = Math.floor(Math.random() * 10) + 1;
            listener(expectedLogItemString.splice(0, randomChunkSize).join(''));
            await sleep(Math.floor(Math.random() * 5) + 1);
          }
          done(0);
        })();
      },
      onError: () => {},
      onErrorData: () => {},
      onClose: listener => {
        done = listener;
      },
    };

    const logItems = await produceGitLog(mockGitLogEmitter);

    expect(logItems).toEqual(expectedLogItems);
  });
});
