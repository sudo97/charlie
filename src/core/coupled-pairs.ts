import type { LogItem } from "./revisions.js";

export type CoupledPair = {
  file1: string;
  file2: string;
  percentage: number;
  revisions: number;
};

function createPairKey(file1: string, file2: string): string {
  return [file1, file2].sort().join("");
}

function addPairToCommit(
  filesInCommit: string[],
  pairCommitCounts: Map<string, number>,
  knownPairs: Map<string, { file1: string; file2: string }>
): void {
  for (let j = 0; j < filesInCommit.length; j++) {
    for (let k = j + 1; k < filesInCommit.length; k++) {
      const file1 = filesInCommit[j]!;
      const file2 = filesInCommit[k]!;
      const pairKey = createPairKey(file1, file2);
      knownPairs.set(pairKey, { file1, file2 });
      pairCommitCounts.set(pairKey, (pairCommitCounts.get(pairKey) ?? 0) + 1);
    }
  }
}

export function coupledPairs(revisions: LogItem[]): CoupledPair[] {
  if (revisions.length === 0) {
    return [];
  }

  const knownPairs = new Map<string, { file1: string; file2: string }>();

  const pairCommitCounts = new Map<string, number>();

  const fileCommitSets = new Map<string, Set<number>>();

  for (let i = 0; i < revisions.length; i++) {
    const rev = revisions[i]!;
    const filesInCommit = rev.fileEntries.map((entry) => entry.fileName);

    for (const file of filesInCommit) {
      if (!fileCommitSets.has(file)) {
        fileCommitSets.set(file, new Set());
      }
      fileCommitSets.get(file)!.add(i);
    }

    addPairToCommit(filesInCommit, pairCommitCounts, knownPairs);
  }

  const result: CoupledPair[] = [];

  for (const [pairKey, bothCount] of pairCommitCounts.entries()) {
    const pair = knownPairs.get(pairKey);
    if (!pair) {
      throw new Error(`Pair not found for key: ${pairKey}`);
    }

    const { file1, file2 } = pair;

    const file1Commits = fileCommitSets.get(file1);
    if (!file1Commits) {
      throw new Error(`File ${file1} not found in fileCommitSets`);
    }
    const file2Commits = fileCommitSets.get(file2);
    if (!file2Commits) {
      throw new Error(`File ${file2} not found in fileCommitSets`);
    }

    const eitherCommits = new Set([...file1Commits, ...file2Commits]);
    const eitherCount = eitherCommits.size;

    result.push({
      file1,
      file2,
      percentage: bothCount / eitherCount,
      revisions: eitherCount,
    });
  }

  const maxRevisions = result
    .map((pair) => pair.revisions)
    .reduce((a, b) => Math.max(a, b), 0);

  const filteredCoupledPairsData = result
    .filter((pair) => pair.revisions / maxRevisions > 0.02)
    .sort((a, b) => b.percentage - a.percentage);

  return filteredCoupledPairsData;
}

export function significantCoupledPairs(
  data: CoupledPair[],
  revisionsPercentile: number,
  minCouplingPercentage: number
): CoupledPair[] {
  const revisions = data.map((pair) => pair.revisions).sort((a, b) => a - b);
  const percentileIdx = Math.floor(revisions.length * revisionsPercentile);
  const revisionThreshold = revisions[percentileIdx] || 0;

  return data.filter(
    (pair) =>
      pair.percentage >= minCouplingPercentage ||
      pair.revisions >= revisionThreshold
  );
}
