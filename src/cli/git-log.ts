import * as Git from "isomorphic-git";
import fs from "fs";
import type { History } from "../shared/revisions.js";

/**
 * Gets affected files between two commits
 * @param dir - The git repository directory
 * @param commitHash1 - First commit hash (older)
 * @param commitHash2 - Second commit hash (newer)
 * @returns Array of affected file paths
 */
async function getAffectedFiles(
  dir: string,
  commitHash1: string | undefined,
  commitHash2: string
): Promise<string[]> {
  // If no parent commit, compare against empty tree
  const tree1 = commitHash1
    ? Git.TREE({ ref: commitHash1 })
    : Git.TREE({ ref: "4b825dc642cb6eb9a060e54bf8d69288fbee4904" });
  const tree2 = Git.TREE({ ref: commitHash2 });

  const changes = await Git.walk({
    fs,
    dir,
    trees: [tree1, tree2],
    map: async function (filepath: string, [A, B]) {
      // ignore directories and root
      if (filepath === ".") {
        return;
      }
      if ((await A?.type()) === "tree" || (await B?.type()) === "tree") {
        return;
      }

      // generate ids
      const Aoid = await A?.oid();
      const Boid = await B?.oid();

      // Skip if files are identical
      if (Aoid === Boid) {
        return;
      }

      return filepath;
    },
  });

  return changes.filter(
    (filepath: string | undefined): filepath is string =>
      typeof filepath === "string"
  );
}

/**
 * Gets commits from all branches
 */
async function getAllBranchCommits(
  repositoryPath: string,
  depth?: number,
  since?: Date
): Promise<Git.ReadCommitResult[]> {
  const refs = await Git.listBranches({ fs, dir: repositoryPath });
  const allCommits: Git.ReadCommitResult[] = [];

  for (const branchRef of refs) {
    try {
      const branchCommits = await Git.log({
        fs,
        dir: repositoryPath,
        ref: branchRef,
        depth,
        since,
      });
      allCommits.push(...branchCommits);
    } catch {
      // Skip branches that can't be accessed
      continue;
    }
  }

  // Remove duplicates based on commit hash and sort by date
  const uniqueCommits = Array.from(
    new Map(allCommits.map((commit) => [commit.oid, commit])).values()
  ).sort((a, b) => b.commit.committer.timestamp - a.commit.committer.timestamp);

  return depth ? uniqueCommits.slice(0, depth) : uniqueCommits;
}

/**
 * Gets git log with affected files for each commit
 * @param repositoryPath - Path to the git repository
 * @param options - Optional configuration
 * @returns Promise resolving to array of commits with affected files
 */
export async function getGitLogWithFiles(
  repositoryPath: string,
  options: {
    /** Maximum number of commits to return */
    depth?: number;
    /** Branch/ref to start from (default: 'HEAD') */
    ref?: string;
    /** Return history newer than the given date */
    since?: Date;
    /** Include all branches (similar to --all flag) */
    all?: boolean;
  } = {}
): Promise<History> {
  const { depth, ref = "HEAD", since, all = false } = options;

  try {
    // Get commits from git log
    const commits = all
      ? await getAllBranchCommits(repositoryPath, depth, since)
      : await Git.log({
          fs,
          dir: repositoryPath,
          ref,
          depth,
          since,
        });

    const commitsWithFiles: History = [];

    for (const commitData of commits) {
      if (!commitData) {
        continue;
      }

      const parentCommit = commitData.commit.parent[0];

      // Get affected files by comparing with parent
      const affectedFiles = await getAffectedFiles(
        repositoryPath,
        parentCommit,
        commitData.oid
      );

      commitsWithFiles.push(affectedFiles.map((file) => ({ file })));
    }

    return commitsWithFiles;
  } catch (error) {
    throw new Error(
      `Failed to get git log: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}
