import { spawnSync } from "node:child_process";

const [issueIdentifier, ...titleParts] = process.argv.slice(2);
const rawTitle = titleParts.join(" ").trim();

if (!issueIdentifier || !rawTitle) {
  console.error("Usage: pnpm paperclip:branch -- <ISSUE-ID> <branch title>");
  process.exit(1);
}

const slug = rawTitle
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-+|-+$/g, "")
  .slice(0, 48);

if (!slug) {
  console.error("Could not derive a kebab-case title from the provided branch title.");
  process.exit(1);
}

const branchName = `${issueIdentifier}/${slug}`;

const insideWorkTree = spawnSync("git", ["rev-parse", "--is-inside-work-tree"], {
  encoding: "utf8"
});

if (insideWorkTree.status !== 0) {
  console.error("This helper must run inside a git repository.");
  process.exit(1);
}

const switchResult = spawnSync("git", ["switch", "-c", branchName], {
  encoding: "utf8",
  stdio: "inherit"
});

if (switchResult.status !== 0) {
  process.exit(switchResult.status ?? 1);
}

console.log(branchName);
