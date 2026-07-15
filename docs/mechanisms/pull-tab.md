# 풀탭 (당기면 움직이는 장치) (pull-tab)

## 개요

카드 앞면에 뚫린 좁은 슬롯(트랙) 안에서 별도로 오린 슬라이더 조각을 손잡이로 밀거나 당기면 그림이 옆으로 이동하는 메커니즘. `registry.js`의 `labelKo`는 `'풀탭 (당기면 움직이는 장치)'`, `instructionStyle`은 `'generic'`(v-fold/box-popup/parallel-fold와 동일하게 전용 문구 없음), `defaultParams`는 `{ sliderWidth: 30, sliderHeight: 15, trackLength: 80 }`이다(`registry.js:43-48`). `sliderWidth`/`sliderHeight`는 슬라이더 조각의 크기(mm), `trackLength`는 카드에 뚫는 슬롯의 길이(mm)다.

**주의: 이 메커니즘은 네 개 중 유일하게 3D 조립 포즈 미리보기가 없다.** `Preview3D.jsx`의 `SUPPORTED_3D = new Set(['v-fold', 'box-popup', 'parallel-fold'])`(`Preview3D.jsx:17`)에 `'pull-tab'`이 빠져 있어, pull-tab을 선택하면 항상 "이 메커니즘은 아직 3D 미리보기를 준비 중이에요!" 플레이스홀더만 표시된다(`Preview3D.jsx:157-165`). 또한 다른 세 메커니즘과 달리 **실제 자르기/접기 기하 버그를 고친 전용 커밋이 존재하지 않는다** — 아래 "이전 작업" 절 참고.

## 작동 방식

`src/generators/pullTab.js` 상단 공식(`pullTab.js:6-8`): `travel = trackLength - sliderLength - 2·buffer`, `slotWidth = paperThickness + clearance (0.5~1.0mm)`.

- `validatePullTabParams(params)`(`pullTab.js:64-78`)가 입력을 clamp한다: `sliderWidth` 8~60mm, `sliderHeight` 5~40mm, `trackLength` 20~`maxTrack`(=`card.width - 2·PRINT.MARGIN - 20`), `paperThickness` 기본 0.3mm, `clearance` 0.5~1.5mm(기본 0.8), `buffer` 1~5mm(기본 2).
- `generatePullTab(rawParams)`(`pullTab.js:95-243`)이 4개의 독립된 조각을 계산한다:
  1. **트랙 슬롯(track slot)** — 카드에 뚫는 좁은 직사각형 구멍. `slotWidth = round(paperThickness + clearance, 1)`(`pullTab.js:106`), `sliderLength = sliderWidth`(슬라이더는 자신의 폭 방향으로 이동, `107`), `travel = round(trackLength - sliderLength - 2·buffer, 1)`(`108`). 트랙 중심은 기본적으로 카드 상단 절반(척추 위쪽)에 위치: `trackCenterY = spineY - CARD_SIZES[...].height/4`(`114`). `trackLeft/Right/Top/Bot`으로 사각형 네 변을 계산해 CUT으로 그린다(`121-128`).
  2. **안내 띠(guide strips)** — 카드 뒷면에 붙이는 폭 4mm짜리 별도 조각 두 개. **부품 절단선은 아래 절반 여백(척추 바로 아래)에 그려지고, 카드 면 슬롯 위아래에는 SCORE 자리 표시만 인쇄된다** — 과거에는 부품 CUT 사각형이 카드 앞면 위에 그려져 지시대로 자르면 카드에 구멍 2개가 나는 버그였다(2026-07 수정). 트랙보다 살짝 길게(`trackLength + 6`) 잘라 슬롯 양옆을 감싸며, 가운데에 접는 선(폴드) 하나씩을 그어(`153-159`) "슬라이더를 덮듯이 접어 넣는" 형태로 설계돼 있다. 주석(`130-131`)에 따르면 이 띠는 "슬라이더를 정렬 상태로 유지하기 위해 카드 뒷면에 접착하는" 용도다.
  3. **슬라이더 조각(slider piece)** — 카드 인쇄 영역 아래 여백(`sliderAreaX = PRINT.MARGIN+10`, `sliderAreaY = spineY + card.height/2 + 15`)에 배치되는 별도 몸체. 몸체(사각형, `171-176`)에 손잡이 탭(폭 8mm, 사다리꼴로 바깥쪽이 넓어지는 모양, `179-186`)이 이어 붙고, 몸체-손잡이 경계에 산접기(MOUNTAIN_FOLD) 선 하나 — 손잡이는 앞으로(관찰자 쪽으로) 접어 세우는 탭이므로 다른 생성기의 전방 접기 탭과 같은 산접기다(과거 골접기 표기는 2026-07 수정).
  4. **멈춤 탭(stops)** — 슬라이더 좌우 끝 위아래에 작은 돌기 4개(폭 3mm, 높이 1.5mm, `196-220`) — 안내 띠에 걸려 슬라이더가 슬롯 밖으로 완전히 빠지지 않게 하는 역할로 추정된다(주석에 명시적 서술은 없음).
  - 각 조각의 위치/치수를 설명하는 마커 텍스트(슬롯 크기, 이동 거리, 슬라이더 크기, 손잡이)도 함께 생성(`223-229`).
