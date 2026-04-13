# CEO Unblock Decision Brief

## Purpose

- Collapse the remaining release and pilot blockers into a short set of board or CEO decisions.
- Separate technical work that is already done from the small number of decisions that still require executive action.

## Current State

- Engineering implementation for the v1 staffing operations control tower is effectively complete through pilot P1 hardening.
- The repository clears contract, fixture, review-surface, and correlated evidence checks in the shared Paperclip workspace.
- The remaining path to release or pilot entry is blocked by governance and access decisions, not by missing application code.

## Decision 1: GitHub Governance Unblock

### What is blocked

- Private-repo branch protection on `main` is still unavailable on the current GitHub setup.
- This blocks the final feature-branch rerun and final release archive refresh.
- GitHub paid plan을 쓰지 않는다는 전제가 생기면, private repo에서 governance blocker를 푸는 선택지는 사실상 사라집니다.

### Options

| Option | Effect | Speed | Tradeoff |
| --- | --- | --- | --- |
| Switch the repo to public and keep GitHub Free | Keeps zero cash cost and restores branch governance on the repo | fastest | source becomes public, so pilot data and secrets must stay out of Git |
| Stay private on GitHub Free | Keeps code private | fastest | branch-governance blocker remains unresolved |
| Leave GitHub as-is and rely on manual discipline only | Avoids plan change and visibility change | medium | no enforceable branch protection, weak release control, misaligned with the current QA/release gate |

### CTO recommendation

- 무료 모드 고정이면 `repo를 public으로 전환`하는 것이 유일한 실무적 unblock 경로입니다.
- 단, public 전환 전 조건이 있습니다:
  - customer data, pilot evidence raw files, secrets, tokens, internal URLs를 repo 밖으로 분리
  - demo fixture와 masked sample만 repo에 남기기
  - PR/rerun/release archive는 계속 GitHub 위에서 진행
- private를 유지하면서 Free만 쓰는 경로는 governance blocker를 푸는 해법이 아닙니다.

### Decision needed now

- `무료 유지`가 확정이면 [CMPAAAAAAAA-32](/CMPAAAAAAAA/issues/CMPAAAAAAAA-32) 의 해법은 `public repo 전환 승인 여부`만 결정하면 됩니다.

## Decision 2: Design Partner Access Path

### What is blocked

- Pilot entry still depends on real partner data access and confirmation of who the first design partner is.
- The onboarding pack and evidence pack are ready, but they cannot be exercised on real workflow evidence until access is granted.

### Minimum access package requested

- one named design partner
- one operations contact and one finance contact
- masked historical samples for order, site, worker, assignment, attendance, and billing export
- permission to request one completed month-close export example
- permission to observe one live or shadow month-close cycle if possible

### CEO choices

| Choice | Effect | Recommendation |
| --- | --- | --- |
| Prioritize one partner now | Removes targeting ambiguity and lets onboarding start immediately | choose now |
| Allow masked historical data only | lowest-friction start, enough for initial onboarding and export alignment | acceptable minimum |
| Allow masked historical data plus live month-close observation | best path for realistic pilot proof and release confidence | preferred |
| Require both operations and finance contacts before onboarding starts | reduces loop time and prevents partial discovery | preferred |

### CTO recommendation

- Select one design partner now.
- Approve masked historical data collection immediately.
- Approve live or shadow month-close observation if the partner allows it.
- Require both operations and finance contacts before calling the partner "pilot-ready."

## Decision 3: Board-Level Control-Plane Unblock

### What is blocked

- [CMPAAAAAAAA-3](/CMPAAAAAAAA/issues/CMPAAAAAAAA-3) is still blocked by a stale execution run even though the technical and market inputs are already prepared.

### Required board action

- cancel stale run `d2597669-2d8e-40d2-81df-afb09e7c4fe1`
- re-trigger or reassign [CMPAAAAAAAA-3](/CMPAAAAAAAA/issues/CMPAAAAAAAA-3)

### Why this matters

- Once [CMPAAAAAAAA-3](/CMPAAAAAAAA/issues/CMPAAAAAAAA-3) is unblocked, the company can formally lock:
  - MVP wedge
  - ICP
  - first design-partner target
  - 60-day success metric

## Recommended Order Of Operations

1. Resolve the board-level stale-run unblock for [CMPAAAAAAAA-3](/CMPAAAAAAAA/issues/CMPAAAAAAAA-3).
2. Finalize the wedge, ICP, design-partner target, and 60-day metric on [CMPAAAAAAAA-3](/CMPAAAAAAAA/issues/CMPAAAAAAAA-3).
3. Approve `public repo + free mode` for [CMPAAAAAAAA-32](/CMPAAAAAAAA/issues/CMPAAAAAAAA-32), or explicitly accept that governance blocker stays open.
4. Remove any non-masked or sensitive repo contents before the visibility switch.
5. Start design-partner onboarding using `docs/design-partner-data-onboarding-pack.md`.
6. After GitHub governance is fixed, run the final release rerun on [CMPAAAAAAAA-53](/CMPAAAAAAAA/issues/CMPAAAAAAAA-53).

## What Happens After These Decisions

- After Decision 1, QA can execute the final feature-branch and real-PR rerun.
- After Decision 2, the team can collect real partner data and move from seeded proof to partner-backed pilot proof.
- After Decision 3, the company can formally close the remaining strategy decision loop and operate from one locked target.

## Bottom Line

- No additional engineering wave is required before these decisions.
- The fastest path is:
  - board cancels the stale run on [CMPAAAAAAAA-3](/CMPAAAAAAAA/issues/CMPAAAAAAAA-3)
  - CEO locks the design-partner target and data-access level
  - CEO approves `public repo + free mode`, with sensitive material kept out of Git
- Once those are done, the final release archive refresh is administrative and QA-led rather than exploratory engineering work.
