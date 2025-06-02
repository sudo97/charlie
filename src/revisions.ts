export type FileChange = {
  file: string;
  // linesAdded: number;
  // linesRemoved: number;
};

export type Commit = FileChange[];

export type History = Commit[];

export type Revisions = Record<string, number>;

export function revisions(history: History): Revisions {
  return history
    .flatMap((commit) => commit.map((file) => file.file))
    .reduce((acc, file) => {
      acc[file] = (acc[file] || 0) + 1;
      return acc;
    }, {} as Revisions);
}
