export function calculateFileProximity(file1: string, file2: string) {
  const pathA = file1.split('/');
  const pathB = file2.split('/');

  while (pathA[0] === pathB[0] && pathA.length > 0 && pathB.length > 0) {
    pathA.shift();
    pathB.shift();
  }

  return pathA.length + pathB.length;
}
