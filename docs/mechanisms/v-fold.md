# 브이폴드 (v-fold)

## 개요

카드 척추(spine) 한가운데서 V자 모양으로 갈라진 두 팔이 카드를 열면 산 모양으로 솟아오르는 가장 기본적인 팝업 메커니즘이다. `registry.js`의 `labelKo`는 `'브이폴드 (V-Fold)'`, `instructionStyle`은 `'generic'`(전용 문구 없이 공용 "오리기/접기/풀칠" 3단계를 그대로 사용), `defaultParams`는 `{ armLength: 40, angle: 45 }`다 (`src/generators/registry.js:25-30`). `armLength`는 V자 팔의 길이(mm), `angle`은 척추 기준 팔의 반각(half-angle, 도 단위)이다.

## 작동 방식

### 2D SVG 도안 (`src/generators/vfold.js`)

`generateVFold(svg, options)` (`src/generators/vfold.js:9-73`)이 실제 좌표를 계산한다.

- 파일 상단 주석의 공식: `β = 2·arcsin(k·sin(α/2))` (k=1이면 β=α), `h = L·sin(β/2)` (`vfold.js:5-7`). 단, 2D 생성기 자체는 이 공식으로 "열림 각도"를 렌더링하지 않는다 — 2D 도안은 항상 `angle`(기본 45°) 하나로 고정된 평면 전개도(자르고 접기 전 상태)만 그린다. 이 β/h 공식은 실제로는 `Preview3D.jsx`의 3D 포즈 계산에서 재사용된다(아래 참조).
- 팔 끝점 계산 (`vfold.js:25-32`):
  ```
  angleRad = angle(deg) → rad
  dx = armLength · cos(angleRad)
  dy = armLength · sin(angleRad)
  leftX = cx - dx,  rightX = cx + dx,  topY = cy - dy
  ```
  즉 척추 중심 `(cx, cy)`에서 반각 `angleRad`만큼 벌어진 두 방향으로 `armLength`만큼 뻗은 점이 V자의 양 끝이다.
- 자르기 선(CUT): 중심 `(cx,cy)`에서 `(leftX,topY)`, `(rightX,topY)`로 이어지는 두 직선(`vfold.js:35-36`) — 이것이 V자 팔 자체의 실루엣이다.
- 척추 골접기(VALLEY_FOLD): `(cx,topY)`~`(cx,cy)` (`vfold.js:39`) — 척추를 따라 팝업이 접히는 선.
- 산접기(MOUNTAIN_FOLD): `baseFoldY = topY - 15`로 임의로 15mm 띄운 뒤, 각 팔 끝에서 `(cx, baseFoldY)`로 이어지는 두 선(`vfold.js:41-48`). 코드 주석에 `// Wait, standard V-fold cut from center: ... Base folds parallel to spine? No, V-fold bases are angled.`라는 실토 섞인 주석이 남아 있다(`vfold.js:45-46`) — 이 산접기의 기하학적 근거(왜 15mm 오프셋인지, 왜 이 각도가 맞는지)는 코드에 검증되어 있지 않다. 수정 시 실제로 종이가 이 선을 따라 접었을 때 팔이 자연스럽게 세워지는지 실물로 확인이 필요하다.
- 풀칠 탭(GLUE_TAB): 팔 좌우에 사다리꼴로 하나씩(`vfold.js:55-67`), `addText`로 `'풀칠'` 라벨(`vfold.js:69-70`).
- `renderVFold(params)`(`vfold.js:82-92`)가 `createTemplate()`으로 인쇄 가능한 페이지(트림 마진 + 척추 골접기)를 만들고, `cx = paper.width/2`, `cy = spineY`를 넣어 `generateVFold`를 호출한다.

### 3D 조립 포즈 미리보기 (`src/components/Preview/Preview3D.jsx`)

`Preview3D.jsx`는 순수 CSS 3D transform으로 "카드를 α도 열었을 때" 포즈를 렌더링하는 **별도의 것**이다 — vfold.js의 2D 평면 좌표를 재사용하지 않고, `utils/math.js`의 공식(`calculateVFoldAngle`, `calculatePopupHeight`)을 유일한 진실 소스로 삼아 각도만 재해석한다(`Preview3D.jsx:82-85` 주석). 공유하는 파라미터는 `armLength` 하나뿐이다.

