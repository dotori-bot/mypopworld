# 반쪽 넘김판 (flip-disc)

## 개요

원 모양 그림을 세로 지름선으로 반씩 나눠, 왼쪽은 배경에 고정된 반원, 오른쪽은 책장처럼 한 장씩 넘기는 여러 장의 반원 "넘김판" 더미로 만드는 메커니즘이다. `registry.js:67-72`의 등록 내용은 다음과 같다.

- `labelKo: '반쪽 넘김판 (넘기면 그림이 바뀌는 접시)'`
- `render: (params) => renderFlipDisc(params)`
- `defaultParams: { R: 42, pages: 4 }`
- `instructionStyle: 'flip-disc'`

`R`은 원 반지름(mm), `pages`는 넘김판(오른쪽 반원) 개수 `N`이다. 넘김판을 한 장씩 왼쪽으로 넘기면, 그 아래 깔려 있던 다음 페이지가 드러나면서 "완성된 원"의 그림이 바뀐다(예: 접시 위 요리가 바뀌는 연출). `flipDisc.js:1-11` 파일 헤더에 명시된 대로, 이 메커니즘은 **회전판(volvelle)과 다르다** — volvelle은 원판 하나가 창문 뒤에서 통째로 회전하지만, flip-disc는 아무것도 회전하지 않고 반원 낱장들이 고정된 반원 위로 **넘어갈** 뿐이다.

## 작동 방식

`FLIPDISC_CONST`(`flipDisc.js:73-89`)에 핵심 상수가 모여 있다: `R_MIN=22, R_MAX=48, R_DEFAULT=42`, `PAGES_MIN=3, PAGES_MAX=6, PAGES_DEFAULT=4`, `TAB=8`(힌지 탭 폭, mm), `NUB_DEPTH=5`(그립용 돌기 반지름 방향 깊이), `NUB_HALF_DEG=6`(돌기 각도 반폭), `STAGGER_DEG=10`(페이지마다 돌기 각도 오프셋 Δ), `NUB_START_DEG=100`(첫 돌기 각도).

**경첩/제본 기하** (파일 헤더 `flipDisc.js:19-31`): 각 넘김판은 `[탭(폭 t) | 골접기 선 | 반원(반지름 R)]` 구조다. 조립 시 탭들을 골접기 선에서 뒤로 접어 **서로 겹쳐 쌓고 탭끼리만 풀칠**해 하나의 "제본 축(spine)"을 만든 뒤, 그 축의 밑면을 배경의 지름선에 붙이고, 마지막으로 고정 반원을 위에 덮어 붙여 탭 다발을 가린다. 탭 폭 `t=8mm`(그립/풀칠 최소 기준 5mm 이상)이며, 페이지 1장당 접착 면적은 `t·2R`(넓은 선형 힌지) — 한 점이 아니라 넓은 면으로 힘을 분산시켜, 반복해서 넘겨도 한 곳이 쉽게 찢어지지 않게 하는 설계다.

**정렬 vs. 부채꼴(stagger)의 핵심 통찰** (`flipDisc.js:33-41`): 모든 넘김판은 지름선이 고정 반원의 지름선과 **정확히 일치**해야 원이 어긋나지 않는다. 그래서 모든 반원은 **기하학적으로 완전히 동일**하고 같은 접는 선을 공유한다 — 어떤 낱장도 실제 원판 모양 자체를 움직이지 않는다. 참고 이미지에서 보이는 "부챗살처럼 벌어진" 모습은 오직 반지름 `R` **바깥으로 튀어나온 작은 그립 돌기(nub)**에만 적용된다: `nubA = NUB_START_DEG + k·STAGGER_DEG`(`flipDisc.js:260`, `Δ=10°`). `N`장이 `(N-1)·10° ≤ 50°`의 호 범위로 벌어지며, 이 돌기는 깨끗한 원 테두리 자체에는 전혀 영향을 주지 않는다.

