# Nutriments Tistory Public Baseline

Status: INVENTORY_ONLY
Checked: 2026-10-04
Target: https://nutriments.tistory.com/
Mutation performed during baseline: NONE

## Public structure
- Blog title/category label observed: `영양 성분`
- Public article count observed: 4
- Numeric URLs: `/1`, `/2`, `/3`, `/4`
- Public category: `영양 성분` (4)
- Existing URLs are SEO assets and must not be deleted or replaced with new numeric URLs during modernization.

## Existing article inventory

| Priority | URL | Current title | Date | Category | Public image state | Primary modernization findings | Internal-link state | Cannibalization |
|---:|---|---|---|---|---|---|---|---|
| 3 | https://nutriments.tistory.com/1 | 리보플라빈(B2) 하루 권장량·효능 5가지·음식 TOP7·복용 팁 | 2025-09-05 | 영양 성분 | First body image on kakaocdn; public OG not yet verified | Separate ordinary intake from 400 mg migraine research; remove/qualify generalized fatigue/eye/anemia/cataract claims; recheck medication-interaction section because NIH ODS states no clinically relevant medication interactions are known | Automatic category links observed; no R3 manual related-links module observed | Low against current 4 posts |
| 2 | https://nutriments.tistory.com/2 | 비타민 E 효과·부작용·권장량 총정리 | 2025-09-08 | 영양 성분 | First body image on kakaocdn; public OG not yet verified | Visible source/editorial residue; `권장량: 15 ~ 1,000 mg` mixes RDA and UL; one-month skin/recovery claims need evidence grading; disease-prevention wording requires narrowing | Automatic category links observed; no R3 manual related-links module observed | Low against current 4 posts |
| 4 | https://nutriments.tistory.com/3 | 비타민D 효능과 하루 권장량, 결핍 증상까지 한 번에 정리! | 2025-11-23 | 영양 성분 | First body image on kakaocdn; public OG not yet verified | Serum 25(OH)D cutoffs presented too definitively; infection/mood/metabolic outcomes need association-vs-causation separation; supplement vs deficiency treatment distinction; product-brand recommendation should be removed or neutralized | Automatic category links observed; no R3 manual related-links module observed | Low against current 4 posts |
| 1 | https://nutriments.tistory.com/4 | 유산균(프로바이오틱스) 효능·부작용·하루 권장량 완전정리 | 2025-11-23 | 영양 성분 | First body image on kakaocdn; public OG not yet verified | No universal healthy-adult RDA/AI exists; CFU guidance must be strain/indication-specific; `유산균 결핍` is not a nutrient-deficiency framework; broad infection/skin/mood/metabolic prevention claims need evidence grading; food CFU values are highly variable; brand recommendations should be removed or neutralized | Automatic category links observed; no R3 manual related-links module observed | Medium for future gut-health/probiotic content; preserve `/4` as canonical probiotic overview |

## Publicly observed tag cloud
The site sidebar exposes topic tags including `리보플라빈 뜻`, `리보플라빈 영양소`, `리보플라빈 부족`, `리보플라빈 결핍증`, `비타민E 섭취기준`, `비타민E 크림`, `유산균 하루권장량`, `유산균 신생아`, `유산균 부족`, `유산균 결핍`. This is a public sidebar observation, not an administrator-authoritative per-post tag export. Existing tags must be preserved during update unless the editor confirms a reason to change them.

## Broken/template residue
- Homepage listing for `/2` visibly includes `{{표시 텍스트}} -->` after the title.
- `/2` body visibly includes an editorial note equivalent to “출처 표기: 국가성분표/USDA FoodData Central/관련 논문명·연도 병기.”
- No destructive cleanup was performed during baseline.

## R3 gap summary
None of the four current public articles should be assumed to satisfy Nutriments Editorial R3. Before any `updated` ledger state, the public page must be rechecked for quick summary, H2/H3 styling, responsive tables/images, 3 distinct images with alt, FAQ, latest-evidence module, core summary, manual related links, sources, highlighter colors, representative image/OG, and 1440/390 overflow.

## First modernization candidate
`/4` is selected as the first update candidate because its current search intent is clear and stable while several central claims require structural correction. The URL and topic must remain unchanged. A ready+approved `/4` update source has now been prepared locally at `updates/update-4-probiotics-20261004.json`, but no Tistory mutation has been attempted. Runtime execution remains gated by repository/runner/profile/login/test/source-drift checks and re-confirms the administrator title before final submit.
