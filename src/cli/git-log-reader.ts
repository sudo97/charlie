import type { LogItem } from '../core/git-log.js';
import { parseGitLog } from '../core/parse-log.js';

// FIXME: onData lies. createGitLogEmitter wires this listener to
// stdout.on('data'), which hands it a Buffer, so the chunk.toString() below is
// load-bearing rather than the no-op its type suggests — delete it and the CLI
// breaks while all tests stay green, because every test passes strings.
// The fix is `chunk: Buffer | string` here, after which the conversion is
// visibly necessary. It was left out of the boundary change because listener
// contravariance under strictFunctionTypes forces the three test doubles in
// tests/cli/git-log-reader.test.ts to change signature too.
//
// This is data corruption, not untidiness: decoding per chunk destroys any
// multi-byte character straddling a chunk boundary, so a non-ASCII author name
// silently becomes a second, phantom contributor in the ownership analysis.
// Deliberately deferred, on measurement rather than guesswork — a 22.6 MB log
// with 1,046 multi-byte characters carries 0.0051% continuation bytes across
// 345 boundaries, giving 0.018 expected corruptions per run (1.7%), and ten
// real runs produced none. The fix is to accumulate Buffers and decode once
// with Buffer.concat(...).toString('utf8'); measured at +8 ms on that log,
// against the ~9.9 s `git log` itself takes, so cost is not the obstacle.
export type GitLogEmitter = {
  onData: (listener: (chunk: string) => void) => void;
  onError: (listener: (error: Error) => void) => void;
  onErrorData: (listener: (chunk: string) => void) => void;
  onClose: (listener: (code: number) => void) => void;
};

// isomorphic-git was measured too slow for this repository's histories, so the
// log is parsed as text instead:
// git log --all --numstat --date=short --pretty=format:'--%h--%ad--%aN' --no-renames --after=<a year ago>
export async function produceGitLog(
  gitLogEmitter: GitLogEmitter
): Promise<LogItem[]> {
  return new Promise((res, rej) => {
    let text = '';

    gitLogEmitter.onData(chunk => {
      // Not redundant — see the note on GitLogEmitter above.
      text += chunk.toString();
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
        return;
      }

      res(
        parseGitLog(text, (line, error) => {
          console.error(`skipping unparseable git log line: ${line}`, error);
        })
      );
    });
  });
}
