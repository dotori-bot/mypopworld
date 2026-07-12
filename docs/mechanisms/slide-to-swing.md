# 손잡이를 밀면 좌우로 흔들리는 장치 (slide-to-swing)

> 소스: `src/generators/slideToSwing.js`
> 등록: `src/generators/registry.js` (`'slide-to-swing'`)
> 커밋: `a7251f5` "Add slide-to-swing mechanism (Scotch yoke) as an original implementation"

## 개요

카드 한 면 위에 얹히는 평면(in-plane) 기구로, 고전 **스카치 요크(Scotch yoke)**를 종이로 구현한 것이다. 손잡이(handle)가 달린 슬라이더가 수평 직선으로 움직이면, 밑동에서 회전하는 기둥(post/arm) 꼭대기의 핀이 슬라이더의 **세로 슬롯**을 타고 오르내리며, 슬라이더의 직선 운동을 기둥의 좌우 진동으로 바꾼다. 기둥 꼭대기에 붙인 장식(하트, 인형 등)이 손잡이를 밀 때마다 좌우로 흔들린다.

registry.js에서:
- `labelKo`: `'흔들 장치 (손잡이를 밀면 그림이 좌우로 흔들림)'`
- `instructionStyle`: `'slide-to-swing'`
- `defaultParams`: `{ armLength: 34, swingAngle: 35 }` — 기둥 길이 r(pivot→pin, mm), 흔들림 반각 θmax(deg). (그 외 `clearance`, `grip`도 resolve에서 받음.)

## 작동 방식

기둥 피벗은 카드 위 고정점 P=`(px, py)`. 기둥 길이 r(pivot→pin). θ = 중앙 정지(θ=0, 기둥이 위/상단을 향함)에서의 흔들림 각, θ ∈ [−θmax, +θmax].

```
pin(θ) = ( px + r·sin θ ,  py − r·cos θ )
```

코드: `pinPosition(thetaDeg, px, py, r)` (slideToSwing.js:173-176).

**슬라이더 구속(스카치 요크의 핵심)**. 슬라이더는 고정 높이 `y = ySlot`에서 수평 이동만 한다. `ySlot = py − r`로 잡는다 — θ=0일 때 핀의 높이(가장 높은 점, 가장 작은 y). 기둥이 어느 쪽으로 흔들려도 핀은 슬라이더 기준으로 **아래로만** 내려간다:

```
Δy(θ) = (py − r·cos θ) − (py − r) = r·(1 − cos θ) ≥ 0
```

최대 내림 = `slotCore = r·(1 − cos θmax)`. 세로 슬롯은 이 값 + 핀 자체 footprint + 여유를 담아야 한다:

```
slotLen = slotCore + PIN_NECK + 2·clearance
```

(가장 위험한 고장 = 슬롯이 짧아 극단에서 핀이 낌. resolve가 slotLen을 slotCore 기준으로 **구조적으로** 크게 잡아 원리상 낌이 불가능.)

**1:1 구동**. 슬롯이 x방향으로 꽉 끼므로(`slotWidthX = PIN_NECK + clearance`) 슬라이더 x가 핀 x를 그대로 따른다:

```
xSlider(θ) = px + r·sin θ
손잡이 왕복 travel = 2·r·sin θmax
진폭 A = r·sin θmax = travel/2
```

장식은 핀보다 약간 위(피벗에서 `r + DECO_OFF`)에 붙어 손잡이보다 살짝 더 넓게 호를 그린다 — "손잡이는 직선, 장식은 따라오는 듯 호를 그림"이 이 장난감의 매력.

**θmax 선정**. `sin θmax = travel/(2r)`. 기본 r=34, θmax=35° ⇒ travel ≈ 39.0mm(아이 손가락 밀기에 적당), slotCore ≈ 6.15mm, slotLen ≈ 10.8mm(깔끔히 오려짐).

