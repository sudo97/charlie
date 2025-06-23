import * as path from 'path';
// import * as fs from 'fs/promises';
import * as fsOld from 'fs';
import { hotspots } from '../core/hotspots.js';
import type { LogItem } from '../core/git-log.js';
import { revisions } from '../core/revisions.js';

export async function readHotspots(
  repositoryPath: string,
  logItems: LogItem[]
) {
  const revisionsData = revisions(logItems);
  return hotspots(revisionsData, file => {
    const filepath = path.join(repositoryPath, file);

    if (!fsOld.existsSync(filepath) || fsOld.statSync(filepath).isDirectory()) {
      return {
        onData: () => {},
        onEnd: onEnd => {
          onEnd();
        },
      };
    }

    console.log('reading', filepath);
    const fileStream = fsOld.createReadStream(filepath, { encoding: 'utf8' });

    return {
      onData: listener => {
        fileStream.on('data', (chunk: string | Buffer<ArrayBufferLike>) => {
          listener(chunk.toString());
        });
      },
      onEnd: listener => {
        fileStream.on('end', () => {
          listener();
        });
      },
    };
  });
}
