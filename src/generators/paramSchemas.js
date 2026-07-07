/**
 * @fileoverview Declarative parameter metadata for every mechanism, consumed
 * by the expert-mode ParamPanel (sliders/number inputs) and by
 * validation.js (printability warnings).
 *
 * Field shape:
 *   { key, labelKo, unit, step, limits(params, paperSize) => {min, max} }
 * where `params` is the fully merged param object
 * (`{...defaultParams, ...cardParams.params}`). `limits` is ALWAYS a function
 * so interdependent bounds (e.g. flap-clap: bigger offset → smaller
 * flapLength max) re-evaluate against the current values.
 *
 * Optional sub-object params (v-fold's armExtension) use
 *   { key, labelKo, type: 'group', optional: true, enableValue, children }
 * where children are ordinary fields whose values live at
 * `params[group.key][child.key]`.
 *
 * min/max strategy: wherever a generator exports a clamping resolver we
 * "probe" it — ask it to clamp an absurdly large (or small) request and read
 * back the value it settled on. That keeps these bounds authoritative (the
 * exact numbers the printed SVG will use) without duplicating the fit
 * formulas. Static bounds come straight from the generators' exported LIMITS
 * constants — never re-typed literals — so UI, print clamp, and warnings all
 * share one source.
 *
 * @module generators/paramSchemas
 */

import { CARD_SIZES, PRINT } from './constants.js';
import { clamp, degToRad } from '../utils/math.js';
import { vFoldLimits, EXTENSION_LIMIT_OPTS } from './vfold.js';
import { ACCORDION_LIMITS, resolveAccordionGeometry } from './accordionPopup.js';
import { VOLVELLE_CONST } from './volvelle.js';
import { FLIPDISC_CONST, resolveFlipDiscGeometry } from './flipDisc.js';
import { SPIRAL_LIMITS } from './spiralSpring.js';
import { RISING_LIMITS } from './risingSlide.js';
import { LAYERED_STAGE_LIMITS } from './layeredStage.js';
import { AUTO_SLIDE_LIMITS, resolveAutoSlideWindow } from './autoSlideWindow.js';
import { SLIDE_SWING_LIMITS, resolveSlideToSwing } from './slideToSwing.js';
import { FLAP_CLAP_LIMITS, resolveFlapClapGeometry } from './flapClap.js';
import { CAMERA_PULL_LIMITS, resolveCameraPull } from './cameraPrintPull.js';
import { GATE_CURTAIN_LIMITS, resolveGateCurtain } from './gateCurtain.js';

const card = (paperSize) => CARD_SIZES[paperSize] || CARD_SIZES.A4;
const num = (v, d) => (typeof v === 'number' && Number.isFinite(v) ? v : d);

