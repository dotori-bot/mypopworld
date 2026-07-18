# 매직 셔터 (magic-shutter)

> 소스: `src/generators/magicShutter.js`
> 등록(예정): `src/generators/registry.js` (`'magic-shutter'`) — 오케스트레이터가 배선
> 유형: `sceneType: 'flat'` (책 열림 각이 아니라 손잡이 좌우 밀기로 구동)

## 개요

정사각형에 가까운 액자(프레임) 카드. 카드 앞면 가운데(오른쪽 치우침)에 네모 창문이 있고, 창문 안은 **폭 w의 세로 살(bar)과 폭 w의 틈(gap)이 번갈아 있는 빗살(picket grille)**로 남아 있다. 창문 뒤에는 두 그림(①·②)을 폭 w의 세로 조각으로 잘라 번갈아 배치한 **슬라이더 시트**가 있고, 오른쪽으로 튀어나온 손잡이("밀기 ↔")를 정확히 한 살 폭(w)만큼 밀면 틈에 정렬된 조각이 ①→②로 통째로 바뀐다("짠!"). 인스타 릴스(할린 "magic love card")의 "손잡이를 좌우로 → 창문 그림 전환" 체감을 그대로 재현한 것.

이 메커니즘은 물리적으로 자명한 고전 **빗살(barrier-grid / picket-fence) 애니메이션**이다. 설계 후보였던 (A) 직조(woven) 슬랫 전환은 기각했다(아래 "채택/기각 근거" 참조).

## 작동 방식

이것은 회전각·링크 기구가 아니라 **직선 1피치 전환**이다. 기하는 "창문·슬라이더·멈춤을 인쇄 가능 면 안에 안전하게 클램프"하는 문제로 귀결된다.

**물리 스택(앞→뒤)**:
1. 카드 앞면: 인쇄된 프레임 + 창문을 빗살로 오림(틈 칸만 세로 슬롯으로 잘라내고 살은 프레임 위·아래에 붙은 채 남김).
2. 슬라이더 시트: 두 그림을 w폭 조각으로 번갈아 인쇄. 오른쪽으로 손잡이(grip)가 카드 오른쪽 밖으로 튀어나옴(접지 않는 동일면 연장 → "튀어나온 Pull 손잡이").
3. 위 안내 다리 + 아래 안내·멈춤 다리: 슬라이더 위·아래 **프레임에만** 풀칠(슬라이더에는 안 붙음), 립을 슬라이더 가장자리 위로 접어 Z방향 포획. 아래 다리는 **멈춤 핀**을 함께 지녀 슬라이더의 멈춤 슬롯에 끼워 1피치 스트로크로 제한.

**빗살 광학(왜 깨끗이 바뀌나)**. 창문 폭 `W = cols·w`, cols는 **홀수**로 잡아 양쪽 바깥 칸이 살(bar)이 되게 한다(각 살이 프레임 위·아래에 붙어 있어 빗살이 떨어지지 않음). cols 홀수일 때:
- 살 `bars = (cols+1)/2` (짝수 인덱스 0,2,…,cols−1)
- 틈 `gaps = (cols−1)/2` (홀수 인덱스 1,3,…,cols−2)

슬라이더 로컬 x(슬라이더 왼쪽 = 창문좌표 `windowX0 − coverPad`에 매핑)에서:
- ① 조각 중심 `x = coverPad + (k+0.5)·w`, **홀수 k** (offset 0에서 틈에 정렬)
- ② 조각 중심 `x = coverPad + (k+0.5)·w`, **짝수 k** (offset 0에서 살 뒤에 숨음)

슬라이더를 오른쪽으로 정확히 한 피치(u = w) 밀면 모든 ② 조각이 틈 아래로 들어와 그림이 전면 ②로 바뀐다. **travel = w**.

