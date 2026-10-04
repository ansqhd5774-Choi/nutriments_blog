# nutriments_blog

Automation source of truth for `https://nutriments.tistory.com/` only.

This repository must remain isolated from `nhunnhun_blog`: no post/update source, publication/update ledger, article ID, URL, Chrome profile, runner label or workflow state may be shared.

Active paths:
- new posts: `posts/*.json` → `.github/workflows/publish-posts.yml` → `publishing/publish.mjs`
- existing numeric URL updates: `updates/*.json` → `.github/workflows/update-posts.yml` → `publishing/update.mjs`
- new publication ledger: `publishing/state/`
- update ledger: `publishing/update-state/`
- Editorial standard: `docs/EDITORIAL_PUBLISH_STANDARD_R3.md`
- public baseline: `docs/SITE_BASELINE.md`
- Windows runner setup: `docs/WINDOWS_NUTRIMENTS_RUNNER.md`

Mutation host is fail-closed to `https://nutriments.tistory.com`. Active publisher code must not use Browserbase, TinyFish or Remote Desktop Commander as a publication path.
