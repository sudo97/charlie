import type { LogItem } from './git-log';

export type FileOwnership = Record<
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

type OwnershipDistribution = Array<{ name: string; percentage: number }>;

export function ownershipDistribution(
  ownership: FileOwnership
): OwnershipDistribution {
  const reversedMapping: Record<
    string,
    { file: string; percentage: number }[]
  > = {};

  for (const file of Object.keys(ownership)) {
    for (const owner of ownership[file]!) {
      if (!reversedMapping[owner.name]) {
        reversedMapping[owner.name] = [];
      }
      reversedMapping[owner.name]!.push({
        file,
        percentage: owner.percentage,
      });
    }
  }

  const totalFiles = Object.keys(ownership).length;

  const result: Record<string, { percentage: number }> = {};

  for (const owner of Object.keys(reversedMapping)) {
    const mapping = reversedMapping[owner]!;
    result[owner] = {
      percentage: mapping.reduce((acc, curr) => acc + curr.percentage, 0),
    };
  }

  return Object.keys(result)
    .map(name => ({
      name,
      percentage: result[name]!.percentage / totalFiles,
    }))
    .sort((a, b) => b.percentage - a.percentage);
}

export function truckFactor(
  data: OwnershipDistribution
): OwnershipDistribution {
  const result: OwnershipDistribution = [];

  const remaining = [...data];

  while (isLessThan(result, 0.5)) {
    const item = remaining.shift();
    if (item) {
      result.push(item);
    }
  }

  return result;
}

function isLessThan(data: OwnershipDistribution, threshold: number): boolean {
  return data.reduce((acc, curr) => acc + curr.percentage, 0) < threshold;
}
