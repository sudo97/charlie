import { describe, it, expect, vi } from 'vitest';
import {
  parseFileEntry,
  parseGitLog,
  parseHeader,
  parseLogItem,
} from '../../core/parse-log.js';

const sampleLog1 = `
'--6d0f6d10a--2024-06-03--John Doe--some message'
1       0       .docker/backend/file
17      0       backend/src/app/api.ts
17      0       backend/src/app/config/dashboard.ts
1       0       backend/src/package.json
4       1       frontend/src/app/app.svelte
1       1       frontend/src/package.json
48      45      package-lock.json
`.trim();

const sampleLog2 = `
'--6d0f6d14b--2024-06-04--Jededaia--some other message'
`.trim();

describe('parse logitem', () => {
  it('parses hash', () => {
    expect(parseLogItem(sampleLog1).hash).toEqual('6d0f6d10a');
    expect(parseLogItem(sampleLog2).hash).toEqual('6d0f6d14b');
  });

  it('parses date', () => {
    expect(parseLogItem(sampleLog1).date).toEqual('2024-06-03');
    expect(parseLogItem(sampleLog2).date).toEqual('2024-06-04');
  });

  it('parses author', () => {
    expect(parseLogItem(sampleLog1).author).toEqual('John Doe');
    expect(parseLogItem(sampleLog2).author).toEqual('Jededaia');
  });

  it('parses file entries', () => {
    expect(parseLogItem(sampleLog1).fileEntries).toEqual([
      {
        added: 1,
        removed: 0,
        fileName: '.docker/backend/file',
      },
      { added: 17, removed: 0, fileName: 'backend/src/app/api.ts' },
      {
        added: 17,
        removed: 0,
        fileName: 'backend/src/app/config/dashboard.ts',
      },
      { added: 1, removed: 0, fileName: 'backend/src/package.json' },
      { added: 4, removed: 1, fileName: 'frontend/src/app/app.svelte' },
      { added: 1, removed: 1, fileName: 'frontend/src/package.json' },
      { added: 48, removed: 45, fileName: 'package-lock.json' },
    ]);
  });

  it('parses message', () => {
    expect(parseLogItem(sampleLog1).message).toEqual('some message');
    expect(parseLogItem(sampleLog2).message).toEqual('some other message');
  });

  it('rejects empty input before reaching the header parser', () => {
    expect(() => parseLogItem('')).toThrow('Empty log item');
  });
});

describe('parseHeader', () => {
  it('rejects a missing hash', () => {
    expect(() => parseHeader("'----date--author--message'")).toThrow(
      'Invalid log item'
    );
  });

  it('rejects a missing date', () => {
    expect(() => parseHeader("'--hash----author--message'")).toThrow(
      'Invalid log item'
    );
  });

  it('rejects a missing author', () => {
    expect(() => parseHeader("'--hash--date----message'")).toThrow(
      'Invalid log item'
    );
  });

  it('rejects a missing message', () => {
    expect(() => parseHeader("'--hash--date--author")).toThrow(
      'Invalid log item'
    );
  });

  it('strips only a trailing quote from the author', () => {
    expect(parseHeader("'--hash--date--Author'--message'").author).toBe(
      'Author'
    );
  });

  it('keeps an apostrophe inside the author', () => {
    expect(parseHeader("'--hash--date--O'Brien--message'").author).toBe(
      "O'Brien"
    );
  });

  it('keeps an apostrophe inside the message', () => {
    expect(parseHeader("'--hash--date--author--it's fine'").message).toBe(
      "it's fine"
    );
  });
});

describe('parseFileEntry', () => {
  it('parses added, removed and file name', () => {
    expect(parseFileEntry('12\t34\tsrc/a.ts')).toStrictEqual({
      added: 12,
      removed: 34,
      fileName: 'src/a.ts',
    });
  });

  it('rejects a line with no added count', () => {
    expect(() => parseFileEntry(' 1 src/a.ts')).toThrow(
      'Invalid file entry:  1 src/a.ts'
    );
  });

  it('rejects a line missing the file name', () => {
    expect(() => parseFileEntry('1 2')).toThrow('Invalid file entry: 1 2');
  });

  it('rejects a line with only one field', () => {
    expect(() => parseFileEntry('lonely')).toThrow(
      'Invalid file entry: lonely'
    );
  });
});

