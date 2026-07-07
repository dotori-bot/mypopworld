# 커튼 문 카드 (gate-curtain)

> 소스: `src/generators/gateCurtain.js`
> 등록: `src/generators/registry.js` (`'gate-curtain'`)
> 커밋: `4dbc811` "Add gate-curtain mechanism: opening the doors draws the curtains aside"

## 개요

**게이트폴드(양문형)** 카드다. 가운데 뒷판(back panel) 좌우에 뒷판 절반 폭의 문 두 짝이 세로 골접기로 달려 있고, 뒷판 가운데에 주인공 그림이 붙는다. 그 위로 노란 **보타이(모래시계) 커튼 두 장**이 겹쳐 놓여 주인공을 가리고, 장식 액자(리테이너 겸용)가 커튼을 덮는다. 두 문을 열면 문과 커튼을 잇는 **지지대(스트랩)**가 커튼을 좌우로 끌어당겨 주인공 둘레에 노란 다이아몬드 창이 열리고, 닫으면 커튼이 저절로 다시 모인다. 참고 원형은 부활절 "El ha Resucitado" 게이트폴드 카드(문 바깥면에 돌 장식).

registry.js에서:
- `labelKo`: `'커튼 문 카드 (문을 열면 커튼이 걷히는 카드)'`
- `sceneType`: `'flat'` — 카드 자체가 척추 반접기 책형이 아니라 수직 경첩 2개짜리 게이트폴드라서, 책형 α 슬라이더 대신 flatScenes의 전용 드라이브 슬라이더("문 열기 (여닫기)", 0–180°)로 구동한다.
- `instructionStyle`: `'gate-curtain'`
- `defaultParams`: `{ panelWidth: 90, revealWidth: 44, hingeOffset: 16 }` — 뒷판 폭(mm), 다이아몬드 창 폭(mm), 경첩→문 피벗 거리 d(mm, 커튼 이동량의 절반).
- `decorationSlots`: 주인공(다이아몬드 창 크기 `revealW × revealH`) 1개 + 문 바깥 돌 장식(30×40) 2개 — 모두 리졸버 지오메트리에서 파생.

## 작동 방식

핵심은 auto-slide-window와 **같은 직렬(in-line) 슬라이더-크랭크**를 **수직 경첩 축**에 적용한 것이다. 오른쪽 문 기준, 경첩을 수직축으로 두고 수평 단면(위에서 본 모습)에서:

- 문 위 경첩에서 거리 d인 피벗 P = `(d·cos α, d·sin α)` (α: 문 여는 각, 0=닫힘, 180=활짝).
- 커튼 부착점 S = `(s, 0)`은 뒷판 위 수평 채널에 갇혀 미끄러진다.
- 길이 L의 스트랩이 P–S를 잇는다. |P−S| = L에서:

```
s(α) = d·cos α + √(L² − d²·sin²α)          (sGate, gateCurtain.js)
```

커튼 변위는 `curtainOffset(α) = (d+L) − s(α)`, 0에서 2d까지 단조 증가. 코드는 `L = doorW − d − GAP`으로 정하고 `d ≤ (doorW − GAP − L_MIN_OVER_D)/2`로 클램프해 **항상 L > d**(사점 없음, 전 구간 단조)를 보장한다.

**왜 깨끗한 종이 메커니즘인가**: 피벗 열과 슬라이더가 같은 수평 단면(offset e=0)에 있어, 수직 경첩 회전이 y좌표를 보존한다 → P·S·스트랩이 한 수평면에 머무는 prismatic extrusion. 스트랩의 두 접힘선이 모두 경첩과 나란한 **수직선**이라 비틀림 0으로 접힌다. 스트랩은 양방향(열 때 밀고 닫을 때 당김)이라 커튼이 자동 복귀한다.

**기각한 대안**: (a) 커튼을 문 안쪽면에 직접 붙이기 — 중간 각도에서 부착부가 `d·sinα`만큼 들려 커튼이 텐트처럼 뜸. (c) 커튼을 문 자유단에 경첩식으로 붙이기 — 커튼이 문과 함께 서기만 하고 수평 이동이 없음. 오직 스트랩 방식만 "평평 유지 + 수평 병진"을 동시에 만족한다.

**보타이 커튼과 다이아몬드 개방**: 커튼 안쪽 변은 중앙 높이에서 wMin까지 좁아지는 셰브런(‹)이다. `wMin = doorW − s(150°) − revealW/2`로 역산해 **α=150°에서 다이아몬드가 정확히 완전 개방**되고, 닫힘(α=0)에서는 두 커튼이 중앙에서 `wMin − GAP`(기본 9.1mm)만큼 겹쳐 주인공을 완전히 가린다. revealW는 `wMin ≥ WMIN_FLOOR(8mm)`가 되도록 클램프.

