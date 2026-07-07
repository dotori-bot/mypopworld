# CLAUDE.md

## Orchestration

이 세션의 오케스트레이터는 다음 기준으로 작업을 위임한다:

- **추론이 무거운 단계** (새 종이공예 메커니즘의 접기 수식/각도 계산, 인쇄 가능성 검증, 아키텍처 결정): `deep-reasoner` 서브에이전트(Opus)에게 위임한다.
- **기계적인 일** (반복 리팩터, 여러 파일 일괄 수정, 조사/탐색): `general-purpose` 또는 `Explore` 서브에이전트에게 위임한다.
- **고부담 결정** (신규 메커니즘 채택, 큰 구조 변경 등): 가능하면 `deep-reasoner`를 병렬로 여러 관점에서 실행하거나 결과를 교차 검증한 뒤 종합한다.
- 오케스트레이터 자신의 컨텍스트는 가볍게 유지하고, 조사 결과나 긴 산출물은 서브에이전트가 요약해서 보고하게 한다.

> Codex CLI/플러그인은 이 환경에 설치되어 있지 않다 (마켓플레이스 출처를 검증할 수 없어 임의 설치하지 않음). "새로운 관점"이 필요한 경우 현재는 `deep-reasoner`를 대체 경로로 사용한다. 사용자가 검증된 마켓플레이스 소스를 제공하면 재검토한다.

## Project shape (for quick orientation)

- `src/generators/*.js` — 각 종이공예 메커니즘("공예 공식")의 SVG 생성 로직. `constants.js`에 종이 크기(A4/Letter)와 인쇄 안전 마진, 선 스타일이 정의되어 있다.
- `src/generators/registry.js` — 메커니즘 id → 렌더 함수/기본 파라미터/`paramSchema`(전문가 모드 편집 메타데이터)/`sceneType`('book'|'flat')/조립 설명서를 매핑하는 단일 소스(`MECHANISM_REGISTRY`, `INSTRUCTION_TEXT`). 새 메커니즘 추가 시 이 파일(+`paramSchemas.js` 스키마 1개)만 건드리면 된다.
- `src/generators/paramSchemas.js` — 15종 전체의 슬라이더 메타데이터. min/max는 각 생성기의 클램핑 resolver를 극단값으로 "프로브"해 얻으므로 UI 한계·인쇄 클램프·경고(`validation.js`)가 한 소스를 공유한다.
- `src/store/cardModel.js` — 카드 데이터 모델 정규화. v1(단일 mechanism, AI 챗 출력)과 v2(`elements[]` 다중 메커니즘 조합)를 `getElements()` 한 곳에서 흡수한다. 조합 규칙은 `src/generators/compatibility.js`(척추 구간 겹침 검사 등), 조합 배치도 페이지는 `src/generators/assemblyMap.js`.
- `src/components/Chat/ChatWindow.jsx` + `api/chat.js` — Gemini 기반 대화형 아이디어 제안 챗봇(어린이 모드). v1 cardParams만 발행한다.
- `src/components/Expert/*` — 전문가 모드(헤더 토글): 메커니즘 직접 선택(`MechanismPicker`), 전 파라미터 실시간 편집(`ParamPanel`, 150ms 디바운스 커밋), 요소 추가/삭제/배치(`ExpertPanel`).
- `src/components/Preview/SVGPreview.jsx` — 메커니즘별 도안을 조립해 미리보기/PDF로 만드는 곳. 도안 페이지(동기)와 장식 페이지(비동기, 입력 핑거프린트가 바뀔 때만 Pollinations 재요청)를 분리한 2개 이펙트 구조.
- `src/components/Preview/Preview3D.jsx` — CSS 3D 기반 조립 자세 시뮬레이터. 카드를 여닫는 "책형" 메커니즘은 열림 각도 α 슬라이더로(장면 빌더는 `bookScenes.jsx`), 평면형(슬라이더·돌림판 등) 메커니즘은 `flatScenes.jsx`의 전용 드라이브 슬라이더(당기기/밀기/돌리기/넘기기/불기/여닫기)로 구동한다. 다중 조합 카드는 책형 요소들을 spineOffset만큼 이동시켜 α 하나로 동시 구동하고, 평면형 요소는 개별 보기로 전환한다.
- `src/components/Preview/flatScenes.jsx` — 평면형 메커니즘(pull-tab, rising-slide, slide-to-swing, volvelle, flip-disc, straw-rocket, camera-print-pull, gate-curtain)의 구조 충실 3D 장면 빌더. 부품 배치는 생성기의 resolver 지오메트리를 그대로 쓰고, 종이 한 장당 translateZ 한 층씩 쌓아 카메라를 돌리면 뒷면 구조(손잡이·멈춤 띠·안내 띠·고정 캡)가 실제 조립 순서대로 보인다.
- `src/components/Preview/Instructions.jsx` — 메커니즘별 조립 가이드(정적).

## 종이공예 메커니즘 목록

`src/generators/registry.js`의 `MECHANISM_REGISTRY`에 등록된 전체 메커니즘. id, 생성 파일, 한 줄 설명 순.

| id | 생성 파일 | 설명 |
| --- | --- | --- |
| `v-fold` | `vfold.js` | 카드를 열면 가운데 능선이 앞으로 솟는 삼각형 팝업(가장 기본적인 팝업 형태). |
| `box-popup` | `boxPopup.js` | 카드를 열면 사각 상자 모양이 입체적으로 펼쳐지는 팝업. |
| `parallel-fold` | `parallelFold.js` | 지그재그 계단처럼 층이 앞뒤로 겹쳐 솟는 평행 접기(계단식) 팝업. |
| `pull-tab` | `pullTab.js` | 손잡이를 옆으로 당기면 슬라이더가 트랙을 따라 움직이는 장치. |
| `straw-rocket` | `strawRocket.js` | 종이 튜브를 말아 붙이고 빨대를 꽂아 불면 날아가는 로켓. |
| `accordion` | `accordionPopup.js` | 병풍처럼 지그재그로 접힌 띠가 카드를 열면 무대처럼 서는 팝업. |
| `volvelle` | `volvelle.js` | 겹쳐진 원판을 손으로 돌리면 창문 속 그림이 바뀌는 돌림판. |
| `flip-disc` | `flipDisc.js` | 반원 조각들을 책장처럼 한 장씩 넘기면 접시 그림이 바뀌는 장치. |
| `spiral-spring` | `spiralSpring.js` | 소용돌이 모양으로 오린 종이가 카드를 열면 스프링처럼 위로 늘어나는 팝업. |
| `rising-slide` | `risingSlide.js` | 손잡이를 위로 당기면 그림이 슬롯(빛줄기)을 따라 위로 올라가는 슬라이드. |
| `layered-stage` | `layeredStage.js` | 카드를 열면 여러 겹의 벽(성·마을 등)이 서로 다른 깊이에서 층층이 솟는 팝업. |
| `auto-slide-window` | `autoSlideWindow.js` | 카드를 여닫는 동작만으로 지지대(팔)가 슬라이더를 밀어 창문 속 그림이 저절로 바뀌는 액자 카드. |
| `slide-to-swing` | `slideToSwing.js` | 손잡이를 좌우로 밀면 핀-슬롯 연결을 통해 회전하는 기둥 위 장식이 시계추처럼 흔들리는 장치. |
| `gate-curtain` | `gateCurtain.js` | 양쪽 문(게이트폴드)을 열면 문에 스트랩으로 연결된 노란 커튼 두 장이 좌우로 걷히며 가운데 주인공이 드러나는 카드. |
