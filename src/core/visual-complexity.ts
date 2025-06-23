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
  let count = 0;

  if (newDepth > prevDepth) {
    count++;
  }
  count++;

  return { count, newDepth };
}

export async function visualComplexity(emitter: VisualComplexityEmitter) {
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
