export function visualComplexity(file: string) {
  let count = 0;
  let depth = 0;
  for (const line of file.split("\n")) {
    if (line.length > 0) {
      const newDepth = line.match(/^\s*/)?.[0]?.length || 0;
      if (newDepth > depth) {
        count++;
      }
      depth = newDepth;
      count++;
    }
  }
  return count;
}
