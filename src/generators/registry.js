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
import { renderVolvelle, resolveVolvelleGeometry } from './volvelle.js';
import { renderFlipDisc } from './flipDisc.js';
import { renderSpiralSpring } from './spiralSpring.js';
import { renderRisingSlide } from './risingSlide.js';
import { renderLayeredStage, resolveLayeredStageGeometry } from './layeredStage.js';
import { renderAutoSlideWindow } from './autoSlideWindow.js';
import { renderSlideToSwing } from './slideToSwing.js';
import { renderFlapClap, resolveFlapClapGeometry } from './flapClap.js';
import { renderCameraPrintPull, resolveCameraPull } from './cameraPrintPull.js';
import { renderGateCurtain, resolveGateCurtain } from './gateCurtain.js';
import { renderMagicShutter } from './magicShutter.js';
import { PARAM_SCHEMAS } from './paramSchemas.js';
import { getElements } from '../store/cardModel.js';

export const MECHANISM_REGISTRY = {
  'v-fold': {
    sceneType: 'book',
    labelKo: '브이폴드 (V-Fold)',
    render: (params) => renderVFold(params),
    defaultParams: { armLength: 40, angle: 45, armExtension: null },
    instructionStyle: 'v-fold',
  },
  'box-popup': {
    sceneType: 'book',
    labelKo: '상자 팝업 (Box Popup)',
    render: (params) => renderBoxPopup(params),
    defaultParams: { width: 40, height: 30 },
    instructionStyle: 'generic',
  },
  'parallel-fold': {
    sceneType: 'book',
    labelKo: '평행 접기 (계단식 팝업)',
    render: (params) => renderParallelFold(params),
    defaultParams: { width: 80, depth: 30 },
    instructionStyle: 'generic',
  },
  'pull-tab': {
    sceneType: 'flat',
    labelKo: '풀탭 (당기면 움직이는 장치)',
    render: (params) => renderPullTab(params),
    defaultParams: { sliderWidth: 30, sliderHeight: 15, trackLength: 80 },
    instructionStyle: 'generic',
  },
  'straw-rocket': {
    sceneType: 'flat',
    labelKo: '빨대 로켓',
    render: (params) => renderStrawRocket(params),
    defaultParams: {},
    instructionStyle: 'straw-rocket',
  },
  'accordion': {
    sceneType: 'book',
    labelKo: '병풍 팝업 (지그재그 무대)',
    render: (params) => renderAccordion(params),
    defaultParams: { a: 40, panels: 6, wallHeight: 60 },
    instructionStyle: 'accordion',
  },
  'volvelle': {
    sceneType: 'flat',
    labelKo: '돌림판 (돌리면 그림이 바뀌는 창문)',
    render: (params) => renderVolvelle(params),
    defaultParams: { R: 40, sectors: 6 },
    instructionStyle: 'volvelle',
    // Rotor disc is a flat circle of diameter 2R, not the generic 100x100mm
    // square hint — size the reference-image slot to match it so the AI
    // image (and the "직접 그리기" guide circle) actually fits the real disc
    // instead of floating at an unrelated size/position.
    decorationSlots: (params) => {
      const geo = resolveVolvelleGeometry(params);
      return [{
        label: '돌림판 전체 그림 (동그랗게, 바로 위에서 내려다본 모습으로 창문에 꽉 차게)',
        width: geo.R * 2,
        height: geo.R * 2,
      }];
    },
  },
  'flip-disc': {
    sceneType: 'flat',
    labelKo: '반쪽 넘김판 (넘기면 그림이 바뀌는 접시)',
    render: (params) => renderFlipDisc(params),
    defaultParams: { R: 42, pages: 4 },
    instructionStyle: 'flip-disc',
  },
  'spiral-spring': {
    sceneType: 'book',
    labelKo: '달팽이 스프링 (늘어나며 떠오르는 팝업)',
    render: (params) => renderSpiralSpring(params),
    defaultParams: { turns: 4, pitch: 8, decorations: 4 },
    instructionStyle: 'spiral-spring',
  },
  'rising-slide': {
    sceneType: 'flat',
    labelKo: '빛줄기 상승 슬라이드 (당기면 그림이 위로 올라가는 장치)',
    render: (params) => renderRisingSlide(params),
    defaultParams: { riseFraction: 0.62, sliderWidth: 12, grip: 20 },
    instructionStyle: 'rising-slide',
  },
  'layered-stage': {
    sceneType: 'book',
    labelKo: '층층이 무대 (케이크처럼 층층이 솟는 팝업)',
    render: (params) => renderLayeredStage(params),
    defaultParams: { layers: 3 },
    instructionStyle: 'layered-stage',
    // One decoration slot per tier, sized off the SAME geometry the mechanism
    // itself renders with (resolveLayeredStageGeometry), so the decoration
    // image's suggested size always matches the actual printed tier front.
    decorationSlots: (params) => {
      const geo = resolveLayeredStageGeometry(params);
      return geo.layers.map((layer) => ({
        label: `${layer.index}층 앞면 그림 (${layer.index === 1 ? '맨 아래·제일 큰 층' : layer.index === geo.count ? '맨 위·제일 작은 층' : '중간 층'})`,
        // The art lands on the tier's FRONT panel (w_i × v_i): size it to
        // cover that face with a little bleed.
        width: layer.width * 0.85,
        height: layer.frontHeight * 1.2,
      }));
    },
  },
  'auto-slide-window': {
    sceneType: 'book',
    labelKo: '열면 바뀌는 액자 카드 (열면 창문 속 그림이 저절로 바뀜)',
    render: (params) => renderAutoSlideWindow(params),
    defaultParams: { pivotArm: 16, strut: 44, windowHeight: 12 },
    instructionStyle: 'auto-slide-window',
  },
  'slide-to-swing': {
    sceneType: 'flat',
    labelKo: '흔들 장치 (손잡이를 밀면 그림이 좌우로 흔들림)',
    render: (params) => renderSlideToSwing(params),
    defaultParams: { armLength: 34, swingAngle: 35 },
    instructionStyle: 'slide-to-swing',
  },
  'flap-clap': {
    sceneType: 'book',
    labelKo: '통통 플랩 (카드를 열고 닫으면 두 조각이 마주 부딪힘)',
    render: (params) => renderFlapClap(params),
    defaultParams: { offset: 18, flapLength: 22, halfWidth: 18, delta: 110 },
    instructionStyle: 'flap-clap',
    // One decoration slot per flap (upper page / lower page), sized off the
    // SAME geometry the mechanism itself renders with, so the flipper/paw
    // decoration always matches the printed flap's footprint.
    decorationSlots: (params) => {
      const geo = resolveFlapClapGeometry(params);
      return [
        { label: '위쪽 플랩 그림 (지느러미 등)', width: geo.b * 2 * 0.85, height: geo.h * 0.9 },
        { label: '아래쪽 플랩 그림 (지느러미 등)', width: geo.b * 2 * 0.85, height: geo.h * 0.9 },
      ];
    },
  },
  'camera-print-pull': {
    sceneType: 'flat',
    labelKo: '카메라 인화 손잡이 (아래로 당기면 사진이 위로 올라오는 장치)',
    render: (params) => renderCameraPrintPull(params),
    defaultParams: { riseFraction: 0.5, clearance: 0.9, stripWidth: 14, grip: 24, photoWidth: 46 },
    instructionStyle: 'camera-print-pull',
    // One decoration slot (the photo), sized off the SAME geometry the
    // mechanism itself renders with (resolveCameraPull), so the decoration
    // image's suggested size always matches the actual printed photo cutout.
    decorationSlots: (params) => {
      const geo = resolveCameraPull(params);
      return [{ label: '인화 사진 (인물 사진, 세로로 길게)', width: geo.photoW, height: geo.photoH }];
    },
  },
  'gate-curtain': {
    sceneType: 'flat',
    labelKo: '커튼 문 카드 (문을 열면 커튼이 걷히는 카드)',
    render: (params) => renderGateCurtain(params),
    defaultParams: { panelWidth: 90, revealWidth: 44, hingeOffset: 16 },
    instructionStyle: 'gate-curtain',
    // Slot sizes come from the SAME resolver the printed pattern uses, so the
    // character image always matches the diamond reveal window and the stone
    // decorations match the loose stone pieces.
    decorationSlots: (params) => {
      const geo = resolveGateCurtain(params);
      return [
        { label: '가운데 주인공 그림 (다이아몬드 창에 꽉 차게)', width: geo.revealW, height: geo.revealH },
        { label: '왼쪽 문 바깥 장식 (돌 등)', width: 30, height: 40 },
        { label: '오른쪽 문 바깥 장식 (돌 등)', width: 30, height: 40 },
      ];
    },
  },
  'magic-shutter': {
    sceneType: 'flat',
    labelKo: '매직 셔터 (손잡이를 옆으로 밀면 창문 그림이 바뀌는 액자)',
    render: (params) => renderMagicShutter(params),
    defaultParams: { windowWidth: 96, windowHeight: 60, pitch: 6, grip: 24 },
    instructionStyle: 'magic-shutter',
  },
};