**정합(registration) = 두 개의 물리적 하드 스톱**. 슬라이더 아래 여백(창문 아래 STOP_ZONE)에 가로 **멈춤 슬롯**(길이 `w + PIN_FOOT`)이 있고, 카드에 고정된 **멈춤 핀**(아래 다리의 작은 탭)이 이 슬롯을 관통한다. 슬롯이 양 끝에서 핀에 부딪혀 멈추므로 **쉬는 자리는 u = 0(그림 ①)과 u = w(그림 ②) 딱 둘뿐**이며, 구성상 정확히 한 피치 차이다. 아이는 손잡이를 "딸깍" 걸릴 때까지 밀기만 하면 되고, 세 번째 멈춤이 없으므로 그림이 ①/② 반반으로 어중간하게 쉴 수 없다. (pullTab/risingSlide의 "닫힌 슬롯 = 내재 정지" 관용구가 여기서는 피치-정합 역할까지 겸함.)

**핀 x 위치(정합의 급소)**. 슬롯 중심의 world-x는 `sliderRestX + stopSlotCx + u`. 고정 핀(폭 `PIN_FOOT`)이 u=0에서 슬롯 **오른쪽 끝**을, u=travel에서 슬롯 **왼쪽 끝**을 받치려면
```
핀 오른끝 = pinCx + PIN_FOOT/2 = 슬롯 오른끝(u=0) = sliderRestX + stopSlotCx + stopSlotLen/2
stopSlotLen/2 − PIN_FOOT/2 = travel/2   (stopSlotLen = travel + PIN_FOOT 이므로)
⇒ pinCx = sliderRestX + stopSlotCx + travel/2
```
이 값은 **급소**다 — 핀이 어긋나면 두 스톱이 **함께** 밀려 ①·② 둘 다 반반으로 보인다. (기본 A4: `pinCx = 96 + 54 + 3 = 153`, 슬롯[145,155]·핀[151,155] → u=0에서 오른끝 155 일치, u=6에서 왼끝 151 일치.) 아래 다리에서의 부품-로컬 좌표는 `pinLocalX = stopSlotCx + travel/2 + GLUE_END`(= 기본 63mm). 코드: `resolveMagicShutter()`(`pinCx`, `pinLocalX`), `drawBottomStopGuide()`.

> **과거 버그(수정됨)**: 핀을 다리 정중앙(`ox + guideLen/2`)에 그려 `sliderRestX + stopSlotCx + travel`이 되었다 — 필요값보다 **travel/2 오른쪽**. 기본값에서 u=0일 때 핀 발[+4,+8]이 슬롯[−5,+5] 밖으로 나가 끼울 수조차 없었고, 억지로 끼우면 두 정지점이 u=3·u=9가 되어 ①·② 모두 반반으로 보였다.

**조립 규약(어느 면을 카드에 붙이나)**. 뒷면 부품(슬라이더 + 위/아래 다리 2개)은 모두 **인쇄면이 카드 뒤(안쪽)를 향하게 뒤집어(printed-face-DOWN)** 카드 앞면 **뒤쪽**에 붙인다(풀칠 초록 표시가 카드에 닿고, 슬라이더 그림은 창문 쪽을 향해 틈으로 보임). 카드 패널을 뒤집어 뒷면에서 작업하면 x가 한 번 반전되고, 부품을 뒤집어 붙이면 x가 또 한 번 반전되어 **두 반전이 상쇄** — 부품 인쇄-로컬 x가 카드-앞면 world-x에 1:1로 매핑된다(부품 왼끝을 대상 왼끝 `guideL = sliderRestX − GLUE_END`에 맞춤). 그래서 `pinLocalX`의 오프셋 부호가 `+travel/2`(뒤집힘이면 `−travel/2`가 됨)이고, 그림 조각도 반전 없이 정합된다. 다리 라벨에 "인쇄면이 카드 뒤로 가게 뒤집어 붙임"으로 명시.

