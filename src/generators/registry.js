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
