import type { LogItem } from "./revisions.js";

export type CoupledPair = {
  file1: string;
  file2: string;
  percentage: number;
  revisions: number;
};

function createPairKey(file1: string, file2: string): string {
  return [file1, file2].sort().join(separator);
}

function addPairToCommit(
  filesInCommit: string[],
  pairCommitCounts: Map<string, number>
): void {
  for (let j = 0; j < filesInCommit.length; j++) {
    for (let k = j + 1; k < filesInCommit.length; k++) {
      const file1 = filesInCommit[j]!;
      const file2 = filesInCommit[k]!;
      const pairKey = createPairKey(file1, file2);
      pairCommitCounts.set(pairKey, (pairCommitCounts.get(pairKey) ?? 0) + 1);
    }
  }
}

const separator = "|||||||||||||||||||||||||||||||";

export function coupledPairs(revisions: LogItem[]): CoupledPair[] {
  if (revisions.length === 0) {
    return [];
  }

  // Track which files appear together in commits
  const pairCommitCounts = new Map<string, number>();
  // Track which commits each file appears in
  const fileCommitSets = new Map<string, Set<number>>();

  // Process each revision
  for (let i = 0; i < revisions.length; i++) {
    const rev = revisions[i]!;
    const filesInCommit = rev.fileEntries.map((entry) => entry.fileName);

    // Track which files appear in this commit
    for (const file of filesInCommit) {
      if (!fileCommitSets.has(file)) {
        fileCommitSets.set(file, new Set());
      }
      fileCommitSets.get(file)!.add(i);
    }

    // Create pairs for files that appear together in this commit
    addPairToCommit(filesInCommit, pairCommitCounts);
  }

  const result: CoupledPair[] = [];

  // Calculate statistics for each pair
  for (const [pairKey, bothCount] of pairCommitCounts.entries()) {
    const [file1, file2] = pairKey.split(separator);

    // Get commits where each file appears
    const file1Commits = fileCommitSets.get(file1!) ?? new Set();
    const file2Commits = fileCommitSets.get(file2!) ?? new Set();

    // Count commits where either file appears (union of sets)
    const eitherCommits = new Set([...file1Commits, ...file2Commits]);
    const eitherCount = eitherCommits.size;

    result.push({
      file1: file1!,
      file2: file2!,
      percentage: bothCount / eitherCount,
      revisions: eitherCount,
    });
  }

  return result;
}