**핀 수직 관통(도달 거리)**. 핀 뿌리는 아래 다리의 **슬라이더 쪽 변**(front-y `pinRootY = windowY0 + winH + STOP_ZONE + RET_GAP`)에서 위로 접혀 올라가 슬라이더 뒤를 지나 멈춤 슬롯(front-y `[slotTopY, slotBotY] = windowY0 + winH + STOP_ZONE/2 ± stopSlotH/2`)을 **뒤에서 관통**하고, 슬롯 앞으로 나온 끝(`PIN_CAP` ≈ 3.5mm)을 **아래로 접어 캡**으로 고정한다(슬라이더가 핀에서 들려 빠질 수 없음 — 아래쪽 Z포획의 주역). 필요 길이는 winH와 무관한 상수 합:
```
MOUNT_LEN ≥ (STOP_ZONE/2 + RET_GAP − stopSlotH/2)  ← 뿌리→슬롯 근변 상승
          + stopSlotH                               ← 슬롯 통과
          + PIN_CAP                                 ← 캡 여유
          = 5.7 + 8.6 + 3.5 = 17.8 → 18mm 채택 (캡 실측 3.7mm)
```
캡은 위가 아니라 **아래로** 접는다 — 위로 접으면 그림 창문 영역을 침범한다. 코드: `resolveMagicShutter()`(`pinRootY`, `pinTipY`, `slotTopY`, `slotBotY`), `drawBottomStopGuide()`.

> **과거 버그(수정됨)**: 핀을 다리의 **먼 변**에서 MOUNT_LEN=12로 접어 올렸는데, tip이 슬롯 근변보다 ~2.7mm 못 미쳐 **핀이 슬롯에 아예 닿지 않았다**. 뿌리를 슬라이더 쪽 변으로 옮기고 18mm로 늘려 해결.

**창문이 절대 비어 보이지 않음(커버리지 증명)**. 창문 `[X0, X0+W]`. offset 0에서 슬라이더(폭 `S_x`) 왼쪽은 `X0 − coverPad`. offset w에서 왼쪽은 `X0 − coverPad + w`. 창문 왼쪽 끝을 계속 덮으려면
```
X0 − coverPad + w ≤ X0   ⇒   coverPad ≥ travel = w
```
그래서 `coverPad = w + SAFETY_PAD` (엄격히 큼)로 잡고
```
S_x = W + travel + 2·coverPad = W + 3w + 2·SAFETY_PAD
```
스트로크 전 구간에서 창문 양 끝이 덮여 어떤 손잡이 위치에서도 빈 종이가 비치지 않는다. 코드: `resolveMagicShutter()` (`sliderW`, `coverPad`).

**Flat-foldability**: 팝업 의미의 flat-fold는 N/A — 전 조립이 항상 평면(<1mm)에 있어 접는 카드가 그 위로 문제없이 닫힌다. 접힘은 안내 다리의 립과 아래 다리의 멈춤 핀 탭(뿌리 산접기 + 끝 캡 골접기)뿐이고, 핀은 슬라이더 뒤에 납작하게 누워 두께를 더하지 않으며, 붕괴시킬 mountain/valley 짝이 없다.

## 치수(A4·Letter 양쪽 보장)

앞면: y ∈ [MARGIN, spineY], 높이 `faceH = card.height − MARGIN` (A4 143.5, Letter 134.7 → **높이는 Letter가 지배**). 폭 `faceW = paper.width − 2·MARGIN` (A4 200, Letter 205.9 → **폭은 A4가 지배**). resolver는 **넘겨받은 paperSize의 인쇄 가능 면에 대해 클램프**하므로 어느 크기로 호출하든 그 크기에 맞게 들어간다.

- 폭: `W ≤ min(faceW − 2·FRAME_MIN, whitespaceW − 2·OUTER_PAD − 3w − 2·SAFETY_PAD − gripLen − 1)`
  (앞면 프레임 + 아래 여백의 슬라이더+손잡이 둘 다 성립)
- 높이: `winH ≤ min(frontHeightLimit, whiteHeightLimit)`
  - `frontHeightLimit = faceH − TOP_RESERVE − STOP_ZONE − RET_GAP − STOP_BRIDGE_W − SPINE_PAD`
    (**슬라이더가 창문 아래로 STOP_ZONE만큼 더 내려간다는 점을 포함** — 이걸 빠뜨리면 아래 다리가 슬라이더 위에 풀칠되는 버그)
  - `whiteHeightLimit = whitespaceH − whitespaceOverhead(L) − 1`
    (`whitespaceOverhead`는 슬라이더 + 위/아래 다리 + 간격 + 핀 탭의 세로 합, LIMITS로 단일 소스화)

