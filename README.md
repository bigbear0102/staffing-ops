# Staffing Ops

Private delivery repository for the first staffing operations product wedge.

This repository is the GitHub execution surface for the internal workflow defined in Paperclip. Paperclip remains the source of truth for roadmap ownership, issue status, approvals, and delegation. GitHub owns source code, pull requests, CI, and release history.

## Repository Layout

- `apps/admin`: internal operations admin shell
- `apps/api`: API and job-entry shell
- `packages/domain`: shared domain contracts and workflow-safe business primitives
- `docs`: operating model, architecture, and workflow specifications
- `scripts`: local automation for branch creation and governance checks
- `.github`: CI, PR template, issue template, and ownership rules

## Engineering Conventions

- Branches must use the Paperclip issue identifier: `<issue-identifier>/<short-kebab-title>`
- Pull request titles must use the Paperclip issue identifier: `[<issue-identifier>] <summary>`
- Pull request bodies must include:
  - linked Paperclip issue
  - summary
  - risk notes
  - verification notes
- `main` is the protected production-ready branch. Delivery happens through short-lived feature branches and pull requests.

## Local Commands

```bash
pnpm install
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm paperclip:branch -- CMPAAAAAAAA-32 "bootstrap repo baseline"
```

## Initial CI Baseline

The required checks configured for pull requests are:

- `governance`
- `lint`
- `typecheck`
- `test-unit`
- `test-integration`
- `build`
