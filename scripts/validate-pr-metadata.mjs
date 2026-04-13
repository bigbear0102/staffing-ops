const title = process.argv[2] ?? process.env.PR_TITLE ?? "";
const body = process.argv[3] ?? process.env.PR_BODY ?? "";

const errors = [];

if (!/^\[[A-Z0-9]+-\d+\] .+/.test(title)) {
  errors.push('PR 제목은 "[ISSUE-ID] " 뒤에 요약이 오는 형식이어야 합니다.');
}

const requiredSectionGroups = [
  ["## 연결된 Paperclip 이슈", "## Linked Paperclip Issue"],
  ["## 변경 요약", "## Summary"],
  ["## 리스크 메모", "## Risk Notes"],
  ["## 검증 메모", "## Verification Notes"]
];

for (const sectionGroup of requiredSectionGroups) {
  if (!sectionGroup.some((section) => body.includes(section))) {
    errors.push(`PR 본문에 필수 섹션이 없습니다: "${sectionGroup[0]}".`);
  }
}

if (!/\/[A-Z0-9]+\/issues\/[A-Z0-9]+-\d+/.test(body)) {
  errors.push(
    "PR 본문에는 /CMPAAAAAAAA/issues/CMPAAAAAAAA-32 와 같은 Paperclip 이슈 경로가 포함되어야 합니다."
  );
}

if (errors.length > 0) {
  for (const error of errors) {
    console.error(error);
  }

  process.exit(1);
}

console.log("PR 메타데이터 확인 완료.");