`cols`는 그다음 `cols·w ≤ 폭 상한`을 만족하는 **가장 큰 홀수**로 내림. 창문은 **오른쪽 치우침**(오른쪽 프레임 = FRAME_MIN)으로 배치해 조립 시 손잡이가 카드 오른쪽 밖으로 튀어나온다(기본값 A4에서 약 29mm). 왼쪽 프레임은 항상 ≥ FRAME_MIN(증명: `W ≤ faceW − 2·FRAME_MIN ⇒ windowX0 ≥ MARGIN + FRAME_MIN`)이며, 남는 넓은 왼쪽 패널은 "Magic!" 등 장식 공간으로 쓴다.

## 채택/기각한 설계 근거

- **채택: (B) 빗살 셔터의 엄밀 변형.** 물리적으로 자명(닫힌 슬롯 2-스톱 = 정확한 1피치 정합, 커버리지 부등식으로 빈 창문 배제, flat 유지)하고, 인쇄된 절선만으로 8세 아동이 조립 가능하며, A4·Letter 극단 파라미터 전부에서 인쇄 면을 벗어나지 않음을 resolver 클램프 + 경계 프로브로 증명했다.
- **기각: (A) 직조(woven) 슬랫 전환(영상의 near-full 커버리지 방식).** 두 빗(comb)을 위·아래에서 엮어 미는 방식은 **표면이 통째로 바뀌어 얇은 이음선만 남는** 릴스의 near-full 룩을 낸다. 그러나 (1) 엮인 손가락(fingers)이 미끄러질 때 종이가 카밍(camming)으로 부드럽게 지나가지 않고 접혀 잼(jam)되며, 이 무-간섭·복원을 종이 물성상 보장하는 단면 증명을 세울 수 없었고, (2) 정확히 1피치만 밀리는 기계적 정합 장치가 없어 아동이 "보고 맞추는" 부정확 조작이 되어 매직이 깨진다. 임무 지침의 "증명 안 되면 억지 채택 금지" 원칙에 따라 기각.
- **광학 트레이드오프(정직한 한계)**: (B)는 각 그림을 창문 면적의 절반(틈)만 보여 준다 — 뇌가 세로 줄무늬를 완성상으로 읽는 고전 빗살 애니메이션이다. 살 폭 w를 작게(기본 6mm, 최소 3mm) 하면 완성도가 올라가지만 손잡이 throw도 그만큼 짧아진다(throw = w). 그래서 손잡이 grip을 크게(≥16mm) 주어 짧은 throw도 아이가 큰 손잡이로 딸깍 밀 수 있게 했다. 릴스의 "얇은 이음선 몇 개"(near-full)는 (A)에서만 가능하며 (B)는 "촘촘한 세로 살"로 읽힌다 — 체감(밀면 ①↔② 전환)은 동일하되 룩이 다르다.

## 실패 모드와 대책

- **어중간한 반반 정합** → 닫힌 멈춤 슬롯(길이 w+PIN_FOOT)의 두 끝이 유일한 쉬는 자리. 중간 detent 없음.
- **미는 도중 빈 창문** → `coverPad > travel` 강제(`= w + SAFETY_PAD`), `S_x = W + 3w + 2·SAFETY_PAD`.
- **손잡이를 세게 당겨 빠짐/찢김** → 하중이 얇은 손잡이 목이 아니라 튼튼한 멈춤 슬롯이 핀에 부딪혀 받게 함. Z포획은 앞면 살 + 위/아래 다리 립.
- **아래 다리가 슬라이더에 풀칠됨** → 다리는 슬라이더 **바깥**(창문 아래 slider bottom 아래 프레임)에만 풀칠. frontHeightLimit에 STOP_ZONE 포함으로 자리 확보. (이 버그를 경계 프로브가 실제로 잡아 수정함.)
- **빗살이 떨어짐** → cols 홀수 + 틈 슬롯을 프레임 안쪽에만 내어 모든 살이 위·아래로 프레임에 붙어 있게 함.
- **NaN/쓰레기/극단 입력** → `numOr(v,d)`로 흡수, 모든 파라미터 clamp, 9999/0/NaN/undefined 프로브 안전.

## 창 모양 · 전환 방식 (windowShape / revealStyle)

