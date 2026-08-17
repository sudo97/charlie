import type { LogItem } from '@core/git-log.js';
import { parseFileEntry, parseHeader } from './parse-log.js';

export type GitLogEmitter = {
  onData: (listener: (chunk: string) => void) => void;
  onError: (listener: (error: Error) => void) => void;
  onErrorData: (listener: (chunk: string) => void) => void;
  onClose: (listener: (code: number) => void) => void;
};

// isomorphic-git was measured too slow for this repository's histories, so the
// log is parsed as text instead:
// git log --all --numstat --date=short --pretty=format:'--%h--%ad--%aN' --no-renames --after=<a year ago>
function appendLine(logItems: LogItem[], line: string): void {
  if (line.startsWith("'--")) {
    const { hash, date, author, message } = parseHeader(line);
    logItems.push({ hash, date, author, fileEntries: [], message });
    return;
  }

  if (line.length === 0) {
    return;
  }

  try {
    logItems[logItems.length - 1]!.fileEntries.push(parseFileEntry(line));
  } catch (e) {
    console.log(e);
  }
}

export async function produceGitLog(
  gitLogEmitter: GitLogEmitter
): Promise<LogItem[]> {
  return new Promise((res, rej) => {
    const logItems: LogItem[] = [];

    let buffer = '';

    gitLogEmitter.onData(chunk => {
      // Node delivers Buffers here despite the string type on GitLogEmitter.
      buffer += chunk.toString();

      if (!buffer.includes('\n\n')) {
        return;
      }

      const [completed, rest] = buffer.split('\n\n');
      buffer = rest!;

      for (const line of completed!.trim().split('\n')) {
        appendLine(logItems, line);
      }
    });

    gitLogEmitter.onErrorData(chunk => {
      process.stderr.write(chunk);
    });

    gitLogEmitter.onError(error => {
      console.error(`spawn error: ${error}`);
      rej(error);
    });

    gitLogEmitter.onClose(code => {
      if (code !== 0) {
        console.error(`git process exited with code ${code}`);
        rej(new Error(`git process exited with code ${code}`));
      } else {
        res(logItems);
      }
    });
  });
}
