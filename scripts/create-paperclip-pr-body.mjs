const [issueIdentifier] = process.argv
  .slice(2)
  .filter((argument) => argument !== "--");
const issueIdentifierPattern = /^([A-Z0-9]+)-\d+$/;

if (!issueIdentifier) {
  console.error("사용법: pnpm paperclip:pr-body -- <ISSUE-ID>");
  process.exit(1);
}

const issueMatch = issueIdentifier.match(issueIdentifierPattern);

if (!issueMatch) {
  console.error(
    `Paperclip issue identifier "${issueIdentifier}" 형식이 올바르지 않습니다. 예: "CMPAAAAAAAA-60".`
  );
  process.exit(1);
}

const companyPrefix = issueMatch[1];
const issuePath = `/${companyPrefix}/issues/${issueIdentifier}`;

const body = `## 연결된 Paperclip 이슈

- [${issueIdentifier}](${issuePath})

## 변경 요약

- 변경 내용을 적어주세요.

## 리스크 메모

- 사용자 영향, workflow 변화, 데이터 영향, 운영 리스크를 적어주세요.

## 검증 메모

- \`pnpm lint\`
- \`pnpm typecheck\`
- \`pnpm test\`
- \`pnpm build\`
`;

process.stdout.write(body);
