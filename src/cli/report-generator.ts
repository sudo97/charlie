import fs from "fs/promises";
import path from "path";
import mustache from "mustache";
import type { TreeData } from "src/core/tree-data.js";
import type { CoupledPair } from "../core/coupled-pairs.js";
import type { Soc } from "../core/soc.js";

export interface ReportOptions {
  title: string;
  outputPath: string;
  data: TreeData;
  coupledPairs: CoupledPair[];
  socData: Soc[];
}

export async function generateReport(options: ReportOptions) {
  const templatePath = path.join(
    process.cwd(),
    "src/frontend/templates/report.mustache"
  );

  const frontendDistPath = path.join(process.cwd(), "dist/frontend");

  try {
    const template = await fs.readFile(templatePath, "utf-8");

    const css = await readFrontendAsset(frontendDistPath, "bundle.css");
    const js = await readFrontendAsset(frontendDistPath, "bundle.js");

    const templateData = {
      title: options.title,
      css: css,
      js: js,
      reportDataJson: JSON.stringify(options.data),
      coupledPairsJson: JSON.stringify(options.coupledPairs),
      socDataJson: JSON.stringify(options.socData),
    };

    const html = mustache.render(template, templateData);

    await fs.writeFile(options.outputPath, html, "utf-8");
  } catch (error) {
    console.error("Failed to generate report:", error);
    throw error;
  }
}

async function readFrontendAsset(
  frontendDistPath: string,
  filename: string
): Promise<string> {
  try {
    const filePath = path.join(frontendDistPath, filename);
    return await fs.readFile(filePath, "utf-8");
  } catch {
    console.warn(
      `Warning: Could not read frontend asset ${filename}. Make sure to run 'npm run build:frontend' first.`
    );
    return "";
  }
}
