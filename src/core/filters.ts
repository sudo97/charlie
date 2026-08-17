import type { LogItem } from './git-log.js';

export type FilterRules = {
  include: RegExp[];
  exclude: RegExp[];
};

export function applyFilters(items: LogItem[], rules: FilterRules): LogItem[] {
  const { exclude, include } = rules;
  return items
    .map(item => ({
      ...item,
      fileEntries: item.fileEntries.filter(
        file =>
          !exclude.some(regex => regex.test(file.fileName)) &&
          (include.length === 0 ||
            include.some(regex => regex.test(file.fileName)))
      ),
    }))
    .filter(item => item.fileEntries.length > 0);
}
