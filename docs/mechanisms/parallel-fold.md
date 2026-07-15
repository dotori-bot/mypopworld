# 평행 접기 (계단식 팝업) (parallel-fold)

## 개요

척추에서부터 카드 안쪽으로 여러 단(레벨)이 계단처럼 겹겹이 솟아오르는 메커니즘. 단이 하나면 box-popup과 사실상 동일한 위상(topology)이고, 여러 단을 지정하면 폭이 점점 좁아지고 깊이가 점점 깊어지는 계단(staircase)을 만들 수 있다. `registry.js`의 `labelKo`는 `'평행 접기 (계단식 팝업)'`, `instructionStyle`은 `'generic'`(전용 문구 없음), `defaultParams`는 `{ width: 80, depth: 30 }`으로 **단일 레벨**만 사용한다(`registry.js:37-42`). `width`는 단의 폭(척추 방향, mm), `depth`는 척추로부터의 절단 깊이(mm)이며, 파일 상단 공식 `height(α) = d·sin(α/2)`, `height_max = d`가 명시돼 있다(`src/generators/parallelFold.js:6-7`). 다단 계단은 `levels: [{width, depth}, ...]` 배열로 지정할 수 있고 `d1 < d2 < d3`, `w1 > w2 > w3`이어야 한다(`parallelFold.js:7`)지만, 현재 `registry.js`의 `defaultParams`는 다단을 쓰지 않으므로 **UI에서 실제로 도달 가능한 경로는 단일 레벨뿐**이다(아래 "이전 작업" 절 참고).

## 작동 방식

### 2D SVG 도안 (`src/generators/parallelFold.js`)

- `buildLevels(params)`(`parallelFold.js:57-75`)가 `levels` 배열이 있으면 그대로 폭/깊이를 `clamp`하고, 없으면 `params.width ?? 40`, `params.depth ?? 20`으로 단일 레벨을 만든다. `maxDepth = card.height/2 - PRINT.MARGIN`, `maxWidth = card.width - 2·PRINT.MARGIN`로 인쇄 안전 영역을 벗어나지 않게 clamp한다.
- `generateParallelFold(rawParams)`(`parallelFold.js:103-214`)의 메인 루프(`126-203`)가 레벨마다 다음을 계산한다:
  - `accumulatedDepth`: 이전 레벨까지 누적된 깊이. 첫 레벨은 0.
  - `cutDepthFromSpine = accumulatedDepth + depth`: 이번 레벨의 절단 깊이(척추 기준 절대값).
  - 위쪽(척추 위) 절단: `upperStart = spineY - accumulatedDepth`, `upperEnd = spineY - cutDepthFromSpine`; 좌우 세로 절단선을 이 범위(`upperStart~upperEnd`)에만 그린다(`parallelFold.js:138-146`) — "이 레벨 자신의 띠 범위만" 자른다는 주석(`141-142`)이 핵심: 계단 조각이 카드에서 들려 올라갈 수 있도록 그 레벨의 좌우 모서리만 자유롭게 한다.
  - 아래쪽(척추 아래)도 대칭으로 동일 계산(`148-153`).
  - **바깥쪽(절단 깊이) 가로선 처리가 이 메커니즘의 핵심 로직**(`155-180`, 주석 `156-158`): "한 선은 자르기 아니면 접기 둘 중 하나이지 둘 다일 수 없다"는 원칙 아래,
    - 마지막(가장 안쪽/가장 깊은) 레벨이면: 바깥 모서리는 **조각이 카드로 되돌아 붙는 유일한 앵커 = 골접기(VALLEY)**다. 폭 전체를 골접기로 긋는다 — 과거에는 CUT이어서 조각 둘레가 전부 절단선이 되어 카드에서 탈락하는 치명 버그였다(2026-07 수정).
    - 마지막이 아니면(다음에 더 좁은 레벨이 얹힐 예정이면): 다음 레벨 폭보다 바깥쪽의 "어깨(shoulder)" 부분만 CUT으로 자르고, 다음 레벨 폭 안쪽 가운데 띠는 자르지 않는다 — 이 안 잘린 가운데 띠가 다음 레벨(i+1)이 스스로 그리는 산접기 경첩이 되기 때문에, 여기서는 그 위치에 대해 `mountainFolds`를 절대 push하지 않는다(중복 라벨링 방지, `165-180`).
  - **안쪽(척추에 가까운 쪽) 경첩**: 접기 방향은 최외곽 골접기 앵커에서 안쪽으로 골·산 교대다(중심 단면에서 접기각 합 = +90° 조건으로 유도; 코드 주석 참고). 위치 N−i+1이 홀수면 골, 짝수면 산 — N=1이면 척추 크리스가 산접기(고전 단일 계단 V·M·V), N=2면 척추 크리스가 골접기가 된다. 레벨 0의 경첩은 척추 구간 자체이며, 템플릿의 카드 척추 골선은 그 구간을 `spineGaps`로 건너뛴다(한 선 한 의미).
  - 라벨(`195-201`): 각 레벨 중앙에 `단계 N: depth mm` 텍스트.
