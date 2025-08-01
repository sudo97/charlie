import type { Hotspot } from '@core/hotspots.js';
import type { LogItem } from '@core/git-log';
import { soc, type Soc } from '@core/soc';
import { type FileOwnership, fileOwnership } from '@core/file-ownership';
// import { coupledPairs, type CoupledPair } from '@core/coupled-pairs';

export interface AppData {
  hotspots: Hotspot[];
  logItems: LogItem[];
  soc: Soc[];
  architecturalGroups: Record<string, string>;
  wordCount: Record<string, number>;
  fileOwnership: FileOwnership;
}

export function loadAllData(): AppData {
  const logItems = loadLogItems();
  return {
    hotspots: loadHotspots(),
    logItems,
    soc: loadSoc(logItems),
    architecturalGroups: loadArchitecturalGroups(),
    wordCount: loadWordCount(),
    fileOwnership: fileOwnership(logItems),
  };
}

function loadHotspots(): Hotspot[] {
  const dataElement = document.getElementById('data');
  if (!dataElement) {
    throw new Error('Hotspots data element not found');
  }
  return JSON.parse(dataElement.textContent || '[]');
}

function loadLogItems(): LogItem[] {
  const dataElement = document.getElementById('log-items-data');
  if (!dataElement) {
    throw new Error('Log items data element not found');
  }
  return JSON.parse(dataElement.textContent || '[]');
}

function loadSoc(logItems: LogItem[]): Soc[] {
  return soc(logItems);
}

function loadArchitecturalGroups(): Record<string, string> {
  const groupsElement = document.getElementById('architectural-groups');
  if (!groupsElement) {
    throw new Error('Architectural groups element not found');
  }
  return JSON.parse(groupsElement.textContent || '{}');
}

function loadWordCount(): Record<string, number> {
  const dataElement = document.getElementById('word-count-data');
  if (!dataElement) {
    throw new Error('Word count data element not found');
  }
  return JSON.parse(dataElement.textContent || '{}');
}