**좌표 계산**:
- `flipPageOutline(dcx, dcy, R, t, nubA, nubHalf, nubDepth)`(`flipDisc.js:166-183`): 탭 왼쪽 위(`atl`)부터 시작해 위쪽 점(0°)까지 직선, 거기서 `nubA - nubHalf`까지 원호(`A ... 0 0 1`), 돌기 바깥쪽 두 점(반지름 `R+nubDepth`)을 지나 `nubA + nubHalf`로 복귀, 다시 원호로 아래쪽 점(180°)까지, 마지막으로 탭 왼쪽 아래(`bbl`)로 내려와 닫는다(Z). 오른쪽으로 볼록한 반원 + 탭 + 돌기 하나의 외곽선을 한 번에 만든다.
- `fixedHalfOutline(dcx, dcy, R)`(`flipDisc.js:190-196`): 아래쪽 점에서 왼쪽(270°) 호를 지나 위쪽 점까지 그린 뒤 지름선(Z)으로 닫는 왼쪽 볼록 반원.
- `resolveFlipDiscGeometry(opts)`(`flipDisc.js:117-158`): `pages`를 `[PAGES_MIN, PAGES_MAX]=[3,6]`으로 클램프하고, `cells = pages + 1`(고정 반원 포함). `extraW = TAB + NUB_DEPTH + GAP`, `extraH = LABEL_GAP + GAP`를 여유분으로 두고, `rows = 1..ROWS_MAX(=3)`을 순회하며 `cols = ceil(cells/rows)`에 대해 폭 제약(`Rw = usableW/cols - extraW`)과 높이 제약(`Rh = (usableH/rows - extraH)/2`)의 최솟값(`Rfit`)을 구해, 가장 큰 `Rfit`을 주는 행 수를 채택한다. 최종 `R`은 `[R_MIN, min(R_MAX, best.Rfit)]`로 클램프된다 — A4/Letter 양쪽에서 실제 인쇄 가능 영역에 맞춰 페이지 개수별로 최대 반지름을 동적으로 계산하는 방식이다.
- `generateFlipDisc()`(`flipDisc.js:209-277`)에서 cell 0은 고정 반원(왼쪽 볼록, `cellDisc(0,'left')`), cell 1..N은 넘김판(오른쪽 볼록)이다. 고정 반원의 지름선에는 SCORE(회색) 선을 긋는데(252번째 줄) 이는 **접는 방향을 뜻하지 않는다** — 고정 반원 자체는 절대 접히지 않으며, 이 선은 풀칠/정렬 기준선 표시일 뿐이다. 반면 넘김판의 지름선에는 VALLEY_FOLD(파란 점선)를 긋는다(263번째 줄) — 이 선이 실제로 책장처럼 넘어가는 힌지다. GLUE_TAB은 각 넘김판마다 탭 영역(`[dcx-tab, dcx]`)에만 그려지며(265번째 줄), 반원 몸통에는 절대 그려지지 않는다.

## 활용

- `SVGPreview.jsx`가 `getMechanism('flip-disc').render(params)` → `renderFlipDisc()`을 호출한다(`flipDisc.js:288-297`). `resolveFlipDiscGeometry`는 `renderFlipDisc` 자체가 아니라 `generateFlipDisc` 내부에서 호출되어(`flipDisc.js:213`) 최종 배치에 쓰인다.
- `decorationSlots`를 정의하지 않으므로 기본 단일 100×100mm 슬롯(`registry.js:279-287`)을 사용한다. 각 넘김판 반원 위에는 원 안 그림(예: 다른 요리)을 붙이도록 `①②③...` 순번 라벨이 찍혀 있다(`flipDisc.js:268-269`, `CIRCLED` 배열).
- PDF export 시 `INSTRUCTION_TEXT['flip-disc']`(`registry.js:167-178`)가 조립 설명서로 포함된다.
- **3D 프리뷰: 미지원.** `Preview3D.jsx:17`의 `SUPPORTED_3D`에 `'flip-disc'`가 없어 플레이스홀더만 표시된다. 책장 넘김 포즈를 표현하려면 기존 3종(회전 힌지 패널)과는 다른, "겹쳐 쌓인 낱장을 한 장씩 넘기는" 애니메이션이 필요하다.

## 이전 작업에서 배운 교훈