- `renderPullTab(params)`(`pullTab.js:250-278`)이 `createTemplate()`으로 인쇄 페이지를 만들고, `track-slot`/`guides`/`slider-piece`/`stops` 네 개의 별도 `<g>` 그룹으로 나눠 각각의 스타일(CUT/MOUNTAIN_FOLD/VALLEY_FOLD)로 그린다(`256-275`) — 이 네 그룹 분리는 이 조각들이 **물리적으로 서로 다른 잘라낼 부분**(카드 자체의 트랙 구멍 vs. 별도로 오려서 조립하는 슬라이더/가이드 조각들)이라는 것을 반영한다.

**2D 도안 이외의 재사용은 없다** — 다른 세 메커니즘과 달리 `Preview3D.jsx`가 pull-tab 파라미터(`sliderWidth`/`sliderHeight`/`trackLength`)를 전혀 재해석하지 않는다(3D 프리뷰 자체가 없으므로).

## 활용

- `registry.js`: `'pull-tab'` 엔트리가 `render: (params) => renderPullTab(params)`(`registry.js:43-48`).
- `SVGPreview.jsx`: 다른 메커니즘과 동일한 경로로 `mech.render(params)` 결과를 1페이지에 그린다(`SVGPreview.jsx:44-53`). `instructionStyle: 'generic'`이므로 PDF 설명서도 공용 3단계 문구.
- `Preview3D.jsx`: **연결되어 있지 않다.** `SUPPORTED_3D`에 `'pull-tab'`이 없어 항상 플레이스홀더만 표시된다(`Preview3D.jsx:17`, `157-165`).
- `Instructions.jsx`: `'generic'` 케이스 공유(`Instructions.jsx:870-920`), pull-tab 전용 삽화 없음 — 슬롯/슬라이더/안내띠/멈춤탭처럼 부품이 4종류나 되는 비교적 복잡한 메커니즘임에도 조립 설명은 v-fold/box-popup과 똑같은 "오리기 → 접기 → 풀칠" 3단계 범용 문구뿐이다. 예를 들어 안내 띠를 "양 끝만 붙이고 가운데는 붙이지 않는다"는 식의 다른 메커니즘(`rising-slide`, `auto-slide-window`, `slide-to-swing`)에 존재하는 안전장치 관련 경고 문구가 pull-tab에는 전혀 없다.

## 이전 작업에서 배운 교훈

pull-tab의 히스토리는 다른 세 메커니즘과 뚜렷하게 다르다.

- **`2294c26`("Enhance UX with input fields, fix image prompts, and support pull-tab")**: 커밋 시점의 `SVGPreview.jsx` diff를 보면 pull-tab 지원은 실제로는 `addRect`/`addText` 몇 줄로 이뤄진 **자리표시자**였다. 코드 주석 자체가 이를 인정한다: `// Basic pull tab placeholder since full generator isn't linked`. 즉 이 시점에는 트랙/슬라이더/안내띠/멈춤탭을 계산하는 진짜 로직이 UI에 연결돼 있지 않았다.
- 그런데 파일 히스토리(`git log --follow -- src/generators/pullTab.js`)를 확인하면 `pullTab.js` 자체는 **초기 커밋 `52ebea7`에서 이미 278줄짜리 완성된 모듈로 존재**했고, 그 이후 지금까지 **단 한 번도 다시 수정된 적이 없다**(오직 최초 추가뿐). 즉 이 파일의 실제 기하 계산 로직은 프로젝트 시작 시점에 통째로 작성된 뒤 검증도, 버그 수정도 거친 적이 없다.
- **`6defbad`("Fix broken parallel-fold/pull-tab, add mechanism registry, vector PDF export")**: `pullTab.js`가 이미 사용하고 있던 `createTemplate()`(`svgBuilder.js`)과 `getLineStyles()`(`constants.js`)가 그 시점까지 코드베이스에 존재하지 않아, 이 생성기를 호출하면 즉시 런타임 에러가 났다 — 그래서 `SVGPreview.jsx`는 대신 조용히 자리표시자만 그리고 있었다. 이 커밋은 그 누락된 헬퍼들을 추가하고 `registry.js`로 배선을 새로 해서 `renderPullTab()`이 처음으로 실제 실행되게 만들었다.
- **이후 pull-tab 전용 기하(cut/fold) 버그 수정 커밋이 없다.** box-popup(`be0a85b`)과 parallel-fold(`b1367c1`)는 실행 가능해진 뒤 실제 자르기/접기 로직에 있던 버그(CUT과 FOLD가 같은 좌표에 중복 등록되는 버그)가 발견되어 고쳐졌지만, pull-tab은 실행 가능해진 이후 지금까지 **누구도 실제 기하 검증을 거친 기록이 없다.** 코드 안에도 이 사실을 뒷받침하는 정황이 있다: 안내 띠(guide strips)와 멈춤 탭(stops)의 역할을 설명하는 주석(`130-131`, `195`)이 "~하는 용도로 추정" 수준으로 약하게 서술돼 있고, 트랙 슬롯의 CUT 사각형(`121-128`)이 카드 자체에 뚫리는 구멍임에도 이 구멍이 카드의 트림/척추 라인과 겹치지 않는지, 안내 띠가 실제로 슬라이더의 멈춤 탭에 걸리는 위치에 오는지(`guideTopY = trackTop - guideWidth - 1`, `guideBotY = trackBot + 1`, 멈춤 탭은 슬라이더 쪽 좌표계 `sliderAreaY` 기준이라 트랙 좌표계와 별개) 등이 실측/실물 검증된 적이 없다.

