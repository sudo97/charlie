#!/usr/bin/env node
import * as path from 'path';
import { produceGitLog } from './git-log-reader.js';
import { createGitLogEmitter } from './createGitLogEmitter.js';
import { generateReport } from './report-generator.js';
import { readConfigFile } from './config.js';
import { applyFilters } from '../core/filters.js';
import { gitHistoryWordCount } from '../core/word-count.js';
import { readHotspots } from './readHotspots.js';
import { parseArgs } from '../core/parse-args.js';
import { couplingAnalysis } from '../core/coupling-analysis.js';
import { defaultLimits, jsonPayload } from '../core/json-payload.js';

const args = parseArgs(process.argv.slice(2));

const repositoryPath = path.resolve(args.repositoryPath);

const config = await readConfigFile(repositoryPath);

const logItems = applyFilters(
  await produceGitLog(createGitLogEmitter(repositoryPath, config.after)),
  config
);

const hotspotsData = await readHotspots(repositoryPath, logItems);

if (args.json) {
  const payload = jsonPayload(
    hotspotsData,
    couplingAnalysis(logItems),
    args.all ? undefined : defaultLimits
  );

  console.log(JSON.stringify(payload, null, 2));
} else {
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
}
