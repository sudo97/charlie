import type { LogItem } from '@core/git-log.js';
import { parseFileEntry, parseHeader } from './parse-log.js';

export type GitLogEmitter = {
  onData: (listener: (chunk: string) => void) => void;
  onError: (listener: (error: Error) => void) => void;
  onErrorData: (listener: (chunk: string) => void) => void;
  onClose: (listener: (code: number) => void) => void;
};

// This is tricky. I tried using isomorphic-git, but it was very slow.
// Now we are parsing the output of git log --all --numstat --date=short --pretty=format:'--%h--%ad--%aN' --no-renames --after=(CURRENT_YEAR - 1)
// and splitting it into log items.
// Then I also decided to write tests for this, so that it's easier to maintain.
// So I created a GitLogEmitter type instead of using child_process.spawn directly.

export async function produceGitLog(
  gitLogEmitter: GitLogEmitter
): Promise<LogItem[]> {
  return new Promise((res, rej) => {
    const logItems: LogItem[] = [];

    let buffer = '';

    gitLogEmitter.onData(chunk => {
      // console.log("buffer", JSON.stringify(buffer));
      // Process each chunk of data as it comes in
      // console.log("--");

      buffer += chunk.toString();

      if (buffer.includes('\n\n')) {
        const [chunkStr, rest] = buffer.split('\n\n');
        buffer = rest!;

        const commitLines = chunkStr!.toString().trim().split('\n');

        for (const line of commitLines) {
          // console.log(line);
          if (line.startsWith("'--")) {
            const { hash, date, author, message } = parseHeader(line);
            logItems.push({ hash, date, author, fileEntries: [], message });
          } else if (line.length > 0) {
            try {
              const fileEntry = parseFileEntry(line);

              logItems[logItems.length - 1]!.fileEntries.push(fileEntry);
            } catch (e) {
              console.log(e);
            }
          }
        }
      }

      // console.log("--");
      // process.stdout.write(chunk);
    });

    gitLogEmitter.onErrorData(chunk => {
      // Handle error output
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
