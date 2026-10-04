# Windows Nutriments Publisher Runner

Status: SETUP_REQUIRED

## Isolation
Runner labels must be exactly compatible with:
- self-hosted
- windows
- x64
- nutriments-publisher

The dedicated browser profile must be outside the repository and contain `nutriments` in its path. Recommended path:
`C:\tistory-nutriments\profile`

Do not reuse the ordinary Chrome Default/User Data profile or any nhunnhun profile. Do not upload cookies/profile/session to GitHub, cache or artifact.

## CMD-only initial preparation
Run in Windows CMD under the same Windows account that will execute the runner:

```cmd
if not exist C:\tistory-nutriments mkdir C:\tistory-nutriments
if not exist C:\tistory-nutriments\profile mkdir C:\tistory-nutriments\profile
set "TISTORY_CHROME_PATH=C:\Program Files\Google\Chrome\Application\chrome.exe"
set "TISTORY_PROFILE_DIR=C:\tistory-nutriments\profile"
```

After the repository exists, clone `ansqhd5774-Choi/nutriments_blog` into a Nutriments-only working directory and run `npm install --global pnpm@11.19.0` once if needed, then `pnpm install --frozen-lockfile --ignore-scripts` followed by `pnpm run login`. The user completes Kakao/Tistory authentication directly in the dedicated Chrome window. Password, OTP and CAPTCHA are never automated or copied into chat.

Runner registration requires the live GitHub runner registration token generated from the new private repository. Do not reuse the nhunnhun runner registration identity. Keep `NUTRIMENTS_TISTORY_ENABLED` false until login + smoke + tests are confirmed.
