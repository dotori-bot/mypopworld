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
- `src/components/Chat/ChatWindow.jsx` + `api/chat.js` — Gemini 기반 대화형 아이디어 제안 챗봇.
- `src/components/Preview/SVGPreview.jsx` — 메커니즘별 도안을 조립해 미리보기/PDF로 만드는 곳. 현재 메커니즘 분기가 if/else로 하드코딩되어 있다.
- `src/components/Preview/Instructions.jsx` — 메커니즘별 조립 가이드(정적).
