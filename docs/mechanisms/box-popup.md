# 상자 팝업 (box-popup)

## 개요

카드를 열면 척추 양옆에서 직사각형 상자 면이 수직으로 솟아올라 하나의 이어진 상자 앞면을 이루는 메커니즘. `registry.js`의 `labelKo`는 `'상자 팝업 (Box Popup)'`, `instructionStyle`은 `'generic'`(v-fold와 동일하게 전용 문구 없이 공용 3단계 설명을 사용), `defaultParams`는 `{ width: 40, height: 30 }`이다(`registry.js:31-36`). `width`는 상자의 폭(척추 방향, mm), `height`는 상자의 높이이자 척추로부터의 깊이(depth)이며, `boxPopup.js` 상단 주석에 명시된 대로 **평탄 접기(flat-foldable)가 성립하려면 반드시 depth == height, 즉 이 코드에서는 애초에 같은 값**으로 취급된다(`boxPopup.js:5-6`, `24`).

## 작동 방식

### 2D SVG 도안 (`src/generators/boxPopup.js`)

`generateBoxPopup(svg, options)`(`boxPopup.js:7-59`)이 실제 좌표를 계산한다.

- `hw = width / 2`, `d = height`(= depth)(`boxPopup.js:23-24`).
- **자르기 선(CUT)은 상자의 좌우 세로변만**이다: `(cx-hw, cy-d)~(cx-hw, cy+d)`와 `(cx+hw, cy-d)~(cx+hw, cy+d)`(`boxPopup.js:30-31`). 주석(`boxPopup.js:26-29`)이 명확히 경고한다: "위/아래 가로 변(cy-d, cy+d)은 반드시 안 잘려 있어야 한다 — 그게 상자 패널이 주변 카드에 붙어 있는 지점이기 때문이다. 거기까지 자르면 패널이 완전히 떨어져 나가 팝업을 세울 게 없어진다."
- 척추 산접기(MOUNTAIN_FOLD): `(cx-hw, cy)~(cx+hw, cy)`(`boxPopup.js:34`) — 상자가 시청자 쪽으로 튀어나오므로 산접기.
- 위/아래 골접기(VALLEY_FOLD): `(cx-hw, cy-d)~(cx+hw, cy-d)`와 `(cx-hw, cy+d)~(cx+hw, cy+d)`(`boxPopup.js:37-38`) — 상자가 평평한 카드 면에 실제로 붙는 자리.
- 풀칠 탭(GLUE_TAB): 좌우 변에 사다리꼴 두 개(`boxPopup.js:41-54`).
- `renderBoxPopup(params)`(`boxPopup.js:68-78`)이 `createTemplate()`으로 인쇄 페이지를 만들고 `cx=paper.width/2`, `cy=spineY`로 `generateBoxPopup`을 호출한다.

### 3D 조립 포즈 미리보기 (`src/components/Preview/Preview3D.jsx`)

`Preview3D.jsx`의 주석은 box-popup을 "v-fold와 완전히 동일한 위상(topology)"으로 명시한다(`Preview3D.jsx:129-149`): 척추에서 depth `d`(=box의 `height` 파라미터)만큼 떨어진 두 부착점 + 척추에 있는 공유 크리스 하나. 차이는 뾰족한 삼각형 대신 폭이 있는 직사각형이라는 점뿐이다.

- v-fold와 동일한 대칭 굽힘 각 `a = α/2`를 쓰되, `calculateParallelFoldHeight(boxDepth, alpha)`(단일 레벨용 `h = d·sin a` 공식, `utils/math.js:82-85`)로 `h`를 구하고 `γ = arcsin(h/d)`를 계산한다(`Preview3D.jsx:249-252`).
- v-fold와 달리 **복합 `rotate3d`가 필요 없다**: 직사각형의 부착 모서리가 이미 척추와 평행(=페이지 자신의 `rotateY` 축과 평행)하기 때문에, 코드 주석상으로는 "플랩의 바깥(부착) 모서리를 피벗으로 삼는 단순한 두 번째 `rotateY`"로 설명되어 있다(`Preview3D.jsx:139-142`).
- 다만 실제 구현 코드(`Preview3D.jsx:258-276`)는 v-fold 팔과 **동일한 `rotate3d(-sin a, 0, ∓cos a, γ°)` 조합**을 그대로 재사용하고 있다 — 즉 v-fold의 "검증된(PROVEN)" 회전 조합을 그대로 가져다 썼다는 것이 `be0a85b` 커밋 메시지에도 나온다("an early attempt with a naive single-axis rotateY produced an edge-on/invisible panel instead of one facing the viewer" → 결국 v-fold와 동일한 rotate3d 조합으로 교체). 주석의 서술(단순 rotateY)과 실제 구현(rotate3d 재사용)이 다르므로, 코드를 수정할 때는 **주석보다 실제 `flapLiftLeft`/`flapLiftRight` 계산식(`Preview3D.jsx:261-262`)을 신뢰**해야 한다.
- `a=0`에서 플랩은 이미 edge-on인 자기 페이지와 동일 평면에 있어 숨고, `a=90`(α=180)에서 플랩이 90도 회전해 자유(척추 쪽) 모서리가 시청자를 정면으로 향하며 높이 `d`에 도달한다. 좌우 폭(`width`)이 같고 같은 중심선에 정렬돼 있어 두 플랩의 자유 모서리가 항상 일치해 하나의 이어진 평평한 상자 면을 이룬다.

## 활용