const header = (hash: string) => `'--${hash}--2026-01-01--Someone--a message'`;
const commit = (hash: string, ...files: string[]) =>
  [header(hash), ...files.map(f => `1\t2\t${f}`)].join('\n');

describe('parseGitLog', () => {
  it('parses every commit when separated by blank lines', () => {
    const text = [
      commit('aaa', 'a.ts'),
      commit('bbb', 'b.ts'),
      commit('ccc', 'c.ts'),
      commit('ddd', 'd.ts'),
    ].join('\n\n');

    expect(parseGitLog(text, vi.fn()).map(item => item.hash)).toStrictEqual([
      'aaa',
      'bbb',
      'ccc',
      'ddd',
    ]);
  });

  it('parses the last commit when there is no trailing separator', () => {
    const text = [commit('aaa', 'a.ts'), commit('bbb', 'b.ts')].join('\n\n');

    expect(text.endsWith('\n')).toBe(false);
    expect(parseGitLog(text, vi.fn()).map(item => item.hash)).toStrictEqual([
      'aaa',
      'bbb',
    ]);
  });

  it('parses a single commit with no separators at all', () => {
    const result = parseGitLog(commit('aaa', 'a.ts'), vi.fn());

    expect(result).toStrictEqual([
      {
        hash: 'aaa',
        date: '2026-01-01',
        author: 'Someone',
        message: 'a message',
        fileEntries: [{ added: 1, removed: 2, fileName: 'a.ts' }],
      },
    ]);
  });

  it('returns an empty array for empty text', () => {
    expect(parseGitLog('', vi.fn())).toStrictEqual([]);
  });

  it('attaches file entries to the commit that precedes them', () => {
    const text = [commit('aaa', 'a.ts', 'b.ts'), commit('bbb', 'c.ts')].join(
      '\n\n'
    );

    const result = parseGitLog(text, vi.fn());

    expect(result[0]!.fileEntries.map(e => e.fileName)).toStrictEqual([
      'a.ts',
      'b.ts',
    ]);
    expect(result[1]!.fileEntries.map(e => e.fileName)).toStrictEqual(['c.ts']);
  });

  it('reports a malformed file entry and keeps going', () => {
    const onMalformedLine = vi.fn();
    const text = [header('aaa'), 'truncated', '1\t2\ta.ts'].join('\n');

    const result = parseGitLog(text, onMalformedLine);

    expect(result[0]!.fileEntries.map(e => e.fileName)).toStrictEqual(['a.ts']);
    expect(onMalformedLine).toHaveBeenCalledTimes(1);
    expect(onMalformedLine.mock.calls[0]![0]).toBe('truncated');
  });

  it('reports a file entry that appears before any commit header', () => {
    const onMalformedLine = vi.fn();

    const result = parseGitLog('1\t2\torphan.ts', onMalformedLine);

    expect(result).toStrictEqual([]);
    expect(onMalformedLine).toHaveBeenCalledTimes(1);
    expect(onMalformedLine.mock.calls[0]![0]).toBe('1\t2\torphan.ts');
    expect((onMalformedLine.mock.calls[0]![1] as Error).message).toBe(
      'File entry before any commit header'
    );
  });

  it('ignores blank lines anywhere', () => {
    const onMalformedLine = vi.fn();
    const text = ['', '', commit('aaa', 'a.ts'), '', '', ''].join('\n');

    expect(parseGitLog(text, onMalformedLine).map(i => i.hash)).toStrictEqual([
      'aaa',
    ]);
    expect(onMalformedLine).not.toHaveBeenCalled();
  });

  it('throws on a malformed commit header', () => {
    expect(() => parseGitLog("'--only-two--parts'", vi.fn())).toThrow(
      'Invalid log item'
    );
  });
});
