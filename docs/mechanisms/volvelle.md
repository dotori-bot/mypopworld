# 돌림판 (volvelle)

## 개요

사용자가 보는 효과는 "창문 속 그림이 손잡이를 밀 때마다 바뀌는 회전 원판"이다. 카드형 팝업이 아니라 브래드(핀) 없이 종이만으로 조립하는 4장짜리 원판 샌드위치다. `registry.js`의 `labelKo`는 `'돌림판 (돌리면 그림이 바뀌는 창문)'`, `instructionStyle`은 `'volvelle'`(→ `INSTRUCTION_TEXT.volvelle` 및 `Instructions.jsx`의 `case 'volvelle'`), `defaultParams`는 `{ R: 40, sectors: 6 }`이다. 즉 기본으로 반지름 40mm 원판에 6개의 그림 섹터를 만든다. 접기(fold)가 전혀 없는 유일한 계열의 메커니즘이라 산/골 짝맞춤 검증이 필요 없고, 대신 "테두리만 붙이고 돌림판은 절대 붙이지 않는" 포획(capture) 구조가 핵심이다.

## 작동 방식

부품은 4장이며 모두 `src/generators/volvelle.js`의 `generateVolvelle` (`volvelle.js:133`)에서 2×2 격자로 배치·그려진다.

1. **덮개(①)** — 바깥 반지름 `outerR = R + RIM(8)`. 창문(환형 섹터)과 아래쪽(180°) 손잡이 홈이 뚫린다.
2. **돌림판(②)** — 반지름 `R`. `sectors`개의 방사형 분할선과 섹터 번호가 들어간다.
3. **간격 링(③)** — 바깥 `outerR`, 안쪽 `innerR = R + CLEARANCE(1.0)`인 환형. 이 링의 안쪽 구멍(반지름 R+1mm)이 돌림판(반지름 R)을 헐겁게 물어 자유 회전시킨다.
4. **뒷판(④)** — 바깥 반지름 `outerR`인 원판.

조립: 뒷판 + 간격 링 + 덮개를 테두리(`glueRingR`)끼리 풀칠해 샌드위치로 만들고, 돌림판은 링 구멍 안에 **끼우기만** 한다. 돌림판은 브래드 구멍 없이 링 테두리에만 걸려 갇힌 채 돈다.

### 좌표·각도 수식

파라미터 해석/클램프는 `resolveVolvelleGeometry` (`volvelle.js:104`)에 있다.

- `R = clamp(opts.R ?? 40, R_MIN(20), R_MAX(40))`
- `sectors = clamp(round(opts.sectors ?? 6), 3, 10)`
- 섹터 각도 `σ = 360 / sectors` (`sigma`)
- 창문 각도 `θ_w = max(σ − 2·δ, 10)`, 가드 `δ = GUARD_DEG(6)` (`thetaW`) — 이웃 섹터가 창문으로 새지 않게 좌우 6°씩 여유를 둔다.
- `outerR = R + RIM(8)`, `innerR = R + CLEARANCE(1.0)`, `rOut = R − WINDOW_MARGIN(1.5)`

원과 섹터 경로는 `circlePath` (`volvelle.js:63`), `sectorPath` (`volvelle.js:75`)가 그린다. 각도→좌표는 `utils/math.js`의 `polarToCartesian(cx, cy, r, deg)`를 쓰며 **0°가 위쪽**, 시계 방향 양수 규약이다. 창문은 `sectorPath(..., -thetaW/2, thetaW/2)` (`volvelle.js:163`)로 상단 중앙에 뚫린다. 돌림판 분할선은 `for k in [0,sectors)`에서 `polarToCartesian(..., R, k·σ)` 끝점으로 그리되, **SCORE(자리 표시) 스타일**로 그린다 — 과거에는 CUT 실선이어서 지시대로 자르면 돌림판이 부채꼴 조각으로 해체되는 치명 버그였다(2026-07 수정). 돌림판은 회전을 위해 반드시 한 장짜리 원판으로 남아야 한다.

- 창문 바깥 반지름 `rOut = R − 1.5`이므로 돌림판이 최대 1mm 표류해도 창문 가장자리가 절대 드러나지 않는다.
- 손잡이 홈: 하단 180°에서 좌우 `notchHalf(15)`° 폭으로 `notchInner = R − 4`까지 파고들어 돌림판 rim(반지름 R < outerR)을 손끝에 노출시킨다 (`volvelle.js:168`).
- 풀칠 링 반지름 `glueRingR = (outerR + innerR)/2` (`volvelle.js:156`) — 간격 링과 뒷판의 초록 풀칠 테두리 위치.

### 인쇄 적합성(하드 캡)

