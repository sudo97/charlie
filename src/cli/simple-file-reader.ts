import * as fsOld from 'fs';
import type { VisualComplexityEmitter } from '../core/visual-complexity';

export const fileReader = (filepath: string): VisualComplexityEmitter => {
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
};
