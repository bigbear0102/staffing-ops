# Staffing Ops

대한민국 스태핑 운영 제품 1차 wedge를 위한 공개 전환 준비 저장소입니다.

이 저장소는 Paperclip에서 관리하는 내부 delivery workflow의 GitHub 실행면입니다. 로드맵 소유권, 이슈 상태, 승인, 위임의 source of truth는 계속 Paperclip에 있고, GitHub는 소스코드, pull request, CI, release history를 담당합니다.

## 저장소 구조

- `apps/admin`: 운영팀용 admin shell
- `apps/api`: API 및 job entry shell
- `packages/domain`: 공용 도메인 계약과 workflow-safe business primitive
- `packages/db`: Postgres schema manifest와 재현 가능한 SQL migration
- `packages/jobs`: idempotent outbox job contract와 queue helper
- `docs`: 운영 모델, 아키텍처, 검증, delivery 문서
- `artifacts`: 외부 검토용 reproducible demo HTML 및 pilot proof bundle
- `scripts`: branch 생성 및 governance 점검용 로컬 자동화
- `.github`: CI, PR 템플릿, 이슈 템플릿, ownership 규칙

## 엔지니어링 규칙

- branch 이름은 Paperclip issue identifier를 사용해야 합니다: `<issue-identifier>/<short-kebab-title>`
- pull request 제목은 Paperclip issue identifier를 사용해야 합니다: `[<issue-identifier>] <summary>`
- pull request 본문에는 아래 항목이 모두 들어가야 합니다:
  - 연결된 Paperclip 이슈
  - 변경 요약
  - 리스크 메모
  - 검증 메모
- `main`은 production-ready protected branch이며, delivery는 짧은 feature branch와 pull request를 통해 진행합니다.

## 공개 저장소 가드레일

- secret, raw pilot data, credential, internal-only evidence는 git에 넣지 않습니다.
- 외부 검토자는 private infrastructure 접근 없이도 proof를 확인할 수 있어야 하므로 demo artifact는 코드에서 재현 가능해야 합니다.
- 저장소 visibility를 바꾸기 전에 `docs/public-repo-scrub-checklist.md` 기준으로 최종 점검합니다.
- 최종 점검은 `pnpm public:preflight -- --require-public` 한 번으로 다시 확인할 수 있어야 합니다.

## 로컬 명령

```bash
pnpm install
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm demo:bundle
pnpm public:preflight -- --require-public
pnpm paperclip:branch -- CMPAAAAAAAA-32 "bootstrap repo baseline"
```

`pnpm demo:bundle`는 workspace를 다시 빌드한 뒤 reviewable bundle을 `artifacts/demo-bundle/`에 생성합니다. 여기에는 admin HTML snapshot과 design-partner pilot proof JSON payload가 포함됩니다. 생성된 인덱스는 `artifacts/demo-bundle/README.md`에서 확인할 수 있습니다.
`pnpm public:preflight`는 공개 전환에 필요한 파일, secret 패턴, generated artifact ignore 규칙, demo bundle 재생성, GitHub visibility를 한 번에 점검합니다. public 전환 전에 로컬 준비만 확인할 때는 `--skip-github`, 전환 직후 최종 확인에는 `--require-public`을 사용합니다.
CI도 같은 명령을 실행하고 `artifacts/demo-bundle/`를 `demo-bundle` workflow artifact로 업로드해 pull request 검토에 사용합니다.

## 초기 CI 기준선

pull request에서 요구되는 기본 check는 아래와 같습니다.

- `governance`
- `lint`
- `typecheck`
- `test-unit`
- `test-integration`
- `build`
- `demo-bundle`
