# NUTRIMENTS Coupon Site Standard R1

Status: ACTIVE
Target: https://nutriments.tistory.com/
Source of truth: ansqhd5774-Choi/nutriments_blog / main
Effective date: 2026-10-05

## 1. 전환 원칙

- 기존 영양 콘텐츠와 기존 숫자 URL은 보존한다.
- 기존 영양 글을 쿠폰 글로 덮어쓰지 않는다.
- 신규 글부터 쿠폰 콘텐츠를 발행한다.
- 쿠폰 하나마다 새 글을 대량 생성하지 않는다.
- 기본 단위는 브랜드별 통합 쿠폰 페이지다.
- 사이트의 차별점은 "많은 코드"가 아니라 "검증 가능한 최신 상태"다.
- 제휴 여부와 관계없이 정보 정확도와 검증 기록을 우선한다.
- 제휴 링크는 rel="sponsored nofollow"를 기본값으로 한다.
- 공식 출처 또는 명확한 검증 근거가 없는 쿠폰은 ACTIVE로 표시하지 않는다.

## 2. 초기 분야 우선순위

### Phase 1 — 해외직구
가장 먼저 구축한다.

우선 브랜드 후보:
- AliExpress
- iHerb
- Temu
- Amazon 계열 공개 프로모션이 확인되는 경우
- 기타 한국 사용자가 실제 이용 가능한 해외 쇼핑몰

선정 이유:
- 코드 / 최소금액 / 할인액 / 시작일 / 종료일 구조가 명확하다.
- 월별·행사별 반복 프로모션이 많아 DB형 페이지와 잘 맞는다.
- 한국 대상 코드, 글로벌 코드, 결제수단 할인 등 적용범위 검증 가치가 높다.

### Phase 2 — 여행·레저
우선 브랜드 후보:
- Trip.com
- KKday
- MyRealTrip
- Agoda
- Klook

### Phase 3 — 디지털·구독
우선 대상:
- SaaS
- AI 도구
- 디자인/생산성 서비스
- VPN/호스팅/클라우드 등 명확한 공식 프로모션이 있는 서비스

### Phase 4 이후
- 패션·뷰티
- 생활·쇼핑
- 식품·건강

국내 쇼핑몰의 계정별·앱전용·개인화 쿠폰은 자동 검증 난도가 높으므로 초기 핵심군에서 제외한다.

## 3. 최종 카테고리 구조

1. 해외직구
2. 여행·레저
3. 디지털·구독
4. 패션·뷰티
5. 생활·쇼핑
6. 식품·건강

보조 탐색:
- 오늘 확인된 쿠폰
- 만료 임박
- 신규 쿠폰
- 종료된 쿠폰
- 브랜드 전체보기

브랜드는 반드시 하나의 주 카테고리에만 속한다. 보조 탐색은 태그/상태 필터로 처리한다.

## 4. 브랜드 페이지 구조

브랜드당 숫자 URL 1개를 기본 자산으로 유지한다.

페이지 순서:

1. 제목
   - "[브랜드] 할인코드·쿠폰 최신 정리"
2. 검증 요약
   - 마지막 확인일
   - ACTIVE 개수
   - EXPIRING_SOON 개수
   - 공식 출처 확인 여부
3. 가장 좋은 현재 혜택
4. 현재 사용 가능한 쿠폰 표
5. 쿠폰별 상세 카드
6. 적용 조건
   - 최소 주문금액
   - 신규/기존 회원
   - 앱/웹
   - 국가/지역
   - 상품·카테고리 제한
7. 중복 적용 가능 여부
8. 사용 방법
9. 만료/제외된 코드
10. 검증 기록
11. 공식 출처
12. FAQ
13. 관련 브랜드/카테고리 내부링크
14. 제휴 고지

각 쿠폰 카드 필수 표시:
- 혜택
- 코드
- 상태
- 최소금액
- 대상
- 적용범위
- 시작일
- 종료일
- 마지막 확인일
- 검증 방식
- 공식출처
- 중복 가능 여부

## 5. 상태값

허용 상태:
- ACTIVE
- EXPIRING_SOON
- EXPIRED
- UNVERIFIED
- REMOVED

판정 규칙:

### ACTIVE
다음 조건을 모두 만족:
- 현재 시간이 startAt 이상
- endAt이 없거나 현재 시간이 endAt 이전
- 공식 출처 확인 또는 허용된 검증 절차 통과
- freshness SLA 이내

### EXPIRING_SOON
ACTIVE 조건을 만족하면서 종료까지 72시간 이하.

### EXPIRED
종료시각이 현재보다 과거이거나 공식적으로 종료 확인.

### UNVERIFIED
다음 중 하나:
- 공식 출처 없음
- 조건 일부 미확인
- 검증 SLA 초과
- 코드가 발견됐으나 실제 적용 여부 미확인

