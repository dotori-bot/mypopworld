# 층층이 무대 (layered-stage)

## 개요

사용자가 보는 효과는 "카드를 약 120° 열면 벽(성벽·건물 실루엣) 여러 장이 서로 다른 깊이에서 층층이 솟아오르는" 다층 극장식 팝업이다. 성벽 뒤로 안쪽 탑이 우뚝 솟은 장면을 떠올리면 된다. `registry.js`의 `labelKo`는 `'층층이 무대 (성·마을이 겹겹이 솟는 팝업)'`, `instructionStyle`은 `'layered-stage'`, `defaultParams`는 `{ layers: 3 }`이다. `layers`는 벽 개수 N(2~4). 이 메커니즘은 **`decorationSlots(params)`를 정의하는 몇 안 되는 메커니즘 중 하나**로, 벽마다 별도 장식 슬롯을 만든다(아래 "활용" 참고). 구조적으로는 `boxPopup.js`의 단일 상자 라이저를 N개로 일반화하고, 누적 깊이 관리는 `parallelFold.js`의 계단식에서 가져왔다.

## 작동 방식

### 층별 단위 (box-riser, d_i = h_i)

각 층 i는 카드에 near(가까운 쪽) crease로 붙고 far(먼 쪽) + 양옆이 잘려 자유로운 서 있는 벽이다. box-popup의 평면 접힘 규칙을 층마다 적용한다:

```
d_i = h_i            (평면 접힘, 층별)
```

`d_i`는 카드 면 위 깊이 footprint, `h_i`는 벽 높이. `d_i = h_i`이면 카드를 닫을 때 벽이 자기 깊이 밴드 `[a_{i-1}, a_i]` 안으로 정확히 납작하게 접혀 far 가장자리가 near crease에 딱 내려앉고 이웃 밴드를 침범하지 않는다. **near crease = 산접기(MOUNTAIN, 뷰어 쪽으로 팝업)**, **far crease = 골접기(VALLEY, 벽 상단이 접혀 내려감)**. 모든 산접기가 같은 층 안에서 골접기와 짝을 이루므로 각 층이 독립적으로 평면화된다.

### 중첩 / 누적 깊이

```
a_0 = 0,   a_i = a_{i-1} + d_i = Σ_{j≤i} d_j      (누적 깊이)
```

층 i의 near crease가 `a_{i-1}`, far crease가 `a_i`. 1층의 near crease는 척추 그 자체다. 깊이는 바깥으로 갈수록 비감소(`d_1 ≤ … ≤ d_N`)라 깊을수록 뒤·높음(성 안쪽 탑), 폭은 비증가(`w_1 ≥ … ≥ w_N`)라 앞 벽이 뒤 벽 실루엣을 가리지 않는다.

### 하드 제약: 닫으면 아무것도 카드 밖으로 안 나감 (증명된 포획 경계)

닫으면 각 층 벽이 자기 밴드 `[a_{i-1}, a_i]`로 접히고, 이 밴드들은 척추에서 바깥으로 `[0, a_N]`을 빈틈없이 타일링한다. 가장 깊은 배경 층 N이 가장 멀리 뻗으므로 카드 바깥 절단선을 넘을 위험은 N층이 대표한다. 모든 층이 만족해야 하는 부등식:

```
a_i = Σ_{j≤i} d_j ≤ S_max        (i=N에서 구속)
S_max = CARD_SIZES[paper].height / 2 − PRINT.MARGIN
```

`d_j > 0`이라 `a_i`가 순증가 → `a_N ≤ S_max`이면 전부 만족(**증명된 포획 경계**). 코드(`resolveLayeredStageGeometry`, `layeredStage.js:171`)는 누적합에 대해 클램프한다:

- `sMax = card.height/2 − PRINT.MARGIN`, `budget = DEPTH_SAFETY(0.92)·sMax` (`layeredStage.js:175`)
- 층마다 `avail = budget − acc`; `avail < DEPTH_MIN(8)`이면 **남은 층을 버린다**(`layeredStage.js:197`) → 과대/쓰레기 입력은 벽이 지면 밖으로 나가는 대신 층 수가 줄거나 짧아짐.
- `depth = clamp(spec.depth, DEPTH_MIN, avail)`, `width = clamp(spec.width, WIDTH_MIN(30), maxWidth)`.
- `maxWidth = card.width − 2·MARGIN − 2·TAB_W` (`layeredStage.js:177`).

기본 깊이 표(오름차순, `DEFAULT_DEPTHS`, `layeredStage.js:116`): N=2 `[22,30]`(Σ52), N=3 `[14,19,24]`(Σ57), N=4 `[10,13,16,19]`(Σ58). 모두 Letter budget 59.66mm 미만이라 Letter 가장자리를 ≥1.6mm 여유로 통과(A4는 ≥5.7mm). 기본 폭은 `WIDTH_FRONT(100)`에서 `WIDTH_STEP(16)`씩 감소.