- (과거의 '척추 골접기 표시 라인 ±5mm' 중복 표기는 제거됨 — 척추 구간 표기는 위 경첩 규칙 하나로 통일.)
- `round()`/`clamp()`는 `src/utils/math.js`의 헬퍼(라운딩·범위 제한)를 그대로 사용.
- `renderParallelFold(params)`(`parallelFold.js:221-235`)가 `createTemplate()`으로 페이지를 만들고 `cuts`/`mountainFolds`/`valleyFolds`/`markers`를 각각 `styles.CUT`/`MOUNTAIN_FOLD`/`VALLEY_FOLD`로 그린다.

### 3D 조립 포즈 미리보기 (`src/components/Preview/Preview3D.jsx`)

- `mechanism === 'parallel-fold'` 분기(`Preview3D.jsx:215-240`)는 `params.levels`가 있으면 그대로, 없으면 `[{width, depth}]` 단일 레벨로 만든다. 매 레벨의 국소 굽힘각은 동일하게 `γ = α/2`(box-popup의 단일 레벨 케이스와 동일한 `h_level = depth·sin(α/2)` 공식).
- `renderStairLevel(levels, i, side, sinA, cosA, gamma, PX, parentDimPx)`(`Preview3D.jsx:45-76`)이 재귀적으로 각 레벨의 DOM을 만든다. **레벨 i는 레벨 i-1의 실제 DOM 자식**이라, `preserve-3d`를 통해 부모의 전체 변환을 상속받고 그 위에 자기 자신의 로컬 `transform`만 얹는다 — 이것이 "레벨 i는 레벨 i-1의 움직이는 표면에 붙어 있다"는 물리를 CSS로 그대로 구현한 것(`Preview3D.jsx:20-26` 주석).
  - 레벨 0의 부모는 페이지(page) 자체이고 경첩(hinge)은 척추(`right:0`/`left:0`); 레벨 i>0의 부모는 이전 레벨이고 경첩은 그 부모의 먼 쪽 모서리(`right:100%`/`left:100%`)(`Preview3D.jsx:52-57`).
  - **접힘 방향이 레벨마다 번갈아 뒤집힌다**: 짝수 레벨(0,2,4…)은 `+γ`("리저", 부모 표면에서 멀어지며 들림), 홀수 레벨은 `-γ`("트레드", 부모와 다시 평행하게 눕음)(`Preview3D.jsx:39-44`, `59`). 주석이 이유를 명시: 이 교대가 없으면 (a) 실제 평탄 접기가 요구하는 산/골 교대를 어기고, (b) 회전 프레임이 나선형으로 누적되어 계단이 단조 상승하는 대신 수직을 지나쳐 이전 레벨 안쪽으로 말려 들어간다.
  - 축 성분: `zc = side==='left' ? -cosA : cosA`, `transform = rotate3d(-sinA, 0, zc, angle°)`(`Preview3D.jsx:60-61`) — v-fold/box-popup과 동일한 축 관례(sign만 좌우로 대칭).
- 총 높이 표시는 `calculateParallelFoldHeight(totalDepth, alpha)`로 모든 레벨 depth의 합에 대해 한 번에 근사 계산한다(`Preview3D.jsx:238-239`) — 각 레벨이 독립적으로 접히는 정확한 누적치는 아니고 표시용 근사값이다.

