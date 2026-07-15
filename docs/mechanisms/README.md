# 종이공예 메커니즘 문서 (13종)

`src/generators/registry.js`의 `MECHANISM_REGISTRY`에 등록된 13종 메커니즘 각각에 대해, 작동 방식(접기/기구 기하학), 앱에서의 활용(SVGPreview/Preview3D/decorationSlots 연결), 이전 작업에서 배운 교훈(실제 커밋·버그 기반), 앞으로 작업 시 주의사항을 정리한 문서 모음이다.

각 문서는 6개 섹션(개요/작동 방식/활용/이전 작업에서 배운 교훈/앞으로 작업 시 주의사항)으로 구성되며, 소스 코드의 file:line을 인용해 검증된 내용만 담았다.

| 메커니즘 | 문서 | 3D 프리뷰 |
|---|---|---|
| 브이폴드 (V-Fold) | [v-fold.md](./v-fold.md) | ✅ |
| 상자 팝업 (Box Popup) | [box-popup.md](./box-popup.md) | ✅ |
| 평행 접기 (계단식 팝업) | [parallel-fold.md](./parallel-fold.md) | ✅ |
| 풀탭 (당기면 움직이는 장치) | [pull-tab.md](./pull-tab.md) | ❌ |
| 빨대 로켓 | [straw-rocket.md](./straw-rocket.md) | ❌ |
| 병풍 팝업 (지그재그 무대) | [accordion.md](./accordion.md) | ❌ |
| 돌림판 (돌리면 그림이 바뀌는 창문) | [volvelle.md](./volvelle.md) | ❌ |
| 반쪽 넘김판 (넘기면 그림이 바뀌는 접시) | [flip-disc.md](./flip-disc.md) | ❌ |
| 달팽이 스프링 (늘어나며 떠오르는 팝업) | [spiral-spring.md](./spiral-spring.md) | ❌ |
| 빛줄기 상승 슬라이드 | [rising-slide.md](./rising-slide.md) | ❌ |
| 층층이 무대 (성·마을이 겹겹이 솟는 팝업) | [layered-stage.md](./layered-stage.md) | ❌ |
| 열면 바뀌는 액자 카드 | [auto-slide-window.md](./auto-slide-window.md) | ❌ |
| 흔들 장치 (Scotch yoke) | [slide-to-swing.md](./slide-to-swing.md) | ❌ |

## 전체 공통 사항

- **선 표기 표준 (2026-07 통일)**: 모든 도안은 국제 종이공예/팝업 표기법(Yoshizawa–Randlett 계열)을 따른다 — 자르기=검정 실선, **골접기(안쪽으로)=점선 '4 2'(파랑)**, **산접기(바깥으로)=dash-dot '6 1.5 1.2 1.5'(빨강)**, 풀칠=초록 빗금 채움(`url(#glue-hatch)`, `svgBuilder.ensureGlueHatchDefs`), SCORE=자리 표시 전용(가는 회색 점선, 자르지도 접지도 않음). 흑백 모드에서도 대시 패턴은 동일해 패턴만으로 구분된다. 모든 페이지 하단 여백에 범례가 자동 인쇄된다(`svgBuilder.addLegend`; createTemplate가 호출, 자체 페이지를 만드는 gate-curtain은 직접 호출). 템플릿 척추 골선은 `createTemplate(paper, color, { spine, spineGaps })`로 생략/구간 제외할 수 있다 — 한 선에는 한 의미만 인쇄한다.
- **조립 안내 이중 관리**: 모든 메커니즘의 조립 설명은 `src/generators/registry.js`의 `INSTRUCTION_TEXT`(PDF 내보내기용 텍스트)와 `src/components/Preview/Instructions.jsx`(화면 표시용 일러스트)에 손으로 동기화되어 있다. 한쪽만 고치면 PDF와 화면 안내가 어긋난다.
- **3D 프리뷰는 3종뿐**: `src/components/Preview/Preview3D.jsx`의 `SUPPORTED_3D`에는 `v-fold`, `box-popup`, `parallel-fold`만 등록돼 있다. 나머지 10종은 "3D 미리보기 준비 중" 플레이스홀더만 표시된다. 새 메커니즘에 3D 프리뷰를 추가하려면 이 세트에 등록하고, 해당 메커니즘의 자유도(회전각 vs. 직선 이동 vs. 낱장 넘김 등)에 맞는 CSS 포즈 파라미터화를 새로 설계해야 한다.
- **`decorationSlots`는 소수 메커니즘만 정의**: 기본은 단일 100×100mm 폴백 슬롯이며, `layered-stage`만 벽 개수만큼 슬롯을 만드는 `decorationSlots(params)`를 정의한다(`resolveLayeredStageGeometry`를 렌더러와 공유해 드리프트를 방지).
- 각 문서의 "이전 작업에서 배운 교훈"은 실제 git 커밋(`git show <hash>`로 검증)과 코드의 방어적 장치(클램프, 불변식, NaN 방어 등)를 근거로 작성되었다.
