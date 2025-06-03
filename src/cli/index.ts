import { getGitLogWithFiles } from "./git-log.js";
import { hotspots } from "../core/hotspots.js";
import * as fs from "fs/promises";
import { revisions } from "../core/revisions.js";
import { treeData } from "../core/tree-data.js";
import * as path from "path";

const repositoryPath = path.resolve(process.argv[2] ?? ".");

const skip = new RegExp("package.*json|.*.md|drizzle\\/meta"); // <- TODO: use .charlieignore

const history = await getGitLogWithFiles(repositoryPath);
const revisionsData = revisions(
  history.map((commit) => {
    return commit.filter((file) => !skip.test(file.file));
  })
);
const hotspotsData = await hotspots(revisionsData, async (file) => {
  const filepath = path.join(repositoryPath, file);
  if (
    await fs
      .access(filepath)
      .then(() => true)
      .catch(() => false)
  ) {
    return fs.readFile(filepath, "utf8");
  }
  return "";
});

// console.log(JSON.stringify(hotspotsData, null, 2));
console.log(JSON.stringify(treeData(hotspotsData), null, 2));
