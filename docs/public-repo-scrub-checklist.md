# 공개 저장소 전환 점검표

## 목적

- 저장소를 `public repo + GitHub Free` 운영 모드로 전환할 준비를 마칩니다.
- secret, raw pilot data, internal-only evidence를 노출하지 않으면서 branch governance를 유지합니다.

## 현재 스캔 결과

- 저장소 루트와 근접 경로에서 `.env`, key, cert, obvious secret 파일은 발견되지 않았습니다.
- `apps/`, `packages/`, `docs/`, `tests/`, `README.md`, `package.json`, `tsconfig.json` 범위에서 obvious secret 패턴은 발견되지 않았습니다.
- 현재 저장소 remote는 `https://github.com/bigbear0102/staffing-ops.git`입니다.
- 현재 public-facing 외부 URL은 `docs/market-research-evidence-board.md`의 시장 조사 출처 링크 위주이며, citation 용도로 허용 가능합니다.

## Git에 남기면 안 되는 것

- API key, token, password, local credential 파일
- 고객 식별 가능한 order, worker, attendance, billing 데이터
- design partner에게서 받은 raw pilot export
- masking 되지 않은 내부 evidence bundle
- private operational URL, callback endpoint, internal infrastructure 주소

## Git에 남아도 되는 것

- test와 demo proof에 쓰는 masked fixture data
- public market research reference
- architecture, UX, QA, delivery planning 문서
- partner identity를 드러내지 않는 code, migration, test fixture, release evidence
- `artifacts/demo-bundle/` 생성기 자체. 단, 생성된 bundle 디렉터리는 commit하지 않고 local/CI artifact로만 유지합니다.

## 전환 전 체크리스트

- demo와 test fixture가 public 검토에 충분히 masked/synthetic한지 확인합니다.
- `docs/`에 partner-identifying name, raw screenshot, real export sample이 복사돼 있지 않은지 다시 봅니다.
- `tests/`와 `apps/api/src/pilot-proof.ts`에 real customer data로 오해될 수 있는 sample payload가 없는지 다시 봅니다.
- internal hostname, localhost callback assumption, private control-plane endpoint를 숨겨야 하는 상태가 아닌지 확인합니다.
- README와 operating-model 문서가 외부/public audience 기준으로도 읽히는지 확인합니다.
- 로컬 준비 점검은 `pnpm public:preflight -- --skip-github`로, public 전환 직후 최종 점검은 `pnpm public:preflight -- --require-public`로 실행합니다.

## 실행 순서

1. visibility 전환 직전에 `pnpm public:preflight -- --skip-github`를 실행합니다.
2. raw pilot artifact가 있으면 Git 밖으로 빼고, masked fixture 또는 문서 메모로 교체합니다.
3. 저장소를 public으로 전환합니다.
4. `main`에 GitHub Free branch governance를 적용합니다.
5. `pnpm public:preflight -- --require-public`로 final readiness를 다시 확인합니다.
6. `demo-bundle` CI job이 public baseline에서 clean proof artifact를 올리는지 확인합니다.
7. public-repo baseline으로 `[CMPAAAAAAAA-53](/CMPAAAAAAAA/issues/CMPAAAAAAAA-53)` final rerun을 실행합니다.

## 남은 리스크

- 현재 스캔은 pattern 기반이라 semantic leak까지 보장하지는 못합니다. docs와 sample payload는 사람이 한 번 더 확인해야 합니다.
- public visibility로 바뀌면 unfinished code와 internal planning doc도 외부에 보이므로, 민감하지 않더라도 인상 관리 리스크는 남습니다.
- 나중에 private-code posture로 다시 돌아가려면 GitHub governance 전략을 재설계해야 합니다.
