import type { LogItem } from '@core/git-log.js';
import { parseFileEntry, parseHeader } from './parse-log.js';

// FIXME: onData lies. createGitLogEmitter wires this listener to
// stdout.on('data'), which hands it a Buffer, so the chunk.toString() below is
// load-bearing rather than the no-op its type suggests — delete it and the CLI
// breaks while all 75 tests stay green, because every test passes strings.
// The fix is `chunk: Buffer | string` here, after which the conversion is
// visibly necessary. It was left out of the boundary change because listener
// contravariance under strictFunctionTypes forces the three test doubles in
// tests/cli/git-log-reader.test.ts to change signature too.
export type GitLogEmitter = {
  onData: (listener: (chunk: string) => void) => void;
  onError: (listener: (error: Error) => void) => void;
  onErrorData: (listener: (chunk: string) => void) => void;
  onClose: (listener: (code: number) => void) => void;
};

// isomorphic-git was measured too slow for this repository's histories, so the
// log is parsed as text instead:
// git log --all --numstat --date=short --pretty=format:'--%h--%ad--%aN' --no-renames --after=<a year ago>
//
// FIXME: appendLine and the buffer draining in produceGitLog are pure — text
// in, LogItem[] out — and belong in the Core along with parse-log.ts, which is
// pure too. They sit in the Shell only because the streaming does. The move
// needs an error-reporting port first: produceGitLog writes to process.stderr
// and console.error, and console.log(e) below swallows a malformed file entry,
// none of which the Core may do. Doing it would put this parser under the
// Core's coverage and mutation thresholds, where it belongs.
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
      // Not redundant — see the note on GitLogEmitter above.
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
