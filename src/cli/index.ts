#!/usr/bin/env node
import * as path from 'path';
import { produceGitLog } from './git-log-reader.js';
import { createGitLogEmitter } from './createGitLogEmitter.js';
import { generateReport } from './report-generator.js';
import { readConfigFile } from './config.js';
import { applyFilters } from '../core/filters.js';
import { gitHistoryWordCount } from '../core/word-count.js';
import { readHotspots } from './readHotspots.js';

const repositoryPath = path.resolve(process.argv[2] ?? '.');

const config = await readConfigFile(repositoryPath);

const logItems = applyFilters(
  await produceGitLog(createGitLogEmitter(repositoryPath, config.after)),
  config
);

const hotspotsData = await readHotspots(repositoryPath, logItems);

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
