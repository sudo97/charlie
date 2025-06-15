import * as path from 'path';
import * as fs from 'fs/promises';
import { hotspots } from '../core/hotspots.js';
import type { LogItem } from '../core/git-log.js';
import { revisions } from '../core/revisions.js';

export async function readHotspots(
  repositoryPath: string,
  logItems: LogItem[]
) {
  const revisionsData = revisions(logItems);
  return hotspots(revisionsData, async file => {
    const filepath = path.join(repositoryPath, file);
    console.log('reading', filepath);
    if (
      (await fs
        .access(filepath)
        .then(() => true)
        .catch(() => false)) &&
      !(await fs.stat(filepath)).isDirectory()
    ) {
      return fs.readFile(filepath, 'utf8');
    }
    return '';
  });
}
