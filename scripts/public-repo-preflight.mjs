import { spawnSync, execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);

const options = {
  repo: null,
  requirePublic: false,
  skipDemoBundle: false,
  skipGithub: false
};

for (let index = 0; index < args.length; index += 1) {
  const argument = args[index];

  if (argument === "--") {
    continue;
  }

  if (argument === "--repo") {
    options.repo = args[index + 1] ?? null;
    index += 1;
    continue;
  }

  if (argument === "--require-public") {
    options.requirePublic = true;
    continue;
  }

  if (argument === "--skip-demo-bundle") {
    options.skipDemoBundle = true;
    continue;
  }

  if (argument === "--skip-github") {
    options.skipGithub = true;
    continue;
  }

  console.error(
    "사용법: node scripts/public-repo-preflight.mjs [--repo owner/name] [--require-public] [--skip-demo-bundle] [--skip-github]"
  );
  process.exit(1);
}

const checks = [];

function record(status, title, detail = null) {
  checks.push({ status, title, detail });
}

function normalizeSlashes(filePath) {
  return filePath.split(path.sep).join("/");
}

function repoRelative(targetPath) {
  return normalizeSlashes(path.relative(rootDir, targetPath));
}

function pathExists(relativePath) {
  return existsSync(path.join(rootDir, relativePath));
}

function readText(relativePath) {
  return readFileSync(path.join(rootDir, relativePath), "utf8");
}

function detectGithubRepo() {
  if (options.repo) {
    return options.repo;
  }

  try {
    const remote = execFileSync("git", ["config", "--get", "remote.origin.url"], {
      cwd: rootDir,
      encoding: "utf8"
    }).trim();

    const httpsMatch = remote.match(/^https:\/\/github\.com\/([^/]+\/[^/]+?)(?:\.git)?$/u);
    if (httpsMatch) {
      return httpsMatch[1];
    }

    const sshMatch = remote.match(/^git@github\.com:([^/]+\/[^/]+?)(?:\.git)?$/u);
    if (sshMatch) {
      return sshMatch[1];
    }
  } catch {
    return null;
  }

  return null;
}

function collectFiles(relativePath, result = []) {
  const absolutePath = path.join(rootDir, relativePath);
  if (!existsSync(absolutePath)) {
    return result;
  }

  const stats = statSync(absolutePath);
  if (stats.isFile()) {
    result.push(relativePath);
    return result;
  }

  if (!stats.isDirectory()) {
    return result;
  }

  const skipDirectories = new Set([
    ".git",
    "node_modules",
    "dist",
    "coverage"
  ]);

  for (const entry of readdirSync(absolutePath, { withFileTypes: true })) {
    const entryRelativePath = normalizeSlashes(path.join(relativePath, entry.name));

    if (entry.isDirectory()) {
      if (skipDirectories.has(entry.name) || entryRelativePath === "artifacts/demo-bundle") {
        continue;
      }

      collectFiles(entryRelativePath, result);
      continue;
    }

    if (entry.isFile()) {
      result.push(entryRelativePath);
    }
  }

  return result;
}

function scanDangerousFileNames() {
  const allFiles = collectFiles(".");
  const dangerousPatterns = [
    /(^|\/)\.env(\.|$)/u,
    /(^|\/).*\.pem$/iu,
    /(^|\/).*\.key$/iu,
    /(^|\/).*\.crt$/iu,
    /(^|\/).*\.cert$/iu,
    /(^|\/).*\.p12$/iu,
    /(^|\/).*\.pfx$/iu,
    /(^|\/)id_rsa$/u,
    /(^|\/)credentials(\.|$)/iu
  ];

  return allFiles.filter((relativePath) =>
    dangerousPatterns.some((pattern) => pattern.test(relativePath))
  );
}

function scanSecretLikeContent() {
  const textRoots = [
    ".github",
    "apps",
    "docs",
    "packages",
    "scripts",
    "tests",
    "README.md",
    "package.json",
    "tsconfig.json"
  ];
  const secretPatterns = [
    /-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/u,
    /AKIA[0-9A-Z]{16}/u,
    /ghp_[A-Za-z0-9]{36,}/u,
    /AIza[0-9A-Za-z_-]{35}/u,
    /xox[baprs]-[A-Za-z0-9-]{10,}/u,
    /sk_(?:live|test)_[A-Za-z0-9]{16,}/u
  ];
  const skippedExtensions = new Set([
    ".png",
    ".jpg",
    ".jpeg",
    ".gif",
    ".webp",
    ".pdf",
    ".zip",
    ".woff",
    ".woff2"
  ]);
  const findings = [];

  for (const textRoot of textRoots) {
    for (const relativePath of collectFiles(textRoot)) {
      const extension = path.extname(relativePath).toLowerCase();
      if (skippedExtensions.has(extension)) {
        continue;
      }

      const absolutePath = path.join(rootDir, relativePath);
      const stats = statSync(absolutePath);
      if (stats.size > 1_000_000) {
        continue;
      }

      const contents = readFileSync(absolutePath, "utf8");
      const matchedPattern = secretPatterns.find((pattern) => pattern.test(contents));
      if (matchedPattern) {
        findings.push(`${relativePath} :: ${matchedPattern}`);
      }
    }
  }

  return findings;
}