좌표 계산 위치:
- 순수 수치/클램프: `resolveSlideToSwing()` (slideToSwing.js:212-286).
- 부품: `drawPostPiece`(301, 기둥+핀탭+피벗목), `drawSliderPiece`(339, 몸통+세로슬롯+멈춤날개+손잡이), `drawGuidePiece`(381), 배치·앞면 가이드 `generateSlideToSwing`(415).

**물리 스택(앞→뒤)**: 장식(cap) → 슬라이더(세로 슬롯) → 기둥(핀이 슬롯을 앞으로 관통) → 카드면(피벗 구멍+가이드 앵커).

**핀-슬롯 캡처**: 기둥 꼭대기 핀은 `PIN_NECK` 폭의 종이 탭으로, 산접기(mountain)로 앞으로 접혀 슬롯을 관통한다. 앞면에 붙인 장식이 3.8mm 슬롯보다 훨씬 넓어 핀이 관람자 쪽으로 못 빠지고, 꽉 낀 슬롯 벽이 옆으로도 못 빠지게 잡는다. 세로로 ~6mm는 자유롭게 미끄러진다. 옆힘(side-load)은 얇은 목이 아니라 튼튼한 기둥이 받으므로 목이 찢어지지 않는다.

**베이스 피벗 — 크레이스가 아니라 종이 회전 조인트**. 평면 내 회전을 접힘선으로 내면, 크레이스는 면 밖으로 힌지되고 반복하면 피로 균열이 생긴다(피해야 할 바로 그 고장). 대신 기둥 밑동을 `PIVOT_TAB_W=5mm` 목으로 좁혀 카드의 원형 구멍(`PIVOT_HOLE=7mm`)에 끼우고, 뒤에서 구멍보다 넓은 캡 디스크(`PIVOT_CAP_R=6`)로 잡는다. 목(5) < 구멍(7)이라 1mm 유격으로 자유 회전하며 아무것도 접히지 않아 피로가 없다.

**Flat-foldability**: 이 기구는 카드 평면을 절대 떠나지 않는다. 전체 스택(장식+슬라이더+기둥+카드) 4장 ≈ 1.2mm가 모든 손잡이 위치에서 납작하게 유지되어, 접히는 카드가 그 위로 문제없이 닫힌다. 유일한 접힘(핀 탭·피벗 탭·가이드 립)은 모두 붙이거나 캡처되어 별도 mountain/valley 짝이 필요 없다.

## 활용

- **SVGPreview.jsx**: `renderSlideToSwing`이 1페이지 도안을 만든다. 앞면(상단 절반)에 실제 피벗 구멍을 자르고, 안내띠 풀칠 자리(Ⓐ·Ⓑ)만 점선(SCORE)으로 표시한다. (과거에 있던 장식 흔들림 범위 유령선·슬라이더 밴드 점선은 절단선으로 오독되고 완성 카드 앞면을 어지럽혀 제거됐다 — 움직임 묘사는 프리뷰 화면의 몫.) 하단 절반에 오려낼 부품을 배치.
- **장식 예시**: `generateHeart(...)`(decorations.js)로 하트를 핀에 붙일 예시 장식으로 그려 준다(slideToSwing.js:493).
- **decorationSlots**: 정의 없음 → 단일 폴백 슬롯. 흔들릴 장식 한 개를 그리는 용도라 단일 슬롯으로 충분.
- **Preview3D.jsx**: 지원 안 함(`SUPPORTED_3D`에 없음). 다만 이 기구는 카드의 dihedral 각이 아니라 손잡이 위치가 구동 변수라, 3D "책 열림 각" 프리뷰 프레임과는 성격이 다르다(별도 슬라이더 UI가 더 맞음).
- 설명: registry.js `INSTRUCTION_TEXT['slide-to-swing']` + Instructions.jsx `case 'slide-to-swing'`(라인 746~), 수작업 동기화.

## 이전 작업에서 배운 교훈

커밋 `a7251f5` 본문:

