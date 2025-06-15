import type { Config } from '../cli/config.js';
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

function compileGroups(
  architecturalGroups: Record<string, string> | undefined
) {
  return Object.entries(architecturalGroups ?? {}).map(([pattern, group]) => {
    return {
      pattern: new RegExp(pattern),
      group,
    };
  });
}

function matchToGroup(groups: { pattern: RegExp; group: string }[]) {
  return (file: FileEntry): FileEntry => {
    return {
      ...file,
      fileName:
        groups.find(group => group.pattern.test(file.fileName))?.group ??
        file.fileName,
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
