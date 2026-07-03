# 병풍 팝업 (accordion)

## 개요

카드를 열면 척추(중앙 접는 선) 위로 지그재그로 접힌 종이띠가 병풍처럼 서는 메커니즘이다. `registry.js:55-60`의 등록 내용은 다음과 같다.

- `labelKo: '병풍 팝업 (지그재그 무대)'`
- `render: (params) => renderAccordion(params)`
- `defaultParams: { a: 40, panels: 6, wallHeight: 60 }`
- `instructionStyle: 'accordion'`

`a`는 척추에서 띠의 양 끝(카드 양면에 풀칠되는 지점)까지의 거리, `panels`는 지그재그 주름 칸(패널) 개수 `M`, `wallHeight`는 병풍이 섰을 때 척추와 나란한 방향의 폭(스크린 높이)이다. 이 세 값은 `resolveAccordionGeometry()`가 종이 크기(A4/Letter)의 인쇄 가능 영역에 맞춰 항상 클램핑한다 — straw-rocket과 달리 사용자가 넘긴 값을 그대로 쓰지 않는다.

## 작동 방식

기하 공식은 `accordionPopup.js:9-16`의 파일 헤더 주석에 정리되어 있다(카드 열림각 α, 0=닫힘, 180=평평하게 열림):

- 앵커 간 거리(현): `D(α) = 2·a·sin(α/2)`
- 서 있는 반각: `cos ρ(α) = D(α) / L = 2·a·sin(α/2) / (M·w)`
- 주름 1칸당 튀어나오는 높이: `H(α) = w·sin ρ(α)`

**타지 않게 하는 안전 여유(design rule, `accordionPopup.js:14-17`)**: 띠가 카드보다 먼저 팽팽해지면(taut) 카드를 마저 열 때 풀칠된 끝단이 뜯어진다. `D(180°) = 2a`이므로 `L > 2a`가 항상 성립해야 하며, `D(90°)/L ≈ 0.65` 목표에서 `L ≈ 2.18a`가 나오고 여기에 안전 여유를 얹어 `L = 2.2·a`(`ACCORDION_LIMITS.SAFETY = 2.2`, `accordionPopup.js:53`)를 쓴다. 패널 폭은 `w = L / M`.

`resolveAccordionGeometry(opts)` (`accordionPopup.js:72-105`)가 실제 클램핑을 수행한다.

1. `panels`(=M)를 `[PANELS_MIN=3, PANELS_MAX=10]`으로 클램프(`accordionPopup.js:76`).
2. `wallHeight`는 하드 캡(`WALL_MAX=70`)과, 카드 폭에서 인쇄 마진을 뺀 값(`card.width - 2*PRINT.MARGIN`) 중 작은 쪽으로 다시 캡한 뒤 `[WALL_MIN=20, ...]`으로 클램프(`accordionPopup.js:78-81`) — 병풍의 폭이 카드 인쇄 영역을 벗어나지 않도록 보장.
3. `a`는 하드 캡(`A_MAX=45`)과, 척추에서 카드 면 가장자리까지의 인쇄 가능 거리(`halfFace = card.height/2 - PRINT.MARGIN`)로부터 역산한 `aFit = 2*(halfFace - tabDepth) / SAFETY`(`accordionPopup.js:86-90`) 중 작은 쪽으로 캡한 뒤 클램프. 즉 `(SAFETY·a)/2 + tabDepth ≤ halfFace`가 항상 성립하도록 만들어, 접힌 띠의 절반 + 풀칠 탭 깊이가 카드 한쪽 면 안에 들어가게 한다.
4. `L = SAFETY · a`, `w = L / panels`.

`generateAccordion()`(`accordionPopup.js:125-182`)이 실제 도형을 그린다. 척추는 `createTemplate()`이 그리는 수평선(`svgBuilder.js:106-107`, `spineY = paper.height/2`)이므로, 띠의 긴 축은 **척추와 수직**(세로 방향)으로 눕고, `wallHeight`(가로)는 척추와 **나란한** 방향이다.

- `xL/xR = cx ∓ hWall/2`, `yTop/yBot = cy ∓ totalLength/2` (`accordionPopup.js:149-152`) — 띠 전체를 감싸는 사각형 좌표.
- `pleatTop = yTop + tabDepth`, `pleatBot = yBot - tabDepth` (153-154) — 양 끝 풀칠 패널과 지그재그 주름의 경계.
- 바깥 CUT 윤곽 사각형 1개(157), 양 끝 `tabDepth`(=10mm) 깊이의 GLUE_TAB 사각형 2개(161-162).
- 끝단 접는 선은 **둘 다 VALLEY_FOLD**(165-166) — 양 끝 풀칠 패널이 각각 자기 쪽 카드 면으로 접혀 눕도록 하는 방향.
- 내부 주름 접는 선은 `i=1..M-1`에 대해 홀수는 MOUNTAIN, 짝수는 VALLEY로 번갈아(169-173) 진짜 아코디언(병풍) 접기를 만든다.

파일 헤더 24-28번째 줄에 남아 있는 주석: 이전 사양 문구는 "척추에 수직인 접는 선"이라고 표현했지만, `D(α)=2a·sin(α/2)` 현 공식이 성립하려면 **띠의 긴 축**은 척추에 수직이고, **주름 접는 선 자체**는 척추와 평행해야 평평하게 접힌다(flat-foldable) — 실제 구현은 물리(평행 주름선)를 따랐다. 카드 자체의 척추 접기와 같은 방향으로 접히므로 카드를 닫으면 병풍도 납작하게 접혀 들어간다.