export const PARAM_SCHEMAS = {
  'v-fold': [
    {
      key: 'angle', labelKo: '팔 벌림 각도 (angle)', unit: '°', step: 1,
      limits: () => ({ min: 15, max: 75 }),
    },
    {
      key: 'armLength', labelKo: '팔 길이 (armLength)', unit: 'mm', step: 1,
      limits: (p, paperSize) => {
        const lim = vFoldLimits(num(p.angle, 45), card(paperSize).height, paperSize);
        return { min: Math.ceil(lim.armMin), max: Math.floor(lim.armMax) };
      },
    },
    {
      key: 'armExtension', labelKo: '혀/뿔처럼 길게 늘이기 (armExtension)',
      type: 'group', optional: true,
      enableValue: { armLength: 80, angle: 12 },
      children: [
        {
          key: 'angle', labelKo: '확장부 각도', unit: '°', step: 1,
          limits: () => ({ min: EXTENSION_LIMIT_OPTS.angleMin, max: EXTENSION_LIMIT_OPTS.angleMax }),
        },
        {
          key: 'armLength', labelKo: '확장부 길이', unit: 'mm', step: 1,
          limits: (p, paperSize) => {
            // Same anchor math as vfold.js / Preview3D: the extension inherits
            // the vertical room left above the flat-printed mouth wedge.
            const c = card(paperSize);
            const baseLim = vFoldLimits(num(p.angle, 45), c.height, paperSize);
            const baseArm = clamp(num(p.armLength, 40), baseLim.armMin, baseLim.armMax);
            const flatTopY = c.height - baseArm * Math.sin(degToRad(baseLim.angle));
            const lim = vFoldLimits(num(p.armExtension?.angle, 12), flatTopY, paperSize, EXTENSION_LIMIT_OPTS);
            return { min: Math.ceil(lim.armMin), max: Math.floor(lim.armMax) };
          },
        },
      ],
    },
  ],

  // boxPopup.js has no internal clamps at all, so these bounds are the ONLY
  // guard — kept conservative on purpose (box spans the spine by ±height).
  'box-popup': [
    {
      key: 'width', labelKo: '상자 폭 (width)', unit: 'mm', step: 1,
      limits: (p, paperSize) => ({
        min: 10,
        max: Math.floor(Math.min(120, card(paperSize).width - 2 * PRINT.MARGIN - 12)),
      }),
    },
    {
      key: 'height', labelKo: '상자 높이/깊이 (height)', unit: 'mm', step: 1,
      limits: (p, paperSize) => ({
        min: 10,
        max: Math.floor(card(paperSize).height / 2 - PRINT.MARGIN - 8),
      }),
    },
  ],

  // Mirrors parallelFold.js's internal buildLevels() clamps.
  'parallel-fold': [
    {
      key: 'width', labelKo: '계단 폭 (width)', unit: 'mm', step: 1,
      limits: (p, paperSize) => ({ min: 5, max: Math.floor(card(paperSize).width - 2 * PRINT.MARGIN) }),
    },
    {
      key: 'depth', labelKo: '계단 깊이 = 최대 팝업 높이 (depth)', unit: 'mm', step: 1,
      limits: (p, paperSize) => ({ min: 3, max: Math.floor(card(paperSize).height / 2 - PRINT.MARGIN) }),
    },
  ],

  // Mirrors pullTab.js's internal validatePullTabParams() clamps.
  'pull-tab': [
    {
      key: 'sliderWidth', labelKo: '슬라이더 폭 (sliderWidth)', unit: 'mm', step: 1,
      limits: () => ({ min: 8, max: 60 }),
    },
    {
      key: 'sliderHeight', labelKo: '슬라이더 높이 (sliderHeight)', unit: 'mm', step: 1,
      limits: () => ({ min: 5, max: 40 }),
    },
    {
      key: 'trackLength', labelKo: '트랙 길이 (trackLength)', unit: 'mm', step: 1,
      // Lower bound keeps travel = trackLength − sliderWidth − 2·buffer(2)
      // meaningfully positive (≥ ~6mm of actual movement).
      limits: (p, paperSize) => ({
        min: Math.max(20, Math.ceil(num(p.sliderWidth, 30) + 10)),
        max: Math.floor(card(paperSize).width - 2 * PRINT.MARGIN - 20),
      }),
    },
  ],

  'straw-rocket': [],

  'accordion': [
    {
      key: 'a', labelKo: '척추~앵커 거리 (a)', unit: 'mm', step: 1,
      limits: (p, paperSize) => ({
        min: ACCORDION_LIMITS.A_MIN,
        max: resolveAccordionGeometry({ a: 9999, panels: p.panels, wallHeight: p.wallHeight, paperSize }).a,
      }),
    },
    {
      key: 'panels', labelKo: '병풍 주름판 수 (panels)', unit: '개', step: 1,
      limits: () => ({ min: ACCORDION_LIMITS.PANELS_MIN, max: ACCORDION_LIMITS.PANELS_MAX }),
    },
    {
      key: 'wallHeight', labelKo: '병풍 높이 (wallHeight)', unit: 'mm', step: 1,
      limits: (p, paperSize) => ({
        min: ACCORDION_LIMITS.WALL_MIN,
        max: resolveAccordionGeometry({ a: p.a, panels: p.panels, wallHeight: 9999, paperSize }).wallHeight,
      }),
    },
  ],

  'volvelle': [
    {
      key: 'R', labelKo: '돌림판 반지름 (R)', unit: 'mm', step: 1,
      limits: () => ({ min: VOLVELLE_CONST.R_MIN, max: VOLVELLE_CONST.R_MAX }),
    },
    {
      key: 'sectors', labelKo: '그림 칸 수 (sectors)', unit: '개', step: 1,
      limits: () => ({ min: VOLVELLE_CONST.SECTORS_MIN, max: VOLVELLE_CONST.SECTORS_MAX }),
    },
  ],

  'flip-disc': [
    {
      key: 'R', labelKo: '접시 반지름 (R)', unit: 'mm', step: 1,
      // More pages → smaller grid cells → lower R cap; probe the packer.
      limits: (p, paperSize) => ({
        min: FLIPDISC_CONST.R_MIN,
        max: resolveFlipDiscGeometry({ R: 9999, pages: p.pages, paperSize }).R,
      }),
    },
    {
      key: 'pages', labelKo: '넘김판 장수 (pages)', unit: '개', step: 1,
      limits: () => ({ min: FLIPDISC_CONST.PAGES_MIN, max: FLIPDISC_CONST.PAGES_MAX }),
    },
  ],

  'spiral-spring': [
    {
      key: 'turns', labelKo: '감김 수 (turns)', unit: '개', step: 1,
      limits: () => ({ min: SPIRAL_LIMITS.TURNS_MIN, max: SPIRAL_LIMITS.TURNS_MAX }),
    },
    {
      key: 'pitch', labelKo: '스프링 띠 폭 (pitch)', unit: 'mm', step: 1,
      limits: () => ({ min: SPIRAL_LIMITS.PITCH_MIN, max: SPIRAL_LIMITS.PITCH_MAX }),
    },
    {
      key: 'decorations', labelKo: '장식 부착점 수 (decorations)', unit: '개', step: 1,
      limits: () => ({ min: SPIRAL_LIMITS.DECOS_MIN, max: SPIRAL_LIMITS.DECOS_MAX }),
    },
  ],

  'rising-slide': [
    {
      key: 'riseFraction', labelKo: '상승 거리 비율 (riseFraction)', unit: '×', step: 0.01,
      limits: () => ({ min: RISING_LIMITS.RISE_MIN, max: RISING_LIMITS.RISE_MAX }),
    },
    {
      key: 'sliderWidth', labelKo: '슬라이더 띠 폭 (sliderWidth)', unit: 'mm', step: 1,
      limits: () => ({ min: RISING_LIMITS.SLIDER_W_MIN, max: RISING_LIMITS.SLIDER_W_MAX }),
    },
    {
      key: 'grip', labelKo: '손잡이 길이 (grip)', unit: 'mm', step: 1,
      limits: () => ({ min: RISING_LIMITS.GRIP_MIN, max: RISING_LIMITS.GRIP_MAX }),
    },
  ],

  'layered-stage': [
    {
      key: 'layers', labelKo: '벽 층수 (layers)', unit: '개', step: 1,
      limits: () => ({ min: LAYERED_STAGE_LIMITS.LAYERS_MIN, max: LAYERED_STAGE_LIMITS.LAYERS_MAX }),
    },
  ],

  'auto-slide-window': [
    {
      key: 'pivotArm', labelKo: '피벗 팔 길이 (pivotArm)', unit: 'mm', step: 1,
      limits: (p, paperSize) => ({
        min: AUTO_SLIDE_LIMITS.P_MIN,
        max: resolveAutoSlideWindow({ paperSize, pivotArm: 9999, strut: p.strut, windowHeight: p.windowHeight }).p,
      }),
    },
    {
      key: 'strut', labelKo: '지지대 팔 길이 (strut)', unit: 'mm', step: 1,
      // Monotonicity requires L ≥ p + 10; both ends probed off the resolver.
      limits: (p, paperSize) => ({
        min: Math.ceil(resolveAutoSlideWindow({ paperSize, pivotArm: p.pivotArm, strut: 0, windowHeight: p.windowHeight }).L),
        max: Math.floor(resolveAutoSlideWindow({ paperSize, pivotArm: p.pivotArm, strut: 9999, windowHeight: p.windowHeight }).L),
      }),
    },
    {
      key: 'windowHeight', labelKo: '창문 높이 (windowHeight)', unit: 'mm', step: 1,
      limits: () => ({ min: AUTO_SLIDE_LIMITS.WIN_H_MIN, max: AUTO_SLIDE_LIMITS.WIN_H_MAX }),
    },
  ],

  'slide-to-swing': [
    {
      key: 'armLength', labelKo: '기둥 길이 (armLength)', unit: 'mm', step: 1,
      limits: (p, paperSize) => ({
        min: SLIDE_SWING_LIMITS.R_MIN,
        max: resolveSlideToSwing({ paperSize, armLength: 9999, swingAngle: p.swingAngle }).r,
      }),
    },
    {
      key: 'swingAngle', labelKo: '흔들림 반각 (swingAngle)', unit: '°', step: 1,
      limits: () => ({ min: SLIDE_SWING_LIMITS.THETA_MIN, max: SLIDE_SWING_LIMITS.THETA_MAX }),
    },
  ],

  'flap-clap': [
    {
      key: 'offset', labelKo: '척추~경첩 거리 (offset)', unit: 'mm', step: 1,
      limits: () => ({ min: FLAP_CLAP_LIMITS.OFFSET_MIN, max: FLAP_CLAP_LIMITS.OFFSET_MAX }),
    },
    {
      key: 'flapLength', labelKo: '플랩 길이 (flapLength)', unit: 'mm', step: 1,
      // hFit = SAFETY·sMax − offset: bigger offset → smaller max. Probed.
      limits: (p, paperSize) => ({
        min: FLAP_CLAP_LIMITS.LEN_MIN,
        max: resolveFlapClapGeometry({ offset: p.offset, flapLength: 9999, halfWidth: p.halfWidth, delta: p.delta, paperSize }).h,
      }),
    },
    {
      key: 'halfWidth', labelKo: '플랩 반폭 (halfWidth)', unit: 'mm', step: 1,
      limits: (p, paperSize) => ({
        min: FLAP_CLAP_LIMITS.HALFW_MIN,
        max: resolveFlapClapGeometry({ offset: p.offset, flapLength: p.flapLength, halfWidth: 9999, delta: p.delta, paperSize }).b,
      }),
    },
    {
      key: 'delta', labelKo: '조립 세움 각도 (delta)', unit: '°', step: 1,
      limits: () => ({ min: FLAP_CLAP_LIMITS.DELTA_MIN, max: FLAP_CLAP_LIMITS.DELTA_MAX }),
    },
  ],

  'camera-print-pull': [
    {
      key: 'riseFraction', labelKo: '사진 상승 비율 (riseFraction)', unit: '×', step: 0.01,
      limits: () => ({ min: CAMERA_PULL_LIMITS.RISE_MIN, max: CAMERA_PULL_LIMITS.RISE_MAX }),
    },
    {
      key: 'clearance', labelKo: '슬롯 여유 (clearance)', unit: 'mm', step: 0.05,
      limits: () => ({ min: CAMERA_PULL_LIMITS.CLEARANCE_MIN, max: CAMERA_PULL_LIMITS.CLEARANCE_MAX }),
    },
    {
      key: 'stripWidth', labelKo: '되돌림 띠 폭 (stripWidth)', unit: 'mm', step: 1,
      limits: () => ({ min: CAMERA_PULL_LIMITS.STRIP_W_MIN, max: CAMERA_PULL_LIMITS.STRIP_W_MAX }),
    },
    {
      key: 'grip', labelKo: '손잡이 길이 (grip)', unit: 'mm', step: 1,
      limits: () => ({ min: CAMERA_PULL_LIMITS.GRIP_MIN, max: CAMERA_PULL_LIMITS.GRIP_MAX }),
    },
    {
      key: 'photoWidth', labelKo: '사진 폭 (photoWidth)', unit: 'mm', step: 1,
      limits: (p, paperSize) => ({
        min: CAMERA_PULL_LIMITS.PHOTO_W_MIN,
        max: resolveCameraPull({
          paperSize,
          riseFraction: p.riseFraction,
          clearance: p.clearance,
          stripWidth: p.stripWidth,
          grip: p.grip,
          photoWidth: 9999,
        }).photoW,
      }),
    },
  ],

  'gate-curtain': [
    {
      key: 'panelWidth', labelKo: '카드(뒷판) 폭 (panelWidth)', unit: 'mm', step: 1,
      limits: (p, paperSize) => ({
        min: GATE_CURTAIN_LIMITS.PANEL_W_MIN,
        max: resolveGateCurtain({ paperSize, panelWidth: 9999 }).panelW,
      }),
    },
    {
      key: 'revealWidth', labelKo: '가운데 창(다이아몬드) 폭 (revealWidth)', unit: 'mm', step: 1,
      // Upper bound depends on panelWidth·hingeOffset (curtain pinch ≥ floor);
      // keep the current values and probe revealWidth only.
      limits: (p, paperSize) => ({
        min: GATE_CURTAIN_LIMITS.REVEAL_W_MIN,
        max: resolveGateCurtain({
          paperSize,
          panelWidth: p.panelWidth,
          hingeOffset: p.hingeOffset,
          revealWidth: 9999,
        }).revealW,
      }),
    },
    {
      key: 'hingeOffset', labelKo: '경첩-지지대 거리 = 커튼 이동 절반 (hingeOffset)', unit: 'mm', step: 1,
      // Upper bound depends on panelWidth (door width + monotonicity L > d);
      // keep panelWidth and probe hingeOffset only.
      limits: (p, paperSize) => ({
        min: GATE_CURTAIN_LIMITS.D_MIN,
        max: resolveGateCurtain({ paperSize, panelWidth: p.panelWidth, hingeOffset: 9999 }).d,
      }),
    },
  ],
};
