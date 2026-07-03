/**
 * @fileoverview Single source of truth mapping a mechanism id to everything
 * needed to render it and to instruct the user how to assemble it.
 * Adding a new mechanism means adding one entry here instead of touching
 * SVGPreview.jsx, Instructions.jsx, and api/chat.js separately.
 *
 * @module generators/registry
 */

import { renderVFold } from './vfold.js';
import { renderBoxPopup } from './boxPopup.js';
import { renderParallelFold } from './parallelFold.js';
import { renderPullTab } from './pullTab.js';
import { renderStrawRocket } from './strawRocket.js';
import { renderAccordion } from './accordionPopup.js';
import { renderVolvelle } from './volvelle.js';
import { renderFlipDisc } from './flipDisc.js';
import { renderSpiralSpring } from './spiralSpring.js';
import { renderRisingSlide } from './risingSlide.js';
import { renderLayeredStage } from './layeredStage.js';
import { renderAutoSlideWindow } from './autoSlideWindow.js';

export const MECHANISM_REGISTRY = {
  'v-fold': {
    labelKo: '브이폴드 (V-Fold)',
    render: (params) => renderVFold(params),
    defaultParams: { armLength: 40, angle: 45 },
    instructionStyle: 'generic',
  },
  'box-popup': {
    labelKo: '상자 팝업 (Box Popup)',
    render: (params) => renderBoxPopup(params),
    defaultParams: { width: 40, height: 30 },
    instructionStyle: 'generic',
  },
  'parallel-fold': {
    labelKo: '평행 접기 (계단식 팝업)',
    render: (params) => renderParallelFold(params),
    defaultParams: { width: 80, depth: 30 },
    instructionStyle: 'generic',
  },
  'pull-tab': {
    labelKo: '풀탭 (당기면 움직이는 장치)',
    render: (params) => renderPullTab(params),
    defaultParams: { sliderWidth: 30, sliderHeight: 15, trackLength: 80 },
    instructionStyle: 'generic',
  },
  'straw-rocket': {
    labelKo: '빨대 로켓',
    render: (params) => renderStrawRocket(params),
    defaultParams: {},
    instructionStyle: 'straw-rocket',
  },
  'accordion': {
    labelKo: '병풍 팝업 (지그재그 무대)',
    render: (params) => renderAccordion(params),
    defaultParams: { a: 40, panels: 6, wallHeight: 60 },
    instructionStyle: 'accordion',
  },
  'volvelle': {
    labelKo: '돌림판 (돌리면 그림이 바뀌는 창문)',
    render: (params) => renderVolvelle(params),
    defaultParams: { R: 40, sectors: 6 },
    instructionStyle: 'volvelle',
  },
  'flip-disc': {
    labelKo: '반쪽 넘김판 (넘기면 그림이 바뀌는 접시)',
    render: (params) => renderFlipDisc(params),
    defaultParams: { R: 42, pages: 4 },
    instructionStyle: 'flip-disc',
  },
  'spiral-spring': {
    labelKo: '달팽이 스프링 (늘어나며 떠오르는 팝업)',
    render: (params) => renderSpiralSpring(params),
    defaultParams: { turns: 5, pitch: 6, decorations: 4 },
    instructionStyle: 'spiral-spring',
  },
  'rising-slide': {
    labelKo: '빛줄기 상승 슬라이드 (당기면 그림이 위로 올라가는 장치)',
    render: (params) => renderRisingSlide(params),
    defaultParams: { riseFraction: 0.62, sliderWidth: 12, grip: 20 },
    instructionStyle: 'rising-slide',
  },
  'layered-stage': {
    labelKo: '층층이 무대 (성·마을이 겹겹이 솟는 팝업)',
    render: (params) => renderLayeredStage(params),
    defaultParams: { layers: 3 },
    instructionStyle: 'layered-stage',
  },
  'auto-slide-window': {
    labelKo: '열면 바뀌는 액자 카드 (열면 창문 속 그림이 저절로 바뀜)',
    render: (params) => renderAutoSlideWindow(params),
    defaultParams: { pivotArm: 16, strut: 44, windowHeight: 12 },
    instructionStyle: 'auto-slide-window',
  },
};

