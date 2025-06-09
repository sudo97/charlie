import { type LogItem } from './revisions.js';
import { type Config } from '../cli/config.js';

export function applyFilters(items: LogItem[], config: Config): LogItem[] {
  const { exclude, include } = config;
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
