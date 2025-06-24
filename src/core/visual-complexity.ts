import * as path from 'path';
import * as fsOld from 'fs';
export interface VisualComplexityEmitter {
  onData: (listener: (chunk: string) => void) => void;
  onEnd: (listener: () => void) => void;
}

function processLine(
  line: string,
  prevDepth: number
): { count: number; newDepth: number } {
  if (line.length === 0) {
    return { count: 0, newDepth: prevDepth };
  }

  const newDepth = line.match(/^\s*/)?.[0]?.length || 0;

  return { count: newDepth > prevDepth ? 2 : 1, newDepth };
}

export async function visualComplexity(
  emitter: VisualComplexityEmitter
): Promise<number> {
  return new Promise<number>(resolve => {
    let count = 0;
    let buf = '';
    let prevDepth = 0;

    emitter.onEnd(() => {
      const result = processLine(buf, prevDepth);
      count += result.count;
      resolve(count);
    });

    emitter.onData(chunk => {
      buf += chunk;
      let idx;
      while ((idx = buf.indexOf('\n')) !== -1) {
        const line = buf.slice(0, idx);
        buf = buf.slice(idx + 1);

        const result = processLine(line, prevDepth);

        count += result.count;
        prevDepth = result.newDepth;
      }
    });
  });
}

export async function visualComplexityFile(
  repositoryPath: string,
  file: string
): Promise<number> {
  const filepath = path.join(repositoryPath, file);
  const emitter = fileReader(filepath);
  return visualComplexity(emitter);
}

const fileReader = (filepath: string): VisualComplexityEmitter => {
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
