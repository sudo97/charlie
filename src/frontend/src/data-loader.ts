import type { Hotspot } from '@core/hotspots.js';
import type { LogItem } from '@core/git-log';
import { type FileOwnership, fileOwnership } from '@core/file-ownership';
import {
  couplingAnalysis,
  type CouplingItem,
  type Soc,
} from '@core/coupling-analysis';

export interface AppData {
  hotspots: Hotspot[];
  logItems: LogItem[];
  soc: Soc[];
  coupling: CouplingItem[];
  architecturalGroups: Record<string, string>;
  wordCount: Record<string, number>;
  fileOwnership: FileOwnership;
}

export function loadAllData(): AppData {
  const logItems = loadLogItems();
  const analysis = couplingAnalysis(logItems);
  return {
    hotspots: loadHotspots(),
    logItems,
    soc: analysis.soc,
    coupling: analysis.coupling,
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
