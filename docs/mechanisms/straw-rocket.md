# 빨대 로켓 (straw-rocket)

## 개요

사용자가 챗봇에서 "빨대 로켓" 계열 아이디어를 고르면, 도안 1페이지에 종이 튜브(관)와 앞/뒤 장식 실루엣이 출력된다. 이 튜브를 말아 붙이고 윗부분을 막은 뒤 빨대에 꽂아 불면, 밀폐된 공기가 튜브를 밀어내며 로켓처럼 날아간다. `src/generators/registry.js:49-54`의 등록 내용은 다음과 같다.

- `labelKo: '빨대 로켓'`
- `render: (params) => renderStrawRocket(params)`
- `defaultParams: {}`
- `instructionStyle: 'straw-rocket'`

다른 메커니즘(예: accordion의 `{ a, panels, wallHeight }`, flip-disc의 `{ R, pages }`)과 달리 `defaultParams`가 **빈 객체**다. 이유는 `strawRocket.js`에 사용자가 조절할 만한 수치형 파라미터(길이/각도 등)가 애초에 없기 때문이다 — 튜브 폭(25mm)·튜브 높이(40mm)·풀칠 탭 폭(6mm)·윗면 밀폐 탭 높이(8mm)가 전부 "표준 6mm 빨대에 헐렁하게 맞는 원통"을 만들기 위한 **고정 상수**로 소스에 하드코딩되어 있다(`strawRocket.js:25-27,47`). `buildMechanismParams()`(`registry.js:257-261`)는 모든 메커니즘에 공통으로 `theme`을 얹어주므로, straw-rocket이 실제로 받는 유일한 "파라미터"는 앞/뒤 장식에 쓰일 `theme` 문자열뿐이다. 즉 이 메커니즘은 종이 접기/팝업이 아니라 **말아서 만드는 원통(튜브)을 입으로 불어 날리는 장치**이며, 다른 메커니즘들의 "산접기/골접기 팝업" 패러다임과는 근본적으로 다르다.

## 작동 방식

`generateStrawRocket(svg, options)` (`src/generators/strawRocket.js:8-79`)가 실제 도형을 그린다.

1. **튜브 본체** (`strawRocket.js:25-44`): `tubeWidth = 25`, `tubeHeight = 40`, `tabWidth = 6`. `tubeX = cx - (tubeWidth + tabWidth) / 2`로 중심을 맞춰, 폭 `tubeWidth + tabWidth`(=31mm)·높이 `tubeHeight`(=40mm)짜리 직사각형을 CUT 실선으로 그린다. `tubeX + tubeWidth` 위치에 MOUNTAIN_FOLD 선을 그어 "본체"와 "풀칠 탭"을 구분하고, 탭 영역은 GLUE_TAB(초록) 폴리곤으로 표시한다. 주석(`strawRocket.js:23-24`)에 따르면 6mm 빨대의 둘레는 약 19mm인데, 25mm로 만들어 "헐렁하게" 감쌀 여유와 풀칠 겹침분을 확보한 것이다.
2. **윗면 밀폐 탭** (`strawRocket.js:46-56`): `sealHeight = 8`. 튜브 상단에 `tubeWidth × sealHeight` 크기의 날개를 CUT으로 추가하고, 튜브 상단 경계선을 MOUNTAIN_FOLD로 표시, 날개 전체를 GLUE_TAB으로 칠한다. 이 날개를 접어 풀칠하면 튜브 위쪽이 완전히 막혀, 빨대로 불었을 때 공기가 새지 않고 튜브를 밀어낸다.
3. **장식 실루엣** (`strawRocket.js:58-72`): `decWidth = 60`, `decHeight = 50` 크기의 앞면/뒷면 자리표시자 사각형을 CUT으로 그리고, 그 안에 `[${theme} 앞면]` / `[${theme} 뒷면]` 텍스트를 넣는다. **이 사각형은 테마 모양을 따라 잘린 실루엣이 아니라 순수한 플레이스홀더 네모다** — 실제 테마 그림(로켓·나비·새 등)은 아트웍이 아니라 이 네모 안에 들어갈 라벨 텍스트로만 표현된다.
4. **`renderStrawRocket(params)`** (`strawRocket.js:89-99`): `createTemplate(paperSize, colorMode)`로 페이지 틀(트림 마진 + 중앙 척추선)을 만들고, `cx = paper.width / 2`, `cy = spineY`를 계산해 `generateStrawRocket`에 넘긴다. 즉 튜브/장식의 절대 좌표는 종이 크기에 따라 자동으로 중앙 정렬되지만, 그 **크기 자체는 A4든 Letter든 항상 고정된 25×40mm**다 — accordion/flip-disc처럼 `resolveXxxGeometry()`로 종이 크기에 맞춰 클램핑하는 로직이 없다. A4(210×297mm)와 Letter(215.9×279.4mm) 양쪽에서 우연히 여백 안에 들어맞을 뿐, 명시적으로 검증된 것은 아니다.

