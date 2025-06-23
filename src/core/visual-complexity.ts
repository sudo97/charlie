export interface VisualComplexityEmitter {
  onData: (listener: (chunk: string) => void) => void;
  onEnd: (listener: () => void) => void;
}

export async function visualComplexity(emitter: VisualComplexityEmitter) {
  return new Promise<number>(resolve => {
    let count = 0;
    let buf = '';
    let prevDepth = 0;

    emitter.onEnd(() => {
      if (buf.length > 0) {
        const newDepth = buf.match(/^\s*/)?.[0]?.length || 0;
        if (newDepth > prevDepth) {
          count++;
        }
        count++;
      }
      resolve(count);
    });

    emitter.onData(chunk => {
      buf += chunk;
      let idx;
      while ((idx = buf.indexOf('\n')) !== -1) {
        const line = buf.slice(0, idx);
        buf = buf.slice(idx + 1);
        if (line.length > 0) {
          const newDepth = line.match(/^\s*/)?.[0]?.length || 0;
          if (newDepth > prevDepth) {
            count++;
          }
          prevDepth = newDepth;
          count++;
        }
      }
    });
  });
}