- 커밋 `7d1bd3a`("Add flip-disc mechanism")의 메시지가 설계 의도를 명시한다: "bound only at a narrow tab (never at the picture face, so pages actually flip instead of gluing shut)." 즉 탭에만 풀칠을 국한한 것은 우연이 아니라, 그림 면끼리 붙어버려 넘겨지지 않는 실패를 막기 위한 의도적 설계다.
- 같은 커밋 메시지의 "staggering a small grip nub per page rather than moving the disc itself, so every leaf's straight edge still lines up with the fixed half when closed" — 부채꼴로 벌어진 모습을 재현하고 싶을 때 원판 자체를 회전/이동시키고 싶은 유혹이 있을 수 있지만, 그렇게 하면 지름선이 어긋나 완성된 원이 깨진다는 것을 미리 알고 "그립 돌기만 움직인다"는 대안을 택한 것이 이 커밋의 핵심 교훈이다.
- `INSTRUCTION_TEXT['flip-disc'].steps[2]`(`registry.js:173`)의 "중요: 반원 그림 부분은 절대 서로 붙이지 마세요! 붙이면 넘겨지지 않아요."와 `.tips`(177번째 줄)의 "반원 조각끼리 붙지 않고 왼쪽 네모(경첩)만 붙는 것이 핵심입니다"는 이 메커니즘에서 가장 자주 실수할 수 있는 지점을 정면으로 겨냥한 경고문이다. 이 경고는 순전히 안내문과 시각적 구분(GLUE_TAB은 좁은 초록 탭에만, 반원 몸통은 흰색)에 의존하며, 코드 차원에서 "실수로 반원끼리 붙지 못하게 막는" 물리적 장치는 없다 — 전적으로 조립자의 주의와 안내문에 달려 있다.

## 앞으로 작업 시 주의사항

- 반원 낱장의 "부채꼴로 펼쳐진" 모습을 강조하거나 조정하고 싶더라도, 절대 원판 자체(지름선·반지름·중심)를 페이지마다 다르게 만들지 말 것 — 오직 `nubA = NUB_START_DEG + k·STAGGER_DEG`로 그립 돌기 각도만 바꿔야 한다. 원판 형태 자체를 흔들면 조립 시 완성된 원의 테두리가 어긋난다.
- GLUE_TAB 사각형(`flipDisc.js:251, 265`)은 반드시 `[dcx-tab, dcx]` 범위(탭 영역)에만 그려야 하고, 지름선을 넘어 반원 몸통 쪽으로 확장되면 안 된다 — 조립자가 안내문을 따라 풀칠할 때 그림 면끼리 붙는 사고를 코드가 유도하게 된다.
- 고정 반원의 SCORE 선(회색, 252번째 줄)과 넘김판의 VALLEY_FOLD 선(파란 점선, 263번째 줄)은 같은 지름선 위에 그려지지만 의미가 다르다 — 하나는 "접히지 않는 정렬/풀칠 기준선", 다른 하나는 "실제로 접히는 힌지"다. 향후 접기 방향 검증 도구나 자동 검사 로직을 추가한다면 이 둘을 같은 것으로 취급하지 말 것.
- `PAGES_MAX`(현재 6)를 늘릴 계획이 있다면, `resolveFlipDiscGeometry()`의 그리드 탐색(`rows = 1..ROWS_MAX(=3)`)이 늘어난 `cells = pages+1`에 대해서도 A4·Letter 양쪽에서 `R ≥ R_MIN`을 만족하는 배치를 찾아내는지 반드시 재검증할 것 — 현재 로직은 최대 6페이지(7칸)까지만 검증되어 있고, 그 이상에서는 보장되지 않는다.
- "낱장을 겹쳐 쌓고 탭에만 풀칠해 묶는다"는 이 메커니즘의 위상(topology)은 앞으로 비슷한 "여러 장 갈아 끼우기/넘기기" 메커니즘을 새로 설계할 때 재사용할 만한 템플릿이다 — 접착을 좁은 탭 영역에만 국한하고 디스플레이 면(그림이 보이는 부분)에는 절대 풀칠하지 않는다는 원칙을 그대로 가져갈 것.