조립 물리: 원통 둘레(25mm)를 이루는 사각형을 말아 `풀칠` 탭(6mm)에 겹쳐 붙이면 지름 약 8mm의 원통이 되어 6mm 빨대에 헐렁하게 들어간다. 위쪽 날개(8mm)를 접어 붙이면 원통 상단이 막힌 캡슐이 되고, 아래쪽은 열려 있어 빨대를 꽂을 수 있다. 빨대로 불면 압축된 공기가 막힌 윗면을 밀어 원통이 빨대에서 빠져나가며 날아간다 — 이는 종이접기 각도 계산이 아니라 순수히 "밀폐된 관 + 피스톤" 물리다.

## 활용

- `SVGPreview.jsx`는 `getMechanism('straw-rocket')`을 통해 `mech.render(params)` → `renderStrawRocket()`을 호출해 1페이지 도안을 만든다(`SVGPreview.jsx:44-53`).
- 장식은 두 겹으로 존재한다: (a) 위에서 설명한, 메커니즘 자체가 그리는 플레이스홀더 네모, (b) `getDecorationSlots()`(straw-rocket은 `decorationSlots`를 정의하지 않으므로 `registry.js:279-287`의 기본값인 단일 100×100mm 슬롯)을 통해 `SVGPreview.jsx`가 별도 페이지에 생성하는 AI 이미지/자유 그리기 안내 페이지. 사용자는 이 별도 페이지의 그림을 오려서 메커니즘 페이지의 플레이스홀더 네모 위에 붙이는 방식으로 완성한다.
- PDF 내보내기 시 `INSTRUCTION_TEXT['straw-rocket']`(`registry.js:135-145`)의 텍스트가 조립 설명서 페이지로 포함된다(`SVGPreview.jsx:231-238`).
- **3D 프리뷰: 미지원.** `Preview3D.jsx:17`의 `SUPPORTED_3D = new Set(['v-fold', 'box-popup', 'parallel-fold'])`에 `'straw-rocket'`이 없어, 항상 "이 메커니즘은 아직 3D 미리보기를 준비 중이에요" 플레이스홀더가 표시된다(`Preview3D.jsx:157-165`). 게다가 기존 3종의 3D 프리뷰는 전부 평평한 사각형/삼각형 패널을 척추 축으로 `rotate3d`/`rotateY` 회전시키는 기법인데, 말린 튜브를 표현하려면 **원기둥으로 감기는(radial roll) 근본적으로 다른 기법**이 필요하다 — 기존 패널 힌지 코드를 재사용할 수 없다.

## 이전 작업에서 배운 교훈

- `strawRocket.js`는 최초 커밋 `52ebea7`("Initialize MyPopWorld project")에서부터 존재했고, 당시엔 `svgBuilder.js`에 `createTemplate()`/`getLineStyles()`가 아직 없었다(`git show 52ebea7:src/generators/strawRocket.js`로 확인, import에 `createTemplate`이 없다). 이후 `6defbad`("Fix broken parallel-fold/pull-tab, add mechanism registry, vector PDF export")에서 다른 메커니즘들과 동일한 인쇄 템플릿(트림 마진 + 척추선)을 쓰도록 `renderStrawRocket()` 래퍼가 뒤늦게 덧붙었다. 즉 **`generateStrawRocket()` 본체는 registry/svgBuilder 관례가 자리잡기 전에 짜인 코드**이고, `render*()` 래퍼만 나중에 다른 메커니즘 패턴에 맞춰 추가된 것이다. accordion(`ACCORDION_LIMITS` + `resolveAccordionGeometry()`)이나 flip-disc(`FLIPDISC_CONST` + `resolveFlipDiscGeometry()`)처럼 상수를 모아놓은 export나 클램핑 함수가 straw-rocket에는 없다 — 전부 함수 본문에 매직 넘버로 박혀 있다.
- 커밋 `82803c9`("Enhance UX: ... and Straw Rocket SVG instructions")은 `Instructions.jsx`/`api/chat.js`/`ChatWindow.jsx`만 수정했고 `strawRocket.js`는 건드리지 않았다 — 화면에 보이는 일러스트 조립 가이드(`Instructions.jsx`의 `case 'straw-rocket'`, 대략 21~91번째 줄)와 `registry.js`의 `INSTRUCTION_TEXT['straw-rocket']`(135~145번째 줄)이 서로 다른 시점에, 서로 다른 커밋에서 손으로 맞춰졌다는 뜻이다. 지금은 4단계로 정확히 1:1 대응하지만, 이는 우연이 아니라 그때그때 수작업으로 맞춘 결과다.
- `INSTRUCTION_TEXT['straw-rocket'].tips`(`registry.js:144`)의 "튜브 윗부분을 완전히 밀폐해야 빨대로 불었을 때 힘차게 날아갑니다"는 이 메커니즘의 핵심 실패 조건을 명시한다 — 다른 팝업 메커니즘은 풀칠이 부실해도 "덜 예쁘게 서는" 정도로 끝나지만, straw-rocket은 윗면이 완전히 막히지 않으면 **아예 작동하지 않는다**(공기가 새어 나가 추진력이 생기지 않음). 이 때문에 코드에서 윗면 날개 전체를 GLUE_TAB으로 표시(`strawRocket.js:50-55`)해 "일부만 붙이면 안 된다"는 것을 시각적으로 강조한다.

