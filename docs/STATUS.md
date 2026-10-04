# Build Status

Checked: 2026-10-04 16:38 KST

- Public baseline inventory: DONE (4 numeric URLs, no mutation)
- Nutriments hard host isolation: IMPLEMENTED_LOCALLY
- Editorial R3: IMPLEMENTED_LOCALLY
- Nutrition evidence guard: IMPLEMENTED_LOCALLY
- Publish runtime: IMPLEMENTED_LOCALLY
- Update runtime: IMPLEMENTED_LOCALLY
- Source drift / submitting / duplicate guards: IMPLEMENTED_LOCALLY (remote main rechecked after submitting checkpoint commit, before final click)
- Anonymous public verification 1440/390: IMPLEMENTED_LOCALLY
- Workflow isolation: IMPLEMENTED_LOCALLY (shared mutation concurrency lock; narrow path triggers; pnpm frozen lockfile)
- Static check: PASS (includes shared mutation concurrency lock, same-URL update guard, active update-source R3 precheck)
- Node syntax check: PASS
- Dependency-backed unit tests: BLOCKED_LOCALLY_BY_PACKAGE_REGISTRY_DNS_EAI_AGAIN (static/syntax/workflow-YAML gates PASS; deterministic pnpm lock matches verified nhunnhun baseline)
- GitHub private repo `ansqhd5774-Choi/nutriments_blog`: NOT_CREATED (reverified 2026-10-04 16:38 KST; GitHub connector permission is Allow all actions, but the connector exposes no repository-create action; container has no authenticated `gh` CLI; CMD helper prepared)
- GitHub main commit/run IDs: NOT_AVAILABLE
- Windows device check: Desktop Commander device observed Offline at 2026-10-04 16:38 KST; no PC changes made
- Nutriments runner registration: NOT_STARTED (requires repository and live runner token)
- Dedicated Chrome profile/login: NOT_STARTED (requires Windows PC online/user login)
- First update `/4`: SOURCE_PREPARED_NOT_EXECUTED (`updates/update-4-probiotics-20261004.json`)
- First new publication: NOT_EXECUTED (blocked until first update path is proven)

- Update `/4` research: DONE (`docs/UPDATE_4_RESEARCH.md`; NIH ODS/NCCIH/FDA + licensed Wikimedia image sources)
- Mutation concurrency: SHARED_LOCK `nutriments-tistory-mutation` for publish/update
- Mobile public verification: FULL_R3 + exact body + OG + overflow at 390px
- Existing-update new numeric URL guard: IMPLEMENTED (`E_UPDATE_CREATED_NEW_URL`)

- Shared unsafe/template body guard: IMPLEMENTED for both posts and updates
- Dependency lock: pnpm 11.19.0 / pnpm-lock.yaml Git blob `32711051ebe1cea1951cea33b350574e1dbad109` (matches verified nhunnhun baseline)
- Pre-submit checkpoint drift guard: IMPLEMENTED (`submitting` commit must be current remote main immediately before final click)

- Public reverify: `/4` current title still matches `expectedCurrentTitle`; `/2` homepage `{{표시 텍스트}} -->` residue still present on 2026-10-04.

## Latest local verification
- Connection recheck evidence: `evidence/public/connection-check-20261004-1638-kst.json`.
- Stubbed JS unit suite: PASS 21/21. This checks project logic but does not replace a real dependency-backed run.
- Mock-ledger update validation: PASS; 1 prepared `/4` update pending; Editorial R3.
- Mock-ledger new-post validation: PASS; 0 pending new posts; Editorial R3.
- Fixed hosted-test portability bug: Windows `C:\tistory-nutriments\profile` is now recognized as an absolute Windows path even when tests run on Ubuntu.
- Pre-submit Editorial R3 contract now enforces FAQ, latest-evidence module, related links, first image eager/high-priority, and all remaining images lazy before any irreversible click.
- `/4` image source/license pages reverified on Wikimedia Commons.
