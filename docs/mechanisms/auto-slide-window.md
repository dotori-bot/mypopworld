# 열면 바뀌는 액자 카드 (auto-slide-window)

> 소스: `src/generators/autoSlideWindow.js`
> 등록: `src/generators/registry.js` (`'auto-slide-window'`)
> 커밋: `1de0b6b` "Add auto-slide-window mechanism (열면 바뀌는 액자 카드)"

## 개요

책처럼 반으로 접히는 카드다. 고정된 뒷면(back face)에 창문 모양 액자가 붙어 있고, 그 뒤로 메시지 띠(슬라이더)가 지나간다. 사용자가 손잡이를 당기는 게 아니라 **카드를 여닫는 동작 자체**가 띠를 밀고 당겨서, 살짝 열면 메시지 ①, 활짝 열면 메시지 ②가 창문 속에 저절로 나타난다. 이것이 pull-tab / rising-slide(손으로 당김)와의 결정적 차이다.

registry.js에서:
- `labelKo`: `'열면 바뀌는 액자 카드 (열면 창문 속 그림이 저절로 바뀜)'`
- `instructionStyle`: `'auto-slide-window'` — INSTRUCTION_TEXT와 Instructions.jsx의 조립 카드가 이 키로 연결됨.
- `defaultParams`: `{ pivotArm: 16, strut: 44, windowHeight: 12 }` — 각각 앞면 위 피벗 팔 길이 p(mm), 지지대(strut) 길이 L(mm), 창문 세로 높이 winH(mm).

## 작동 방식

핵심은 **직렬(in-line) 슬라이더-크랭크**를, V-fold 팝업 팔과 똑같은 종이 접기로 구현한 것이다. 척추(spine, `y = paper.height/2`)를 힌지 축(x축)으로 두고, 척추에 수직인 한 단면 `x = x₁`에서 본다.

- 뒷면(back face)은 테이블 평면에 고정. 척추에서 거리 s인 점 = `(s, 0)`.
- 앞면(front / moving face)은 척추에서 힌지되어 dihedral 각 α를 이룬다. 앞면 위 피벗 P(거리 p) = `(p·cos α, p·sin α)`.
- 길이 L의 강체 지지대(strut)가 P와 슬라이더 S=`(s,0)`를 잇는다. 슬라이더는 뒷면의 가이드 채널을 따라서만 움직인다.

길이 구속 |P − S| = L을 (offset e=0으로) 코사인 법칙 전개하면 슬라이더 위치 수식이 나온다:

```
s(α) = p·cos α + √(L² − p²·sin²α)          (in-line slider-crank)
```

이 수식은 코드에서 `sliderDistance(alphaDeg, p, L)` (autoSlideWindow.js:165-169)로 그대로 구현되어 있다.

**단조성(monotonicity)**: `ds/dα = −p·sin α · [ 1 + p·cos α / √(L² − p²·sin²α) ]`. α ∈ (0°,180°)에서 sin α > 0이고, 괄호 항이 항상 > 0이려면 **L > p** 이어야 한다(최악은 α→180°). 즉 L > p이면 실사용 구간 20°–160°에서 슬라이더가 반전 없이 단조로 움직인다. 코드는 `L ≥ p + L_MIN_OVER_P`(기본 L=44, p=16, `L_MIN_OVER_P=10`)로 이를 강제한다(resolveAutoSlideWindow, autoSlideWindow.js:226-228).

**왜 이게 깔끔한 종이 메커니즘인가**: 크랭크 피벗 열과 트랙이 같은 열 `x = x₁`(offset e=0)이다. 앞면이 척추(x축)를 중심으로 돌면 모든 점의 x좌표가 보존되므로, P·S·strut 전체가 하나의 수직 평면 `x = x₁`에 머문다 — 평면 슬라이더-크랭크의 **prismatic extrusion**. 두 strut 접힘선(P쪽, S쪽)이 모두 척추와 평행이라 비틀림(twist) 없이 종이 접힘으로 힌지된다. e≠0(서로 다른 두 열을 잇는 strut)이면 접힘선이 비틀려 걸리는데, 그걸 피한 설계다.

