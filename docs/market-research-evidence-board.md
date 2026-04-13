# Market Research Evidence Board

Updated: 2026-04-07 (KST)

## Executive Takeaway

- Evidence-backed opportunity: the public market shows a gap between adjacent HR/T&A tools that already automate scheduling, attendance, payslips, payroll transfer, tax, and 4-insurance handoff, and broad ERP suites that already cover company-wide HR, finance, and collaboration cheaply. The open gap is the staffing-ops control tower: client order -> worker qualification and placement -> multi-site day-of control -> approved attendance -> invoice handoff.
- Best initial ICP is an inference from the reviewed sources, not a direct market-claim from any one vendor: Korean small-to-mid dispatch, subcontract, and outsourcing operators with recurring multi-site deployments, frequent shift changes, and finance handoff friction.
- Segments to exclude now: very small agencies that can stay on cheap generic HR tools, large outsourcing groups already operating multi-line custom systems, and general manufacturer or retail HQ teams whose needs are already covered by ERP suites.

## Competitor and Alternative Matrix

| Category | Public positioning and evidence | What it clearly does well | Publicly visible gap against our wedge | What this means for us |
| --- | --- | --- | --- | --- |
| Shiftee | Shiftee explicitly markets an outsourcing solution for contract and dispatched workforce operations across multiple jobsites, with attendance, schedules, payroll, electronic contracts, and ERP or HRIS integration.[S1][S2][S3] | Multi-site attendance control, anti-fraud controls, scheduling, workflow, e-signatures, payroll export, integration depth. | The reviewed public pages stay centered on workforce management and T&A. They do not surface client order intake, worker qualification, placement approval, replacement flow, or invoice handoff as first-class objects. | Treat Shiftee as the closest adjacent competitor. Differentiate on order-to-assignment-to-invoice control rather than on generic attendance features. |
| Newploy | Newploy positions itself as payroll and HR automation, with automatic payroll transfer, payslip delivery, shift scheduling, electronic labor contracts, Hometax upload, 4-insurance reporting help, and open API.[S4][S5][S6] | Payroll-compliance automation, employee records, attendance capture, legal-document handling, bank and tax workflow compression. | The reviewed public materials emphasize employer payroll and HR admin, not staffing demand intake, site-level dispatch control, or assignment lifecycle. | Keep payroll, payslips, Hometax, and 4-insurance as downstream integration or export priorities, not as the core v1 wedge. |
| ECOUNT | ECOUNT markets an all-industry ERP with inventory, production, accounting, payroll, groupware, and messenger. It says it serves about 80,000 companies and costs KRW 40,000 per month for all ERP features.[S7][S8][S9][S10] | Broad SME ERP coverage, low price, company-wide workflow linkage, API connectivity. | No staffing-specific operating model is visible on the reviewed pages. The product posture is broad ERP for all industries, not dispatch or outsourcing control-tower software. | Do not position as "ERP for HR." Position as staffing operations infrastructure that sits upstream of generic ERP. |
| Duzon / WEHAGO | WEHAGO and Smart A 10 present bundled HR and finance tooling with payroll info input, payslip sending, attendance-linked approvals, electronic contracts, 4-insurance reporting, payroll transfer, and collaboration packages for small firms.[S11][S12][S13][S14] | Strong back-office compliance workflow, SME bundle packaging, collaboration plus HR integration. | Public materials remain focused on general corporate HR and finance administration, not staffing-specific order, placement, site, or attendance-exception control. | General HQ back-office teams are not the first wedge. They already have credible suite alternatives. |
| Manual stack | Public vendor messaging repeatedly frames the current alternative as fragmented Excel, email or messenger, internet banking, and separate payroll or reporting flows.[S1][S5][S10] | Cheap, familiar, and flexible for edge cases. | Creates re-entry, fragmented evidence, weak HQ visibility, and slower payroll or invoice handoff. | The product story should be "replace fragmented operator handoffs" rather than "digitize HR." |
| Self-built enterprise stack | A 2024 labor-law thesis argues that ERP and MES-driven integrated control can blur the subcontract versus dispatch boundary, and a Samsung service case described a centrally managed integrated system used to track contractor worker data in detail.[S15][S16] | High custom fit for large operators with complex processes and established IT. | High implementation burden and potential labor-law sensitivity when control structures become too centralized. | Large listed outsourcing groups are a poor first ICP for an MVP and should be treated as a later-enterprise segment. |

## Signal Queue

The format below follows the requested handoff structure:

`signal -> affected segment -> workflow pain -> product implication -> priority impact -> source`

