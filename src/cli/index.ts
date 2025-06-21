#!/usr/bin/env node
import * as path from 'path';
import { getLogItems } from './git-log-reader.js';
import { generateReport } from './report-generator.js';
import { treeData } from '../core/tree-data.js';
import {
  coupledPairs,
  significantCoupledPairs,
} from '../core/coupled-pairs.js';
import { soc, socPercentile } from '../core/soc.js';
import { readConfigFile } from './config.js';
import { groupHotspots } from '../core/group-hotspots.js';
import { gitHistoryWordCount } from '../core/word-count.js';
import { groupGitLog } from '../core/group-git-log.js';
import { readHotspots } from './readHotspots.js';
import { calculateFileProximity } from '../core/file-proximity.js';

const repositoryPath = path.resolve(process.argv[2] ?? '.');

const config = await readConfigFile(repositoryPath);

const logItems = await getLogItems(repositoryPath, config);

const hotspotsData = await readHotspots(repositoryPath, logItems);

const groupedHotspotsData = groupHotspots(
  hotspotsData,
  config.architecturalGroups
);

const coupledPairsData = significantCoupledPairs(
  coupledPairs(logItems),
  config.revisionsPercentile,
  config.minCouplingPercentage
).map(pair => ({
  ...pair,
  proximity: calculateFileProximity(pair.file1, pair.file2),
}));

const coupledPairsDataGrouped = significantCoupledPairs(
  coupledPairs(groupGitLog(logItems, config.architecturalGroups)),
  config.revisionsPercentile,
  config.minCouplingPercentage
);

const socData = socPercentile(soc(logItems), config.socPercentile);

/* 
TBD. Maybe I don't need this.

const outputPath2 = path.join(repositoryPath, 'coupled-pairs.json');
await fs.writeFile(outputPath2, JSON.stringify(coupledPairsData, null, 2));
console.log(`Coupled pairs data written to: ${outputPath2}`);

const outputPath3 = path.join(repositoryPath, 'soc.json');
await fs.writeFile(outputPath3, JSON.stringify(socData, null, 2));
console.log(`Soc data written to: ${outputPath3}`);
*/

const outputPath = path.join(repositoryPath, 'charlie-report.html');

await generateReport({
  title: repositoryPath.split('/').pop() ?? 'Charlie Code Hotspots Report',
  outputPath,
  data: treeData(hotspotsData),
  coupledPairs: coupledPairsData,
  coupledPairsGrouped: coupledPairsDataGrouped,
  socData: socData,
  wordCount: gitHistoryWordCount(logItems),
  groupedHotspots: treeData(groupedHotspotsData),
});

console.log(`Report generated successfully at: ${outputPath}`);