**이동량**: `s(0) − s(180) = (p+L) − (L−p) = 2p`. 기본값에서 travel = 32mm.

**두 메시지 배치**: 창문은 이동 구간 `[L−p, L+p]`의 중점 W=L에 둔다. 그러면 창문에 드러나는 소재 offset u = W − s(α) ∈ [−p, +p]로 대칭이 된다. 두 설계 각도(`ALPHA_PARTIAL=25°`, `ALPHA_FULL=155°`)에서 메시지 ①/②가 창문 중앙에 온다. 띠 위 두 메시지 간격은 `|s(25°) − s(155°)| = 2p·cos25° ≈ 1.81p`. 창문 높이는 `winH < 1.6p`로 클램프되어 두 메시지가 절대 반씩 겹쳐 보이지 않는다.

좌표 계산 위치:
- 순수 수치/클램프: `resolveAutoSlideWindow()` (autoSlideWindow.js:208-285). 여기서 `sPartial/sFull/u1/u2/uMin/uMax/stripLen/W` 등을 계산한다.
- 부품 그리기: `drawSliderPiece`(313), `drawStrutPiece`(371), `drawFramePiece`(400), `drawGuidePiece`(424), 배치 `generateAutoSlideWindow`(459).

**Flat-foldability**: 닫힘(α=0)에서 strut가 뒷면 위 `[p, L+p]` 구간에 완전히 눕고(길이 L), 앞면이 뒷면에 포갬. 활짝(α=180)에서도 strut가 `[−p, L−p]`에 눕는다. 그 사이엔 strut가 `p·sin α ≤ p` 높이로 텐트처럼 솟았다 내려간다. 앞면-피벗 접힘(mountain)은 슬라이더-strut 접힘(valley)과 짝을 이뤄 양 극단에서 납작하게 접힌다. 메시지 띠·창문은 뒷면 평면을 떠나지 않으므로(<1mm) 카드는 문제없이 닫힌다.

## 활용

- **SVGPreview.jsx**: `mech.render(params)`(= `renderAutoSlideWindow`)가 1페이지 도안 SVG를 만든다(SVGPreview.jsx:44-50). 이후 장식 페이지는 공통 로직으로 붙는다.
- **decorationSlots**: 정의 없음. 따라서 registry.js `getDecorationSlots`의 폴백 단일 슬롯(`{ label: theme, width:100, height:100 }`)을 쓴다. 즉 창문에 넣을 두 메시지 그림을 별도 슬롯으로 분리하지는 않는다 — 향후 개선 여지(아래 참고).
- **Preview3D.jsx**: 지원 안 함. `SUPPORTED_3D = new Set(['v-fold','box-popup','parallel-fold'])`에 없어 "3D 미리보기 준비 중" 플레이스홀더가 뜬다. dihedral 각 α로 구동되는 메커니즘이라 3D 프리뷰와 궁합이 매우 좋음(슬라이더 위상 `s(α)`를 그대로 슬라이더에 매핑 가능).
- 조립 설명은 registry.js `INSTRUCTION_TEXT['auto-slide-window']`(텍스트/PDF)와 Instructions.jsx `case 'auto-slide-window'`(라인 634~, 화면용 일러스트) 두 곳에 있고 **수작업으로 동기화**됨.

## 이전 작업에서 배운 교훈

커밋 `1de0b6b`의 본문에 설계 근거가 명시돼 있다:

