# NUTRIMENTS Editorial Publish Standard R3

Status: ACTIVE
Target: https://nutriments.tistory.com/

## Core visual contract
- H2: 26px / 800 with one accent bar per H2
- H3: 20px / 800
- Responsive table wrapper
- Responsive images
- Opening representative image, then short search-intent lead
- `핵심만 먼저:` source block rendered as “이것만 먼저 보세요”
- FAQ
- latest-evidence module with year when freshness matters
- `핵심 정리`
- `함께 보면 좋은 글`
- `자료 출처`
- at least 3 distinct body images, meaningful alt text required
- first image eager + fetchpriority=high; remaining images lazy
- source `<u>` markers render with cyclic Yellow/Lime/Blue/Pink highlighters
- if highlights >=2, at least 2 colors must render
- public representative `og:image` must be kakaocdn and not default opengraph.png

## Nutrient/evidence contract
Use definitions and reference values precisely. RDA, AI, UL and DV are different concepts and must never be collapsed into one “recommended range.” Separate ordinary intake guidance from deficiency treatment or trial-level supplement dosing. Age, sex, pregnancy and lactation values must be labeled when applicable.

Preferred evidence: NIH ODS, WHO, FDA, EFSA, MFDS, KDCA, USDA FoodData Central, then appropriate professional bodies, systematic reviews/meta-analyses and primary trials. Observational associations must not be written as causal effects. Animal/in-vitro findings must not be generalized as established human outcomes. Unsupported treatment/prevention claims are prohibited.

## Publishing contract
New article source: `posts/*.json` → `.github/workflows/publish-posts.yml` → `publishing/publish.mjs`.
Only `ready + approved` is eligible. Maximum one pending new article per run. `submitting` is durable and never auto-retried. `published` is never republished.

## Existing-article contract
Existing article source: `updates/*.json` → `.github/workflows/update-posts.yml` → `publishing/update.mjs`.
`articleId`, `targetUrl`, and `expectedCurrentTitle` must match. Update must stay on the same numeric URL. `submitting` is never auto-retried; `updated` with the same fingerprint is skipped.

## Completion contract
Static/source validation alone is not completion. Mutation completion requires anonymous public verification of title/body/editorial DOM, images/kakaocdn, representative OG image, PC 1440 and mobile 390 overflow, then final ledger state.