`R ≤ 40mm`. Ø96(=2·(40+8)) 두 개를 나란히 놓으면 `2·96 = 192mm`로 A4 인쇄 가능 폭 200mm(210 − 2·5) 안에 들고, 2×2 격자는 A4/Letter 높이에 모두 맞는다. 격자 간격 `GRID_OFFSET(52)`가 `outerR`보다 커서 부품끼리 겹치지 않는다. 렌더는 `renderVolvelle` (`volvelle.js:218`)이 `createTemplate`로 페이지를 만든 뒤 `cx = paper.width/2, cy = spineY`에 배치한다.

### 평면 접힘

해당 없음. 돌림판에는 산/골 접기가 없어 짝맞춤할 것이 없다. 카드처럼 닫히지 않고, 포획은 오로지 테두리 풀칠 샌드위치로만 이뤄진다.

## 활용

- **SVGPreview.jsx**: `getMechanism('volvelle').render(params)`로 1페이지(도안)를 만든다. `decorationSlots`를 정의하지 않으므로 `getDecorationSlots`는 기본 단일 슬롯 `{ label: theme, width: 100, height: 100 }`으로 폴백한다(`registry.js:286`). 즉 장식 페이지는 1장만 생긴다.
- **registry.js**: `defaultParams`의 `R`, `sectors`가 그대로 `renderVolvelle`로 전달된다. PDF 조립 설명은 `INSTRUCTION_TEXT.volvelle`(`registry.js:156`)가, 화면용은 `Instructions.jsx`의 `case 'volvelle'`(`Instructions.jsx:143`)가 담당하며 **손으로 동기화**된다.
- **Preview3D.jsx**: 미지원. `SUPPORTED_3D = new Set(['v-fold','box-popup','parallel-fold'])`에 없어 "아직 3D 미리보기를 준비 중" 플레이스홀더가 뜬다. (앞으로의 과제: 3D 포즈보다 손잡이를 밀 때 섹터가 회전하는 2D 애니메이션이 이 메커니즘엔 더 잘 맞는다.)

## 이전 작업에서 배운 교훈

- **커밋 `91587d0`** ("Add accordion ... and volvelle"): 처음부터 "브래드(금속 핀) 없이 종이만으로 자유 회전 원판을 포획한다"는 목표로 설계됐다. 핀을 쓰지 않기 때문에 포획은 세 겹(뒷판+링+덮개) 테두리 풀칠 + 링 안쪽 구멍의 물림에 전적으로 의존한다. → 조립 시 **돌림판(②)에 풀이 한 방울이라도 닿으면 회전 불능**이 된다. `INSTRUCTION_TEXT.volvelle`의 3단계와 `Instructions.jsx`의 "풀칠 금지!" 표기가 이 실패를 막기 위한 것이다.
- **표류(drift) 대비 이중 안전장치**: `rOut = R − 1.5`(창문이 돌림판 가장자리보다 안쪽)와 `CLEARANCE = 1.0`(구멍이 돌림판보다 1mm 넓음)을 함께 두어, 헐거움으로 인한 최대 1mm 표류가 창문 가장자리를 절대 드러내지 않게 했다. 둘 중 하나만 바꾸면 이 부등식(`WINDOW_MARGIN > CLEARANCE`)이 깨질 수 있다.
- **너무 꽉/너무 헐거움의 경계**: `CLEARANCE`를 줄이면 안 돌고, 키우면 그림이 창문 안에서 비뚤어진다. `INSTRUCTION_TEXT.volvelle.tips`가 이 체감 문제를 직접 설명한다.

## 앞으로 작업 시 주의사항

- `R` 상한 40mm는 **A4 인쇄 폭에 2-up로 맞추기 위한 값**이다. 상한을 올리려면 `GRID_OFFSET`와 2×2 배치가 여전히 200mm 폭·A4/Letter 높이 안에 드는지 다시 계산할 것. 단순히 `R_MAX`만 올리면 부품이 지면 밖으로 나간다.
- `WINDOW_MARGIN > CLEARANCE` 불변식을 반드시 유지하라. `CLEARANCE`를 키우면 `WINDOW_MARGIN`도 그 이상으로 키워야 표류 시 창문이 안 드러난다.
- 손잡이 홈 `notchInner = R − 4`, `notchHalf = 15°`는 고정 상수다. `R`을 최소값(20)에 가깝게 만들 때 홈이 창문(`rOut`) 영역이나 섹터 번호 텍스트와 겹치지 않는지 확인하라 — 현재 코드는 이 충돌을 클램프하지 않는다.
- 조립 설명은 `registry.js`의 `INSTRUCTION_TEXT.volvelle`와 `Instructions.jsx`의 `case 'volvelle'` **두 곳에 중복**되어 손으로 맞춰져 있다. 한쪽만 고치면 PDF와 화면 안내가 어긋난다.
- 이 메커니즘의 안전성은 "회전 부품에 풀칠 금지"라는 조립 규칙에 걸려 있다. 도안을 바꿔 돌림판을 다른 부품과 물리적으로 더 가깝게 만들 경우, 풀이 번질 위험이 커지지 않는지 점검하라.
