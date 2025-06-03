export interface HotspotData {
  file: string;
  complexity: number;
  revisions: number;
}

export interface ReportOptions {
  title: string;
  outputPath: string;
  data: TreeData;
}

export type Folder = {
  name: string;
  children: TreeData[];
};

export type File = {
  name: string;
  complexity: number;
  revisions: number;
};

export type TreeData = Folder | File;