### REMOVED
- 오기재
- 중복
- 브랜드 요청
- 허위/위조
- 공개하면 안 되는 비공개 코드
- 더 이상 추적하지 않는 항목

REMOVED는 공개 기본 목록에서 숨기되 감사 로그에는 남긴다.

## 6. Freshness SLA

- 플래시/행사 쿠폰: 24시간
- 종료일 7일 이내 쿠폰: 48시간
- 일반 기간형 쿠폰: 72시간
- 상시 코드: 7일

SLA를 넘기면 자동으로 ACTIVE를 유지하지 않고 UNVERIFIED 후보로 내린다.

## 7. 쿠폰 JSON 표준

신규 쿠폰 브랜드 source 권장 경로:
- coupons/<brand-slug>.json

예시:

{
  "schemaVersion": 1,
  "pageType": "brand_coupon_hub",
  "id": "aliexpress",
  "brand": {
    "name": "AliExpress",
    "slug": "aliexpress",
    "category": "해외직구",
    "officialUrl": "https://example.com/",
    "countryScope": ["KR"]
  },
  "title": "알리익스프레스 할인코드·쿠폰 최신 정리",
  "status": "ready",
  "approval": "approved",
  "lastReviewedAt": "2026-10-05T00:00:00+09:00",
  "representativeImageUrl": "https://...",
  "coupons": [
    {
      "couponId": "ali-202610-choice-04",
      "benefitType": "fixed",
      "benefitValue": 4,
      "benefitCurrency": "USD",
      "benefitText": "$4 할인",
      "code": "EXAMPLE04",
      "minimumSpend": {
        "amount": 34,
        "currency": "USD"
      },
      "audience": ["ALL"],
      "platform": ["WEB", "APP"],
      "countryScope": ["KR"],
      "scopeType": "SITEWIDE",
      "scopeText": "행사 적용 상품",
      "startAt": "2026-10-01T00:00:00+09:00",
      "endAt": "2026-10-07T23:59:59+09:00",
      "lastVerifiedAt": "2026-10-05T00:00:00+09:00",
      "status": "ACTIVE",
      "stackable": "UNKNOWN",
      "usageLimit": null,
      "source": {
        "type": "OFFICIAL",
        "url": "https://...",
        "checkedAt": "2026-10-05T00:00:00+09:00"
      },
      "verification": {
        "method": "OFFICIAL_SOURCE",
        "result": "PASS",
        "evidence": "공식 행사 페이지에서 코드·기간·최소금액 확인",
        "checkedAt": "2026-10-05T00:00:00+09:00"
      },
      "affiliate": {
        "url": null,
        "rel": "sponsored nofollow"
      },
      "notes": []
    }
  ]
}

## 8. 필수 JSON 필드

브랜드:
- name
- slug
- category
- officialUrl
- countryScope

쿠폰:
- couponId
- benefitType
- benefitText
- code 또는 code=null
- minimumSpend
- audience
- platform
- countryScope
- scopeType
- scopeText
- startAt
- endAt
- lastVerifiedAt
- status
- stackable
- source
- verification
- affiliate

허용 audience:
- ALL
- NEW_CUSTOMER
- EXISTING_CUSTOMER
- MEMBER
- APP_FIRST_ORDER
- CARD_HOLDER
- OTHER

허용 scopeType:
- SITEWIDE
- CATEGORY
- PRODUCT
- SELLER
- REGION
- PAYMENT_METHOD
- APP_ONLY
- OTHER

stackable:
- YES
- NO
- CONDITIONAL
- UNKNOWN

## 9. 중복 판정

중복키는 단순 code만 사용하지 않는다.

정규화 키:
brandSlug
+ normalizedCode
+ benefitText
+ minimumSpend
+ countryScope
+ startAt
+ endAt

동일 코드라도 행사 기간·최소금액·대상 조건이 다르면 별도 record를 허용한다.

동일 조건의 record가 2개 이상이면:
- 공식 출처 우선
- checkedAt 최신 우선
- 나머지는 REMOVED + duplicateOf 기록

## 10. 검증 신뢰도

verification.method 허용값:
- OFFICIAL_SOURCE
- OFFICIAL_EMAIL
- MANUAL_CART_TEST
- MERCHANT_CONFIRMATION
- TRUSTED_PARTNER_SOURCE
- USER_REPORT
- AGGREGATOR_ONLY

ACTIVE 허용:
- OFFICIAL_SOURCE
- OFFICIAL_EMAIL
- MANUAL_CART_TEST
- MERCHANT_CONFIRMATION
- TRUSTED_PARTNER_SOURCE

USER_REPORT 또는 AGGREGATOR_ONLY 단독 근거는 UNVERIFIED만 허용한다.

## 11. 자동화 파이프라인

