# Charlie 🕵️

This is a tool for analyzing and visualizing your git history. Based on ideas from "[Your Code as a Crime Scene](https://pragprog.com/titles/atcrime2/your-code-as-a-crime-scene-second-edition/)" by Adam Tornhill. Highly recommended reading.

## Table of Contents

- [Motivation](#motivation)
- [Core Concepts](#core-concepts)
  - [Hotspots](#hotspots)
  - [Coupled Pairs](#coupled-pairs)
  - [Sum of Coupling (SOC)](#sum-of-coupling-soc)
  - [The Power of Data Over Time](#the-power-of-data-over-time)
  - [Complexity Calculation](#complexity-calculation)
- [.charlie.config.json](#charlieconfigjson)
  - [Configuration Fields](#configuration-fields)
    - [`include` (optional)](#include-optional)
    - [`exclude` (optional)](#exclude-optional)
    - [`after` (optional)](#after-optional)
    - [`architecturalGroups` (optional)](#architecturalgroups-optional)
  - [Complete Example](#complete-example)
  - [How It Works](#how-it-works)
- [Thoughts](#thoughts)
  - [On Architectural Grouping](#on-architectural-grouping)
- [Credits](#credits)
- [TODO](#todo)

## Motivation

In "Your Code as a Crime Scene", Adam Tornhill presents powerful techniques for mining insights from version control systems to identify problematic code patterns, architectural issues, and team dynamics. The book demonstrates these concepts using [Code Maat](https://github.com/adamtornhill/code-maat), a command-line tool that extracts and analyzes VCS data. While Code Maat is excellent for research and deep analysis, it requires exporting git logs to files and often involves additional Python scripts to generate visualizations from CSV outputs.

[CodeScene](https://codescene.com/), the commercial evolution of these ideas, provides beautiful visualizations and automated analysis through GitHub integration. While it's a powerful tool, some developers prefer a completely local solution without any external service dependencies.

Charlie bridges this gap by providing a tool similar to `bundle-analyzer` or `dependency-cruiser` - you can run it locally with a single command and immediately see visual results in your browser. No file exports, no online services, just instant insights into your codebase's behavioral patterns.

Building this tool (with a little help from my friends) has been the best way to truly understand the concepts from the book. As they say, you don't really know something until you can build it yourself.

## Core Concepts

### Hotspots

A **hotspot** is a file or module that is both frequently modified AND has high complexity. These represent the most problematic areas of your codebase - they change often (indicating active development or bug fixes) and are complex (making them risky to modify). Hotspots should be your top priority for refactoring. The circle size represents the complexity of the file being changed. Colors represent the frequency of the file being changed (from gray i.e. low frequency, to blue-ish, to red-ish i.e. high frequency).

### Coupled Pairs

**Coupled pairs** are files that frequently appear together in the same commits. When two files are consistently modified together, it suggests they're more tightly coupled than your architecture might indicate. High coupling can lead to ripple effects where changes in one file require changes in another.

### Sum of Coupling (SOC)

**SOC** is a metric calculated per file that counts how many times the file appears in commits with other files (i.e., it's not alone in the commit). Every time a file is committed alongside other files, we assume it might be coupled with them. A high SOC score indicates a file that's frequently involved in multi-file changes, which could signal architectural problems. When a file is both a hotspot AND has high SOC, it becomes a critical refactoring priority.

### The Power of Data Over Time

These metrics might sound overly simplistic at first glance, but when you collect data over months or a full year, powerful patterns emerge. Individual commits might seem random, but aggregate behavior reveals the true structure and pain points of your codebase. **Data is king** - it shows you what's actually happening, not what you think is happening.

### Complexity Calculation

Charlie calculates complexity using a simple but effective approach: it adds 1 to the complexity score for each line of code in the file, and adds another point whenever a line has more leading whitespace than the previous line (indicating nested code blocks). This method is language-agnostic and works well for identifying complex areas across different codebases. As long as the formatting is consistent, this approach will work.

While cyclomatic complexity might be more academically accurate, this nested-based approach is sufficient for the behavioral analysis goals of this tool. For individual file analysis, I still recommend measuring cyclomatic complexity, but for understanding large-scale patterns and trends, this simpler metric serves us well.

# .charlie.config.json

The `.charlie.config.json` file allows you to customize Charlie's analysis behavior. This file should be placed in the root of your repository (the same directory where you run the `charlie` command). Additional analysis options like coupling thresholds and percentile filters are available through the interactive frontend.

## Configuration Fields

### `include` (optional)

**Type:** `string[]` (array of regex patterns)  
**Default:** `[]` (includes all files)

An array of regular expression patterns to specify which files should be included in the analysis. If this field is empty or not provided, all files are included by default.

```json
{
  "include": ["^src/", "^lib/", "\\.ts$", "\\.js$"]
}
```

### `exclude` (optional)

**Type:** `string[]` (array of regex patterns)  
**Default:** `[]` (excludes no files)

An array of regular expression patterns to specify which files should be excluded from the analysis. These patterns are applied after the `include` patterns.

```json
{
  "exclude": ["node_modules/", "\\.test\\.", "\\.spec\\.", "dist/", "build/"]
}
```

### `after` (optional)

**Type:** `string` (ISO date format)  
**Default:** One year ago from the current date

Specifies the earliest date for git commits to include in the analysis. Only commits made after this date will be considered.

```json
{
  "after": "2023-01-01T00:00:00.000Z"
}
```

### `architecturalGroups` (optional)

**Type:** `Record<string, string>` (regex pattern → group name mapping)  
**Default:** `undefined` (no grouping)

Allows you to group files into architectural components for analysis. The key is a regex pattern that matches file paths, and the value is the name of the architectural group. Files matching the same group will be consolidated into single entries. Only the first group that matches a file is used.

When `architecturalGroups` is specified, Charlie generates both file-level and grouped visualizations in the report:
1. **File-level Hotspots** - Shows individual files as separate hotspots
2. **Grouped Hotspots** - Shows architectural groups as consolidated hotspots
3. **Grouped Coupled Pairs** - Shows coupling relationships between architectural groups

This allows you to see both the detailed file-level view and the higher-level architectural view simultaneously.

```json
{
  "architecturalGroups": {
    "^src/components/": "UI Components",
    "^src/services/": "Business Logic",
    "^src/utils/": "Utilities",
    "^src/hooks/": "React Hooks"
  }
}
```

## Complete Example

Here's a comprehensive example of a `.charlie.config.json` file:

```json
{
  "include": ["^src/", "^lib/"],
  "exclude": [
    "node_modules/",
    "\\.test\\.",
    "\\.spec\\.",
    "dist/",
    "build/",
    "__tests__/",
    "\\.d\\.ts$"
  ],
  "after": "2023-06-01T00:00:00.000Z",
  "architecturalGroups": {
    "^src/components/": "UI Layer",
    "^src/services/": "Service Layer",
    "^src/store/": "State Management",
    "^src/utils/": "Utilities",
    "^src/types/": "Type Definitions"
  }
}
```

## How It Works

1. **File Filtering**: Charlie first applies the `include` patterns (if any), then applies the `exclude` patterns to filter which files are analyzed.

2. **Date Filtering**: Git commits are filtered to only include those made after the specified `after` date.

3. **Architectural Grouping**: If `architecturalGroups` is specified, files matching the regex patterns are grouped together and their complexity/revision metrics are combined. Both the original file-level hotspots and the grouped architectural hotspots are displayed in separate visualizations.

4. **Interactive Analysis**: Additional filtering options for SOC analysis, coupled pairs, and other metrics are available through the interactive frontend, allowing you to adjust thresholds and percentiles dynamically without regenerating the analysis.

This configuration system allows you to focus your analysis on specific parts of your codebase and organize the results in a way that makes sense for your project's architecture.

# Thoughts

## On Architectural Grouping

I personally haven't yet found an easy and useful case for architectural grouping. Usually when the codebase is messy, it's very hard to group things properly, but these types of codebases are the ones you usually need to analyze with tools like Charlie. And the codebases where things are easy to group, well... things are usually obvious enough without needing to group them.

This creates an interesting paradox: the feature works best on codebases that need it least, and struggles most on codebases that would benefit from it the most. That said, your mileage may vary - if you have a reasonably well-organized codebase with clear architectural boundaries that just needs some fine-tuning, architectural grouping might provide valuable insights. Or, perhaps, you have a good codebase, but the number of files is so large that it's hard to see the forest for the trees.

# Credits

Special thanks to Aleksandra Kozlova and Darya Losich for their contributions and support in making this project possible.

# TODO:

- [x] Calculate the complexity of each file based on the number of lines and the number of peaks
- [x] Retrieve number of revisions for each file
- [x] Calculate the hotspots based on the complexity and the number of revisions
- [x] Produce D3 visualization of the hotspots inside an html page
- [x] Pick prettier colours for the visualization
- [x] Move colours into theme.ts file
- [x] Add a diagram (and calculation) for the coupling pairs
- [x] Add a diagram (and calculation) for the SOC
- [x] Add .charlie.config.json file support. It should support a list of files that should be excluded from the analysis, and a list of files that should be included, and a list of files that should be grouped into "architectural components".
- [x] Add a way to group files into "architectural components"
- [x] Coupled pairs and SOC should show only significant data. This filtering should be implemented in the backend using `revisionsPercentile` and `minCouplingPercentage` configuration options.
- [x] Rewrite frontend in react or similar, add dynamic filtering and grouping. Consider rendering svg directly instead of d3, consider using `react-spring` for animations.
  - [x] Rewrite hotspots
  - [x] Rewrite coupled pairs
    - [x] Rewrite coupled pairs table
    - [x] Add filtering on the frontend
    - [x] Rewrite coupled pairs diagram
  - [x] Add some form of routing
  - [x] Rewrite SOC
  - [x] Rewrite word count
- [ ] Default date should be 1 year before the last commit in the repo
- [x] Architectural groups should produce 1. hotpsots 2. coupled pairs
- [x] Alternatively, maybe .charlie.config.json should be a starting point, but then in the webpage the user could change the config to see different slices of data.
- [x] Reading file for complexity should be done in chunks
- [x] Coupled pairs are sorted in the table by normalized coupling percentage times the number of revisions, but filtered by two thresholds: minCouplingPercentage and revisionsPercentile. Instead, we should use the sorting that we have, and filter by single percentile threshold.
- [ ] Add a way to find file/module owners
- [ ] Add a way to find teams that happen to form by analyzing authors
- [ ] Add a way to show fractal diagrams for the files or modules based on their ownership
- [ ] Add a way to show the "social graph" of the team based on the git history
- [ ] Add a way to calculate truck-factor of a project (i.e. how many people can leave before 50% of the code is left without a knowledgeable maintainer)