| Signal | Affected segment | Workflow pain | Product implication | Priority impact | Source |
| --- | --- | --- | --- | --- | --- |
| Outsourcing-focused T&A products already promise multi-site attendance visibility, assignment across jobsites, anti-fraud controls, and payroll export. | Mid-sized dispatch, subcontract, and outsourcing operators with repeated site rotation. | Attendance is managed site by site, headquarters lacks real-time visibility, and payroll processing is manual.[S1] | Keep multi-site dispatch board, location-aware attendance evidence, and approval or exception flows in the v1 wedge. | Critical | [S1](https://shiftee.io/en/outsourcing), [S2](https://shiftee.io/en/pricing), [S3](https://worker.shiftee.io/en) |
| HR payroll tools already automate payslips, payroll transfer, Hometax uploads, and 4-insurance submission assistance. | Operators whose finance or HR team is one to a few people and already spends time on downstream compliance. | Bank, tax, insurance, and payslip work are fragmented across separate systems and deadlines.[S4][S5] | Treat payroll, Hometax, and 4-insurance as downstream handoff or integration layers after attendance approval. Do not let them define the core wedge. | High | [S4](https://www.newploy.net/), [S5](https://www.newploy.net/2024%EB%85%84-4%EB%8C%80%EB%B3%B4%ED%97%98-%EC%9A%94%EC%9C%A8/), [S6](https://www.newploy.net/%EA%B8%89%EC%97%AC%EB%AA%85%EC%84%B8%EC%84%9C-%EC%9E%91%EC%84%B1/) |
| Cheap, broad ERP suites already serve generic HR and finance needs across industries. | General manufacturer and retail HQ, and price-sensitive small firms. | They can already get payroll, accounting, collaboration, and basic HR in one suite at low cost.[S7][S8][S11][S12] | Position the product as a staffing-ops control tower, not a general HR or ERP replacement. | Critical | [S7](https://www.ecount.com/kr/ecount/product/erp_features), [S8](https://www.ecount.com/kr/ecount/trial/what-is-erp), [S11](https://www.wehago.com/landing/ko/business/), [S12](https://www.wehago.com/landing/mobile/ko/packageplan/) |
| Manual alternatives persist because data still moves through Excel, messenger, and separate systems. | Core ICP operators still running spreadsheet and chat-based dispatch plus downstream back-office tools. | Re-entry and cross-check work create latency between attendance, payroll, and billing, and weaken auditability.[S1][S10] | Order, assignment, attendance, and invoice handoff should share one event trail with explicit evidence attachments. | Critical | [S1](https://shiftee.io/en/outsourcing), [S10](https://www.ecount.com/kr/ecount/product/erp_overview) |
| Very small firms are already being targeted with free or near-free generic tooling. | Tiny agencies and small labor brokers. | Their pain may be real, but the switching threshold is low and their current alternatives are cheap enough to delay purchasing a specialized tool.[S1][S2][S8][S12] | Exclude the smallest firms from the first design-partner list unless they have recurring multi-site dispatch complexity. | High | [S1](https://shiftee.io/en/outsourcing), [S2](https://shiftee.io/en/pricing), [S8](https://www.ecount.com/kr/ecount/trial/what-is-erp), [S12](https://www.wehago.com/landing/mobile/ko/packageplan/) |
| Large outsourcing groups often operate across many service lines and can justify custom system layers, but integrated control can create subcontract or dispatch boundary risk. | Large listed or near-listed outsourcing companies and diversified HR-service groups. | Their process map is wider than staffing alone and usually carries heavier integration, legal, and organizational complexity.[S15][S16] | Exclude them from the first ICP. Revisit only after the product has mature APIs, audit trails, legal controls, and configurable operating boundaries. | High | [S15](https://www.donga.com/news/Economy/article/all/20240828/126714518/2), [S16](https://dcollection.korea.ac.kr/srch/srchDetail/000000279198), [S17](https://www.pressian.com/pages/articles/6970) |

## ICP Hypothesis

This section is an explicit inference from the source set above.

### Best initial ICP

- Korean dispatch, subcontract, and outsourcing operators that already run recurring client sites and must coordinate:
  - demand intake
  - worker qualification and placement
  - first-shift readiness and replacements
  - attendance approval
  - payroll and invoice handoff
- These teams feel stronger pain than generic employers because the public competitor set already handles generic HR admin reasonably well, while the staffing-specific control tower remains weakly represented in reviewed public materials.

### Best design-partner shape

- Regionally concentrated operator with recurring client sites, not a single-site employer.
- Internal coordinator or account-manager-led operations team, not only payroll staff.
- High dependence on same-day phone, chat, or spreadsheet coordination.
- Clear monthly handoff from approved attendance to billing, where re-entry still happens.

## Non-Customer Guidance For v1

| Segment to exclude now | Evidence-backed reason | Revisit trigger |
| --- | --- | --- |
| Very small agencies and brokers | Cheap alternatives already exist: Shiftee promotes support for firms under 30 employees, ECOUNT advertises all ERP features at KRW 40,000 per month, and WEHAGO packages start with small-company plans.[S2][S8][S12] | Revisit if a small operator has unusually high recurring-site complexity and proves willingness to pay for dispatch control rather than HR admin. |
| Large outsourcing groups with broad service portfolios | Aramintech is described as a total outsourcing company spanning dispatch, call centers, sales promotion, production subcontracting, catering, facilities, and more, with about KRW 100 billion revenue and roughly 4,000 managed personnel.[S15] The MES and Samsung sources also point to legal and operational complexity when integrated control over contractor work becomes too centralized.[S16][S17] | Revisit after enterprise-grade API, audit, permission, and legal-control tooling exists. |
| General manufacturer or retail HQ | Public positioning from ECOUNT and WEHAGO already covers these buyers with all-industry ERP, HR, finance, collaboration, and compliance bundles.[S7][S8][S11][S12] | Revisit only if the company decides to build a horizontal workforce platform instead of a staffing-ops product. |

## Opportunity Framing

- The strongest product opening is not "better payroll" or "better attendance."
- The opening is the operational space between demand intake and finance handoff, where public alternatives either start too late in the workflow or stay too generic.
- This means the product narrative should stay anchored on:
  - order and site setup
  - worker qualification and assignment snapshots
  - day-of dispatch and replacement control
  - approved attendance with evidence
  - invoice-ready handoff

## Suggested Next Scan Loop

- Watch Shiftee for movement from outsourcing T&A into client-order or billing workflows.
- Watch Newploy for deeper staffing, placement, or site-control features beyond payroll and HR automation.
- Watch ERP suites for staffing-specific templates or industry packages targeting dispatch, subcontract, and outsourcing operators.
- Track legal or court developments where integrated systems are used as evidence in subcontract versus dispatch disputes.

## Sources

- [S1] Shiftee, "Integrated Workforce Management Solution for Outsourcing and Contract Staffing" - https://shiftee.io/en/outsourcing
- [S2] Shiftee, "Pricing" - https://shiftee.io/en/pricing
- [S3] Shiftee, "Workforce Management Software" - https://worker.shiftee.io/en
- [S4] Newploy, product home page - https://www.newploy.net/
- [S5] Newploy, "2024년 4대보험 요율" - https://www.newploy.net/2024%EB%85%84-4%EB%8C%80%EB%B3%B4%ED%97%98-%EC%9A%94%EC%9C%A8/
- [S6] Newploy, "급여명세서 작성" - https://www.newploy.net/%EA%B8%89%EC%97%AC%EB%AA%85%EC%84%B8%EC%84%9C-%EC%9E%91%EC%84%B1/
- [S7] ECOUNT, "업무관리에 필요한 모든 기능" - https://www.ecount.com/kr/ecount/product/erp_features
- [S8] ECOUNT, "ERP란 무엇인가?" - https://www.ecount.com/kr/ecount/trial/what-is-erp
- [S9] ECOUNT, "Open API" - https://www.ecount.com/my/ecount/product/erp_open-api
- [S10] ECOUNT, "ERP를 쓰는 이유" - https://www.ecount.com/kr/ecount/product/erp_overview
- [S11] WEHAGO, business landing page - https://www.wehago.com/landing/ko/business/
- [S12] WEHAGO, pricing and package plans - https://www.wehago.com/landing/mobile/ko/packageplan/
- [S13] WEHAGO NAHAGO, staff landing page - https://www.wehago.com/landingnahago/ko/edge/staff/
- [S14] WEHAGO Smart A 10 payroll leaflet PDF - https://wu.wehago.com/wehagoupdate/wehagopdf/WEHAGO%EC%84%9C%EB%B9%84%EC%8A%A4%EB%A6%AC%ED%94%8C%EB%A6%BF_SmartA10%EA%B8%89%EC%97%AC%EA%B4%80%EB%A6%AC.pdf
- [S15] Dong-A Ilbo, "기업에 꼭 필요한 인재 키워 경쟁력 강화" (Aramintech profile) - https://www.donga.com/news/Economy/article/all/20240828/126714518/2
- [S16] Korea University dCollection, "도급과 파견의 구별기준에 관한 연구 : 전산시스템(MES)를 통한 작업지시에 대한 검토를 중심으로" - https://dcollection.korea.ac.kr/srch/srchDetail/000000279198
- [S17] Pressian, "삼성, 협력사 직원 결혼 여부까지 파악해 직접 관리" - https://www.pressian.com/pages/articles/6970
