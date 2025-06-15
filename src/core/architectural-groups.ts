export type Group = { pattern: RegExp; group: string };
export function compileGroups(
  architecturalGroups: Record<string, string> | undefined
): Group[] {
  return Object.entries(architecturalGroups ?? {}).map(([pattern, group]) => {
    return {
      pattern: new RegExp(pattern),
      group,
    };
  });
}

export function filenameToGroup(fileName: string, groups: Group[]) {
  return groups.find(group => group.pattern.test(fileName))?.group ?? fileName;
}
