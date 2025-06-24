import { hotspots } from '../core/hotspots.js';
import * as path from 'path';
import type { LogItem } from '../core/git-log.js';
import { revisions } from '../core/revisions.js';
import { fileReader } from '../core/simple-file-reader.js';

import { visualComplexity } from '../core/visual-complexity.js';

export async function readHotspots(
  repositoryPath: string,
  logItems: LogItem[]
) {
  const revisionsData = revisions(logItems);
  return hotspots(revisionsData, file =>
    visualComplexityFile(repositoryPath, file)
  );
}

export async function visualComplexityFile(
  repositoryPath: string,
  file: string
): Promise<number> {
  const filepath = path.join(repositoryPath, file);
  const emitter = fileReader(filepath);
  return visualComplexity(emitter);
}
