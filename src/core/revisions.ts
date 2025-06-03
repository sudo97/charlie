export type FileEntry = {
  added: number;
  removed: number;
  fileName: string;
};

export type LogItem = {
  hash: string;
  date: string;
  author: string;
  fileEntries: FileEntry[];
};

export type Revisions = Record<string, number>;

export function revisions(
  history: LogItem[],
  blacklist: RegExp[] = []
): Revisions {
  return history
    .flatMap((commit) =>
      commit.fileEntries
        .filter((file) => !blacklist.some((regex) => regex.test(file.fileName)))
        .map((file) => file.fileName)
    )
    .reduce((acc, file) => {
      acc[file] = (acc[file] || 0) + 1;
      return acc;
    }, {} as Revisions);
}
