import type { FileEntry, LogItem } from './git-log.js';

export function parseHeader(line: string): {
  hash: string;
  date: string;
  author: string;
  message: string;
} {
  const [hash, date, author, message] = line.split('--').slice(1);
  if (!hash || !date || !author || !message) {
    throw new Error('Invalid log item');
  }
  const cleanedAuthor = author.replace(/'$/g, '');
  return {
    hash,
    date,
    author: cleanedAuthor,
    message: message.replace(/'$/g, ''),
  };
}

export function parseLogItem(logItem: string): LogItem {
  const [firstLine, ...rest] = logItem.split('\n');
  if (!firstLine) {
    throw new Error('Empty log item');
  }
  const { hash, date, author, message } = parseHeader(firstLine);

  const fileEntries = rest.map(parseFileEntry);

  return {
    hash,
    date,
    author,
    fileEntries,
    message,
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

export type MalformedLineHandler = (line: string, error: unknown) => void;

const isHeader = (line: string) => line.startsWith("'--");

function appendFileEntry(
  logItems: LogItem[],
  line: string,
  onMalformedLine: MalformedLineHandler
): void {
  const current = logItems[logItems.length - 1];

  if (!current) {
    onMalformedLine(line, new Error('File entry before any commit header'));
    return;
  }

  try {
    current.fileEntries.push(parseFileEntry(line));
  } catch (error) {
    onMalformedLine(line, error);
  }
}

export function parseGitLog(
  text: string,
  onMalformedLine: MalformedLineHandler
): LogItem[] {
  const logItems: LogItem[] = [];

  for (const line of text.split('\n')) {
    if (line.length === 0) {
      continue;
    }

    if (isHeader(line)) {
      logItems.push({ ...parseHeader(line), fileEntries: [] });
    } else {
      appendFileEntry(logItems, line, onMalformedLine);
    }
  }

  return logItems;
}
