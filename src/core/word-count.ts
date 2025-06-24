import type { LogItem } from './git-log';

export function wordCount(text: string): Record<string, number> {
  return text
    .toLowerCase()
    .split(/[^a-z]/)
    .filter(word => word.length > 0)
    .reduce(
      (acc, word) => {
        const key = word;
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );
}

export function gitHistoryWordCount(
  logItems: Array<Pick<LogItem, 'message'>>
): Record<string, number> {
  return wordCount(logItems.map(({ message }) => message).join(' '));
}
