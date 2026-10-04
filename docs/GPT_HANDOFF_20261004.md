# NUTRIMENTS GPT 인수인계 (2026-10-04)

## 기준 저장소와 경로
- 비공개 저장소: https://github.com/ansqhd5774-Choi/nutriments_blog
- authoritative branch: main. 시작 전에 원격 최신 main을 읽는다.
- 로컬 소스: C:\Users\c06\Documents\Codex\nutriments-recovery\source
- 전용 runner: nutriments-publisher-c06
- labels: self-hosted, Windows, X64, nutriments-publisher
- runner 경로: C:\tistory-nutriments\runner
- runner 시작(CMD): call C:\tistory-nutriments\start-runner.cmd
- 최초/만료 로그인(CMD): call C:\tistory-nutriments\login.cmd
- 전용 Chrome 프로필: C:\tistory-nutriments\profile (복사·업로드 금지)
- 현재 runner는 사용자 세션의 백그라운드 프로세스다. 재부팅 자동 시작 서비스는 설정하지 않았다. PC 재시작 후 위 CMD로 시작하고 GitHub에서 Online/Idle을 확인한다.

## 완료 증거
- 원본 R5 bundle 해시와 시작 SHA 확인, private repo 생성 및 main push 완료.
- 실제 의존성 Windows 테스트 22/22 PASS.
- Ubuntu hosted 신규 검증: Actions 37190049334 PASS.
- Ubuntu hosted 수정 검증: Actions 37190049326 PASS.
- pnpm 설치 전 setup-node 자동 캐시 오류 수정.
- 저장소 내부 Chrome 프로필 거부 검사 추가.
- 전역 setx 대신 전용 CMD 세션 환경변수 사용.
- 전용 Chrome 종료 후 재실행에서 LOGIN_SAVED 확인.
- 읽기 전용 runner 검증: runner-smoke.yml (실행 결과는 아래 참고).

## GPT가 이어갈 일
1. docs/EDITORIAL_PUBLISH_STANDARD_R3.md와 실제 main 코드를 읽는다.
2. updates/update-4-probiotics-20261004.json의 근거·본문·이미지를 검토한다. NIH ODS 등 공식 근거 우선. 보편적 하루 CFU 권장량을 만들지 않는다.
3. targetUrl=https://nutriments.tistory.com/4, articleId=4, expectedCurrentTitle을 실제 관리 화면과 대조한다.
4. 준비 완료 후 GitHub repository variable NUTRIMENTS_TISTORY_ENABLED=true로 설정하고 update-posts.yml을 main에서 한 번 실행한다. 현재 변수는 미설정으로 실제 발행/수정이 비활성화되어 있다.
5. 최종 클릭 전 sourceCommit 및 checkpoint 원격 SHA 검사를 유지한다. submitting 이후 결과 불명확 시 재실행 금지.
6. /4 유지, 새 숫자 URL 생성 없음, 익명 PC1440/모바일390, 이미지·OG·편집기준을 검증하고 update ledger updated 확인.
7. /4가 완전히 PASS한 뒤 기존 글과 검색 의도가 겹치지 않는 신규 글을 posts/*.json에 작성. 한 실행 최대 1개, publish-posts.yml 표준 경로로 발행·공개검증·published ledger 확인.

## 실행 경계
- Tistory 수정/발행은 Windows runner + 전용 persistent Chrome + Playwright만 사용.
- active publishing shell CMD. 브라우저 도구로 직접 발행하지 않는다.
- nhunnhun 저장소/블로그/runner/profile/ledger 수정 및 공유 금지.
- 비밀번호·OTP는 사용자만 입력. 쿠키/프로필/token을 파일·채팅·artifact에 노출하지 않는다.
- GitHub source 수정이나 테스트 성공은 실제 발행 성공과 다르다.
- 현재 /4 수정, 신규 발행, 공개 검증, 최종 ledger는 모두 NOT_RUN이다.
- GitHub 연결이 source 편집만 지원하고 workflow/변수 실행 권한이 없으면 해당 작업만 Codex에 요청한다. 기존 소스를 새로 만들거나 우회 발행하지 않는다.

## 실제 runner 결과
- Actions 37190317900 SUCCESS: CMD에서 설치 및 smoke 실행 완료. NUTRIMENTS_LOGIN_PASS / MUTATION_NOT_ATTEMPTED 확인.
- https://github.com/ansqhd5774-Choi/nutriments_blog/actions/runs/37190317900

