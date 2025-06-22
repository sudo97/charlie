#!/usr/bin/env node
import * as path from 'path';
import { getLogItems } from './git-log-reader.js';
import { generateReport } from './report-generator.js';
import { readConfigFile } from './config.js';
import { gitHistoryWordCount } from '../core/word-count.js';
import { readHotspots } from './readHotspots.js';

const repositoryPath = path.resolve(process.argv[2] ?? '.');

const config = await readConfigFile(repositoryPath);

const logItems = await getLogItems(repositoryPath, config);

const hotspotsData = await readHotspots(repositoryPath, logItems);

/* 
TBD. Maybe I don't need this.

const outputPath2 = path.join(repositoryPath, 'coupled-pairs.json');
await fs.writeFile(outputPath2, JSON.stringify(coupledPairsData, null, 2));
console.log(`Coupled pairs data written to: ${outputPath2}`);

const outputPath3 = path.join(repositoryPath, 'soc.json');
await fs.writeFile(outputPath3, JSON.stringify(socData, null, 2));
*/

const outputPath = path.join(repositoryPath, 'charlie-report.html');

await generateReport({
  title: repositoryPath.split('/').pop() ?? 'Charlie Code Hotspots Report',
  outputPath,
  hotspots: hotspotsData,
  logItems,
  wordCount: gitHistoryWordCount(logItems),
  architecturalGroups: config.architecturalGroups,
});

console.log(`Report generated successfully at: ${outputPath}`);