좌표계: x=오른쪽, y=아래, z=시청자 쪽(`Preview3D.jsx:87-88`). 척추는 x=0 수직선, 카드 평면은 z=0.

- `α` = 카드 열림 각도(슬라이더로 0~180 조절), `a = α/2` (`Preview3D.jsx:90-91`).
- `θ_page = (180-α)/2 = 90-a` — 각 페이지가 척추를 축으로 `rotateY(±θ_page)` 회전(`Preview3D.jsx:92-95`, 실제 적용은 `Preview3D.jsx:284-303`).
- `β = calculateVFoldAngle(α)`(대칭이므로 `=α`), `h = calculatePopupHeight(armLength, β) = L·sin(a)`, `γ = arcsin(h/L) = a`(`Preview3D.jsx:96-98`, `184-187`).
- 핵심 설계 포인트(`Preview3D.jsx:100-126` 주석): 정점(apex)은 대칭평면 위 월드좌표 `A = (0, -L·cos a, L·sin a)`에 있어야 하고, 좌우 두 팔의 끝이 항상 이 A에서 만나야 한다. 페이지의 `rotateY(±θ)`와 팔의 자체 접힘은 **서로 다른 축**에 대한 회전이라 각도를 단순히 더할 수 없다. 그래서 각 팔을 자기 페이지의 실제 DOM 자식으로 두어 `preserve-3d`로 부모의 `rotateY`를 상속받게 하고, 그 위에 자기만의 `rotate3d()`를 얹는다:
  ```
  left  arm:  rotate3d(-sin a, 0, -cos a, a°)
  right arm:  rotate3d(-sin a, 0, +cos a, a°)
  ```
  (코드: `Preview3D.jsx:189-194`) 페이지의 회전 피벗과 팔의 회전 피벗이 같은 척추 중심점 O이기 때문에 어느 α에서든 두 팔 끝이 정확히 같은 A에 도달한다. α=0일 때 팔은 자기 페이지와 함께 x=0 평면 속으로 들어가 완전히 숨는다(즉 화면에 edge-on으로 보여 사실상 보이지 않음).
  코드가 명시하는 의도적 타협(`Preview3D.jsx:122-126`): 단일 고정 크리스(crease) 위의 이상적인 강체 거싯(gusset)은 h=L·sin a를 정확히 만족시키면서 동시에 정점을 대칭평면에 유지할 수 없으므로, 매 프레임마다 접힘 축을 다시 계산해서 h와 "끝점이 만난다"는 조건만 정확히 지킨다 — 팔의 자유로운 바깥쪽 모서리는 미세하게 미끄러지지만 이 단순화된 포즈 프리뷰에서는 육안으로 티가 나지 않는다.

## 활용

- `registry.js`: `'v-fold'` 엔트리가 `render: (params) => renderVFold(params)`로 연결(`registry.js:25-30`). `buildMechanismParams()`가 `defaultParams`+`paperSize`+`colorMode`+`theme`을 합쳐 `render()`에 넘긴다.
- `SVGPreview.jsx`: `getMechanism(cardParams.mechanism)`으로 등록된 렌더러를 찾아 1페이지(도안)를 만들고(`SVGPreview.jsx:44-53`), 이후 장식 이미지 페이지들을 추가한다. PDF 내보내기 시 `INSTRUCTION_TEXT[mech.instructionStyle]`(v-fold는 `'generic'`)을 vector PDF의 설명서 페이지에 그대로 싣는다(`SVGPreview.jsx:231-238`).
- `Preview3D.jsx`: `SUPPORTED_3D = new Set(['v-fold', 'box-popup', 'parallel-fold'])`에 포함되어(`Preview3D.jsx:17`) 3D 조립 포즈 슬라이더가 동작한다. `mechanism === 'v-fold'`분기(`Preview3D.jsx:181-214`)에서 위 공식을 계산해 `preview3d-arm-left/right` div의 `transform`을 세팅한다.
- `Instructions.jsx`: `instructionStyle === 'generic'` 케이스(`Instructions.jsx:870-920`)가 "오리기 → 접기(산/골) → 풀칠하여 조립하기" 3단계의 범용 삽화를 보여준다. v-fold 전용 삽화나 문구는 없다.

## 이전 작업에서 배운 교훈

`2f0308a`(3D 프리뷰 최초 추가) 이후 `e5e95f4`에서 실제 버그가 발견되어 수정됐다: **카드를 닫아도(α=0) 팝업 팔이 계속 화면에 보이는 버그**.

