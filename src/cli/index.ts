import * as path from "path";
import * as fs from "fs/promises";
import { revisions } from "../core/revisions.js";
import { hotspots } from "../core/hotspots.js";
import { produceGitLog } from "./git-log.js";
import { generateReport } from "./report-generator.js";
import { treeData } from "../core/tree-data.js";
import { createGitLogEmitter } from "./createGitLogEmitter.js";
import { coupledPairs } from "../core/coupled-pairs.js";
import { soc } from "../core/soc.js";
import { parseConfig } from "./config.js";
import { applyFilters } from "../core/filters.js";
import { groupHotspots } from "../core/group-hotspots.js";

const repositoryPath = path.resolve(process.argv[2] ?? ".");

const config = parseConfig(
  await fs
    .readFile(path.join(repositoryPath, ".charlie.config.json"), "utf8")
    .catch(() => "{}")
);

const logItems = applyFilters(
  await produceGitLog(createGitLogEmitter(repositoryPath, config.after)),
  config
);

const revisionsData = revisions(logItems);

let hotspotsData = await hotspots(revisionsData, async (file) => {
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

if (config.architecturalGroups) {
  hotspotsData = groupHotspots(hotspotsData, config.architecturalGroups);
}

const coupledPairsData = coupledPairs(logItems);

const outputPath2 = path.join(process.cwd(), "coupled-pairs.json");
await fs.writeFile(outputPath2, JSON.stringify(coupledPairsData, null, 2));
console.log(`Coupled pairs data written to: ${outputPath2}`);

const socData = soc(logItems);

const outputPath3 = path.join(process.cwd(), "soc.json");
await fs.writeFile(outputPath3, JSON.stringify(socData, null, 2));
console.log(`Soc data written to: ${outputPath3}`);

const outputPath = path.join(process.cwd(), "charlie-report.html");

await generateReport({
  title: "Charlie Code Hotspots Report",
  outputPath,
  data: treeData(hotspotsData),
  coupledPairs: coupledPairsData,
  socData: socData,
});

console.log(`Report generated successfully at: ${outputPath}`);
