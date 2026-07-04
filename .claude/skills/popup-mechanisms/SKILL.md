---
name: popup-mechanisms
description: Designing a new paper pop-up/kinetic paper mechanism, calculating fold/hinge/linkage geometry for paper craft (angles, travel, clearances, glue-tab placement), checking print/cut safety margins for a paper template, or explaining how an existing pop-up mechanism (V-fold, box pop-up, accordion, volvelle, slider-crank, Scotch yoke, etc.) works and folds flat.
---

# Popup Mechanisms

This is reference knowledge distilled from a paper-craft popup-card generator project (mypopworld), which designed, built, and print-tested 13 distinct paper-engineering mechanisms. It covers fold/hinge/linkage geometry (the actual trigonometry and clamping formulas that make a mechanism fold flat and not tear), assembly gotchas discovered through real bugs and print tests, and print-safety constraints for laying these mechanisms out on A4/Letter paper. Use it when designing a new pop-up or kinetic paper mechanism from scratch, debugging why a fold doesn't sit flat or a slider jams/falls out, or explaining how one of the 13 known mechanisms works to someone who wants to build or adapt it.

Each mechanism has a detailed reference file under `reference/` with its full geometry derivation, known failure modes, and lessons learned from real builds. Read the relevant one before designing something similar — most of these mechanisms are variations on a handful of reusable topologies (single hinge, cascading hinges, slider-in-channel, slider-crank, rotary-disc-in-collar, elastic coil), and the closest existing reference is usually a faster starting point than deriving from scratch.

## 메커니즘 목록 (Mechanism index)

| id | 설명 | 문서 |
| --- | --- | --- |
| `v-fold` | 카드 척추 한가운데서 V자로 갈라진 두 팔이 카드를 열면 산 모양으로 솟아오르는 가장 기본적인 팝업. | [reference/v-fold.md](reference/v-fold.md) |
| `box-popup` | 카드를 열면 척추 양옆에서 사각 상자 면이 수직으로 솟아 하나의 이어진 상자 앞면을 이루는 팝업. | [reference/box-popup.md](reference/box-popup.md) |
| `parallel-fold` | 척추에서부터 여러 단이 계단처럼 겹겹이 솟는 평행 접기(계단식) 팝업. | [reference/parallel-fold.md](reference/parallel-fold.md) |
| `pull-tab` | 카드에 뚫린 슬롯 안에서 별도 슬라이더 조각을 밀거나 당기면 그림이 옆으로 이동하는 장치. | [reference/pull-tab.md](reference/pull-tab.md) |
| `straw-rocket` | 종이를 말아 붙인 튜브에 빨대를 꽂아 불면, 밀폐된 공기가 튜브를 밀어내 날아가는 장치. | [reference/straw-rocket.md](reference/straw-rocket.md) |
| `accordion` | 병풍처럼 지그재그로 접힌 띠가 카드를 열면 무대처럼 서는 팝업. | [reference/accordion.md](reference/accordion.md) |
| `volvelle` | 브래드(핀) 없이 종이 테두리 풀칠만으로 자유 회전 원판을 포획해, 손잡이를 밀면 창문 속 그림이 바뀌는 돌림판. | [reference/volvelle.md](reference/volvelle.md) |
| `flip-disc` | 반원 조각들을 책장처럼 한 장씩 넘기면 완성된 원(접시 등) 그림이 바뀌는 장치. | [reference/flip-disc.md](reference/flip-disc.md) |
| `spiral-spring` | 아르키메데스 나선으로 잘라낸 원판이 카드를 열면 코일 스프링처럼 위로 늘어나는 팝업. | [reference/spiral-spring.md](reference/spiral-spring.md) |
| `rising-slide` | 손잡이를 위로 당기면 그림이 고정된 세로 슬롯을 따라 곧게 위로 올라가는 슬라이드. | [reference/rising-slide.md](reference/rising-slide.md) |
| `layered-stage` | 카드를 열면 여러 겹의 벽(성·마을 등)이 서로 다른 깊이에서 층층이 솟는 다층 극장식 팝업. | [reference/layered-stage.md](reference/layered-stage.md) |
| `auto-slide-window` | 카드를 여닫는 동작만으로 인라인 슬라이더-크랭크가 슬라이더를 밀어, 창문 속 그림이 저절로 바뀌는 액자 카드. | [reference/auto-slide-window.md](reference/auto-slide-window.md) |
| `slide-to-swing` | 손잡이를 좌우로 밀면 스카치 요크(핀-슬롯) 연결을 통해 회전 기둥 위 장식이 시계추처럼 흔들리는 장치. | [reference/slide-to-swing.md](reference/slide-to-swing.md) |

