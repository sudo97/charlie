import fs from "fs/promises";
import path from "path";
import mustache from "mustache";
import type { TreeData } from "@shared/tree-data.js";

export interface ReportOptions {
  title: string;
  outputPath: string;
  data: TreeData;
}

export class ReportGenerator {
  private templatePath: string;
  private frontendDistPath: string;

  constructor() {
    this.templatePath = path.join(
      process.cwd(),
      "src/frontend/templates/report.html"
    );
    this.frontendDistPath = path.join(process.cwd(), "dist/frontend");
  }

  async generateReport(options: ReportOptions): Promise<void> {
    try {
      // Read template
      const template = await fs.readFile(this.templatePath, "utf-8");

      // Read built frontend assets
      const css = await this.readFrontendAsset("bundle.css");
      const js = await this.readFrontendAsset("bundle.js");

      // Prepare template data
      const templateData = {
        title: options.title,
        css: css,
        js: js,
        reportDataJson: JSON.stringify(options.data),
      };

      // Render template
      const html = mustache.render(template, templateData);

      // Write output file
      await fs.writeFile(options.outputPath, html, "utf-8");

      console.log(`Report generated: ${options.outputPath}`);
    } catch (error) {
      console.error("Failed to generate report:", error);
      throw error;
    }
  }

  private async readFrontendAsset(filename: string): Promise<string> {
    try {
      const filePath = path.join(this.frontendDistPath, filename);
      return await fs.readFile(filePath, "utf-8");
    } catch {
      console.warn(
        `Warning: Could not read frontend asset ${filename}. Make sure to run 'npm run build:frontend' first.`
      );
      return "";
    }
  }
}
