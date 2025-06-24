import type { LogItem } from './git-log';

type FileOwnership = Record<
  string,
  Array<{
    commits: number;
    percentage: number;
    name: string;
  }>
>;

export function fileOwnership(revisions: LogItem[]): FileOwnership {
  const fileMapping: Record<
    string,
    Record<
      string,
      {
        commits: number;
        percentage: number;
        name: string;
      }
    >
  > = {};

  for (const revision of revisions) {
    for (const fileEntry of revision.fileEntries) {
      if (!fileMapping[fileEntry.fileName]) {
        fileMapping[fileEntry.fileName] = {};
      }
      if (!fileMapping[fileEntry.fileName]![revision.author]) {
        fileMapping[fileEntry.fileName]![revision.author] = {
          commits: 0,
          percentage: 0,
          name: revision.author,
        };
      }
      fileMapping[fileEntry.fileName]![revision.author]!.commits += 1;
    }
  }

  const result: FileOwnership = {};

  Object.keys(fileMapping).forEach(fileName => {
    const authors = fileMapping[fileName]!;
    const totalCommits = Object.values(authors).reduce(
      (acc, curr) => acc + curr.commits,
      0
    );

    Object.keys(authors).forEach(author => {
      fileMapping[fileName]![author]!.percentage =
        fileMapping[fileName]![author]!.commits / totalCommits;
    });

    result[fileName] = Object.values(authors).sort(
      (a, b) => b.commits - a.commits
    );
  });

  return result;
}