두 개의 열거형(enum) 파라미터로 창의 모양과 그림이 바뀌는 방식을 고른다. (예시 카드: 거북이 자동차 창·유령 눈 — 둘 다 창 전체 그림이 통째로 바뀜.)

- **`windowShape`**: `'rect'`(사각형, 기본) | `'ellipse'`(원/타원). 앞면 프레임 테두리와 창 구멍(aperture)이 이 모양을 따른다.
  - `ellipse` + `swap`: 창을 한 개의 타원 구멍(`ellipsePath`)으로 오려낸다 — 가장 깔끔(유령 눈처럼).
  - `ellipse` + `grille`: 각 틈(gap) 칸을 그 x에서 타원 높이(칸의 **바깥쪽 x**에서 `ellipseHalfH`, 즉 더 짧은 반높이)로 잘라 넣어 어떤 절선도 타원 테두리를 넘지 않게 한다(보수적으로 안쪽에 들어옴).
- **`revealStyle`**: `'grille'`(빗살형, 기본) | `'swap'`(통째 전환형).
  - **grille**(기존): 창 폭이 홀수 cols로 스냅, throw = 한 살 폭 w, 각 그림은 틈으로 **절반만** 보임. 슬라이더는 w폭 조각 인터리브.
  - **swap**(신규): 창은 한 개의 구멍, 슬라이더에 그림 ①·②를 **창 폭만큼** 두 판(panel)으로 나란히 싣는다. throw = **창 폭 전체**(travel = winW)라 손잡이를 창 폭만큼 밀면 그림 **전체**가 통째로 바뀐다. 살(창살)은 구조가 아니라 원하면 앞면에 직접 그리는 장식.

**swap 기하(핵심 식)**. 바깥 여백 `m = SWAP_MARGIN`(3mm). 슬라이더 로컬: `[m, m+winW]`=②판, `[m+winW, m+2winW]`=①판. `sliderW = 2·winW + 2m`, `travel = winW`, `sliderRestX = windowX0 − m − winW`(u=0에서 ①판이 창 뒤). 멈춤 슬롯 중심 `stopSlotCx = m + 1.5·winW`(=창 중심의 슬라이더-로컬). 핀 정합식은 travel에 대해 **일반식** 그대로: `pinCx = sliderRestX + stopSlotCx + travel/2`, `pinLocalX = pinCx − guideL`. 안내다리는 스트로크 전체가 아니라 **창 폭만**(`guideLen = winW + 2·GLUE_END`) 덮으면 된다(슬라이더가 창보다 항상 넓어 창 근처에서 늘 립 아래에 있음; 먼 끝은 들려도 무해). 클램프: 앞면 `winW ≤ (faceW − FRAME_MIN − m)/2`, 여백 `winW ≤ (whitespaceW − 2·OUTER − 2m − grip − 1)/2` — A4 기본에서 winW≈80mm로 묶임.

> **검증**: `resolveMagicShutter`를 A4/Letter × grille/swap × rect/ellipse × 극단폭·높이·쓰레기 입력 122케이스로 프로브해, (1) 창·슬라이더·안내다리가 인쇄면 안, (2) 두 정합 스톱(u=0·u=travel)에서 슬롯 끝이 핀에 정확히 물림을 확인했다(모두 통과).

## 파라미터 / 지오메트리

**사용자 파라미터(defaultParams와 1:1)**: `windowWidth`(창문 목표 폭, 기본 96 → grille는 cols·w로 스냅, swap은 fit-클램프), `windowHeight`(창문 높이, 기본 60), `pitch`(살/틈 폭 w = travel, grille 전용, 기본 6), `grip`(튀어나온 손잡이 길이, 기본 24), `windowShape`(기본 `'rect'`), `revealStyle`(기본 `'grille'`).

**resolver가 반환하는 geometry**(3D 프리뷰 flatScenes 빌더가 부품 배치에 그대로 사용): `windowX0/windowY0/windowCx/windowCy`, `winW/winH`, `pitch/cols/bars/gaps/travel`, `coverPad/coverPadY`, `sliderW/sliderH/sliderRestX`(offset 0에서 슬라이더 왼쪽 world x = 그림 ① 상태), `gripLen/gripH`, `stopSlotLen/stopSlotH/stopSlotCx/stopZoneCy`, `channelH/guideLen`, `restOffsets = [0, w]`(두 정합 스톱). 3D에서 슬라이더를 `sliderRestX + u`로 놓고 u를 0↔w로 보간하면 그림이 전환된다.