async function checkGithubVisibility() {
  if (options.skipGithub) {
    record("warn", "GitHub 공개 상태 확인 생략", "--skip-github 옵션으로 건너뜀");
    return;
  }

  const repo = detectGithubRepo();
  if (!repo) {
    record("warn", "GitHub 저장소 확인 생략", "remote.origin URL에서 owner/name을 찾지 못함");
    return;
  }

  try {
    const response = await fetch(`https://api.github.com/repos/${repo}`, {
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": "paperclip-public-preflight"
      }
    });

    if (response.status === 404) {
      record(
        options.requirePublic ? "fail" : "warn",
        "GitHub 저장소 공개 상태 미확인",
        `${repo} 저장소가 GitHub API에서 보이지 않습니다. public 전환 전이면 예상 가능한 상태입니다.`
      );
      return;
    }

    if (!response.ok) {
      record(
        options.requirePublic ? "fail" : "warn",
        "GitHub 저장소 확인 실패",
        `${repo} 조회가 ${response.status} ${response.statusText}로 실패했습니다.`
      );
      return;
    }

    const payload = await response.json();
    if (payload.private) {
      record(
        options.requirePublic ? "fail" : "warn",
        "GitHub 저장소가 아직 private 상태",
        `${repo} 저장소 visibility가 private입니다.`
      );
      return;
    }

    record("pass", "GitHub 저장소 공개 상태 확인", `${repo} 저장소가 public으로 확인됨`);
  } catch (error) {
    record(
      options.requirePublic ? "fail" : "warn",
      "GitHub 저장소 확인 실패",
      error instanceof Error ? error.message : String(error)
    );
  }
}

function checkRequiredFiles() {
  const requiredFiles = [
    "README.md",
    "docs/public-repo-scrub-checklist.md",
    "scripts/export-demo-bundle.mjs",
    ".github/pull_request_template.md",
    ".github/workflows/ci.yml"
  ];
  const missingFiles = requiredFiles.filter((relativePath) => !pathExists(relativePath));

  if (missingFiles.length > 0) {
    record("fail", "필수 공개 준비 파일 누락", missingFiles.join(", "));
    return;
  }

  record("pass", "필수 공개 준비 파일 존재", requiredFiles.join(", "));
}

function checkGitignore() {
  const gitignore = readText(".gitignore");
  if (!gitignore.includes("artifacts/demo-bundle/")) {
    record("fail", "생성 bundle ignore 규칙 누락", ".gitignore에 artifacts/demo-bundle/ 항목이 필요합니다.");
    return;
  }

  record("pass", "생성 bundle ignore 규칙 확인", "artifacts/demo-bundle/가 gitignore에 등록되어 있음");
}

function checkDangerousFiles() {
  const dangerousFiles = scanDangerousFileNames();
  if (dangerousFiles.length > 0) {
    record("fail", "위험한 파일명 패턴 감지", dangerousFiles.slice(0, 10).join(", "));
    return;
  }

  record("pass", "위험한 파일명 패턴 없음");
}

function checkSecretPatterns() {
  const findings = scanSecretLikeContent();
  if (findings.length > 0) {
    record("fail", "명백한 secret 패턴 감지", findings.slice(0, 10).join(" | "));
    return;
  }

  record("pass", "명백한 secret 패턴 없음");
}

function runDemoBundle() {
  if (options.skipDemoBundle) {
    record("warn", "demo bundle 재생성 생략", "--skip-demo-bundle 옵션으로 건너뜀");
    return;
  }

  const result = spawnSync("pnpm", ["demo:bundle"], {
    cwd: rootDir,
    encoding: "utf8"
  });

  if (result.status !== 0) {
    const detail = [result.stdout, result.stderr].filter(Boolean).join("\n").trim();
    record("fail", "demo bundle 재생성 실패", detail || "pnpm demo:bundle 실패");
    return;
  }

  const requiredOutputs = [
    "artifacts/demo-bundle/README.md",
    "artifacts/demo-bundle/manifest.json",
    "artifacts/demo-bundle/admin/01-work-queue-desktop.html",
    "artifacts/demo-bundle/proof/design-partner-pilot.summary.json"
  ];
  const missingOutputs = requiredOutputs.filter((relativePath) => !pathExists(relativePath));

  if (missingOutputs.length > 0) {
    record("fail", "demo bundle 산출물 누락", missingOutputs.join(", "));
    return;
  }

  record("pass", "demo bundle 재생성 확인", requiredOutputs.join(", "));
}

function printSummary() {
  console.log("공개 저장소 preflight 결과");

  for (const check of checks) {
    const prefix =
      check.status === "pass" ? "[통과]" : check.status === "warn" ? "[주의]" : "[실패]";
    console.log(`${prefix} ${check.title}`);
    if (check.detail) {
      console.log(`  ${check.detail}`);
    }
  }
}

async function main() {
  console.log(`공개 저장소 preflight 시작: ${repoRelative(rootDir) || "."}`);

  checkRequiredFiles();
  checkGitignore();
  checkDangerousFiles();
  checkSecretPatterns();
  runDemoBundle();
  await checkGithubVisibility();

  printSummary();

  const hasFailure = checks.some((check) => check.status === "fail");
  process.exitCode = hasFailure ? 1 : 0;
}

await main();
