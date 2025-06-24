import { hotspots } from '../core/hotspots.js';
import type { LogItem } from '../core/git-log.js';
import { revisions } from '../core/revisions.js';

import { visualComplexityFile } from '../core/visual-complexity.js';

export async function readHotspots(
  repositoryPath: string,
  logItems: LogItem[]
) {
  const revisionsData = revisions(logItems);
  return hotspots(revisionsData, file =>
    visualComplexityFile(repositoryPath, file)
  );
}
