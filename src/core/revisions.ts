import type { LogItem } from './git-log.js';

export type Revisions = Record<string, number>;

export function revisions(history: LogItem[]): Revisions {
  return history
    .flatMap(commit => commit.fileEntries.map(file => file.fileName))
    .reduce((acc, file) => {
      acc[file] = (acc[file] || 0) + 1;
      return acc;
    }, {} as Revisions);
}
