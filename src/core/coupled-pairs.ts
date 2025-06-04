import type { LogItem } from "./revisions.js";

export type CoupledPair = {
  file1: string;
  file2: string;
  percentage: number;
  revisions: number;
};

class Pairs {
  private pairs: Map<string, number> = new Map();

  private key(file1: string, file2: string) {
    return [file1, file2].sort().join("-");
  }

  add(file1: string, file2: string) {
    const key = this.key(file1, file2);
    this.pairs.set(key, (this.pairs.get(key) ?? 0) + 1);
  }

  get(file1: string, file2: string) {
    return this.pairs.get(this.key(file1, file2)) ?? 0;
  }

  items(): { file1: string; file2: string; occurences: number }[] {
    return Array.from(this.pairs.entries()).map(([key, value]) => {
      const [file1, file2] = key.split("-");
      return {
        file1: file1!,
        file2: file2!,
        occurences: value,
      };
    });
  }
}

class SeparateFiles {
  private files: Map<string, number> = new Map();

  add(file: string) {
    this.files.set(file, (this.files.get(file) ?? 0) + 1);
  }

  get(file: string) {
    return this.files.get(file) ?? 0;
  }
}

export function coupledPairs(revisions: LogItem[]): CoupledPair[] {
  if (revisions.length === 0) {
    return [];
  }

  const pairs = new Pairs();
  const separateFiles = new SeparateFiles();

  for (const rev of revisions) {
    for (const file of rev.fileEntries) {
      for (const otherFile of rev.fileEntries) {
        if (file.fileName === otherFile.fileName) {
          continue;
        }

        pairs.add(file.fileName, otherFile.fileName);
      }
      separateFiles.add(file.fileName);
    }
  }

  const result: CoupledPair[] = [];

  for (const item of pairs.items()) {
    const total = separateFiles.get(item.file1) + separateFiles.get(item.file2);
    result.push({
      file1: item.file1,
      file2: item.file2,
      percentage: item.occurences / total,
      revisions: item.occurences,
    });
  }
  return result;
}
