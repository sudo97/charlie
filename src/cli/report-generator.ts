import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import mustache from 'mustache';
import type { Hotspot } from '../core/hotspots.js';
import type { LogItem } from '../core/git-log.js';

export interface ReportOptions {
  title: string;
  outputPath: string;
  hotspots: Hotspot[];
  architecturalGroups: Record<string, string>;
  logItems: LogItem[];
  wordCount: Record<string, number>;
}

// Get the directory of this module file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function generateReport(options: ReportOptions) {
  // Navigate from dist/cli/cli/ to the package root, then to the template
  const packageRoot = path.resolve(__dirname, '../../..');
  const templatePath = path.join(packageRoot, 'templates/report.mustache');
  const frontendDistPath = path.join(packageRoot, 'dist/frontend');

  try {
    const template = await fs.readFile(templatePath, 'utf-8');

    const css = await readFrontendAsset(frontendDistPath, 'bundle.css');
    const js = await readFrontendAsset(frontendDistPath, 'bundle.js');

    const templateData = {
      title: options.title,
      css: css,
      js: js,
      reportDataJson: JSON.stringify(options.hotspots),
      logItemsJson: JSON.stringify(options.logItems),
      wordCountJson: JSON.stringify(options.wordCount),
      architecturalGroupsJson: JSON.stringify(options.architecturalGroups),
    };

    const html = mustache.render(template, templateData);

    await fs.writeFile(options.outputPath, html, 'utf-8');
  } catch (error) {
    console.error('Failed to generate report:', error);
    throw error;
  }
}

async function readFrontendAsset(
  frontendDistPath: string,
  filename: string
): Promise<string> {
  try {
    const filePath = path.join(frontendDistPath, filename);
    return await fs.readFile(filePath, 'utf-8');
  } catch {
    console.warn(
      `Warning: Could not read frontend asset ${filename}. Make sure to run 'npm run build:frontend' first.`
    );
    return '';
  }
}