근본 원인(`git show e5e95f4` 커밋 메시지 및 diff 확인): 최초 구현에서 팔(arm) div들이 페이지(page) div의 **형제(sibling)** 노드였다 — 좌우 팔의 끝이 공유 정점에서 만나도록 하기 위해 일부러 페이지에서 분리해 별도의 `.preview3d-vfold` 컨테이너 아래 두었다. 그런데 `rotateY(gamma)/rotateY(-gamma)`라는 단일 축 회전만 적용했기 때문에, 페이지가 `rotateY(θ_page)`로 닫혀도 팔은 페이지의 회전을 전혀 상속받지 못하고 월드 좌표계의 정지 자세를 유지했다 — 즉 α=0에서 페이지는 정확히 접히는데 팔은 그대로 카메라를 향한 채 남아 있었다.

수정: 각 팔을 실제로 자기 페이지의 DOM 자식으로 재배치해 `preserve-3d`로 페이지의 `rotateY`를 상속받게 하고, 그 위에 얹을 팔 자신의 회전을 `rotate3d(-sin a, 0, ∓cos a, a°)`로 다시 유도했다(정점이 여전히 같은 월드 좌표 A에서 만나도록 축을 매 프레임 재계산). 커밋 메시지에 따르면 α = 0/30/60/90/120/150/180에서 팁 간격(tip gap)이 0.00mm임을 수치로도, 스크린샷으로도 검증했다.

## 앞으로 작업 시 주의사항

- **닫힌 상태(α=0)에서 3D 프리뷰가 실제로 안 보이는지 반드시 확인한다.** 슬라이더를 0으로 내렸을 때 팔이 edge-on으로 사라지는지 스크린샷 또는 브라우저에서 직접 확인 — `e5e95f4`가 고친 버그가 정확히 이 케이스였다.
- **팔/플랩을 자기 페이지의 DOM 자식으로 둘 것.** 페이지와 형제 관계로 분리하면 `preserve-3d` 상속이 끊기고 위와 동일한 버그가 재발한다. 새로운 하위 요소를 추가할 때도 이 부모-자식 nesting 규칙을 지켜야 한다(box-popup/parallel-fold도 동일 패턴).
- **두 팔의 회전 축이 같은 피벗(척추 중심 O)을 공유하는지 검증한다.** 각도만 맞고 피벗이 어긋나면 좌우 팔 끝이 벌어지는(정점이 갈라지는) 시각적 버그가 생긴다. 여러 α 값(0/45/90/135/180)에서 팁이 실제로 만나는지 확인.
- **2D 도안(`vfold.js`)의 산접기 위치(`baseFoldY = topY - 15`)는 임의 상수로, 근거 주석이 스스로 "Wait, standard V-fold cut from center..."라며 확신 없음을 인정하고 있다.** `armLength`/`angle`을 크게 바꿔 사용하는 기능을 추가하기 전에, 이 15mm 오프셋이 실제 종이 접기에서 유효한 범위인지(팔이 접혔을 때 척추 위 다른 요소와 겹치지 않는지, 각도가 지나치게 좁거나 넓을 때도 유효한지) 실물 프린트로 검증해야 한다.
- **2D 생성기와 3D 프리뷰는 서로 다른 소스(파일)에서 각도를 계산한다** — 2D는 고정된 `angle` 파라미터로 정적 전개도만 그리고, 3D는 `calculateVFoldAngle`/`calculatePopupHeight`(`utils/math.js`)로 열림 각도에 따른 동적 포즈를 그린다. 두 값의 "의미"가 다르다는 것(2D의 `angle`=팔의 벌어진 반각, 3D의 `α`=카드 열림 각도)을 혼동하지 않도록 주의.
- **`instructionStyle: 'generic'`이라 v-fold 전용 조립 설명 문구/삽화가 없다.** `registry.js`의 `INSTRUCTION_TEXT.generic`(`registry.js:125-134`)과 `Instructions.jsx`의 `case 'generic'`(`Instructions.jsx:870-920`)은 모든 범용 메커니즘이 공유하므로, v-fold만의 조립 팁(예: 팔 각도가 좁을 때 풀칠 요령)을 추가하려면 새 `instructionStyle` 키를 만들고 두 파일을 함께 고쳐야 한다(아래 "Instructions.jsx/registry.js 드리프트" 항목 참고).
