# NUTRIMENTS Go-Live Checklist

Checked: 2026-10-04
Target: https://nutriments.tistory.com/
Repository target: ansqhd5774-Choi/nutriments_blog

## Already complete locally
- [x] Public inventory `/1`–`/4` captured without mutation.
- [x] BLOG host locked to `nutriments.tistory.com`.
- [x] `nhunnhun.tistory.com` mutation rejected by tests/static contract.
- [x] Publish/update runtime separated.
- [x] Shared mutation concurrency lock configured.
- [x] Editorial R3 renderer and nutrition evidence guard implemented.
- [x] Source drift and `submitting` checkpoint gates implemented.
- [x] Anonymous 1440px/390px public verification implemented.
- [x] First update source prepared for `/4`; current public title reverified on 2026-10-04.
- [x] `/2` homepage residue `{{표시 텍스트}} -->` reverified on 2026-10-04.
- [x] Static and Node syntax checks pass.
- [x] Workflow YAML parses successfully.
- [x] `pnpm-lock.yaml` matches the verified nhunnhun dependency lock Git blob `32711051ebe1cea1951cea33b350574e1dbad109`.

## External gates still required
- [ ] Create private repository `ansqhd5774-Choi/nutriments_blog`.
- [ ] Push this clean local `main` to the new repository.
- [ ] Run hosted `pnpm test` and `pnpm run validate:update` successfully.
- [ ] Register a dedicated Windows runner with labels `self-hosted, windows, x64, nutriments-publisher`.
- [ ] Configure `TISTORY_PROFILE_DIR=C:\tistory-nutriments\profile` outside the repo.
- [ ] User completes Kakao/Tistory login in the dedicated Chrome profile.
- [ ] `pnpm run smoke` passes with no mutation.
- [ ] Keep `NUTRIMENTS_TISTORY_ENABLED=false` until all above gates pass.
- [ ] Execute first `/4` update only through `.github/workflows/update-posts.yml`.
- [ ] Verify same numeric URL, title/body/R3, 3 kakaocdn images, `og:image`, 1440/390 overflow=0, and `updated` ledger.
- [ ] Only after update path PASS, prepare and publish one non-cannibalizing new article through `publish-posts.yml`.

## Repository creation helper
`scripts/bootstrap-repo.cmd` is an optional CMD-only helper. It requires an already authenticated GitHub CLI (`gh`) and creates the target repository as **private**, from a clean local `main`. It contains no token or credential.
