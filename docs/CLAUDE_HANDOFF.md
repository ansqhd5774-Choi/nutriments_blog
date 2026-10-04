# Claude / GPT 인수인계 시작점

기준: 2026-10-04. 이 저장소는 private이며 main이 source of truth다.

## 먼저 읽을 파일
1. README.md — 저장소 목적과 실행 경계
2. docs/GPT_HANDOFF_20261004.md — 경로, 완료 상태, 남은 작업 순서 (Claude에도 동일 적용)
3. docs/evidence/environment-20261004.json — 확인 시점의 상태와 미실행 항목
4. docs/EDITORIAL_PUBLISH_STANDARD_R3.md — 편집 기준
5. docs/SITE_BASELINE.md — 기존 글 기준, 실제 작업 전 최신 상태와 대조
6. docs/WINDOWS_NUTRIMENTS_RUNNER.md — 전용 runner 설정
7. .github/workflows/ — publish, update, 읽기 전용 runner-smoke
8. publishing/ 및 tests/ — 실제 실행 코드와 검증
9. updates/update-4-probiotics-20261004.json — 첫 수정 원고
10. scripts/windows/ — 현재 PC의 비밀정보 없는 CMD 시작 스크립트 사본

## 검증 증거
- 실제 의존성 테스트 22/22 및 신규 검증: https://github.com/ansqhd5774-Choi/nutriments_blog/actions/runs/37190049334
- 기존 글 수정 source 검증: https://github.com/ansqhd5774-Choi/nutriments_blog/actions/runs/37190049326
- Windows runner 실제 로그인 검사: https://github.com/ansqhd5774-Choi/nutriments_blog/actions/runs/37190317900
- 이는 해당 실행 시점의 증거다. 현재 runner/login 상태가 계속 유지된다는 보장은 아니다.
- 실제 /4 수정과 신규 발행 및 공개 화면 검증은 NOT_RUN이다.

## 접근 권한 확인
GitHub에 파일이 존재하는 것과 Claude가 읽을 수 있는 것은 별개다.
Claude에서 연결된 GitHub 계정/앱에 ansqhd5774-Choi/nutriments_blog 접근 권한이 있어야 한다.
이 작업에서는 Claude 세션의 실제 파일 읽기를 수행하지 않았으므로 Claude 접근은 미확인이다.
Claude에게 이 문서와 publishing/core.mjs를 읽고 EXPECTED_REPO 및 main SHA를 보고하도록 요청한다.
정확한 값을 읽으면 해당 세션의 source 접근을 확인할 수 있다. source 읽기 권한은 push/Actions 실행 권한을 뜻하지 않는다.
404/접근 거부 시 Claude의 GitHub 연결에서 이 private 저장소를 허용하고 재연결한다. 저장소를 public으로 바꾸지 않는다.

## GitHub에 올리지 않는 항목
Chrome profile, cookies, session, GitHub OAuth/runner token, .credentials, 개인 비밀번호, node_modules, runner 바이너리.
이들은 인수인계 누락이 아니라 비밀정보 또는 재설치 가능한 실행환경이다.
로그인 상태는 전용 Windows PC에 남는다. 클라우드 Claude가 직접 해당 프로필을 사용할 수 없다.
실제 발행은 전용 Windows runner의 표준 workflow로만 수행한다.

## 운영 주의
- scripts/windows는 현재 PC 경로를 기록한 사본이다. 다른 PC에서 경로를 그대로 실행하지 않는다.
- runner는 현재 세션의 백그라운드 프로세스이며 재부팅 자동 시작은 미설정이다.
- NUTRIMENTS_TISTORY_ENABLED는 인수인계 시 미설정으로 mutation 비활성 상태다.
- /4 먼저 수정·검증·ledger updated 후 신규 글 1개를 진행한다.
- submitting 상태에서 결과가 불명확하면 재실행하지 않는다.
- nhunnhun 관련 source/profile/ledger/runner는 변경하지 않는다.
