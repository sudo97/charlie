import { Hotspot } from "./hotspots";

type Folder = {
  name: string;
  children: TreeData[];
};

type File = {
  name: string;
  complexity: number;
  revisions: number;
};

export type TreeData = Folder | File;

export function treeData(hotspots: Hotspot[]): TreeData {
  const root: TreeData = {
    name: "Root",
    children: [],
  };

  for (const hotspot of hotspots) {
    const path = hotspot.file.split("/");
    const lastItem = path.pop()!;

    let subTree = root;
    for (const folderName of path) {
      let nextSubTree = subTree.children.find(
        (child): child is Folder =>
          child.name === folderName && "children" in child
      );
      if (!nextSubTree) {
        nextSubTree = {
          name: folderName,
          children: [],
        };
        subTree.children.push(nextSubTree);
      }
      subTree = nextSubTree;
    }
    subTree.children.push({
      name: lastItem,
      complexity: hotspot.complexity,
      revisions: hotspot.revisions,
    });
  }

  return root;
}