- `registry.js`: `'box-popup'` 엔트리가 `render: (params) => renderBoxPopup(params)`(`registry.js:31-36`).
- `SVGPreview.jsx`: v-fold와 동일한 경로로 `mech.render(params)` 호출 후 1페이지에 도안을 그린다(`SVGPreview.jsx:44-53`). PDF 설명서 페이지는 `INSTRUCTION_TEXT.generic`을 사용.
- `Preview3D.jsx`: `SUPPORTED_3D`에 포함(`Preview3D.jsx:17`). `mechanism === 'box-popup'` 분기는 v-fold/parallel-fold 둘 다 아닌 `else` 블록으로 처리된다(`Preview3D.jsx:241-277`) — 조건문 순서상 마지막 `else`이므로, 향후 새 3D 지원 메커니즘을 추가할 때 이 `else`를 `else if (mechanism === 'box-popup')`으로 명시적으로 바꿔야 실수로 box-popup 코드 경로가 다른 메커니즘에 잘못 적용되는 것을 막을 수 있다(현재는 `SUPPORTED_3D`에 세 개만 있어 문제 없지만 네 번째 3D 메커니즘 추가 시 위험).
- `Instructions.jsx`: `'generic'` 케이스 공유(`Instructions.jsx:870-920`), box-popup 전용 삽화 없음.

## 이전 작업에서 배운 교훈

`be0a85b` 커밋이 **실제 자르기/접기 도안의 버그**를 고쳤다: 원래 코드는 상자의 위/아래 가로 변(`cy-d`, `cy+d`)을 **자르기 선과 골접기 선 둘 다로 동시에** 그리고 있었다(동일 좌표에 CUT과 VALLEY_FOLD 두 스타일을 겹쳐 그림). 커밋 메시지가 명시하듯: "조립 설명서가 시키는 대로 모든 실선을 자르면, 상자 패널이 카드에서 완전히 떨어져 나가 팝업을 지탱할 게 아무것도 남지 않는다." 즉 사용자가 설명서대로 실선을 다 오리면 상자 패널 자체가 카드에서 분리되어 버리는 치명적 버그였다.

수정은 단순히 위/아래 가로 변의 **중복된 CUT push를 제거**하고 VALLEY_FOLD만 남긴 것이다(`be0a85b` diff, `boxPopup.js`의 "1. Cut Lines" 섹션에서 가로 방향 두 줄 삭제). 세로 변(좌우)만 CUT으로 남아 상자 옆면의 실루엣을 만들고, 위/아래는 골접기로 남아 패널이 카드에 붙은 채 접힌다.

같은 커밋에서 3D 프리뷰도 함께 추가됐는데, v-fold 3D 코드(`e5e95f4`에서 이미 검증된 부모-자식 nesting + `rotate3d` 조합)를 거의 그대로 재사용했다. 커밋 메시지에 "an early attempt with a naive single-axis rotateY produced an edge-on/invisible panel"이라는 언급이 있다 — 즉 처음엔 box-popup이 직사각형이라 단순 회전으로 충분할 거라 가정했지만 실제로는 edge-on(보이지 않는 각도)으로 렌더링되는 실패를 겪었고, 결국 v-fold의 검증된 `rotate3d` 방식을 그대로 가져와야 실제로 시청자를 향하는 면이 나왔다. α = 0/45/90/135/180에서 시각 검증 완료(커밋 메시지 기준).

## 앞으로 작업 시 주의사항

- **동일 좌표에 CUT과 FOLD를 동시에 그리지 않았는지 항상 확인한다.** `be0a85b`가 고친 버그의 근본 패턴(같은 선을 자르기+접기 이중으로 등록)은 parallel-fold(`b1367c1`)에서도 똑같이 반복됐다 — 이 프로젝트에서 반복적으로 나타나는 버그 클래스이므로, 새 메커니즘을 만들거나 기존 것을 수정할 때 **모든 push된 path 좌표를 cuts/mountainFolds/valleyFolds 배열 간에 교차 검사**하는 습관이 필요하다(동일 좌표 쌍이 두 배열에 동시에 있으면 버그).
- **"완성 시 조립 설명서대로 실선을 다 오리면 패널이 카드에서 완전히 분리되지 않는지" 실물 기준으로 재현해 본다.** 이 버그는 시각적으로는 도안이 그럴듯해 보여도 실제로 오리고 접어봐야 드러난다.
- **`width`와 `height`(=depth)를 독립적으로 크게 벌리는 기능을 추가하기 전에**, `boxPopup.js` 파일 상단 주석의 "Math: depth MUST equal height for flat-foldability (d = h)" 제약이 실제로 강제되고 있는지 확인한다 — 현재 코드는 `height` 하나로 `depth`를 대신하고 있어(`d = height`) 이 제약이 코드 구조상 자동으로 지켜지지만, 파라미터를 분리하는 리팩터를 하게 되면 이 제약을 명시적으로 검증(clamp 등)해야 평탄 접기가 깨지지 않는다.
- **3D 프리뷰 코드를 고칠 때 주석과 실제 구현이 어긋나 있음에 주의**: `Preview3D.jsx`의 서술 주석(`139-142`)은 "단순 rotateY"라고 말하지만 실제 코드(`258-276`)는 v-fold와 동일한 `rotate3d` 조합을 쓴다. 코드를 읽을 때 주석만 보고 판단하지 말고 실제 `flapLiftLeft`/`flapLiftRight` 계산을 반드시 확인한다.
- **`else` 분기로 처리되는 box-popup 3D 코드**(`Preview3D.jsx:241`) — 새로운 3D 지원 메커니즘을 추가할 때 이 catch-all `else`가 의도치 않게 새 메커니즘에 적용되지 않도록, 명시적 `else if (mechanism === 'box-popup')`로 바꾸는 편이 안전하다.