### A. Discovery
후보 수집:
- 공식 프로모션 페이지
- 공식 뉴스/이벤트 페이지
- 공식 이메일
- 공식 SNS
- 신뢰 가능한 제휴/파트너 피드
- 경쟁 사이트는 발견용 참고만 허용

경쟁 사이트의 코드만 보고 ACTIVE 생성 금지.

### B. Normalize
- 브랜드명 정규화
- 코드 대문자/공백 정규화
- 금액/통화 분리
- KST 기준 시각 저장
- 국가/대상/플랫폼 분리

### C. Deduplicate
- 정규화 키 기반 중복 제거
- 기존 브랜드 페이지와 비교
- 종료된 동일 코드 이력 유지

### D. Validate
자동 검사:
- JSON schema
- 상태값
- 날짜 역전
- 종료일 경과
- lastVerifiedAt 존재
- 공식 URL HTTPS
- 브랜드/카테고리 일치
- 최소금액 통화
- 코드 중복
- 제휴 rel
- 근거 없는 ACTIVE 차단

### E. Freshness
매 실행 시:
- ACTIVE/EXPIRING_SOON SLA 확인
- SLA 초과 -> UNVERIFIED 후보
- 종료 72시간 이하 -> EXPIRING_SOON
- 종료 -> EXPIRED

### F. Render
브랜드 페이지 1개에:
- 현재 ACTIVE 우선
- EXPIRING_SOON 강조
- UNVERIFIED 별도 구역
- EXPIRED는 하단 이력
- REMOVED는 공개 렌더 제외

### G. Publish
기존 publish-posts 경로를 그대로 재사용하되 쿠폰 전용 validation/render 계약을 추가한다.
쿠폰용 일회성 workflow를 만들지 않는다.

### H. Public Verification
익명 공개 페이지에서:
- 제목
- 브랜드
- 상태
- 쿠폰코드
- 최소금액
- 종료일
- 마지막 확인일
- 공식출처 링크
- 제휴 rel
- PC/mobile overflow
를 검증한다.

## 12. 자동 검증 실패 코드 권장

- E_COUPON_SCHEMA
- E_COUPON_DUPLICATE
- E_COUPON_STATUS
- E_COUPON_DATE_RANGE
- E_COUPON_STALE
- E_COUPON_SOURCE_REQUIRED
- E_COUPON_ACTIVE_UNVERIFIED
- E_COUPON_AFFILIATE_REL
- E_COUPON_CATEGORY
- E_COUPON_PUBLIC_MISMATCH

## 13. SEO / 검색 품질

- 같은 브랜드의 월별 쿠폰 글을 계속 새 URL로 만들지 않는다.
- 브랜드 통합 페이지의 동일 숫자 URL을 지속 갱신한다.
- 행사별 검색 수요가 매우 크고 독립 검색의도가 있을 때만 별도 글을 허용한다.
- 판매자 설명 복사, 제휴 피드 재게시, 쿠폰 목록만 나열하는 페이지는 금지한다.
- 페이지마다 마지막 확인일과 검증 근거를 제공한다.
- 공식 출처 링크를 제공한다.
- 제휴 링크에는 sponsored를 사용한다.
- 제휴 수익이 있으면 페이지 상단 또는 CTA 인접 위치에 명확하게 고지한다.

## 14. 기존 영양 콘텐츠 처리

- 기존 숫자 URL 유지.
- 기존 영양 글 삭제/쿠폰 전환 금지.
- 기존 글 카테고리는 보존 가능.
- 사이트 메뉴에서는 "기존 자료" 또는 별도 아카이브로 점진적 분리 가능.
- 기존 글을 쿠폰 검색의도에 맞추기 위해 제목/본문을 변경하지 않는다.

## 15. 실행 순서

1. Coupon Standard R1 적용
2. 쿠폰 전용 schema + validator 작성
3. 쿠폰 전용 renderer/editorial 작성
4. 카테고리/소개/메뉴 재설계
5. 첫 브랜드: AliExpress
6. 두 번째 브랜드: iHerb
7. 해외직구 5~10개 브랜드 확보
8. 여행·레저 확장
9. 디지털·구독 확장
10. 검색 성과 확인 후 나머지 카테고리 확장

## 16. 첫 발행 Gate

첫 쿠폰 브랜드 페이지는 아래를 모두 만족해야 한다.

- 공식 출처 확인
- 기존 글/제목 중복 없음
- 쿠폰 schema PASS
- 중복 PASS
- 상태 자동판정 PASS
- 최신성 PASS
- ACTIVE 근거 PASS
- 제휴 rel PASS
- 브랜드 통합 페이지 구조 PASS
- PC 1440 PASS
- 모바일 390 PASS
- 동일 숫자 URL 유지 방식 확인
- 익명 공개 검증 PASS