## 활용

- `registry.js`: `'parallel-fold'` 엔트리가 `render: (params) => renderParallelFold(params)`(`registry.js:37-42`).
- `SVGPreview.jsx`: 다른 메커니즘과 동일 경로로 1페이지 도안 생성(`SVGPreview.jsx:44-53`). `instructionStyle: 'generic'`이므로 PDF 설명서는 공용 3단계 문구.
- `Preview3D.jsx`: `SUPPORTED_3D`에 포함(`Preview3D.jsx:17`). 단, **`registry.js`의 `defaultParams`가 단일 레벨(`{width:80, depth:30}`)만 지정하므로, 앱 UI를 통해 실제로 도달 가능한 3D 프리뷰는 단일 계단(=box-popup과 시각적으로 동일)뿐이다.** 다단 계단 코드 경로(`renderStairLevel`의 재귀, 접힘 방향 교대)는 `levels` 배열을 넘기는 별도 경로(예: 챗봇이 다단 파라미터를 생성하는 경우)가 아니면 실행되지 않는다.
- `Instructions.jsx`: `'generic'` 케이스 공유, parallel-fold 전용 삽화 없음.

## 이전 작업에서 배운 교훈

parallel-fold의 히스토리는 세 단계다.

1. **`4f9345e`("Fix select styling and implement parallel-fold mechanism logic")**: 이 시점엔 `SVGPreview.jsx`에 인라인으로 사각형/텍스트만 그리는 **자리표시자(placeholder)** 코드가 추가됐을 뿐, `src/generators/parallelFold.js` 자체는 아직 존재하지 않았다(파일 히스토리 확인 결과 `parallelFold.js`는 초기 커밋 `52ebea7`에서 이미 통째로 212줄짜리 완성된 모듈로 들어와 있었다).
2. **`6defbad`("Fix broken parallel-fold/pull-tab, add mechanism registry, vector PDF export")**: `parallelFold.js`(및 `pullTab.js`)는 `createTemplate()`(`svgBuilder.js`)과 `getLineStyles()`(`constants.js`)를 이미 import해서 쓰고 있었지만, **그 두 함수 자체가 그때까지 코드베이스에 존재하지 않았다** — 즉 이 두 생성기는 처음부터 완성된 기하 로직을 갖고 있었음에도 실행하면 즉시 에러가 나 "도달 불가능(unreachable)"했고, `SVGPreview.jsx`는 그 대신 조용히 자리표시자 사각형만 그리고 있었다. 이 커밋이 누락된 두 헬퍼 함수를 추가하고 `registry.js`를 도입해 실제 생성기가 처음으로 실행되게 만들었다.

> ⚠️ **후속 수정(2026-07)**: `b1367c1`은 "한 선에 CUT과 FOLD 중복" 버그를 지우면서 **접는선 쪽을 지우는 잘못된 선택**을 했다 — 마지막 레벨 바깥 모서리는 자유단이 아니라 조각의 유일한 카드 앵커(골접기)다. CUT을 남긴 결과 조각 둘레 전체가 절단선이 되어 조각이 탈락했다. 현재 코드는 골접기로 복원하고, 안쪽 경첩 방향도 골·산 교대 규칙(접기각 합 +90° 유도)으로 재정립했다. 교훈: 중복 표기를 지울 때는 "어느 쪽이 물리적으로 맞는가"를 단면 유도로 먼저 결정할 것.

