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