- **e=0 결정(공간 링크 회피)**: 초기 "rotary-twist" 후보는 서로 다른 두 dihedral 평면을 가로지르는 공간 링크라서 접힘선이 비틀려 걸릴 위험이 있었다. 피벗 열과 트랙을 같은 x로 두어(offset e=0) strut를 평면 슬라이더-크랭크의 prismatic extrusion으로 만든 것이 이 문제를 없앤 핵심 결정이다.
- **L > p 강제(dead point 회피)**: 강체 링크가 사점(dead point)에서 방향이 뒤집히면 카드를 여는데 메시지가 되돌아가는 고장이 난다. `L ≥ p + L_MIN_OVER_P`로 항상 L > p를 보장해 20°–160° 전 구간 단조성을 확보(파일 헤더에서 수식으로 증명).
- **racking(비틀림 걸림) 방어**: 한쪽에 붙은 strut는 띠의 무게중심에서 벗어난 곳에 힘을 줘 띠를 비틀 수 있다(가장 위험한 고장 모드). 이를 travel을 따라 벌려 붙인 **두 개의 안내다리(guide bridge)**(회전 저항 짝힘)와, x방향으로 넓은 띠(`SLIDER_WX=44`)의 긴 베어링 길이로 막는다. risingSlide의 유지(retention) 아이디어를 재사용한 것.
- **fall-out 방어(멈춤 날개)**: 띠 양 끝의 stop flange 폭 = `channelGap + 2·STOP_CATCH`로 안내다리 채널보다 넓어서, 세게 당겨도 띠가 빠지지 않는다(`drawSliderPiece`의 flange, autoSlideWindow.js:326-333).
- **NaN 방어**: `numOr(v, d)`(155)로 garbage/NaN 입력을 기본값으로 흡수하고, 모든 치수는 throw 없이 clamp된다.

## 앞으로 작업 시 주의사항

- **L > p 불변식을 절대 깨지 말 것**. `L_MIN_OVER_P`를 줄이거나 clamp 순서를 바꿔 L ≤ p가 되면 사점이 생겨 메시지가 되돌아간다. 파라미터 변경 시 `sliderDistance`가 20°–160°에서 단조인지 재확인.
- **창문 높이 클램프 `winH < 1.6p` 유지**. p를 작게 하거나 winH를 키우면 두 메시지가 창문에 반씩 겹쳐 보인다. `WIN_H_MAX`와 `pFit` 클램프(autoSlideWindow.js:219-223)를 함께 검토.
- **A4·Letter 양쪽 fit 재검증**. Letter가 더 얕은 면(faceDepth 134.7 < A4 143.5)이라 지배적이다. 두 하드 클램프 (1) `4p + winH + 2·STRIP_PAD ≤ faceDepth − SPINE_PAD − OUTER_PAD` (2) `L + p ≤ faceDepth − OUTER_PAD`가 두 용지 모두에서 성립하는지 확인. `paperSize` 미지정/오타는 'A4'로 폴백됨.
- **닫힘(α=0)에서 모든 조각이 자르는 선 안**인지 확인 — strut 최대 눕힘 길이 `s(0)=L+p`가 `faceDepth − OUTER_PAD` 안에 들어와야 한다.
- **두 접힘선이 척추와 평행**해야 함(e=0). strut 양 끝 크레이스가 척추와 평행하지 않으면 비틀려 걸린다. 지지대 부착 위치를 바꾼다면 x₁ 정렬 재확인.
- **안내다리는 두 개, travel을 따라 벌려서**. 한 개로 줄이면 racking 방어가 무너진다. `GUIDE_W`, 두 다리 y위치(`gy1`,`gy2`, autoSlideWindow.js:488-489) 확인.
- **문서 동기화**: registry.js `INSTRUCTION_TEXT['auto-slide-window']`와 Instructions.jsx `case 'auto-slide-window'`는 손으로 맞춰 둔 것이다. 한쪽만 고치면 화면 설명과 PDF 설명이 어긋난다.
- **3D 프리뷰 부재**: 추가하려면 Preview3D.jsx의 `SUPPORTED_3D`에 `'auto-slide-window'`를 넣고, 카드 열림 각 α 슬라이더를 `s(α)`(sliderDistance)로 메시지 띠 위치에 매핑하는 분기를 추가해야 한다. 이 메커니즘은 α로 직접 구동되므로 프리뷰 궁합이 좋다.
- **decorationSlots 미정의**: 지금은 단일 폴백 슬롯이라 두 메시지 그림을 따로 뽑지 못한다. 개선하려면 registry에 `decorationSlots`를 추가해 메시지 ①/② 두 슬롯(각 `winW × winH`)을 노출하는 것을 고려.
