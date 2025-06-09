import type { FileEntry, LogItem } from '@core/revisions';

export function parseHeader(line: string): {
  hash: string;
  date: string;
  author: string;
} {
  const [hash, date, author] = line.split('--').slice(1);
  if (!hash || !date || !author) {
    throw new Error('Invalid log item');
  }
  const cleanedAuthor = author.replace(/'$/g, '');
  return { hash, date, author: cleanedAuthor };
}

export function parseLogItem(logItem: string): LogItem {
  const [firstLine, ...rest] = logItem.split('\n');
  if (!firstLine) {
    throw new Error('Invalid log item');
  }
  const { hash, date, author } = parseHeader(firstLine);

  const fileEntries = rest.map(parseFileEntry);

  return {
    hash,
    date,
    author,
    fileEntries,
  };
}

export function parseFileEntry(line: string): FileEntry {
  const [added, removed, path] = line.split(/\s+/);
  if (!added || !removed || !path) {
    throw new Error(`Invalid file entry: ${line}`);
  }

  return {
    added: parseInt(added),
    removed: parseInt(removed),
    fileName: path,
  };
}
