import { Hotspot } from "./hotspots";

export type TreeData =
  | {
      name: string;
      children: TreeData[];
    }
  | {
      name: string;
      complexity: number;
      revisions: number;
    };

export function treeData(hotspots: Hotspot[]): TreeData {
  return {
    name: "Root",
    children: hotspots.map((hotspot) => ({
      name: hotspot.file,
      complexity: hotspot.complexity,
      revisions: hotspot.revisions,
    })),
  };
}