### 도면 배치와 접기선

`generateLayeredStage` (`layeredStage.js:284`): parallelFold처럼 척추 위/아래로 미러링해 각 층이 상·하 반쪽을 그린다. 가장 깊은 층부터 그려(`ordered`, `layeredStage.js:310`) 앞 벽이 위에 겹치게 한다. 층/면(sign −1 위, +1 아래)마다:

- **자르기**(CUT): 양옆 세로 2줄 + far 가로 1줄. near 가로는 붙어 있어야 하므로 자르지 않음 (`layeredStage.js:324-326`).
- **접기**: near = 산접기, far = 골접기 (`layeredStage.js:329-330`).
- **풀칠 탭**: 좌우 사다리꼴이 x 바깥으로 접혀 카드 바닥에 붙음, 폭 `TAB_W(6)`mm(5mm 그립 바닥 위). 탭은 x로만 뻗고 깊이 s로는 안 뻗어(`layeredStage.js:333-346`), 밴드가 disjoint하므로 뒤 층 탭이 앞 층 벽과 충돌 불가.
- 건물 파사드(문·창·박공)는 SCORE 안내선일 뿐 절단선·crease를 건드리지 않아 접힘에 무영향 (`drawFacade`, `layeredStage.js:237`).

## 활용

- **decorationSlots (이 메커니즘의 특징)** — `registry.js:93`. `resolveLayeredStageGeometry(params)`로 **렌더링과 동일한 기하**를 구해 `geo.layers.map(...)`으로 벽마다 슬롯 하나씩 만든다:
  - `label`: `` `${index}번 벽 그림 (...)` `` — 1번은 "제일 바깥쪽/제일 작은 벽", `count`번은 "제일 안쪽/제일 큰 벽", 나머지 "중간 벽".
  - `width = layer.width * 0.75`, `height = layer.height * 1.5`(장식이 벽 footprint 깊이가 아니라 기립 **높이**를 넉넉히 덮게 1.5배).
  - 렌더러와 같은 `resolveLayeredStageGeometry`를 공유하므로 장식 이미지 제안 크기가 실제 인쇄된 벽과 항상 일치한다. (커밋 `a93a7a0`의 직접 결과.)
- **SVGPreview.jsx**: `getDecorationSlots`(`registry.js:279`)가 위 슬롯 배열을 반환 → 도안 1페이지 + **벽 개수만큼 장식 페이지**(각 슬롯당 1장, ai-image·freehand 모드 모두). `cardParams.decorationVariants?.[i]`가 있으면 벽별로 다른 테마(예: 노아의 방주 카드의 서로 다른 동물)를 프롬프트에 쓰고, 없으면 슬롯 `label`을 붙여 페이지가 최소한 구별되게 한다(`SVGPreview.jsx:94-96`). 슬롯이 없는 다른 메커니즘은 단일 100×100mm 슬롯으로 폴백해 무회귀.
- **Preview3D.jsx / bookScenes.jsx**: 지원됨(`BOOK_3D`에 포함, `bookScenes.jsx`의 `mechanism === 'layered-stage'` 분기). 층마다 좌/우 페이지에 벽 플랩 하나씩: 힌지는 자기 near 접기선(척추와 평행, `right/left: near·PX` + `transform-origin`이 척추 쪽 모서리), 회전은 **단순 `rotateY(±γ)`, γ = α/2** — box-popup 주석 블록이 "척추와 평행한 부착 모서리를 가진 직사각형의 이상적 운동"으로 서술한 바로 그 회전이다. v-fold의 복합 `rotate3d` 조합을 여기 쓰면 안 된다(아래 교훈 참고). `Instructions.jsx`의 `case 'layered-stage'` 첫 패널의 아이소메트릭 정적 일러스트도 병행 제공.
- 조립 안내는 `INSTRUCTION_TEXT['layered-stage']`(PDF)와 `Instructions.jsx`의 `case 'layered-stage'`(화면, 7단계 일러스트)에 손으로 동기화.

## 이전 작업에서 배운 교훈

