import * as path from "path";
import * as fs from "fs/promises";
import { revisions } from "../core/revisions.js";
import { hotspots } from "../core/hotspots.js";
import { produceGitLog } from "./git-log.js";
import { generateReport } from "./report-generator.js";
import { treeData } from "../core/tree-data.js";
import { createGitLogEmitter } from "./createGitLogEmitter.js";
import { coupledPairs } from "../core/coupled-pairs.js";

const repositoryPath = path.resolve(process.argv[2] ?? ".");

const blacklist = [
  /package-lock\.json/,
  /package\.json/,
  /yarn\.lock/,
  /\.md$/,
];

const logItems = await produceGitLog(createGitLogEmitter(repositoryPath));

const revisionsData = revisions(logItems, blacklist);

const hotspotsData = await hotspots(revisionsData, async (file) => {
  const filepath = path.join(repositoryPath, file);
  console.log("reading", filepath);
  if (
    await fs
      .access(filepath)
      .then(() => true)
      .catch(() => false)
  ) {
    return fs.readFile(filepath, "utf8");
  }
  return "";
});

const outputPath = path.join(process.cwd(), "charlie-report.html");

await generateReport({
  title: "Charlie Code Hotspots Report",
  outputPath,
  data: treeData(hotspotsData),
});

console.log(`Report generated successfully at: ${outputPath}`);

const coupledPairsData = coupledPairs(logItems);

const outputPath2 = path.join(process.cwd(), "coupled-pairs.json");
await fs.writeFile(outputPath2, JSON.stringify(coupledPairsData, null, 2));
console.log(`Coupled pairs data written to: ${outputPath2}`);
