---
name: verify
description: 이 저장소에서 도안(SVG) 변경을 실제 앱으로 확인하는 절차 — vite dev 서버 + Playwright(사전 설치 Chromium)로 전문가 모드를 구동해 도안 페이지를 스크린샷/DOM 검사한다.
---

# 도안 변경 검증 (전문가 모드 구동)

테스트·린트 스크립트가 없으므로 검증은 `npm run build` 통과 + 실제 브라우저에서 도안 확인이다 (CLAUDE.md).

## 절차

1. `npm install` (컨테이너가 새로 뜨면 node_modules 비어 있음) 후 `npm run dev`를 백그라운드로 (포트 5173).
2. Playwright는 스크래치패드에 `npm install playwright`로 설치하고, 브라우저는 다운로드하지 말고 사전 설치본을 쓴다:
   `chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })`
   (기본 launch()는 버전 불일치로 headless-shell을 못 찾는다.)
3. 앱 구동 경로:
   - `page.getByRole('button', { name: '전문가 모드' }).click()`
   - `page.getByRole('option', { name: /메커니즘 라벨/ }).click()` — 라벨은 registry의 `labelKo`.
   - 파라미터는 왼쪽 ParamPanel의 `input[type="range"]`를 native setter + input/change 이벤트로 조작 (150ms 디바운스 → ~1초 대기).
4. 도안 SVG 찾기: 생성기 그룹은 **`id`**가 `<mechanism>-group` (예: `layered-stage-group`) — class가 아니다. 페이지 마크업은 `.svg-paper`에 innerHTML로 주입된다.
5. 증거: 그룹의 `closest('svg')`를 element screenshot + DOM 검사(rect/path 개수, 텍스트 라벨 목록).

## 주의

- 어린이 모드 챗봇은 로컬에서 안 됨(`/api/chat` 없음) — 검증은 전문가 모드로.
- 장식 페이지의 Pollinations 이미지 요청은 프록시에서 ERR_TUNNEL_CONNECTION_FAILED가 나지만 도안 페이지(1페이지) 검증과 무관하다. `waitUntil: 'networkidle'`은 이것 때문에 오래 걸릴 수 있으니 `domcontentloaded` + 그룹 id 대기가 낫다.
- 프리뷰 캐러셀의 페이지 내비게이터가 도안 아래쪽을 가릴 수 있다(스크린샷 판독 시 참고).