- **원저작(original) 구현**임을 명시 — 스카치 요크 원리를 1차 원리 kinematics와 이 저장소 자체 컨벤션으로 독립 유도한 것이지, 특정 레퍼런스 템플릿의 아트워크/레이아웃을 베낀 게 아니다.
- **베이스 피벗을 크레이스 대신 구멍-목 회전 조인트로**: 평면 내에서 반복적으로 접히는 크레이스는 피로 균열이 나는데, 그게 정확히 이 장난감이 반복 놀이에서 피해야 할 고장이다. 그래서 접힘선이 아니라 캡으로 잡는 회전 조인트를 택했다(파일 헤더 "Base pivot — a paper rotary joint, NOT a crease").
- **슬롯을 slotCore 기준으로 구조적 사이즈**: 슬롯이 짧으면 흔들림 극단에서 핀이 낀다(riskiest failure). resolve가 `slotLen = slotCore + PIN_NECK + 2·clearance`로 항상 넉넉히 잡아 원리상 낌이 불가능(smoke test로 `slotCore + PIN_NECK ≤ slotLen` 검증한다고 헤더에 명시).
- **핀-슬롯 캡처는 risingSlide의 검증된 관용구 재사용**, 슬라이더 트랙 유지는 pullTab의 가이드 스트립+멈춤 플랜지 재사용 — "1차 결합(핀) + 2차 하드스톱(플랜지)"의 이중 방어선.
- **방어적 손잡이 클램프**: `px + A + sliderHalf + grip`이 인쇄 폭을 넘으면 θmax를 asin으로 되돌려 줄여(slideToSwing.js:234-242) 부품이 종이 밖으로 안 나가게 한다. `numOr`로 NaN/garbage도 흡수.

## 앞으로 작업 시 주의사항

- **`ySlot = py − r`(θ=0에서 핀의 최고점) 불변식 유지**. 이걸 다른 높이로 옮기면 핀이 슬롯 안에서 위아래 양방향으로 움직여야 하고, 그러면 slotLen 계산(`r·(1−cos θmax)` 단방향 전제)이 깨져 낌이 생긴다.
- **슬롯을 풀로 막지 말 것**(조립상 주의). 핀은 슬롯 안에서 세로로 자유로워야 한다 — INSTRUCTION_TEXT tips에도 강조됨.
- **피벗 캡은 기둥 목에만, 카드에는 붙이지 말 것**. 카드에 붙으면 기둥이 못 돈다. 목(5) < 구멍(7) 유격을 유지해야 자유 회전. `PIVOT_TAB_W < PIVOT_HOLE` 재확인.
- **장식이 카드 밖으로 나가는지 확인**. 수평 fit 클램프 `(r + DECO_OFF)·sin θmax + DECO_R ≤ px − MARGIN`(slideToSwing.js:228)와 방어적 handle 클램프가 A4·Letter 양쪽에서 성립해야 한다. tips는 넘칠 때 `swingAngle`을 줄이라고 안내.
- **A4·Letter 양쪽 fit**. `paperSize` 오타/미지정은 'A4' 폴백. 세로 fit `r ≤ py − MARGIN − TOP_PAD − DECO_OFF − DECO_R`와 수평 fit 둘 다 확인.
- **멈춤 날개(flange) > 채널** 재확인. 슬라이더 양 끝 flange가 `flangeSpan = sliderH + 2·STOP_CATCH`로 가이드 채널보다 커야 세게 밀어도 안 튀어나온다.
- **grip ≥ 5mm(아이가 잡을 수 있는 최소)**. `GRIP_MIN=8`로 이미 여유 있음 — 줄이더라도 5mm 밑으로 내리지 말 것.
- **문서 동기화**: registry.js `INSTRUCTION_TEXT['slide-to-swing']`와 Instructions.jsx `case 'slide-to-swing'`를 함께 수정. 한쪽만 고치면 드리프트.
- **3D 프리뷰 부재**: 추가하려면 `SUPPORTED_3D`에 `'slide-to-swing'`을 넣되, 구동 변수가 카드 열림 각이 아니라 손잡이 위치이므로 Preview3D의 α 슬라이더를 그대로 쓰기보다 θ(또는 손잡이 x) 전용 슬라이더 분기를 설계해야 한다.