## 앞으로 작업 시 주의사항

- **pull-tab을 수정하거나 파라미터 범위를 넓히기 전에, box-popup/parallel-fold가 겪었던 "CUT과 FOLD가 동일 좌표에 중복 등록"되는 버그 패턴이 여기에도 있는지 처음으로 점검한다.** 이 메커니즘은 그 검증을 아직 한 번도 받은 적이 없다.
- **트랙 슬롯(카드에 뚫는 구멍)과 슬라이더/안내띠/멈춤탭(별도로 오리는 조각들)의 좌표계가 서로 다르다는 점에 주의한다.** 트랙은 `trackCenterX/Y`(카드 중심 기준) 좌표계, 슬라이더는 `sliderAreaX/Y`(카드 아래 여백) 좌표계를 쓴다 — 새 기능(예: 안내 띠가 실제로 멈춤 탭 위치와 정렬되는지 확인하는 로직)을 추가할 때 두 좌표계를 혼동하지 않는다.
- **`SUPPORTED_3D`에 `'pull-tab'`을 추가하는 작업을 하게 된다면**, v-fold/box-popup/parallel-fold와 달리 pull-tab은 "카드 열림 각도 α"로 표현되는 접기 포즈가 아니라 "슬라이더의 수평 이동 거리(0~`travel`)"라는 **전혀 다른 자유도**를 가진 메커니즘이라는 점을 먼저 설계해야 한다 — 기존 3D 코드의 `rotate3d` 접기 공식을 그대로 재사용할 수 없고, `translateX` 계열의 새로운 포즈 파라미터화가 필요하다.
- **안내 띠가 "양 끝만 붙이고 가운데는 띄운다"는 식의 안전장치 설계 의도가 있는지 코드만으로는 확실치 않다** — `rising-slide`/`auto-slide-window`/`slide-to-swing` 같은 다른 슬라이더형 메커니즘은 `INSTRUCTION_TEXT`에 "가운데는 붙이지 마세요, 양 끝만 붙이세요" 같은 명시적 경고가 있는데(`registry.js`의 `'rising-slide'` 등 항목 참고), pull-tab은 `instructionStyle: 'generic'`이라 이런 조립 안전 수칙이 사용자에게 전혀 전달되지 않는다. 실물로 조립해 보고 안내 띠 접착 방식이 실제로 중요한 제약이라면, pull-tab 전용 `instructionStyle`을 새로 만들어 `registry.js`의 `INSTRUCTION_TEXT`와 `Instructions.jsx`의 `switch` 양쪽에 추가해야 한다(둘 다 손으로 동기화해야 하는 구조이므로 하나만 고치면 드리프트가 생긴다 — `Instructions.jsx` 파일 상단 CLAUDE.md 설명 참고).
- **파라미터 검증(clamp) 범위가 서로 상호작용하는지 실측 확인이 필요하다**: 예를 들어 `sliderWidth`를 최대값(60mm)으로, `trackLength`를 최소값(20mm) 근처로 설정하면 `travel = trackLength - sliderLength - 2·buffer`가 음수가 될 수 있는데, 이 값이 음수일 때 트랙/슬라이더 기하가 어떻게 깨지는지(또는 안전하게 처리되는지) 코드상 명시적 가드가 없다.
