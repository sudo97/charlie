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

export function revisions(history: LogItem[]): Revisions {
  return history
    .flatMap((commit) => commit.fileEntries.map((file) => file.fileName))
    .reduce((acc, file) => {
      acc[file] = (acc[file] || 0) + 1;
      return acc;
    }, {} as Revisions);
}
