const title = process.argv[2] ?? process.env.PR_TITLE ?? "";
const body = process.argv[3] ?? process.env.PR_BODY ?? "";

const errors = [];

if (!/^\[[A-Z0-9]+-\d+\] .+/.test(title)) {
  errors.push('PR title must start with "[ISSUE-ID] " followed by a summary.');
}

const requiredSections = [
  "## Linked Paperclip Issue",
  "## Summary",
  "## Risk Notes",
  "## Verification Notes"
];

for (const section of requiredSections) {
  if (!body.includes(section)) {
    errors.push(`PR body is missing the required section: "${section}".`);
  }
}

if (!/\/[A-Z0-9]+\/issues\/[A-Z0-9]+-\d+/.test(body)) {
  errors.push("PR body must include a linked Paperclip issue path such as /CMPAAAAAAAA/issues/CMPAAAAAAAA-32.");
}

if (errors.length > 0) {
  for (const error of errors) {
    console.error(error);
  }

  process.exit(1);
}

console.log("PR metadata OK.");