3. **`b1367c1`("Fix parallel-fold cut/fold bug and add its 3D staircase preview")**: 실제로 처음 실행 가능해진 뒤에야 드러난 **진짜 기하 버그**를 고쳤다 — box-popup(`be0a85b`)과 **완전히 같은 버그 클래스**: 각 레벨의 바깥 모서리(`upperEnd`/`lowerEnd`)가 `cuts` 배열과 `mountainFolds` 배열 양쪽에 동일 좌표로 동시에 push되고 있었다. 커밋 메시지: "every level's outer edge was pushed into BOTH the cuts array AND the mountainFolds array with identical coordinates." 수정 내용:
   - 마지막 레벨: 바깥 모서리는 자유단이므로 전체 폭을 CUT으로만 남기고 중복된 `mountainFolds` push를 삭제.
   - 마지막이 아닌 레벨: 다음(더 좁은) 레벨의 폭 바깥쪽 "어깨" 구간만 CUT으로 자르고, 가운데 띠는 자르지 않은 채로 남겨(다음 레벨이 스스로 그릴 산접기 경첩이 되므로) 여기서 이중으로 라벨링하지 않음.
   - 커밋 메시지에 따르면 단일 레벨/3레벨 계단 양쪽에 대해 "cuts와 folds 두 배열에 동일 좌표 범위가 동시에 나타나지 않는지"를 별도 스크립트로 검증했다고 명시돼 있다.
   - 같은 커밋에서 3D 계단 프리뷰(`renderStairLevel` 재귀 + 레벨별 접힘 방향 교대)도 함께 추가됐다. 커밋 메시지: 단일 레벨 parallel-fold는 모든 각도에서 box-popup과 픽셀 단위로 동일하게 보임을 확인(당연한 결과 — box-popup이 곧 단일 레벨 케이스이므로). 다단 경로는 **레지스트리 기본값으로는 도달 불가능**해서, 검증을 위해 임시로 `registry.js`를 3레벨로 고쳐 스크린샷을 찍은 뒤 커밋 전에 되돌렸다고 명시돼 있다 — 즉 다단 계단 코드는 실제 운영 UI 경로로는 아직 한 번도 실사용자 눈에 노출된 적이 없다.

## 앞으로 작업 시 주의사항

- **"자르기 선과 접기 선이 동일 좌표에 중복 등록되지 않았는지" 항상 교차 검사한다.** 이 버그 패턴은 box-popup(`be0a85b`)과 parallel-fold(`b1367c1`) 양쪽에서 독립적으로 발생했다 — 이 코드베이스에서 가장 흔한 버그 클래스이므로 새 팝업 메커니즘을 작성하거나 기존 걸 수정할 때 `cuts`/`mountainFolds`/`valleyFolds` 배열에 같은 좌표 쌍이 두 번 이상 들어가지 않는지 자동/수동으로 검사하는 습관이 필요하다.
- **다단(`levels`) 경로는 레지스트리 기본값으로는 도달하지 않으므로, 실제로 여러 단을 사용하는 기능을 UI/챗봇에 노출하기 전에 반드시 실물(또는 최소한 3D 프리뷰) 검증을 다시 수행한다.** `b1367c1` 커밋 당시에도 "임시로 registry를 고쳐서 확인 후 되돌렸다"는 임시방편으로 검증했을 뿐, 회귀 테스트나 상시 검증 경로가 없다.
- **레벨 i>0의 산접기가 레벨 i-1이 "그리지 않은" 안 잘린 바깥 모서리와 정확히 일치하는지 좌표 단위로 재검증한다.** 두 레벨의 좌표 계산(`innerLeft`/`innerRight` vs. 다음 레벨의 `left`/`right`)이 어긋나면 접었을 때 계단면 사이에 미세한 틈이나 겹침이 생길 수 있다.
- **3D 프리뷰에서 접힘 방향 교대(짝수 `+γ`, 홀수 `-γ`)를 건드릴 때는 특히 조심한다.** 이 교대를 제거하거나 실수로 뒤집으면 회전이 나선형으로 누적되어 계단이 상승하는 대신 이전 레벨 안쪽으로 말려 들어가는(retract) 시각적 버그가 재발한다 — `b1367c1` 커밋 주석이 이 위험을 명시적으로 경고하고 있다.
- **`calculateParallelFoldHeight(totalDepth, alpha)`로 계산하는 "총 높이" 리드아웃은 근사값**이다(각 레벨이 부모 표면의 법선을 기준으로 독립적으로 기여하는 값의 단순 합) — 다단 계단의 실제 누적 3D 높이를 엄밀히 표시하려면 이 근사가 실제 좌표 합성과 얼마나 벌어지는지 검토가 필요하다.
