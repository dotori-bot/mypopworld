# CLAUDE.md

MyPopWorld: 아이들을 위한 팝업 카드/종이공작 도안을 AI 채팅으로 생성해주는 앱.

## 구조 요약

- `api/chat.js`: Gemini에게 대화시켜 `{ theme, imagePrompt, mechanism, difficulty }` JSON을 뽑아냄.
- `src/store/useCardStore.js`(zustand): `cardParams`로 저장.
- `src/components/Preview/SVGPreview.jsx`: `cardParams.mechanism` 문자열로 분기해서 실제 SVG를 그리는 **유일한 진입점**.
  - Page 1 = 메커니즘 도안(자르기/접기선), Page 2 = Pollinations.ai로 생성한 장식 실루엣(부속 도안).
- `src/generators/*.js`: 메커니즘별 생성기. **실제로 동작하는 유일한 패턴**은 `generateXxx(svg, options)` 형태로 `svgBuilder.js`의 `addPath/addPolygon/addRect/addText/addGroup/getLineStyle`를 가져다 SVG DOM에 직접 그리는 것 (`vfold.js`, `boxPopup.js`, `strawRocket.js`, `parallelFold.js`, `layeredStage.js`, `foldingScreen.js` 참고).
- `src/utils/math.js`: 각도/거리 계산 공식 모음 (`calculateVFoldAngle`, `calculatePopupHeight`, `calculateParallelFoldHeight` 등).

## 과거에 반복된 실수와 교훈 — 새 메커니즘/도안 작업 전에 반드시 읽을 것

### 1. "만들었지만 안 쓴 코드"는 없는 코드다
`pullTab.js`, `decorations.js`, `layoutOptimizer.js`, `pdfExporter.js`, 그리고 (수정 전) `parallelFold.js`는 전부 `svgBuilder.js`/`constants.js`에 실제로는 존재하지 않는 함수(`getLineStyles`, `createTemplate` 등)를 가정하고 작성되었고, `SVGPreview.jsx`에서 import조차 되지 않았다. 즉 "그럴듯한 모듈"을 만들어놓고 실제 렌더링 경로에 연결·검증하지 않은 것이 반복된 근본 원인이다.
→ 새 메커니즘을 추가하면 **반드시** `SVGPreview.jsx`에 import + 분기 추가까지 끝내고, 실제로 렌더링해서 눈으로 확인해야 "완료"다. (검증 방법: headless 브라우저로 `useCardStore.getState().setCardParams(...)` 호출 후 스크린샷 — 코드 리뷰만으로 끝내지 말 것.)

### 2. 부속 도안(장식 조각)은 메커니즘 조각의 실제 치수/각도에서 파생시켜야 한다 ⚠️핵심
**실제 발견된 버그**: `vfold.js`의 V-fold는 `armLength=40, angle=45°` 기준으로 풀칠 탭이 그려지는데, 이때 V가 실제로 벌어지는 폭은 약 56mm, 높이는 약 28mm 밖에 안 된다. 그런데 `SVGPreview.jsx`의 Page 2(장식 조각)는 이 수치와 전혀 무관하게 **항상 고정 100×100mm, 고정 좌표(55,80)** 로 그려진다. 즉 힌지에서 튀어나오는 V-fold 조각의 실제 크기·각도와, 거기에 풀칠해서 붙이는 장식 조각의 크기·모양이 서로를 전혀 참조하지 않는다. 그 결과 실제로 조립하면 장식이 팝업 구조와 따로 놀거나 크기가 안 맞는 오류가 발생했다.

**근본 원인**: `math.js`에 "카드가 목표 각도(α)까지 열렸을 때 팝업이 어떤 각도(β)·높이(h)가 되는지" 계산하는 공식(`calculateVFoldAngle`, `calculatePopupHeight`, `calculateParallelFoldHeight`)이 이미 정의되어 있지만 **어떤 generator도 이 함수들을 실제로 호출하지 않는다.** "카드가 열리는 각도"라는 개념 자체가 도안 생성 파이프라인에 실질적으로 존재하지 않았다.

**앞으로 메커니즘을 새로 만들거나 도안을 입체화할 때 지킬 것**:
1. 장식/부속 조각의 크기·모양·부착 위치는 항상 그것이 붙는 메커니즘 조각의 실제 파라미터(팔 길이, 폭, 깊이, 힌지 각도, 풀칠 탭의 실제 좌표/치수)에서 계산해서 정한다. 고정 좌표·고정 크기로 독립적으로 그리지 않는다.
2. 몸체(mechanism piece)와 그 위에 붙는 장식(decoration piece)은 같은 `options` 값(스파인 위치, armLength/width/depth 등)을 공유해서 계산하거나, 한 함수가 둘 다 계산해서 반환하는 구조로 설계한다. 서로 다른 좌표계·서로 다른 하드코딩된 상수로 독립적으로 그리지 않는다.
3. 가능하면 "카드가 목표 각도(보통 완전히 펼친 180° 또는 실사용 각도 90°)로 열렸을 때 이 팝업이 실제로 어떤 모양이 되는가"를 `math.js` 공식으로 먼저 계산하고, 그 결과에 맞춰 부속 도안 치수를 정한다.
4. 구현 후에는 "이 장식 조각이 이 힌지의 이 탭 크기/각도에 실제로 맞게 붙는가?"를 좌표 수치로 직접 비교해서 검증한다 (스크린샷으로 두 조각을 겹쳐보거나 치수를 로그로 찍어 비교).

### 3. 검증 없이 완료로 보고하지 않는다
`npm run build`(tsc + vite build)로 정적 오류를 잡고, headless 브라우저(Playwright, `/opt/pw-browsers/chromium` 사용 가능, `PLAYWRIGHT_BROWSERS_PATH` 설정됨)로 실제 store→SVGPreview→generator 경로를 실행해 스크린샷을 눈으로 확인한 뒤에만 작업 완료로 간주한다.