**액자 = 리테이너 (정직한 역학)**: 스트랩의 수직 당김 성분(최대 `d·sinα`)이 커튼을 뒷판에서 들어올리므로 리테이너가 반드시 필요하고, 장식 액자가 그 역할을 겸한다. 커튼이 **수평**으로 움직이므로 채널의 열린 변은 좌·우, 풀칠 변은 **위·아래 레일**이다 (autoSlideWindow는 띠가 수직 이동이라 좌·우 풀칠 — 정확히 반대). 커튼 높이 `Hc = channel + 2·TUCK`으로 이동 전 구간에서 레일 밑에 물려 있다.

**닫힘 층 두께**: 중앙에서 뒷판+커튼₂+액자 ≈ 4겹(~0.8mm), 두 문잎은 겹치지 않고 맞닿아 +1겹 → 총 ~1.0mm < 허용 1.5mm.

**페이지 배치(한 장, A4·Letter 모두)**: 폭은 A4가 지배(펼친 카드 2·panelW ≤ 200mm → panelW ≤ 100), 높이는 Letter가 지배(`panelH ≤ (paperH − 마진 − 아랫줄 예산)/2`, Letter 104.2mm). 카드 아래에 1행(커튼 2 + 액자), 2행(스트랩 2 + 돌 2)을 배치한다. **주의**: `createTemplate()`은 수평 척추 골접기를 그리므로 이 생성기는 쓰지 않고, `createSVG` + 자체 트림 사각형 + 세로 골접기 2개로 페이지를 직접 만든다(`renderGateCurtain`).

좌표 계산 위치:
- 순수 수치/클램프: `resolveGateCurtain()` — DOM 없이 헤드리스로 테스트 가능.
- 운동학: `sGate()`, `curtainOffset()` — 3D 프리뷰가 같은 함수를 import.
- 부품 그리기: `drawCurtainPiece` / `drawFramePiece` / `drawStrapPiece` / `drawStonePiece`, 배치 `generateGateCurtain`.

## 활용

- **paramSchemas.js**: 세 파라미터 모두 리졸버 프로브(9999/0) 방식. `revealWidth`·`hingeOffset` 상한은 다른 파라미터 현재값에 의존하므로 해당 값을 유지한 채 대상만 프로브한다.
- **compatibility.js**: `SOLO_ONLY` — 이 메커니즘은 카드 몸체 자체(게이트폴드)라 다른 메커니즘과 조합 불가.
- **flatScenes.jsx** (`buildGateCurtain`): 문 2짝은 수직 경첩 rotateY(±(180−α)), 커튼 2장은 `curtainOffset(α)` translateX, 스트랩은 코드 기울기 `β = asin(d·sinα/L)`로 표현. 닫힌 문이 커튼+액자 스택 위로 정렬되도록 문 translateZ를 접힘각에 따라 보간한다(flip-disc의 zRight→zLeft 기법 — CSS는 평면 교차를 픽셀 단위로 정렬하지 못하므로).
- 조립 설명은 `INSTRUCTION_TEXT['gate-curtain']`(PDF)과 Instructions.jsx `case 'gate-curtain'`(화면 일러스트 6단계) 두 곳, 수작업 동기화.

## 주의사항 / 배운 교훈

- **액자는 위·아래만 풀칠**: 좌·우 기둥을 붙이면 커튼이 못 움직인다. 사용자 관점에선 "장식"이지만 역학적으로는 필수 리테이너 — 설명서(step 5)와 도안 라벨("위·아래만 풀칠 (좌·우는 열어두기)")에 명시했다.
- **스트랩 접힘선은 문 경첩과 나란히(수직)**: 비뚤게 붙이면 prismatic extrusion 조건이 깨져 비틀리며 걸린다. 설명서 step 6에서 강조.
- **파라미터 극단 조합의 pinch 한계**: `hingeOffset`을 최소(8)까지 내리면 `revealWidth` 여유(revMax)가 `REVEAL_W_MIN(24)`보다 작아져 슬라이더 범위가 24–24로 수렴하고, 리졸버는 최소 창폭을 우선해 wMin이 바닥(8mm) 아래(~6mm)로 내려갈 수 있다. UI 프로브 범위 안에서는 문제없지만, 클램프 우선순위(창폭 최소 > pinch 바닥)를 바꿀 땐 이 상호작용을 확인할 것.
- **검증 방법**: 리졸버가 DOM-free라 node로 헤드리스 검증 가능 — 단조성(0–180° 전 구간), 은폐(α=0에서 revealHalf<0)/개방(α=150°에서 revealHalf=revealW/2), 양 용지 마진 적합, 9999/0/NaN 프로브 유한성.