## 활용

- `SVGPreview.jsx`가 `getMechanism('accordion').render(params)` → `renderAccordion()`을 호출해 도안 1페이지를 만든다. `renderAccordion()`(`accordionPopup.js:194-205`)은 `createTemplate()`으로 척추 위치(`spineY`)를 얻어 `cx=paper.width/2, cy=spineY`를 넘긴다.
- `decorationSlots`를 별도로 정의하지 않으므로 `getDecorationSlots()`(`registry.js:279-287`)의 기본 단일 100×100mm 슬롯을 그대로 쓴다.
- PDF export 시 `INSTRUCTION_TEXT.accordion`(`registry.js:146-155`)이 조립 설명서 텍스트로 포함된다.
- **3D 프리뷰: 미지원.** `Preview3D.jsx:17`의 `SUPPORTED_3D`에 `'accordion'`이 없어 플레이스홀더만 표시된다. 참고로 만약 나중에 지원한다면, `ρ(α)`가 `α`에 대해 선형이 아니므로(`cos ρ(α) = 2a·sin(α/2)/(Mw)`) parallel-fold/box-popup이 쓰는 `gamma = alpha/2` 단순 근사(`Preview3D.jsx:227`)를 그대로 가져다 쓸 수 없고, 위 공식대로 `arccos`를 계산해야 한다.

## 이전 작업에서 배운 교훈

- 커밋 `91587d0`("Add accordion (병풍 팝업) and volvelle (돌림판) mechanisms")의 커밋 메시지 자체가 설계 의도를 명시한다: "accordion: chord/standing-height trig with a flat-foldability safety margin so the pleated strip never goes taut before the card is fully open." 즉 `SAFETY=2.2` 상수는 우연히 정한 값이 아니라, "카드가 다 열리기 전에 띠가 먼저 팽팽해져 풀칠 부위가 뜯어지는" 실패를 구조적으로 막기 위해 역산된 값이다.
- 코드 자체에 "이전 사양 문구와 실제 구현이 다르다"는 것을 명시한 주석이 남아 있다(`accordionPopup.js:24-28`, "NOTE on the prior spec wording"). 이는 실제로 겪은 혼선(접는 선 방향을 스펙 문구 그대로 "수직"으로 잘못 해석할 뻔했던 것)을 코드 안에 기록해 재발을 막은 사례다 — 앞으로 이 파일을 수정할 사람은 반드시 이 주석을 먼저 읽고, "평행 주름선 + 수직인 띠의 긴 축"이라는 실제 물리를 기준으로 판단해야 한다.
- `INSTRUCTION_TEXT.accordion.steps[2]`(`registry.js:152`)의 "가운데는 붙이지 말고 그대로 두어야 병풍이 서요!"는 이 메커니즘의 핵심 불변 조건이다 — 중간 주름 부분이 카드 면에 붙으면 병풍이 전혀 서지 못한다. 코드에서도 GLUE_TAB은 양 끝 `tabDepth` 영역에만 그려지고(161-162) 중간 주름에는 절대 그려지지 않는다.

## 앞으로 작업 시 주의사항

- `a`, `panels`, `wallHeight`를 직접 조작하는 코드를 추가할 때는 반드시 `resolveAccordionGeometry()`를 거치게 하라 — 클램프를 우회하면 `L > 2a` 안전 조건이나 인쇄 영역 안착 조건이 깨질 수 있다.
- `ACCORDION_LIMITS.SAFETY(=2.2)`를 바꾸려면, 클램프된 `a`의 전체 범위(`[A_MIN, A_MAX]` 및 `aFit`으로 캡된 실제 상한)에 대해 `D(180°)=2a < L=SAFETY·a`가 항상 성립하는지(즉 `SAFETY > 2`) 다시 확인해야 한다. 값이 2 이하로 내려가면 카드를 완전히 열기 전에 띠가 뜯어질 수 있다.
- "가운데(주름) 영역은 절대 붙이지 않는다"는 불변 조건은 코드(GLUE_TAB 위치)와 안내문(`INSTRUCTION_TEXT.accordion`) 양쪽에 이중으로 표현되어 있다 — 한쪽만 고치면 어긋난다. 예를 들어 GLUE_TAB 영역을 넓히는 식으로 코드를 바꾸면 안내문의 "가운데는 붙이지 말고"라는 문구도 그에 맞춰 재검토해야 한다.
- `wallHeight`(척추와 나란함, 좌우 폭)와 `a`(척추에 수직, 세로 거리)를 헷갈리지 말 것 — 이름만 보면 둘 다 "높이/폭" 계열로 혼동하기 쉽지만, 코드에서 `xL/xR`은 `wallHeight`로, `yTop/yBot`은 `totalLength(=L+2·tabDepth, a에서 파생)`로 계산된다(`accordionPopup.js:149-152`).
- `Instructions.jsx`의 `case 'accordion'` 일러스트(대략 93~141번째 줄)는 `INSTRUCTION_TEXT.accordion.steps`(`registry.js:150-153`)와 손으로 맞춰져 있다 — 한쪽 문구나 단계 수를 바꾸면 반드시 다른 쪽도 확인할 것.