## 조립 순서 요약 (Instructions/INSTRUCTION_TEXT 작성용)

1. 검은 실선을 따라 오려주세요: 앞면 카드(창문의 **틈 칸만** 세로로 잘라내면 살이 빗처럼 남습니다 — 살은 자르지 마세요), 슬라이더 시트 1장(오른쪽 손잡이 포함), 위 안내 다리 1개, 아래 안내·멈춤 다리 1개(가운데 작은 핀 탭 포함).
2. 슬라이더의 창문 칸에 그림 ①·② 조각을 한 줄씩 번갈아 색칠/부착합니다(도안의 ①/② 표시대로). 손잡이 쪽은 빈 채로 둡니다.
3. 슬라이더를 앞면 창문 뒤에 대고, 손잡이를 카드 오른쪽 밖으로 빼냅니다. 슬라이더가 창문을 완전히 덮는지 확인하세요.
4. 위·아래 안내 다리를 슬라이더 위·아래에 다리처럼 얹어 **양 끝 초록색만 앞면(프레임)에 풀칠**하고 가운데는 붙이지 마세요. 아래 다리의 **멈춤 핀을 슬라이더의 멈춤 슬롯에 끼웁니다** — 이 핀이 밀기 거리를 딱 한 칸(w)으로 제한합니다.
5. 손잡이를 왼쪽 끝까지 밀면 그림 ①, 오른쪽 끝까지 밀면 그림 ②가 "짠!" 하고 나타납니다. 양 끝에서 딸깍 걸리는 두 자리가 정확한 그림 위치입니다.

**핵심 팁(풀칠 금지 구역)**: 안내 다리는 **양 끝만** 프레임에 풀칠하고 슬라이더에는 절대 붙이지 마세요(붙으면 안 미끄러집니다). 멈춤 핀과 멈춤 슬롯은 풀로 막지 마세요(핀이 슬롯 안에서 움직여야 정합이 됩니다). 너무 뻑뻑하면 안내 다리 가운데를 아주 살짝 더 띄워 붙이세요.

## 앞으로 작업 시 주의사항

- **cols는 반드시 홀수**로 유지(양 끝 살 = 빗살 지지). `toOdd()` + `COLS_MIN=5`.
- **coverPad > travel 불변식** 유지. `pitch`(=travel)를 키우면 coverPad·S_x가 따라 커지므로 폭 클램프 재확인.
- **frontHeightLimit에 STOP_ZONE 포함**(슬라이더가 창문 아래로 내려감). 아래 다리는 slider bottom 아래 프레임에만 풀칠.
- **whitespaceOverhead·WS_* 상수와 generate()의 배치가 한 소스**여야 함 — 간격을 바꾸면 둘이 함께 움직인다(과거 이 불일치를 프로브가 잡음).
- **paramSchema는 resolver 프로브로**: `windowWidth`/`windowHeight`는 fit-클램프가 걸리므로 9999/0 프로브로 min/max를 얻어야 한다(정적 리터럴 금지). `pitch`/`grip`은 LIMITS의 PITCH_MIN/MAX·GRIP_MIN/MAX 정적 상수로 충분. (`windowWidth`는 cols·w로 스냅되므로 슬라이더 목표값과 실제 winW가 다를 수 있음 — 라벨에 반영 권장.)
- **문서·설명 동기화**: registry.js `INSTRUCTION_TEXT['magic-shutter']`와 Instructions.jsx `case 'magic-shutter'`를 함께 수정.
- **3D 프리뷰**: `flatScenes.jsx`에 빌더 추가 시 구동 변수는 카드 열림 각이 아니라 손잡이 offset u ∈ [0, w]. 슬라이더를 `sliderRestX + u`로 이동, 창문 살은 고정, 두 그림 조각을 홀/짝 칸에 배치.
- **api/chat.js**: 어린이 챗봇 제안 대상이 되려면 시스템 프롬프트 메커니즘 목록과 `mechanism` enum에 `'magic-shutter'` 추가.
