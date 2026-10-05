# NUTRIMENTS Coupon UI Standard R2

Status: DRAFT FOR IMPLEMENTATION
Target: https://nutriments.tistory.com/
Date: 2026-10-05

## 1. R2 goal
NUTRIMENTS coupon UI is not a generic coupon-card blog. The primary flow is:
search -> best current answer -> verification evidence -> conditions/final-price comparison -> alternatives -> expired/history.

## 2. R1 changes
- Remove PC two-column coupon-card-first layout.
- Do not place summary statistics above the best actionable coupon.
- Do not force game, travel and shopping into one card template.
- Separate source-check time from actual-working verification time.
- Replace the generic empty state with a verified "no working coupon" state and useful alternatives.

## 3. Desktop layout
- Main content + verification sidebar.
- Wide one-column offer cards in the main content.
- Verification sidebar shows pass/fail/source events.
- Best current offer must be visible before the general list.
- Affiliate value must not determine ranking.

## 4. Mobile layout
- Brand/game title, current verdict and best offer come first.
- Keep the best action available with a mobile sticky bar.
- Copy/CTA touch targets should be approximately 44-48px high.
- Filters use a horizontal rail.
- Do not remove key conditions or verification evidence on mobile.
- 390px overflow must be zero.

## 5. Industry-specific components

### General shopping / delivery
Show:
- percentage/fixed discount
- minimum spend
- maximum discount
- audience
- scope
- estimated savings

### Travel
Store and render promo codes and card-channel offers separately.
Show:
- web/app
- region
- booking/stay period
- minimum spend
- cap
- final-price comparison between coupon and card channel where possible

### Games
Use a dedicated game-code component:
- code
- reward
- NEW marker
- server
- platform
- expiry
- redemption method
- ACTIVE/EXPIRED separation

## 6. Verification model
Store separately:
- lastSourceCheckedAt
- lastWorkingVerifiedAt

Verification evidence may include:
- direct application test
- official source
- official/affiliate partner
- user report followed by re-verification

Success and failure history should both be retainable.

## 7. Recommendation labels
Do not define BEST as "highest percentage" only.
Possible views:
- current recommendation
- maximum discount
- maximum absolute saving
- easiest conditions
- best for new users
- best for existing users
- strongest verification

The page-level current recommendation should answer the general user's most likely best choice, while other maxima remain comparison aids.

## 8. Offer types
- CODE
- AUTO_DISCOUNT
- CARD_CHANNEL
- MEMBER
- REFERRAL
- GAME_REDEEM
- FREEBIE

## 9. Verified empty state
When no valid coupon is verified, state that clearly.
Provide alternatives such as:
- official sale
- card/payment discount
- recent expired offers
- expected next event when supported by evidence

Never fill an empty state with low-confidence or dead codes.

## 10. Core R2 components
- ncp-site-head
- ncp-search
- ncp-category-rail
- ncp-home-hero
- ncp-verdict
- ncp-main-layout
- ncp-best
- ncp-status
- ncp-condition
- ncp-codebox
- ncp-copy
- ncp-filterbar
- ncp-offer-list
- ncp-offer
- ncp-verify-panel
- ncp-verify-feed
- ncp-proof
- ncp-calculator
- ncp-travel-compare
- ncp-game-list
- ncp-game-code
- ncp-empty-verified
- ncp-mobile-sticky
- ncp-toast

## 11. Tistory isolation
All coupon-specific CSS must stay under the .ncp-* namespace.
Do not introduce broad resets that can damage existing nutrition posts.
Existing numeric URLs and existing nutrition article intent remain unchanged.

## 12. Implementation gate
Do not apply R2 directly to the live Tistory skin yet.
Sequence:
1. CSS + HTML fixture
2. static validation at PC 1440 and mobile 390
3. coupon renderer + script.js
4. legacy nutrition compatibility test
5. skin integration
6. anonymous public verification

## 13. Benchmark principles incorporated
- Best verified actionable code before statistics.
- Mobile persistent access to the best offer.
- Verification feed that can show both successes and failures.
- Honest zero-working-code state.
- High-density Korean condition display: app/web, audience, minimum spend, cap, D-day.
- Travel: distinguish coupon codes from card-channel discounts and compare final price.
- Games: separate active/expired, reward details and redemption instructions.

This document defines the R2 implementation contract. The actual CSS prototype remains isolated from active publishing until the static and legacy-compatibility gates pass.
