import type { LogItem } from './git-log.js';
import type { Revisions } from './revisions.js';

export function countRevisions(history: LogItem[]): Revisions {
  return history
    .flatMap(commit => commit.fileEntries.map(file => file.fileName))
    .reduce((acc, file) => {
      acc[file] = (acc[file] || 0) + 1;
      return acc;
    }, {} as Revisions);
}