## 공통 종이/인쇄 규칙 (Shared paper/print rules)

이 규칙들은 어떤 새 메커니즘을 설계하든 그대로 재사용할 수 있는, 종이 공예 인쇄 도안의 일반적인 제약이다.

**용지 크기**
- A4: 210 × 297mm
- US Letter: 215.9 × 279.4mm
- 카드는 보통 용지를 반으로 접어(주로 높이 방향으로 접어) 만든다. 두 용지의 폭은 거의 같지만(210 vs 215.9mm) 반으로 접었을 때의 카드 면 높이는 Letter가 A4보다 얕다(약 139.7mm vs 148.5mm) — 그래서 이 프로젝트의 여러 메커니즘 기하 클램프는 **Letter를 기준(더 빡빡한 쪽)으로** 안전 마진을 잡고, A4에서는 자동으로 더 여유가 생기게 설계했다. 새 메커니즘을 설계할 때도 두 용지 중 더 얕은 쪽(Letter)을 기준으로 맞추면 양쪽 모두에서 안전하다.

**인쇄 안전 규칙**
- 안전 여백(margin): 종이 가장자리에서 5mm — 도안의 모든 절단선/접는 선은 이 여백 안에 있어야 한다.
- 블리드(bleed): 3mm — 배경/장식이 종이 끝까지 인쇄되어야 하는 경우 대비하는 여유분.
- 최소 선 굵기: 0.7mm(약 2pt) — 이보다 가는 선은 가정용 프린터/일반 인쇄에서 끊기거나 흐려질 위험이 있다.

**선 스타일 범례 (line-style legend)**
도안은 보통 색상 모드(컬러 인쇄용)와 흑백 모드(모노 인쇄용) 두 세트의 선 스타일을 갖는다 — 흑백 모드에서는 색 대신 선 굵기/점선 패턴만으로 구분해야 한다. 각 선의 의미:

| 선 종류 | 의미 |
| --- | --- |
| 자르기(Cut) | 실선. 가위로 실제로 오려내는 윤곽선. |
| 산접기(Mountain Fold) | 점선 계열 A. 종이를 시청자 쪽으로 볼록하게(convex) 접는 선 — 접었을 때 능선이 앞으로 솟는다. |
| 골접기(Valley Fold) | 점선 계열 B. 종이를 시청자 반대쪽으로 오목하게(concave) 접는 선 — 접었을 때 골이 뒤로 들어간다. |
| 풀칠(Glue Tab) | 옅은 채움 + 얇은 점선. 풀이나 양면테이프를 바를 위치. 이 표시가 없는 영역(특히 그림이 보이는 면, 회전/이동하는 부품)에는 절대 풀칠하면 안 된다는 뜻이기도 하다. |
| 골내기(Score) | 회색 계열의 넓은 점선. 반드시 "접히는" 선이 아니라, 정렬 기준선이나 안내선(때로는 눌러서 접는 자국만 내는 자리)을 나타낼 수 있다 — 의미는 메커니즘마다 다를 수 있으므로 각 메커니즘 문서에서 확인한다. (예: `flip-disc`에서는 고정 반원의 지름선에 그어지지만 그 선 자체는 접히지 않는다.)

이 범례의 정확한 색상 코드(hex)·점선 간격(dasharray) 값은 구현 세부사항이므로 여기서는 다루지 않는다 — 요점은 "자르기/산접기/골접기/풀칠/골내기"라는 다섯 가지 역할을 시각적으로 뚜렷이 구분해야 한다는 것이다.

## 공통 주의사항 (Common gotchas)

이 프로젝트에서 13개 메커니즘을 만들며 반복적으로 드러난 일반 원칙들이다. 새로운 종이 공예 도구를 만들거나 기존 것을 디버깅할 때 그대로 적용할 수 있다.