## 앞으로 작업 시 주의사항

- 새로 수치형 파라미터(예: 테마별 튜브 길이)를 추가하고 싶다면, 매직 넘버를 그대로 늘리지 말고 accordion/flip-disc처럼 `STRAWROCKET_LIMITS` 같은 상수 객체 + `resolveStrawRocketGeometry()` 클램프 함수를 새로 만들어 종이 크기(A4/Letter)에 대해 명시적으로 검증하라. 현재는 A4/Letter 양쪽에서 "우연히" 여백 안에 들어가는 상태이며, 어느 쪽 파라미터든 하드코딩 값을 건드리면 이 우연한 적합성이 깨질 수 있다.
- 튜브 원주 관련 상수(`tubeWidth=25`, `tabWidth=6`)는 "6mm 빨대에 헐렁하게 맞음"(주석 `strawRocket.js:23-24`)이라는 실측 전제에 묶여 있다. 바꾸려면 원주가 약 19~25mm(빨대 둘레보다 살짝 크게) 범위를 유지해야 한다 — 너무 좁으면 종이가 안 말리고, 너무 넓으면 바람이 새서 로켓이 잘 안 날아간다.
- 장식 네모(`frontX`/`backX`, `strawRocket.js:63-72`)는 테마 모양을 반영하지 않는 일반 사각형이다. 만약 장식 실루엣을 테마 모양(로켓/나비/새 등)에 맞게 그리고 싶다면, `getDecorationSlots()` 경로에서 오는 AI 이미지와는 별개로 이 파일 안에서 실제 외곽선을 그려야 한다 — 지금 이 두 산출물(플레이스홀더 네모 vs. AI 그림 페이지)은 서로 다른 코드 경로에서 독립적으로 생성되므로, 하나만 고치면 둘이 어긋난다.
- `constants.js:44-51`의 `MECHANISMS` 객체(`STRAW_ROCKET: 'straw-rocket'` 포함)는 코드베이스 전체에서 자기 자신 말고는 아무 곳에서도 참조되지 않는(grep으로 확인) 죽은 코드다 — `registry.js`의 `MECHANISM_REGISTRY` 키 문자열이 실제 단일 진실 공급원이다. 이 상수를 갱신해도 아무 동작도 바뀌지 않으니 새 메커니즘 추가 체크리스트에 넣지 말 것.
- 3D 프리뷰를 추가하려면 `Preview3D.jsx`의 기존 3종처럼 평면 패널을 힌지 회전시키는 방식(`rotate3d`/`rotateY`)을 재사용하려 하지 말 것 — 말린 원통을 표현하려면 완전히 다른 CSS 기법(반지름 방향 말기 애니메이션)이 필요하며, 그 기법이 실제로 만들어지기 전까지는 `SUPPORTED_3D`에 `'straw-rocket'`을 추가하지 말 것.
- `Instructions.jsx`의 일러스트 4단계와 `registry.js`의 `INSTRUCTION_TEXT['straw-rocket'].steps` 4단계는 지금 내용이 일치하지만 서로를 참조하지 않는 완전히 별도의 텍스트다. 한쪽만 고치면 즉시 어긋나므로, 둘 중 하나를 수정할 때는 반드시 다른 쪽도 같이 확인할 것.