- **커밋 `673649d`** ("... with proven containment bound"): 도입부터 "가장 깊은 층의 누적 깊이가 `card.height/2 − PRINT.MARGIN`을 절대 넘지 않는다"는 증명된 경계로 설계됐다. 밴드가 순증가·disjoint 타일링이라 `a_N ≤ S_max` 하나로 전체 포획이 보장된다. 과대/쓰레기 입력은 벽이 카드 밖으로 삐져나오는 대신 층이 줄거나 짧아진다(누적합에 대한 클램프, `avail < DEPTH_MIN`이면 중단).
- **커밋 `a93a7a0`** ("multi-slot decoration architecture; overhaul instructions"): 실제 배포에서 나온 피드백 3가지 — (1) 조립 안내가 너무 추상적이었고, (2) 벽이 여러 장인데 장식 이미지는 **딱 1장만** 생성됐으며, (3) 평면 도안에서 완성 3D를 상상할 수 없었다. 해결로 `decorationSlots(params)`를 도입해 벽당 슬롯을 만들고(`getDecorationSlots`는 무회귀 폴백), SVGPreview가 슬롯당 페이지를 생성하며, chat이 `decorationVariants`로 벽별 테마를 공급하고, Instructions에 아이소메트릭 완성도 + 뒤→앞 조립 순서 다이어그램을 추가했다.
- **조립 순서(뒤→앞)가 물리적으로 필수**: 앞 벽을 먼저 붙이면 그 뒤에 가려 손이 뒤 벽에 닿지 않는다. 순서를 뒤집으면 닫을 때 뒤 벽이 접힌 자리를 벗어나 카드 밖으로 나온다. `INSTRUCTION_TEXT`의 4단계(가장 중요)와 `Instructions.jsx`의 순서 다이어그램이 이 실패를 막는다.
- **탭은 x로만, 깊이로 안 뻗음**: 뒤 층 탭이 앞 층 벽과 밴드가 겹치지 않게 한 설계 결정. 탭이 깊이 방향으로 번지면 이 불변식이 깨진다.
- **3D 프리뷰 90° 뒤틀림 버그**: 최초 3D 장면은 box-popup처럼 v-fold의 `rotate3d(−sin γ, 0, ∓cos γ, γ)` 조합을 재사용했는데, 이 축은 "능선이 척추를 따라 세로로 뻗고 능선 끝이 대칭면에 착지하는" v-fold 팔을 위해 유도된 것이다. 척추와 평행한 near 접기선에 힌지된 이 벽에 적용하면 γ=90°(α=180°)에서 벽의 긴 변(w, 척추 방향이어야 함)이 시청자 축으로 넘어가 벽이 "누운 플랫폼"처럼, 도안과 90° 뒤틀려 보였다. 수정: 힌지 모서리(척추 쪽)에 대한 단순 `rotateY(±γ)`. 척추와 평행한 접기선을 가진 플랩은 페이지의 rotateY 축과 힌지가 평행하므로 복합 축이 필요 없다 — box-popup 3D의 rotate3d는 "잘 보이게 하기 위한" 의도적 양식화이므로 그대로 베끼면 안 된다.

## 앞으로 작업 시 주의사항

- **`decorationSlots`는 반드시 `resolveLayeredStageGeometry`를 재사용**하라. 슬롯 크기를 독자적으로 계산하면 장식 페이지와 실제 인쇄 벽이 어긋난다(커밋 `a93a7a0`가 고친 바로 그 종류의 드리프트). 렌더러 기하가 바뀌면 슬롯도 자동으로 따라오게 유지할 것.
- 층별 깊이 제어를 손대면 **`d_i = h_i` 불변식**을 깨지 마라. 이게 깨지면 벽이 자기 밴드로 납작하게 접히지 않아 평면 접힘이 무너진다.
- 클램프는 개별 깊이가 아니라 **누적합 `acc`**에 대해 걸린다(`avail = budget − acc`). 새 로직을 넣을 때 이 누적 예산 감산을 유지해야 `a_N ≤ S_max` 포획 경계가 보장된다.
- `S_max`·`maxWidth`는 **Letter가 A4보다 빡빡**하다(카드 높이 139.7 vs 148.5). 기본값은 Letter 기준으로 통과하도록 잡혀 있으니 기본 깊이/폭 표를 바꾸면 Letter budget 59.66mm와 폭 상한을 다시 확인하라 — "A4만 맞는" 값은 미완성이다.
- 조립 안내가 `registry.js`(PDF 텍스트)와 `Instructions.jsx`(화면 7단계 일러스트) 두 곳에 손으로 동기화되어 있다. 특히 후자는 아이소메트릭 완성도·순서 다이어그램 등 SVG가 많아 드리프트 위험이 크다. 한쪽만 고치지 말 것.
- 3D 장면(`bookScenes.jsx`)을 손댈 때 벽 플랩의 회전은 반드시 힌지 모서리에 대한 단순 `rotateY(±γ)`를 유지할 것. v-fold/box-popup 분기의 `rotate3d` 조합을 "검증된 방식"이라며 가져오면 벽이 도안과 90° 뒤틀려 보이는 회귀가 된다(위 교훈 참고).