// Attach each mechanism's editable-parameter metadata (see paramSchemas.js).
// Kept in a separate module purely for file size; the registry entry is still
// the single lookup point (`getMechanism(id).paramSchema`).
for (const [id, mech] of Object.entries(MECHANISM_REGISTRY)) {
  mech.paramSchema = PARAM_SCHEMAS[id] || [];
  if (import.meta.env?.DEV) {
    const defaultKeys = new Set(Object.keys(mech.defaultParams));
    const schemaKeys = new Set(mech.paramSchema.map((f) => f.key));
    for (const k of defaultKeys) {
      if (!schemaKeys.has(k)) console.warn(`[registry] '${id}' defaultParams.${k} has no paramSchema entry`);
    }
    for (const k of schemaKeys) {
      if (!defaultKeys.has(k)) console.warn(`[registry] '${id}' paramSchema key '${k}' not in defaultParams`);
    }
  }
}

/**
 * Plain-text assembly instruction content, keyed by `instructionStyle`.
 * Used for the vector PDF export (see pdfExporter.addInstructionPage) — the
 * illustrated, styled step cards in components/Preview/Instructions.jsx are
 * the on-screen equivalent and are kept in sync with this text by hand.
 */
export const INSTRUCTION_TEXT = {
  'v-fold': {
    title: '브이폴드(V-Fold) 조립 설명서',
    materials: '가위, 풀 또는 양면테이프, 색연필(선택)',
    steps: [
      '검은색 실선을 따라 삼각형 팝업 조각을 오려주세요. 조각 아래 양쪽에 붙은 초록색 날개(풀칠 자리)는 자르지 말고 남겨둡니다.',
      '가운데 세로선(빨간 점선)은 산접기(볼록하게) 해서 능선이 앞으로 뾰족하게 서게 하고, 양옆 바닥선(파란 점선)은 골접기(오목하게) 해서 두 팔이 바깥으로 눕게 접어주세요.',
      '카드를 반쯤 펼친 상태에서 왼쪽 팔은 왼쪽 종이면에, 오른쪽 팔은 오른쪽 종이면에 척추(가운데 접는 선)를 기준으로 좌우 대칭이 되도록 붙여주세요. 두 팔의 능선이 척추 위에서 만나야 합니다.',
    ],
    tips: '카드를 닫으면 삼각형이 척추를 따라 납작하게 접히고, 열면 능선이 앞으로 솟아올라야 정상입니다. 한쪽으로 기울면 두 팔을 척추 기준으로 대칭이 되게 다시 붙여 주세요.',
  },
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
      '완성 모습: 케이크처럼 생긴 층(보통 3층, 많으면 4층)이 카드 양면 사이에 다리처럼 걸쳐 붙어 있어서, 카드를 열고 닫는 동작만으로 층층이 솟아오르고 다시 납작해집니다. 90도쯤 열었을 때 가장 반듯한 상자 모양이 됩니다. 1층이 맨 아래(제일 크고), 층수가 올라갈수록 작아집니다.',
      '검은색 실선을 따라 층 조각(긴 띠)을 모두 오려주세요. 띠 하나는 위에서부터 [뒤 날개(초록) → 윗면 → 앞면 → 아래 날개(초록)] 순서로 되어 있습니다. 초록색 날개는 자르지 말고 띠에 붙여 둡니다. (카드에 구멍이 나는 게 싫으면, 띠를 색지에 대고 그려서 오려도 좋아요.)',
      '각 띠를 접어주세요: 초록 날개 두 곳의 파란 점선은 골접기(뒤로, 오목하게), 가운데 빨간 점선(윗면과 앞면 사이)은 산접기(앞으로, 볼록하게). 접고 나면 ㄱ자 상자 모양이 됩니다.',
      '아주 중요 — 조립 순서는 반드시 아래층(1층)부터 위로입니다. 1층의 아래 날개를 바닥 면의 ㉠ 선에(날개는 척추 쪽으로 향하게), 뒤 날개를 뒷벽 면의 ① 선에(날개는 위쪽으로 향하게) 붙이세요. 이때 카드를 90도쯤 세워 두고 붙이면 자리 잡기가 쉽습니다.',
      '2층부터는 아래 날개를 바로 아래층 윗면에 인쇄된 ㉡ 선에(날개는 뒷벽 쪽으로 향하게), 뒤 날개를 뒷벽 면의 같은 번호(②, ③…) 선에 붙입니다. 층마다 같은 방법을 반복하면 케이크가 쌓입니다.',
      '장식 그림 붙이기 — 이 도안은 2번째 페이지부터 층 개수만큼 장식 그림이 따로따로 나옵니다. 각 장식 페이지에 적힌 번호(예: "1층 앞면 그림", "2층 앞면 그림"…)를 확인해서, 가위로 오린 뒤 같은 번호 층의 앞면에 붙여주세요.',
      '카드를 천천히 닫아 확인하세요. 모든 층이 카드 안쪽으로 납작하게 접혀 들어가야 정상입니다(활짝 180도로 펼쳐도 납작해져요). 다시 90도쯤 열면 케이크·성이 층층이 우뚝 섭니다.',
    ],
    tips: '아래층부터 위로 붙이는 것과, 날개의 접는 선을 인쇄된 풀칠선에 정확히 맞추는 것이 핵심입니다. 카드를 닫을 때 걸리는 층이 있으면 그 층의 날개가 선에서 비뚤게 붙은 것이니 떼어 다시 붙여 주세요. 층이 비스듬히 기울면 좌우 폭 가운데가 척추 가운데와 맞는지 확인하세요.',
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
  'slide-to-swing': {
    title: '흔들 장치 조립 설명서',
    materials: '가위, 풀 또는 양면테이프, 색연필(선택)',
    steps: [
      '검은색 실선을 따라 부품을 오려주세요: 기둥(팔) 1개, 슬라이더(가운데 세로 슬롯도 오려냄) 1개, 위·아래 안내띠 2개, 회전축 캡 1개, 장식(하트 등) 1개. 앞면 카드에는 회전축 구멍만 오려 뚫습니다.',
      '기둥 아래쪽 목을 카드의 회전축 구멍에 끼워 뒤로 빼고, 뒤에서 회전축 캡을 그 목에 붙여 고정하세요. 캡은 목(종이)에만 붙이고 카드에는 붙이지 마세요 — 그래야 기둥이 구멍을 중심으로 팽이처럼 자유롭게 좌우로 돕니다. (구멍이 목보다 넓어 접는 자국 없이 부드럽게 돌고, 반복해도 잘 찢어지지 않아요.)',
      '슬라이더를 기둥 위에 겹치고, 기둥 맨 위의 핀을 빨간 점선(산접기)으로 앞으로 접어 슬라이더의 세로 슬롯에 통과시키세요. 앞으로 나온 핀에 장식을 붙이면, 장식이 슬롯보다 넓어 핀이 앞으로 빠지지 않고 슬롯 안에서 위아래로만 움직입니다. (이 핀-슬롯 물림이 곧은 밀기를 좌우 흔들림으로 바꾸는 핵심이에요.)',
      '⚠️ 안내띠 붙이기: 슬라이더 위·아래에 안내띠 Ⓐ·Ⓑ를 얹고 바깥쪽 초록색만 카드에 붙여 슬라이더가 좌우로만 미끄러지는 길(채널)을 만드세요. 슬라이더 양 끝의 넓은 멈춤 날개가 안내띠보다 커서, 손잡이를 세게 밀어도 슬라이더가 튀어나가지 않습니다.',
      '손잡이를 좌우로 슬슬 밀어보세요. 슬라이더는 곧게 옆으로 가는데, 슬롯에 걸린 핀이 원을 그리며 돌아 기둥 위의 장식이 좌우로 왔다갔다 흔들립니다. 시계추처럼, 인사하듯, 짝짝이 춤추듯 움직여요!',
    ],
    tips: '핵심은 두 가지입니다. (1) 회전축 캡은 기둥 목에만 붙이고 카드에는 붙이지 않기 — 붙이면 기둥이 못 돕니다. (2) 핀은 슬롯 안에서 위아래로 자유롭게 움직여야 하니 슬롯을 풀로 막지 마세요. 너무 뻑뻑하면 안내띠를 아주 살짝 느슨하게 붙이고, 장식이 카드 밖으로 나가면 흔들기 각도(swingAngle)를 조금 줄이세요.',
  },
  'flap-clap': {
    title: '통통 플랩 조립 설명서',
    materials: '가위, 풀 또는 양면테이프, 색연필(선택)',
    steps: [
      '완성 모습: 카드를 여닫으면 위쪽 면의 플랩과 아래쪽 면의 플랩이 서로 가까워졌다 멀어졌다 하면서 "탁!" 하고 마주 부딪힙니다. 물범이 지느러미로 배를 통통 치는 모습을 떠올리면 됩니다.',
      '검은색 실선을 따라 위/아래 삼각형 플랩 2개와 지지대(프롭) 막대 2개를 오려주세요. 플랩의 밑변(가로선)은 자르지 말고 남겨두세요 — 그 선이 플랩이 척추 쪽 면에 붙어 서는 접는 선입니다.',
      '빨간 점선(밑변)을 산접기하여 플랩을 종이면에서 들어 세우고, 도안에 적힌 각도(예: 110°)만큼 세운 채로 유지하세요.',
      '아주 중요 — 지지대(프롭) 붙이기: 프롭 막대의 한쪽 끝(①)을 플랩 가운데쯤(초록색 점)에, 다른 쪽 끝(②)을 척추 쪽으로 더 가까운 종이면 위 초록색 점에 붙이세요. 프롭이 팽팽하게 당겨진 상태로 붙어야 플랩이 정확한 각도로 고정되어 서 있습니다. 위쪽 플랩, 아래쪽 플랩 모두 같은 방법으로 붙여주세요.',
      '장식 그림(지느러미·손 모양 등)을 오려서 각 플랩의 앞면에 붙여주세요.',
      '카드를 천천히 여닫아 보세요. 도안에 표시된 "탁! 각도" 근처에서 위아래 플랩(지느러미)이 서로 맞닿습니다. 완전히 닫았을 때는 플랩이 아주 살짝 눌리는 정도이니 억지로 세게 누르지 말고 살살 접어주세요.',
    ],
    tips: '이 메커니즘은 다른 팝업과 달리 플랩이 카드가 열리는 각도에 맞춰 저절로 접히는 구조가 아니라, 프롭으로 고정한 각도 그대로 페이지에 실려 움직입니다. 그래서 완전히 딱 닫히기보다 살짝 도톰하게 눌리는 정도가 정상입니다 — 프롭 길이를 정확히 지켜 붙이는 것이 핵심입니다.',
  },
  'camera-print-pull': {
    title: '카메라 인화 손잡이 조립 설명서',
    materials: '가위, 풀 또는 양면테이프, 색연필(선택)',
    steps: [
      '검은색 실선을 따라 앞면 카드의 세로 슬롯(사진 나오는 곳)과 아래쪽 슬롯(손잡이 나오는 곳), 그리고 되돌림 띠, 롤러(튜브) 조각, 멈춤/안내 띠를 모두 오려주세요. 앞면 카드에는 카메라 그림을 자유롭게 그리거나 색칠해 꾸며 주세요.',
      "가장 긴 네모(① 롤러)를 둥글게 말아서 풀칠 자리에 붙여 튜브로 만들어주세요. 이 롤러를 앞면 카드 맨 위 뒷면에 다리처럼 얹고, 양 끝 초록색 부분만 붙이세요. 가운데는 절대 붙이지 마세요 — 그래야 가운데가 붕 뜬 채로 남아서, 되돌림 띠가 그 위로 180도 넘어갈 수 있어요.",
      '되돌림 띠를 롤러 위에 걸쳐 걸어주세요. 한쪽 끝은 사진을 붙이는 자리(마운트)이고, 반대쪽 끝은 손잡이(PULL)입니다. 마운트 끝에 사진을 붙이고, 손잡이 끝은 아래쪽 슬롯을 통해 앞면으로 빼내주세요. 사진 슬롯 바로 위 뒷면에는 ② 멈춤/안내 띠를 다리처럼 얹어 양 끝 초록색만 붙이세요(가운데는 붙이지 마세요 — 띠가 그 아래로 지나가야 해요). 중요: 되돌림 띠는 마운트 끝과 손잡이 끝, 두 곳 말고는 어디에도 붙이지 마세요! 중간을 붙이면 롤러를 넘어가지 못해요.',
      '카드 아래로 나온 "PULL ↓" 손잡이를 잡고 아래로 당기면, 띠가 롤러를 넘어가면서 사진이 위쪽 슬롯 밖으로 쑤욱 올라옵니다. 끝까지 당기면 사진 뒤의 멈춤 날개가 ② 멈춤 띠에 걸려 더 이상 빠지지 않아요. 사진을 다시 손으로 살살 눌러 내리면 손잡이가 도로 올라가며 처음 모습으로 돌아갑니다.',
    ],
    tips: '핵심은 롤러(①)와 멈춤/안내 띠(②) 모두 "양 끝만" 붙이고 가운데는 절대 붙이지 않는 것입니다 — 가운데가 붙으면 롤러가 헛돌지 못하고 띠도 못 지나갑니다. 너무 뻑뻑하면 롤러를 조금 더 느슨하게(가운데를 더 띄워) 붙이고, 사진이 쑥 빠질 것 같으면 ② 멈춤 띠가 사진 슬롯에 정확히 붙어 있는지 확인하세요.',
  },
  'gate-curtain': {
    title: '커튼 문 카드 조립 설명서',
    materials: '가위, 풀 또는 양면테이프, 색연필(선택)',
    steps: [
      '검은 실선을 따라 오려주세요: 게이트 카드 1장(가운데 뒷판 + 좌·우 문, 파란 세로 점선 2개가 문 접는 선), 노란 커튼 2장, 장식 액자 1장(가운데 다이아몬드 창도 오려냄), 지지대(스트랩) 2개, 문 돌 장식 2개.',
      '좌·우 문을 파란 세로 점선(골접기)으로 안쪽으로 접었다 펴서 경첩을 만들어 주세요. 두 문을 닫으면 자유단이 가운데서 딱 맞닿습니다.',
      '① 주인공 그림을 뒷판 가운데(표시된 자리)에 얇게 붙입니다. 그 위로 커튼이 미끄러지니 두껍지 않게 붙여주세요.',
      '④ 커튼 2장을 주인공 위에 좌·우에서 겹쳐 놓습니다(닫힘 상태에서 가운데서 살짝 겹쳐 주인공을 가림). 커튼 바깥 끝의 초록 풀칠 자리에는 나중에 지지대만 붙일 것이고, 커튼을 뒷판에는 절대 붙이지 마세요 — 커튼은 미끄러져야 합니다.',
      '③ 장식 액자를 커튼 위에 덮고 위·아래 변(초록)만 뒷판에 붙입니다. 좌·우는 절대 붙이지 마세요 — 그래야 커튼이 액자 밑 좌우로 빠져나갑니다. 액자가 커튼을 눌러 뒷판에 납작하게 잡아 줍니다.',
      "② 가장 중요 — 지지대 붙이기: 스트랩 한끝을 문 안쪽 'Ⓡ/Ⓛ 지지대 자리'(경첩에서 조금 안쪽)에, 다른 끝을 같은 쪽 커튼 바깥 끝에 붙입니다. 두 접힘선이 반드시 문 경첩(세로선)과 나란해야 합니다. 비뚤면 열 때 뻑뻑하거나 걸립니다. 오른쪽·왼쪽 모두 대칭으로 붙여주세요.",
      '문 바깥면에 돌 장식을 붙이면 완성. 두 문을 함께 열면 커튼이 좌우로 걷히며 주인공 둘레에 노란 다이아몬드가 열리고, 닫으면 커튼이 저절로 다시 모여 주인공을 덮습니다.',
    ],
    tips: '핵심은 두 가지입니다. (1) 장식 액자는 위·아래만 풀칠 — 좌·우를 붙이면 커튼이 못 움직입니다. (2) 지지대 두 접힘선을 문 경첩과 나란히, 좌우 대칭으로 붙이기. 너무 뻑뻑하면 액자 위·아래 풀칠을 아주 살짝만 하고, 열어도 주인공이 반쯤 가리면 지지대를 커튼 바깥 끝에 더 정확히 다시 붙여 주세요. 닫을 때는 종이가 살짝 도톰하니 억지로 세게 누르지 말고 살살 접으세요.',
  },
  'magic-shutter': {
    title: '매직 셔터 조립 설명서',
    materials: '가위 또는 칼(어른과 함께), 풀 또는 양면테이프, 색연필(선택)',
    steps: [
      '검은색 실선을 따라 오려주세요: ① 앞면 카드의 창문 안 세로 틈(길쭉한 구멍)들 — 중요: 틈 사이의 세로살(빗살)은 절대 자르지 마세요! 살은 위아래가 액자에 붙어 있어야 합니다. ② 오른쪽에 손잡이가 달린 큰 슬라이더 판(가운데 가로로 길쭉한 멈춤 슬롯도 오려냄), ③ 위 안내 다리 띠 1개, ④ 멈춤 핀이 달린 아래 안내 다리 띠 1개.',
      '슬라이더 판의 세로 칸에 그림을 채워주세요. ① 표시 칸들(한 칸 건너 하나씩)에는 첫 번째 그림 조각을, ② 표시 칸들에는 두 번째 그림 조각을 번갈아 그립니다. 칸 순서만 지키면 창문에서 두 그림이 각각 온전하게 보여요.',
      '슬라이더를 그림 그린 면이 창문 쪽을 향하게 앞면 카드 뒤에 대고, 손잡이를 카드 오른쪽 밖으로 빼내세요. 창문 전체가 슬라이더로 덮이는지 확인합니다.',
      '중요(안내·멈춤 다리): 두 안내 다리는 인쇄면이 카드 뒤로 가게 뒤집어, 점선 표시 자리에 맞춰 붙입니다. 위 안내 다리를 슬라이더 위쪽에 다리처럼 얹어 풀칠 면(초록)만 카드에 붙이고, 접는 선의 립(날개)을 슬라이더 쪽으로 접어 덮어주세요 — 립은 슬라이더에 붙이면 안 됩니다! 아래 안내 다리도 같은 방법으로 슬라이더 아래쪽에 붙이되, 가운데 멈춤 핀을 산접기로 위로 접어 슬라이더의 멈춤 슬롯에 뒤에서 끼우고, 앞으로 나온 핀 끝(파란 골선)을 아래로 접어 고정하세요. 이 핀이 슬롯 양 끝에 걸려 손잡이가 딱 한 칸만 움직입니다.',
      '손잡이를 왼쪽 끝까지 밀면 그림 ①, 오른쪽 끝까지 당기면 그림 ②가 짠! 하고 나타납니다. 끝까지 밀어 핀에 딱 걸리는 자리가 그림이 정확히 맞는 자리예요.',
    ],
    tips: '핵심은 세 가지입니다. (1) 창문의 세로살은 자르지 않기 — 틈만 오려냅니다. (2) 안내 다리는 카드에만 풀칠하고 슬라이더에는 절대 붙이지 않기 — 붙이면 안 움직여요. (3) 멈춤 핀을 슬롯에 꼭 끼우기 — 핀이 없으면 그림이 어중간한 자리에 멈춰 반반씩 보입니다. 너무 뻑뻑하면 안내 다리 립을 살짝 느슨하게 접어 주세요.',
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
 * @param {{ mechanism?: string, theme?: string, params?: object }} cardParams
 *   `cardParams.params` (AI-authored, e.g. `vfoldParams`, or a manual UI
 *   override) is merged over the mechanism's defaultParams so both the
 *   printed SVG and the 3D preview pick up the same numbers.
 * @param {'A4'|'LETTER'} paperSize
 * @param {'color'|'bw'} colorMode
 * @returns {object | null}
 */
export function buildMechanismParams(cardParams, paperSize, colorMode) {
  const els = getElements(cardParams);
  if (els.length === 0) return null;
  return buildElementParams(els[0], paperSize, colorMode, cardParams.theme);
}

/**
 * Element-level variant of buildMechanismParams for multi-mechanism (v2)
 * cards: one call per element. buildMechanismParams delegates here with the
 * first element, so v1 single-mechanism behavior is unchanged.
 * @param {{ mechanism?: string, params?: object }} element
 * @param {'A4'|'LETTER'} paperSize
 * @param {'color'|'bw'} colorMode
 * @param {string} [theme]
 * @returns {object | null}
 */
export function buildElementParams(element, paperSize, colorMode, theme) {
  const mech = getMechanism(element?.mechanism);
  if (!mech) return null;
  return { ...mech.defaultParams, ...element.params, paperSize, colorMode, theme };
}

/**
 * Resolve the list of decoration image/guide "slots" a mechanism wants — one
 * per distinct decoration the mechanism can display (e.g. one per wall for
 * 'layered-stage'). Each slot is just a content-size hint in mm
 * (`{ label, width, height }`); SVGPreview.jsx is responsible for laying the
 * slot out on an actual page.
 *
 * Mechanisms without an explicit `decorationSlots(params)` entry fall back to
 * the single-slot behavior every mechanism had before this function existed,
 * so this is a no-regression default.
 *
 * @param {{ mechanism?: string, theme?: string }} cardParams
 * @param {'A4'|'LETTER'} paperSize
 * @param {'color'|'bw'} colorMode
 * @returns {Array<{ label: string, width: number, height: number }>}
 */
export function getDecorationSlots(cardParams, paperSize, colorMode) {
  return getElements(cardParams).flatMap((el) =>
    getElementDecorationSlots(el, paperSize, colorMode, cardParams?.theme),
  );
}

/**
 * Decoration slots for ONE element (multi-mechanism cards concatenate these
 * per element via getDecorationSlots).
 */
export function getElementDecorationSlots(element, paperSize, colorMode, theme) {
  const mech = getMechanism(element?.mechanism);
  if (mech && typeof mech.decorationSlots === 'function') {
    const params = buildElementParams(element, paperSize, colorMode, theme);
    const slots = mech.decorationSlots(params);
    if (Array.isArray(slots) && slots.length > 0) return slots;
  }
  return [{ label: theme, width: 100, height: 100 }];
}