- **자르기 선과 접기 선을 동일 좌표에 중복 등록하지 않는다.** 한 선분은 "자르기" 아니면 "접기" 둘 중 하나의 역할만 가져야 한다. 같은 좌표를 자르기 배열과 접기 배열 양쪽에 동시에 넣는 버그는, 도안만 보면 그럴듯해 보이지만 실제로 사용자가 조립 설명서대로 그 선을 전부 오리면 패널이 카드에서 완전히 분리되어 버려 팝업을 지탱할 게 아무것도 남지 않는 치명적 실패로 이어진다. 이 버그 패턴은 이 프로젝트에서 서로 다른 메커니즘(사각 상자 팝업과 계단식 팝업)에서 독립적으로 두 번 재발했다 — 새 메커니즘을 만들 때마다 "자르기/산접기/골접기 좌표 목록 사이에 동일한 좌표 쌍이 중복되지 않는지" 교차 검사하는 습관을 들이는 게 좋다.
- **부착(풀칠) 지점을 좁고 명확한 탭에 국한하고, 그림이 보이는 면이나 움직여야 하는 부품에는 풀칠하지 않는다.** 회전판, 슬라이더, 넘김판처럼 자유롭게 움직여야 하는 부품은 그 움직임 경로에 풀이 닿는 순간 기능이 완전히 죽는다. 안전한 설계는 접착을 좁은 탭 영역(경첩, 테두리)에만 국한하고, 조립 설명에도 "이 부분은 절대 붙이지 마세요"를 명시적으로 경고하는 것이다 — 코드/도안 차원의 물리적 방지(탭과 몸체를 시각적으로 뚜렷이 구분)와 문구 차원의 경고를 이중으로 두는 편이 안전하다.
- **움직이는 부품은 "빠지지 않으면서도(fall-out-proof) 걸리지 않게(non-binding)" 설계한다.** 슬라이더/핀처럼 트랙이나 슬롯을 타고 움직이는 부품은 두 가지 실패 모드를 동시에 피해야 한다: (1) 너무 헐거우면 세게 당기거나 밀 때 트랙 밖으로 빠져나가 분실된다, (2) 너무 빡빡하면 정상 범위 내에서도 걸려서 움직이지 않는다. 검증된 해법은 "멈춤 날개(stop flange)"를 트랙/채널 폭보다 명확히(예: 한쪽당 몇 mm) 넓게 만들어 극단에서만 걸리게 하고, 정상 주행 구간에서는 여유 간격(clearance)만 살짝 두어 마찰이 거의 없게 하는 것이다. 얇은 목(neck)이 아니라 튼튼한 몸체가 당기는 힘을 받게 설계하면, 반복 사용에도 목이 찢어지지 않는다.
- **평면 안에서 반복 회전하는 부품에는 접는 선(crease)이 아니라 구멍-목(hole-and-neck) 회전 조인트를 쓴다.** 접는 선은 면 밖으로 힌지되는 동작에는 적합하지만, 같은 평면 안에서 계속 돌아가야 하는 부품(예: 피벗 위에서 좌우로 흔들리는 기둥)에 접는 선을 쓰면 반복 사용 시 피로 균열이 생긴다. 대신 부품의 밑동을 좁은 목으로 만들어 카드에 뚫은 구멍에 끼우고, 뒤에서 구멍보다 넓은 캡으로 잡아 목이 구멍 안에서 자유롭게 회전하게 하면 접히는 부분 없이 반복 회전에도 견딘다.
- **수치 파라미터는 항상 NaN/쓰레기 입력에 대해 방어적으로 처리한다.** `null`/`undefined`만 걸러내는 단순한 기본값 처리(`??` 연산자 등)는 문자열 쓰레기나 `NaN`을 그대로 통과시켜, 그 값이 좌표 계산 전체에 전파되면 도안이 통째로 깨질 수 있다. "숫자로 변환 가능하면 그 값을, 아니면 기본값을 쓰는" 헬퍼로 모든 사용자/외부 입력 수치를 감싸는 편이 안전하다.
- **파라미터 클램프(clamp)는 개별 값이 아니라 누적값에 걸어야 할 때가 있다.** 여러 층/레벨이 누적되는 메커니즘(계단식, 다층 무대 등)에서는 "이 레벨까지의 누적 깊이가 안전 한도를 넘지 않는가"를 검증해야 전체 포획 경계가 보장된다 — 레벨마다 독립적으로 범위만 클램프하면 개별 값은 정상이어도 합산했을 때 종이 밖으로 나갈 수 있다. 예산이 부족해지면 값을 억지로 찌그러뜨리기보다 남은 레벨을 조용히 생략하는 편이, 부품이 인쇄 영역 밖으로 삐져나오는 것보다 안전하다.
- **평탄 접기(flat-foldability)를 처음부터 설계 제약으로 명시한다.** 카드를 완전히 닫았을 때 모든 팝업 부품이 자기 몫의 접힌 영역 안에 정확히 들어가야 한다(그 영역을 벗어나면 카드가 안 닫히거나 종이가 눌려 손상된다). 이를 위해 "깊이 = 높이"처럼 부품의 폭·깊이·높이 사이에 등식/부등식 관계를 명시적으로 강제하고, 여러 층이 있다면 각 층의 접힌 영역(band)이 서로 겹치지 않고 이어지도록(disjoint tiling) 설계하면, 개별 층이 조건을 만족하는 것만으로 전체가 안전함을 수학적으로 보장할 수 있다.
- **탄성/장력에 의존하는 메커니즘(코일 스프링 등)은 "완전히 열린 상태에서도 아직 팽팽해지지 않을 여유"를 안전 계수로 확보한다.** 카드가 다 열리기도 전에 탄성 부품이 팽팽해지면(taut) 이후 남은 여닫힘 동작이 접착 부위를 뜯어낸다. 최대 가능 신장량에서 일정 비율(여유 계수, 예: 실제 필요량의 2배 이상)을 곱한 값을 실제 재료 길이로 채택하면 이 실패를 구조적으로 막을 수 있다.
- **여러 자유도가 섞인 링크(강체 지지대로 두 힌지를 잇는 구조 등)를 설계할 때는 사점(dead point)을 피한다.** 슬라이더-크랭크류 링크에서 지지대 길이가 팔 길이보다 충분히 길지 않으면, 어느 각도에서 운동 방향이 반전되는 사점이 생겨 "밀수록 오히려 되돌아가는" 고장이 난다. 지지대 길이를 팔 길이보다 확실한 여유(예: 최소 몇 mm 이상)를 두고 크게 설계하면 사용 각도 범위 전체에서 단조로운(한 방향으로만 진행하는) 움직임을 보장할 수 있다.
- **비틀림(racking)을 유발하는 비대칭 부착을 피한다.** 힘을 주는 지지대나 링크가 이동 부품의 무게중심에서 벗어난 한 점에만 붙으면 부품이 옆으로 비틀리며 걸릴 수 있다. 이동 경로를 따라 벌려서 두 개의 안내 지점(가이드)을 두거나, 이동 방향에 수직인 폭을 넉넉히 주는 것으로 이 비틀림 저항을 만들 수 있다.
- **조립 안내 문서를 이중으로 관리하는 도구를 만들 때는 하나의 소스만 두거나, 이중화하더라도 드리프트를 의식적으로 관리한다.** 인쇄물(PDF)용 텍스트 설명서와 화면 표시용 일러스트 안내가 별도 파일/데이터로 존재하면, 한쪽만 고치고 다른 쪽을 잊는 순간 두 안내가 어긋난다. 가능하면 단일 소스에서 파생시키고, 부득이하게 손으로 동기화해야 한다면 "이 파일을 고치면 반드시 저 파일도 확인하라"는 규칙을 코드 주석이나 체크리스트로 명시해 두는 것이 좋다.
- **장식/디자인 이미지의 권장 크기는 렌더링에 실제로 쓰이는 기하 계산과 같은 소스에서 파생시킨다.** 장식 이미지 크기 제안을 렌더러의 실제 치수 계산과 별개의 로직으로 독립 계산하면, 렌더러 쪽 치수가 바뀔 때 장식 제안 크기가 조용히 어긋난다(장식이 완성된 부품보다 작거나 커서 안 맞음). 두 계산이 같은 함수/공식을 공유하게 만들면 이 드리프트가 구조적으로 불가능해진다.
