import type { LogItem } from './git-log.js';

export type CoupledPair = {
  file1: string;
  file2: string;
  percentage: number;
  revisions: number;
};

function createPairKey(file1: string, file2: string): string {
  return [file1, file2].sort().join();
}

function addPairToCommit(
  filesInCommit: string[],
  pairCommitCounts: Map<string, number>,
  knownPairs: Map<string, { file1: string; file2: string }>
): void {
  filesInCommit.forEach((file1, idx) => {
    filesInCommit.slice(idx + 1).forEach(file2 => {
      const pairKey = createPairKey(file1, file2);
      knownPairs.set(pairKey, { file1, file2 });
      pairCommitCounts.set(pairKey, (pairCommitCounts.get(pairKey) ?? 0) + 1);
    });
  });
}

export function coupledPairs(revisions: LogItem[]): CoupledPair[] {
  const knownPairs = new Map<string, { file1: string; file2: string }>();

  const pairCommitCounts = new Map<string, number>();

  const fileCommitSets = new Map<string, Set<number>>();

  revisions.forEach((rev, i) => {
    const filesInCommit = rev.fileEntries.map(entry => entry.fileName);

    for (const file of filesInCommit) {
      if (!fileCommitSets.has(file)) {
        fileCommitSets.set(file, new Set());
      }
      fileCommitSets.get(file)!.add(i);
    }

    addPairToCommit(filesInCommit, pairCommitCounts, knownPairs);
  });

  const result: CoupledPair[] = [];

  for (const [pairKey, bothCount] of pairCommitCounts.entries()) {
    const pair = knownPairs.get(pairKey)!;

    const { file1, file2 } = pair;

    const file1Commits = fileCommitSets.get(file1)!;
    const file2Commits = fileCommitSets.get(file2)!;

    const eitherCommits = new Set([...file1Commits, ...file2Commits]);
    const eitherCount = eitherCommits.size;

    result.push({
      file1,
      file2,
      percentage: bothCount / eitherCount,
      revisions: eitherCount,
    });
  }

  return result;
}

export function sortCoupledPairs(data: CoupledPair[]): CoupledPair[] {
  const percentageValues = data.map(d => d.percentage);
  const revisionValues = data.map(d => d.revisions);

  const percentage = percentageValues.reduce(
    (acc, el) => ({ max: Math.max(el, acc.max), min: Math.min(el, acc.min) }),
    { min: Infinity, max: -Infinity }
  );

  const revision = revisionValues.reduce(
    (acc, el) => ({ max: Math.max(el, acc.max), min: Math.min(el, acc.min) }),
    { min: Infinity, max: -Infinity }
  );

  const normalize = (value: number, min: number, max: number) => {
    if (max === min) return 0;
    return (value - min) / (max - min);
  };

  return [...data].sort((a, b) => {
    const normalizedPercentageA = normalize(
      a.percentage,
      percentage.min,
      percentage.max
    );
    const normalizedRevisionsA = normalize(
      a.revisions,
      revision.min,
      revision.max
    );
    const scoreA = normalizedPercentageA * normalizedRevisionsA;

    const normalizedPercentageB = normalize(
      b.percentage,
      percentage.min,
      percentage.max
    );
    const normalizedRevisionsB = normalize(
      b.revisions,
      revision.min,
      revision.max
    );
    const scoreB = normalizedPercentageB * normalizedRevisionsB;

    return scoreB - scoreA;
  });
}
