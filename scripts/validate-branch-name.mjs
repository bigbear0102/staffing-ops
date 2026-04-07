import { execFileSync } from "node:child_process";

const branchName =
  process.argv[2] ||
  process.env.GITHUB_HEAD_REF ||
  execFileSync("git", ["branch", "--show-current"], { encoding: "utf8" }).trim();

const branchPattern = /^[A-Z0-9]+-\d+\/[a-z0-9][a-z0-9-]*$/;

if (!branchPattern.test(branchName)) {
  console.error(
    `Invalid branch name "${branchName}". Expected "<ISSUE-ID>/<short-kebab-title>", for example "CMPAAAAAAAA-32/bootstrap-github-repo".`
  );
  process.exit(1);
}

console.log(`Branch name OK: ${branchName}`);
