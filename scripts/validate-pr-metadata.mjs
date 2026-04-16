const cliArgs = process.argv.slice(2).filter((argument) => argument !== "--");
const title = cliArgs[0] ?? process.env.PR_TITLE ?? "";
const body = (cliArgs[1] ?? process.env.PR_BODY ?? "").replace(/\r\n/g, "\n");

const errors = [];
const titleMatch = title.match(/^\[([A-Z0-9]+-\d+)\] .+/);

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function findSection(bodyText, headings) {
  const heading = headings.find((candidate) => bodyText.includes(candidate));
  if (!heading) {
    return null;
  }

  const sectionStart = bodyText.indexOf(heading) + heading.length;
  const remainingBody = bodyText.slice(sectionStart);
  const nextSectionIndex = remainingBody.search(/\n##\s+/u);
  const sectionBody =
    nextSectionIndex === -1 ? remainingBody.trim() : remainingBody.slice(0, nextSectionIndex).trim();

  return {
    heading,
    body: sectionBody
  };
}

if (!titleMatch) {
  errors.push('PR 제목은 "[ISSUE-ID] " 뒤에 요약이 오는 형식이어야 합니다.');
}

const requiredSectionGroups = [
  ["## 연결된 Paperclip 이슈", "## Linked Paperclip Issue"],
  ["## 변경 요약", "## Summary"],
  ["## 리스크 메모", "## Risk Notes"],
  ["## 검증 메모", "## Verification Notes"]
];

for (const sectionGroup of requiredSectionGroups) {
  const section = findSection(body, sectionGroup);

  if (!section) {
    errors.push(`PR 본문에 필수 섹션이 없습니다: "${sectionGroup[0]}".`);
    continue;
  }

  if (!/^[-*]\s+\S+/mu.test(section.body)) {
    errors.push(`PR 본문의 "${section.heading}" 섹션에는 최소 한 개의 bullet 항목이 있어야 합니다.`);
  }
}

if (titleMatch) {
  const issueIdentifier = titleMatch[1];
  const companyPrefix = issueIdentifier.split("-")[0];
  const linkedIssuePattern = new RegExp(
    `\\[${escapeRegExp(issueIdentifier)}\\]\\(/${escapeRegExp(companyPrefix)}/issues/${escapeRegExp(issueIdentifier)}\\)`,
    "u"
  );

  if (!linkedIssuePattern.test(body)) {
    errors.push(
      `PR 본문에는 제목과 동일한 Paperclip 이슈 링크가 있어야 합니다: [${issueIdentifier}](/${companyPrefix}/issues/${issueIdentifier}).`
    );
  }
}

if (errors.length > 0) {
  for (const error of errors) {
    console.error(error);
  }

  process.exit(1);
}

console.log("PR 메타데이터 확인 완료.");
