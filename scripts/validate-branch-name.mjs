import { execFileSync } from "node:child_process";

const cliArgs = process.argv.slice(2).filter((argument) => argument !== "--");

const branchName =
  cliArgs[0] ||
  process.env.GITHUB_HEAD_REF ||
  execFileSync("git", ["branch", "--show-current"], { encoding: "utf8" }).trim();

const branchPattern = /^[A-Z0-9]+-\d+\/[a-z0-9][a-z0-9-]*$/;

if (!branchPattern.test(branchName)) {
  console.error(
    `브랜치 이름 "${branchName}" 형식이 올바르지 않습니다. "<ISSUE-ID>/<short-kebab-title>" 형식을 사용해야 합니다. 예: "CMPAAAAAAAA-32/bootstrap-github-repo".`
  );
  process.exit(1);
}

console.log(`브랜치 이름 확인 완료: ${branchName}`);
