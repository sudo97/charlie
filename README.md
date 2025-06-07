# Charlie 🕵 ️ 

This is a tool for analyzing and visualizing your git history. Based on ideas from "Your Code as a Crime Scene" by Andrew M. Sutton.

This is the [Charlie](https://en.wikipedia.org/wiki/Charlie_Eppes) of your git history.

# .charlie.config.json

The `.charlie.config.json` file allows you to customize Charlie's analysis behavior. This file should be placed in the root of your repository (the same directory where you run the `charlie` command).

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

Allows you to group files into architectural components for analysis. The key is a regex pattern that matches file paths, and the value is the name of the architectural group. Files matching the same group will be consolidated into a single hotspot entry. Only the first group that matches a file is used.

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

note: Currently, only works for hotspots.

### `socPercentile` (optional)
**Type:** `number` (between 0 and 1)  
**Default:** `0.8` (80th percentile)

Controls the percentile threshold for the Sum of Coupling (SOC) analysis. Only files with coupling scores at or above this percentile will be shown in the SOC visualization. A value of `0.8` means only the top 20% most coupled files are displayed.

```json
{
  "socPercentile": 0.9
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
  },
  "socPercentile": 0.85
}
```

## How It Works

1. **File Filtering**: Charlie first applies the `include` patterns (if any), then applies the `exclude` patterns to filter which files are analyzed.

2. **Date Filtering**: Git commits are filtered to only include those made after the specified `after` date.

3. **Architectural Grouping**: If `architecturalGroups` is specified, files matching the regex patterns are grouped together and their complexity/revision metrics are combined.

4. **SOC Filtering**: The SOC (Sum of Coupling) analysis shows only files above the specified percentile threshold to focus on the most problematic coupling relationships.

This configuration system allows you to focus your analysis on specific parts of your codebase and organize the results in a way that makes sense for your project's architecture.



# TODO:
- [x] Calculate the complexity of each file based on the number of lines and the number of peaks
- [x] Retrieve number of revisions for each file
- [x] Calculate the hotspots based on the complexity and the number of revisions
- [x] Produce D3 visualization of the hotspots inside an html page
- [x] Pick prettier colours for the visualization
- [ ] Move colours into theme.ts file
- [x] Add a diagram (and calculation) for the coupling pairs
- [x] Add a diagram (and calculation) for the SOC
- [x] Add .charlie.config.json file support. It should support a list of files that should be excluded from the analysis, and a list of files that should be included, and a list of files that should be grouped into "architectural components".
- [x] Add a way to group files into "architectural components"
- [ ] Make architectural groups work for all the data, not just hotspots.
- [ ] Coupled pairs and SOC should show only significant data. Currently this part is calculated in the frontend, but it should be calculated in the backend.
- [ ] Alternatively, maybe .charlie.config.json should be a starting point, but then in the webpage the user could change the config to see different slices of data.
- [ ] Add a way to find file/module owners
- [ ] Add a way to find teams that happen to form by analyzing authors
- [ ] Add a way to show fractal diagrams for the files or modules based on their ownership
- [ ] Add a way to show the "social graph" of the team based on the git history
- [ ] Add a way to calculate truck-factor of a project (i.e. how many people can leave before 50% of the code is left without a knowledgeable maintainer)