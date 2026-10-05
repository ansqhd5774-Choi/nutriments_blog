# Nutriments Windows Runner Operations

Nutriments 전용 Windows self-hosted runner 운영 파일입니다.

## 원칙

- 대상 저장소: `ansqhd5774-Choi/nutriments_blog`
- 대상 블로그: `https://nutriments.tistory.com/`
- active publishing shell: CMD only
- 전용 Chrome profile만 사용
- profile/cookie/session/password/OTP/CAPTCHA는 GitHub에 저장하지 않음
- runner 창을 닫으면 종료되며 자동 재시작하지 않음

## 사용

1. `NUTRIMENTS_CONFIG.example.cmd`를 로컬에서 `NUTRIMENTS_CONFIG.local.cmd`로 복사합니다.
2. 새 PC라면 GitHub self-hosted runner를 별도 identity로 등록합니다.
3. `NUTRIMENTS_PRECHECK.cmd`로 경로를 확인합니다.
4. `NUTRIMENTS_RUNNER_ONESHOT.cmd`를 실행합니다.
5. 세션이 만료되어 `E_LOGIN_REQUIRED`가 나오면 로컬 `login.cmd`에서 사용자가 직접 로그인합니다.

## GitHub에 올리지 않는 것

- `NUTRIMENTS_CONFIG.local.cmd`
- Chrome profile/cookie/session
- runner registration token
- 비밀번호/OTP/CAPTCHA

다른 블로그의 runner 경로·profile·ledger는 이 저장소에 저장하지 않습니다.
