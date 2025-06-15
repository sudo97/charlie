import type { Config } from '../cli/config.js';
import { compileGroups, filenameToGroup } from './architectural-groups.js';
import type { FileEntry, LogItem } from './git-log.js';

export function groupGitLog(
  gitLogItems: LogItem[],
  architecturalGroups: Config['architecturalGroups']
): LogItem[] {
  const groups = compileGroups(architecturalGroups);

  return gitLogItems.map(item => ({
    ...item,
    fileEntries: aggregated(item.fileEntries.map(matchToGroup(groups))),
  }));
}

function matchToGroup(groups: { pattern: RegExp; group: string }[]) {
  return (file: FileEntry): FileEntry => {
    return {
      ...file,
      fileName: filenameToGroup(file.fileName, groups),
    };
  };
}

function aggregated(fileEntries: FileEntry[]): FileEntry[] {
  return Object.entries(fileEntries.reduce(reducer, {})).map(
    ([fileName, { added, removed }]) => ({
      fileName,
      added,
      removed,
    })
  );
}

function reducer(
  acc: Record<string, { added: number; removed: number }>,
  fileEntry: FileEntry
) {
  if (acc[fileEntry.fileName]) {
    acc[fileEntry.fileName]!.added += fileEntry.added;
    acc[fileEntry.fileName]!.removed += fileEntry.removed;
  } else {
    acc[fileEntry.fileName] = fileEntry;
  }
  return acc;
}