/**
 * Plain-text assembly instruction content, keyed by `instructionStyle`.
 * Used for the vector PDF export (see pdfExporter.addInstructionPage) — the
 * illustrated, styled step cards in components/Preview/Instructions.jsx are
 * the on-screen equivalent and are kept in sync with this text by hand.
 */
export const INSTRUCTION_TEXT = {
  generic: {
    title: '조립 설명서',
    materials: '가위, 풀 또는 양면테이프, 색연필(선택)',
    steps: [
      '검은색 실선을 따라 팝업 조각들을 모두 오려주세요.',
      '빨간 점선은 산접기(볼록하게), 파란 점선은 골접기(오목하게) 해줍니다.',
      '안내된 풀칠 기호에 맞춰 배경 카드에 팝업 조각을 붙여주세요.',
    ],
    tips: '카드를 반으로 접었다 펴면서 팝업이 매끄럽게 움직이는지 미리 확인해 보세요.',
  },
  'straw-rocket': {
    title: '빨대 로켓 조립 설명서',
    materials: '가위, 풀 또는 양면테이프, 빨대 1개',
    steps: [
      '검은색 실선을 따라 튜브 모양과 장식 그림을 조심해서 오려주세요.',
      "가장 긴 네모(튜브)를 둥글게 말아서 '풀칠' 부분에 풀이나 양면테이프를 발라 원통 모양으로 붙여주세요.",
      '튜브 위쪽의 작은 날개를 산접기(빨간 점선)하여 뚜껑을 덮듯 풀칠해 막아주세요. (바람이 새지 않게 꼼꼼히!)',
      '완성된 튜브 앞/뒷면에 장식을 붙인 후, 아래 뚫린 구멍으로 일반 빨대를 꽂고 후~ 불어보세요!',
    ],
    tips: '튜브 윗부분을 완전히 밀폐해야 빨대로 불었을 때 힘차게 날아갑니다.',
  },
  accordion: {
    title: '병풍 팝업 조립 설명서',
    materials: '가위, 풀 또는 양면테이프, 색연필(선택)',
    steps: [
      '검은색 실선을 따라 지그재그 띠를 오려주세요. 위아래 초록색 부분(풀칠 자리)은 자르지 말고 남겨둡니다.',
      '빨간 점선은 산접기(볼록하게), 파란 점선은 골접기(오목하게) 하여 병풍처럼 지그재그로 접어주세요. 붙이기 전에 반대 방향으로도 한 번씩 살짝 접어 접힌 자국을 내두면 훨씬 부드럽게 펴집니다.',
      "카드를 반쯤 열어 놓은 상태에서, 위쪽 '풀칠' 칸을 위 종이면에, 아래쪽 '풀칠' 칸을 아래 종이면에 붙여주세요. (가운데는 붙이지 말고 그대로 두어야 병풍이 서요!)",
    ],
    tips: '카드를 닫으면 병풍이 납작하게 접히고, 열면 짠 하고 서야 정상입니다. 잘 안 서면 접은 자국을 다시 한번 꾹 눌러 주세요.',
  },
  volvelle: {
    title: '돌림판 조립 설명서',
    materials: '가위, 풀 또는 양면테이프, 색연필(선택)',
    steps: [
      '검은색 실선을 따라 동그란 판 4개(덮개·돌림판·간격 링·뒷판)를 모두 오려주세요. 덮개의 창문 구멍과 손잡이 홈도 오려냅니다.',
      '뒷판 위에 간격 링을 겹쳐 초록색 풀칠 테두리끼리 붙여주세요. 가운데 구멍은 뚫린 채로 둡니다.',
      '그림을 그린 돌림판을 간격 링 구멍 안에 살짝 끼워 넣어주세요. 이 판은 절대 풀로 붙이지 마세요! (붙이면 돌아가지 않아요.)',
      '마지막으로 덮개를 맨 위에 덮어 테두리만 붙여주세요. 손잡이 홈으로 돌림판 가장자리를 밀면 창문 속 그림이 바뀝니다.',
    ],
    tips: '너무 꽉 끼면 잘 안 돌고, 너무 헐거우면 그림이 비뚤어져요. 돌림판이 걸리지 않고 살살 돌아가는지 확인하세요.',
  },
  'flip-disc': {
    title: '반쪽 넘김판 조립 설명서',
    materials: '가위, 풀 또는 양면테이프, 색연필(선택), 밑판이 될 종이나 카드 1장',
    steps: [
      '검은색 실선을 따라 왼쪽 고정 반쪽 1개와 오른쪽 넘김판 여러 장을 모두 오려주세요. 오른쪽 조각의 왼쪽에 붙은 네모(풀칠 자리)는 자르지 말고 남겨둡니다.',
      '넘김판 조각마다 왼쪽 네모(경첩)를 파란 점선을 따라 뒤로 접었다 폈다 몇 번 해서 부드러운 접힘 자국을 내주세요. (여기가 책장처럼 넘어가는 부분이에요.)',
      '넘김판들을 순서대로(①②③…) 포개고, 왼쪽 네모끼리만 풀칠해서 한 묶음으로 붙여주세요. 중요: 반원 그림 부분은 절대 서로 붙이지 마세요! 붙이면 넘겨지지 않아요.',
      '묶은 넘김판의 맨 아래 네모를 밑판(배경) 가운데 세로선에 붙여, 반원들이 오른쪽으로 펼쳐지게 하세요. 그 위에 왼쪽 고정 반쪽을 덮어 붙이면 네모 묶음이 가려지고 동그란 접시가 완성됩니다.',
      '오른쪽 반원을 한 장씩 왼쪽으로 넘기면 접시 그림이 짠! 하고 다른 요리로 바뀝니다. 넘김판 가장자리의 작은 손잡이(돌기)를 잡으면 한 장씩 넘기기 쉬워요.',
    ],
    tips: '반원 조각끼리 붙지 않고 왼쪽 네모(경첩)만 붙는 것이 핵심입니다. 왼쪽 반쪽과 오른쪽 반원의 곧은 변이 정확히 맞닿아야 동그라미가 예쁘게 이어져요.',
  },
  'spiral-spring': {
    title: '달팽이 스프링 팝업 조립 설명서',
    materials: '가위, 풀 또는 양면테이프, 색연필(선택)',
    steps: [
      '검은색 실선을 따라 동그란 판을 오리고, 안쪽 소용돌이(스파이럴) 선도 끝까지 오려주세요. 다 오리면 돌돌 말린 종이 스프링이 됩니다.',
      '가운데 초록색 원(①)에 풀을 발라 아래쪽 종이면에 붙여주세요. 소용돌이의 바깥쪽 끝(②)만 위쪽 종이면의 ‘②붙이기’ 자리에 붙입니다. 중요: 이 두 곳(가운데·바깥 끝)만 붙이고, 돌돌 말린 띠의 나머지 부분은 어디에도 붙이지 마세요! 붙으면 늘어나지 않아요.',
      '①②③④ 번호가 찍힌 자리에만 행성이나 인형 같은 평면 장식을 붙여주세요. 옆에 적힌 ‘최대 반지름’보다 큰 장식은 붙이지 마세요. 그보다 크면 카드를 열었을 때 장식이 종이 밖으로 삐져나옵니다.',
      '카드를 닫으면 스프링이 납작하게 돌돌 말리고, 열면 소용돌이가 위로 쭉 늘어나면서 장식들이 서로 다른 높이로 둥실 떠오릅니다.',
    ],
    tips: '번호가 찍힌 안전한 자리에만, 표시된 최대 크기 안에서 장식을 붙이는 것이 핵심입니다. 잘 안 늘어나면 스프링을 살짝 반대로 당겨 말린 자국을 풀어 주세요.',
  },
  'rising-slide': {
    title: '빛줄기 상승 슬라이드 조립 설명서',
    materials: '가위, 풀 또는 양면테이프, 색연필(선택)',
    steps: [
      '검은색 실선을 따라 앞면 카드의 세로 슬롯(길쭉한 구멍), 긴 슬라이더 조각, 멈춤 띠 2개, 작은 그림을 오려주세요. 빛줄기·하늘 같은 배경은 앞면에 그대로 인쇄된 그림이라 오리지 않습니다.',
      '슬라이더를 카드 뒤에 대고, 맨 아래 산접기(빨간 점선) 자리의 작은 탭을 앞으로 접어 슬롯을 통과시킨 뒤 앞면으로 나온 탭에 작은 그림을 붙여주세요. 그림과 슬라이더가 슬롯보다 넓어 카드를 앞뒤로 꽉 물어 빠지지 않습니다.',
      '중요(안전 장치): 슬롯 바로 위 뒷면에 ① 위 멈춤 띠를, 아래쪽에 ② 안내 띠를 다리처럼 얹어 양 끝 초록색 부분만 카드에 붙여주세요. 가운데는 붙이지 마세요(슬라이더가 그 아래로 지나갑니다). 슬라이더 옆에 튀어나온 넓은 ‘멈춤 날개’가 이 위 멈춤 띠에 걸려서, 손잡이를 세게 당겨도 위로 쏙 빠지지 않습니다.',
      '카드 위로 나온 손잡이를 잡고 위로 당기면 그림이 빛줄기를 따라 스르륵 올라갑니다. 끝까지 올라가면 멈춤 날개가 딱 걸려 멈춥니다. 손을 놓고 살살 내리면 그림이 다시 빛 속으로 숨어요.',
    ],
    tips: '멈춤 날개가 멈춤 띠 아래에서만 지나다니고, 맨 위에서 확실히 걸리는지 확인하세요. 너무 뻑뻑하면 안내 띠를 아주 살짝 느슨하게(가운데를 조금 더 띄워) 붙이고, 너무 헐거우면 멈춤 띠 양 끝을 꼼꼼히 눌러 붙여 주세요.',
  },
  'layered-stage': {
    title: '층층이 무대 조립 설명서',
    materials: '가위, 풀 또는 양면테이프, 색연필(선택)',
    steps: [
      '검은색 실선을 따라 각 층(무대) 벽을 오려주세요. 벽의 세로 양옆에 붙은 초록색 네모(풀칠 자리/날개)는 자르지 말고 남겨둡니다. 벽 위쪽(먼 쪽) 가로선만 오리고, 척추(가운데 접는 선) 쪽 아래 가로선은 자르지 마세요 — 그 선으로 벽이 카드에 붙어 섭니다.',
      '빨간 점선(척추 쪽, 산접기)은 볼록하게, 파란 점선(바깥 쪽, 골접기)은 오목하게 접어 벽을 세워주세요. 각 벽은 높이와 깊이가 같아서(높이=깊이), 카드를 닫으면 자기 칸 안으로 정확히 납작하게 접힙니다.',
      '아주 중요 — 반드시 맨 뒤(가장 깊고 큰 번호) 층부터 앞으로 순서대로 붙이세요. 각 층의 양옆 초록색 날개를 바깥으로 접어 카드 바닥면에 붙입니다. 앞 층을 먼저 붙이면 뒤 층에 손이 닿지 않아 조립이 막히고, 순서가 틀리면 겹침(telescoping)이 어긋나 카드를 닫을 때 뒤 벽이 카드 밖으로 삐져나옵니다.',
      '카드를 닫아 확인하세요. 모든 층이 카드 바깥 자르는 선 안쪽으로 납작하게 접혀 들어가야 정상입니다. 열면 성벽·탑이 층층이 서로 다른 깊이로 솟아오릅니다.',
    ],
    tips: '뒤에서 앞 순서로 붙이는 것이 핵심입니다. 뒤 층일수록 더 높고(성의 안쪽 탑처럼) 더 깊은 곳에 섭니다. 닫았을 때 어느 한 벽이라도 카드 밖으로 나오면, 그 층 벽이 너무 깊은 것이니 조금 낮은(=얕은) 벽으로 다시 만들어 주세요.',
  },
  'auto-slide-window': {
    title: '열면 바뀌는 액자 카드 조립 설명서',
    materials: '가위, 풀 또는 양면테이프, 색연필(선택)',
    steps: [
      '검은색 실선을 따라 부품 4종을 오려주세요: 창문 액자(가운데 창 구멍도 오려냄), 긴 메시지 띠(슬라이더), 지지대(팔) 1개, 안내다리(Ⓐ·Ⓑ) 2개. 아래쪽 고정 뒷면에는 붙이는 위치만 표시되어 있으니 오리지 마세요.',
      '메시지 띠를 뒷면의 안내 위치에 올리고, 안내다리 Ⓐ·Ⓑ를 다리처럼 그 위에 얹어 양 끝 초록색만 뒷면에 붙여주세요. 가운데는 붙이지 마세요 — 띠가 그 아래로 지나갑니다. 띠 양 끝의 넓은 멈춤 날개가 안내다리에 걸려 띠가 빠지지 않습니다. (안내다리를 위·아래로 벌려 붙여야 띠가 비뚤어지지 않아요.)',
      '창문 액자를 창 구멍이 메시지 띠 위에 오도록 덮고, 좌·우 초록색 테두리만 뒷면에 붙여주세요. 위·아래는 열어두어야 띠가 창문 뒤로 미끄러집니다.',
      '가장 중요 — 지지대(팔) 붙이기: 지지대 위 끝(①)을 위쪽 여는 앞면의 ‘① 붙이는 곳(척추에서 조금 위)’에, 아래 끝(②)을 메시지 띠 옆의 드라이브 탭(② 자리)에 붙입니다. 두 접는 선(경첩)이 반드시 척추(가운데 접는 선)와 나란해야 합니다. 비뚤게 붙이면 카드를 열 때 뻑뻑하거나 걸립니다.',
      '카드를 살짝 열면 창문 속에 메시지 ①이, 활짝 열면 저절로 메시지 ②로 바뀝니다. 손잡이를 당길 필요 없이 카드를 여닫는 것만으로 그림이 지나갑니다. 닫으면 지지대가 납작하게 접혀 책처럼 덮입니다.',
    ],
    tips: '지지대의 위·아래 경첩을 척추와 나란히, 같은 세로줄(드라이브 칸)에 맞춰 붙이는 것이 핵심입니다. 너무 뻑뻑하면 안내다리 가운데를 아주 살짝 더 띄워 붙이고, 그림이 창문에서 반쯤 잘려 보이면 지지대 아래 끝을 ② 자리에 정확히 다시 맞춰 붙여 주세요.',
  },
};

/**
 * @param {string} id - Mechanism id (e.g. 'v-fold')
 * @returns {(typeof MECHANISM_REGISTRY)[string] | undefined}
 */
export function getMechanism(id) {
  return MECHANISM_REGISTRY[id];
}

/**
 * Build the params object to hand to `mech.render(...)` for the current
 * card/paper/color settings.
 * @param {{ mechanism?: string, theme?: string }} cardParams
 * @param {'A4'|'LETTER'} paperSize
 * @param {'color'|'bw'} colorMode
 * @returns {object | null}
 */
export function buildMechanismParams(cardParams, paperSize, colorMode) {
  const mech = getMechanism(cardParams?.mechanism);
  if (!mech) return null;
  return { ...mech.defaultParams, paperSize, colorMode, theme: cardParams.theme };
}
