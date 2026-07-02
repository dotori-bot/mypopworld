/**
 * @fileoverview Rising-slide ("빛줄기 상승 슬라이드") mechanism generator.
 *
 * A flat, bookmark-style card in which a small figure rides STRAIGHT UP a fixed
 * vertical slot when a handle is pulled. The glow / light-beam / sky behind the
 * figure is printed background art only (NOT a physical cut piece) — the figure
 * simply travels up over it. Adapted from pullTab.js (track slot + separate
 * slider + guide strips + stop tabs), rotated to the vertical axis, given a much
 * longer travel, and fitted with a positive top-of-travel retention catch so the
 * handle can never be yanked out of the top of the slot and lost.
 *
 * ── Physical stack (front → back) ────────────────────────────────────────────
 *   1. Card FRONT: printed scene with a vertical slot cut through it.
 *   2. A mount tab folded FORWARD through the slot; the paper figure glues to it.
 *   3. Card BACK: a long vertical SLIDER strip (figure ↔ slider are joined by the
 *      mount tab passing through the slot; both are wider than the 1.1 mm slot so
 *      the assembly is captured front-to-back and cannot fall off the card).
 *   4. Two RETAINER strips glued across the back — a top "stop" bridge just above
 *      the slot and a lower alignment guide — each bridging OVER the slider strip
 *      to form a channel it slides through.
 *
 * ── Travel vs. card height ───────────────────────────────────────────────────
 *   The front face is one half-sheet: usable depth faceH = CARD.height − MARGIN
 *   (free/handle edge at MARGIN, spine/fold at the far edge). The figure travel
 *   is the design target T = riseFraction · faceH (default 0.62, so ≈ 60–70 %).
 *   The closed slot has length slotLen = T + neckH, where neckH (3 mm) is the
 *   vertical footprint the mount tab occupies in the slot, so
 *       travel = slotLen − neckH = T.
 *   T is clamped so BOTH pieces fit the printable sheet on A4 AND Letter:
 *       front face:  slotTopY + slotLen ≤ spineY − bottomPad
 *                    ⇒ T ≤ spineY − bottomPad − slotTopY − neckH
 *       whitespace:  the loose slider (length = T + grip + 9, plus an 8 mm mount
 *                    tab) must sit in the lower half-sheet
 *                    ⇒ T ≤ (paper.height − spineY − MARGIN) − grip − 21
 *   T = clamp( min(target, frontLimit, whiteLimit) ), never running off the page.
 *
 * ── Slot / slider clearance (same logic as pullTab) ──────────────────────────
 *   slotWidth = paperThickness + clearance = 0.3 + 0.8 = 1.1 mm. The mount tab is
 *   a flat 0.3 mm paper tab passing through flat-wise, sliding with (1.1−0.3)/2 =
 *   0.4 mm each side — free but not sloppy. Laterally the slider body (width
 *   sliderW) rides in a channel of channelGap = sliderW + latClear (latClear =
 *   0.6 mm ⇒ 0.3 mm each side): glides without skewing.
 *
 * ── THE retention catch (top of travel) — the safety-critical number ─────────
 *   A "stop flange" on the slider is wider than the retainer channel by
 *   2·stopCatch. The top retainer bridge (glued to the back just above the slot,
 *   glue ends glueEnd = 6 mm each) has a channel of width channelGap; the flange
 *   is channelGap + 2·stopCatch wide, so it CANNOT pass up through that channel.
 *       stopCatch = 4 mm   ⇒   flangeW = channelGap + 8 mm.
 *   • Not too loose (won't fall out): the flange overhangs the channel by 4 mm on
 *     EACH side — vastly more than the 0.3 mm running clearance — and lands on the
 *     6 mm glued end of the retainer (4 mm < 6 mm, so it seats fully on glued
 *     paper, not on a free edge it could bend past). To escape, the paper would
 *     have to buckle 4 mm per side; it physically jams first. Firm, positive stop.
 *   • Not too tight (won't jam mid-stroke): the flange sits BELOW the retainer the
 *     entire stroke and only meets it at the very top. Throughout travel, only the
 *     slider body (sliderW) is in the channel with its 0.3 mm/side clearance — the
 *     flange adds zero running friction. The stop is felt only at the end.
 *   The closed slot end is a second, redundant stop (the mount tab is trapped in a
 *   closed slot); the flange exists so the sturdy slider — not the thin mount tab
 *   neck — absorbs a hard yank, so the neck never tears.
 *
 * ── Flat-foldability ─────────────────────────────────────────────────────────
 *   N/A in the pop-up sense: this mechanism NEVER leaves the plane. The whole
 *   assembly (card + slider + retainers) is < 1 mm thick and stays flat at every
 *   handle position, so a folding card closes flat over it trivially. The only
 *   folds are the forward mount-tab fold and the glued retainer bridges — neither
 *   needs a collapsing mountain/valley pair.
 *
 * @module generators/risingSlide
 */

import { PAPER_SIZES, CARD_SIZES, PRINT } from './constants.js';
import { clamp, round } from '../utils/math.js';
import {
  addPath,
  addRect,
  addText,
  addGroup,
  getLineStyle,
  createTemplate,
} from './svgBuilder.js';
import { generateStar } from './decorations.js';

/** Fixed design limits / clamps (see file header for the derivations). */
export const RISING_LIMITS = {
  PAPER_THICKNESS: 0.3,
  CLEARANCE_MIN: 0.5,
  CLEARANCE_MAX: 1.5,   // slotWidth = thickness + clearance
  RISE_MIN: 0.5,
  RISE_MAX: 0.7,        // riseFraction of the printable face height
  SLIDER_W_MIN: 8,
  SLIDER_W_MAX: 20,     // slider strip width (mm)
  GRIP_MIN: 15,
  GRIP_MAX: 30,         // exposed handle grip above the scene (mm)
  LAT_CLEAR: 0.6,       // total lateral play of slider in channel (mm)
  RET_W: 6,             // retainer strip width (mm)
  GLUE_END: 6,          // retainer glue end each side (mm, > 5 grip floor)
  STOP_CATCH: 4,        // flange overhang beyond channel each side (mm)
  FLANGE_H: 5,          // vertical height of the stop-flange band (mm)
  NECK_H: 3,            // mount-tab footprint in the slot (mm) → travel headroom
  MOUNT_LEN: 8,         // forward-folding mount tab length (mm)
  TOP_RESERVE: 6,       // sheet-top margin → scene top (mm)
  FIG_TOP_PAD: 6,       // scene top → slot top (figure stays inside scene) (mm)
  BOTTOM_PAD: 4,        // slot bottom → spine (mm)
  T_FLOOR: 20,          // absolute minimum travel (mm)
};

/**
 * @typedef {Object} RisingGeometry
 * @property {'A4'|'LETTER'} paperSize
 * @property {number} spineY
 * @property {number} faceH        - Printable front-face depth (mm)
 * @property {number} cx           - Slot centre X (mm)
 * @property {number} slotWidth    - Slot width = thickness + clearance (mm)
 * @property {number} slotLen      - Slot length (mm)
 * @property {number} slotTopY     - Slot top Y on the card face (mm)
 * @property {number} slotBotY     - Slot bottom Y on the card face (mm)
 * @property {number} sceneTopY    - Top of the printed scene (mm)
 * @property {number} sceneBotY    - Bottom of the printed scene (mm)
 * @property {number} travel       - Figure rise distance (mm)
 * @property {number} sliderW      - Slider strip width (mm)
 * @property {number} channelGap   - Retainer channel width (mm)
 * @property {number} flangeW      - Stop-flange full width (mm)
 * @property {number} stopCatch    - Flange overhang beyond channel each side (mm)
 * @property {number} grip         - Exposed handle grip length (mm)
 * @property {number} stripLen     - Loose slider body length (mm)
 */

/**
 * Resolve + clamp rising-slide geometry against the printable card face.
 * Pure numbers only (no DOM) so it can be unit/bounds tested headlessly.
 *
 * @param {{ paperSize?: 'A4'|'LETTER', riseFraction?: number, clearance?: number,
 *           sliderWidth?: number, grip?: number }} [opts]
 * @returns {RisingGeometry}
 */
export function resolveRisingSlide(opts = {}) {
  const L = RISING_LIMITS;
  const paper = PAPER_SIZES[opts.paperSize] || PAPER_SIZES.A4;
  const card = CARD_SIZES[opts.paperSize] || CARD_SIZES.A4;
  const paperSize = CARD_SIZES[opts.paperSize] ? opts.paperSize : 'A4';

  // NaN-safe numeric intake (?? only guards null/undefined, not NaN/garbage).
  const numOr = (v, d) => (Number.isFinite(Number(v)) ? Number(v) : d);

  const spineY = paper.height / 2;
  const faceH = card.height - PRINT.MARGIN;
  const whitespaceH = paper.height - spineY - PRINT.MARGIN;

  const t = L.PAPER_THICKNESS;
  const c = clamp(numOr(opts.clearance, 0.8), L.CLEARANCE_MIN, L.CLEARANCE_MAX);
  const slotWidth = round(t + c, 2);
  const sliderW = clamp(numOr(opts.sliderWidth, 12), L.SLIDER_W_MIN, L.SLIDER_W_MAX);
  const grip = clamp(numOr(opts.grip, 20), L.GRIP_MIN, L.GRIP_MAX);
  const f = clamp(numOr(opts.riseFraction, 0.62), L.RISE_MIN, L.RISE_MAX);

  const channelGap = round(sliderW + L.LAT_CLEAR, 2);
  const flangeW = round(channelGap + 2 * L.STOP_CATCH, 2);

  const cx = round(paper.width / 2);
  const sceneTopY = PRINT.MARGIN + L.TOP_RESERVE;
  const slotTopY = sceneTopY + L.FIG_TOP_PAD;

  // Travel target and the two hard fit limits (front face & whitespace).
  // Whitespace: the loose piece drops from (spineY + 6) by stripLen (= T+grip+9)
  // plus the MOUNT_LEN forward-fold tab; the whole thing must clear the bottom
  // margin, i.e. 6 + (T+grip+9) + MOUNT_LEN ≤ whitespaceH (+1 mm safety).
  const target = f * faceH;
  const frontLimit = spineY - L.BOTTOM_PAD - slotTopY - L.NECK_H;
  const whiteLimit = whitespaceH - grip - 15 - L.MOUNT_LEN - 1;
  const tMax = Math.max(L.T_FLOOR, Math.min(frontLimit, whiteLimit));
  const T = round(clamp(Math.min(target, frontLimit, whiteLimit), L.T_FLOOR, tMax), 1);

  const slotLen = round(T + L.NECK_H, 1);
  const slotBotY = round(slotTopY + slotLen, 1);
  const sceneBotY = round(spineY - L.BOTTOM_PAD, 1);
  const stripLen = round(T + grip + 9, 1);

  return {
    paperSize,
    spineY: round(spineY, 1),
    faceH: round(faceH, 1),
    cx,
    slotWidth,
    slotLen,
    slotTopY: round(slotTopY, 1),
    slotBotY,
    sceneTopY: round(sceneTopY, 1),
    sceneBotY,
    travel: round(T, 1),
    sliderW: round(sliderW, 1),
    channelGap,
    flangeW,
    stopCatch: L.STOP_CATCH,
    grip: round(grip, 1),
    stripLen,
  };
}

/**
 * Rounded-rectangle helper as an SVG path "d" (all corners same radius).
 * @param {number} x @param {number} y @param {number} w @param {number} h @param {number} r
 * @returns {string}
 */
function roundRectPath(x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  return (
    `M ${round(x + rr)} ${round(y)} ` +
    `L ${round(x + w - rr)} ${round(y)} Q ${round(x + w)} ${round(y)} ${round(x + w)} ${round(y + rr)} ` +
    `L ${round(x + w)} ${round(y + h - rr)} Q ${round(x + w)} ${round(y + h)} ${round(x + w - rr)} ${round(y + h)} ` +
    `L ${round(x + rr)} ${round(y + h)} Q ${round(x)} ${round(y + h)} ${round(x)} ${round(y + h - rr)} ` +
    `L ${round(x)} ${round(y + rr)} Q ${round(x)} ${round(y)} ${round(x + rr)} ${round(y)} Z`
  );
}

/**
 * Draw one retainer strip (a bridge glued at both ends over the slider): a cut
 * rectangle with two green glue-end zones and a central un-glued channel.
 * @param {SVGElement} g
 * @param {number} x - Left edge (mm)
 * @param {number} y - Top edge (mm)
 * @param {RisingGeometry} geo
 * @param {string} label
 * @param {boolean} isColor
 */
function drawRetainer(g, x, y, geo, label, isColor) {
  const L = RISING_LIMITS;
  const w = round(geo.channelGap + 2 * L.GLUE_END);
  const h = L.RET_W;
  addRect(g, x, y, w, h, getLineStyle('CUT', isColor));
  // Left / right glue ends.
  addRect(g, x, y, L.GLUE_END, h, getLineStyle('GLUE_TAB', isColor));
  addRect(g, round(x + w - L.GLUE_END), y, L.GLUE_END, h, getLineStyle('GLUE_TAB', isColor));
  // Central channel boundaries (score) — this part must NOT be glued.
  const chL = round(x + L.GLUE_END);
  addPath(g, `M ${chL} ${y} L ${chL} ${round(y + h)}`, getLineStyle('SCORE', isColor));
  addPath(g, `M ${round(x + w - L.GLUE_END)} ${y} L ${round(x + w - L.GLUE_END)} ${round(y + h)}`, getLineStyle('SCORE', isColor));
  addText(g, round(x + w / 2), round(y + h + 3.5), label, 2.2, 'middle');
  addText(g, round(x + w / 2), round(y - 1.5), '가운데는 붙이지 마세요', 2, 'middle');
}

/**
 * Draw the rising-slide flat pattern into a passed-in SVG/group.
 *
 * @param {SVGElement} svg - Target element (a content group from createTemplate)
 * @param {Object} [options]
 * @param {'A4'|'LETTER'} [options.paperSize='A4']
 * @param {number} [options.riseFraction=0.62]
 * @param {number} [options.clearance=0.8]
 * @param {number} [options.sliderWidth=12]
 * @param {number} [options.grip=20]
 * @param {boolean} [options.isColor=true]
 * @returns {SVGGElement}
 */
export const generateRisingSlide = (svg, options = {}) => {
  const { isColor = true } = options;
  const L = RISING_LIMITS;
  const geo = resolveRisingSlide(options);
  const {
    cx, slotWidth, slotTopY, slotBotY, sceneTopY, sceneBotY,
    travel, sliderW, channelGap, stripLen, grip, spineY,
  } = geo;

  const g = addGroup(svg, 'rising-slide-group');
  const CUT = getLineStyle('CUT', isColor);
  const SCORE = getLineStyle('SCORE', isColor);
  const MOUNT = getLineStyle('MOUNTAIN_FOLD', isColor);
  const GLUE = getLineStyle('GLUE_TAB', isColor);

  // ── FRONT FACE: scene frame, slot, guide/retainer targets ────────────────
  const sceneHalfW = Math.min(cx - PRINT.MARGIN - 6, 62);
  addRect(
    g,
    round(cx - sceneHalfW), sceneTopY,
    round(sceneHalfW * 2), round(sceneBotY - sceneTopY),
    SCORE,
  );
  addText(g, cx, round(sceneTopY - 2), '앞면: 배경(빛줄기) 그림 영역', 2.6, 'middle');

  // Vertical slot (closed rectangle = inherent end stop).
  const slotLeft = round(cx - slotWidth / 2);
  addRect(g, slotLeft, slotTopY, slotWidth, round(slotBotY - slotTopY), CUT);
  addText(g, round(cx + slotWidth + 3), round((slotTopY + slotBotY) / 2), `슬롯 ${round(slotBotY - slotTopY)}×${slotWidth}mm`, 2.2, 'start');

  // Handle-exit indicator at the top of the scene.
  addPath(g, `M ${round(cx - 8)} ${sceneTopY} L ${round(cx + 8)} ${sceneTopY}`, SCORE);
  addText(g, cx, round(sceneTopY + 3), '↑ 손잡이 나오는 곳', 2.2, 'middle');

  // Figure start position (hidden low in the beam) at slot bottom.
  addText(g, cx, round(slotBotY + 3.5), '그림 시작(빛 속에 숨김)', 2.2, 'middle');

  // Back-side retainer glue TARGETS (dashed) — where the two strips glue.
  const retHalf = round(channelGap / 2 + L.GLUE_END);
  // Top stop bridge, just above the slot top.
  const topRetY = round(slotTopY - L.RET_W - 1);
  addRect(g, round(cx - retHalf), topRetY, round(retHalf * 2), L.RET_W, SCORE);
  addText(g, round(cx - retHalf - 1), round(topRetY + L.RET_W / 2), '뒷면 ① 위 멈춤 띠', 2, 'end');
  // Lower alignment guide, near the lower third of travel.
  const lowRetY = round(slotBotY - (slotBotY - slotTopY) * 0.28);
  addRect(g, round(cx - retHalf), lowRetY, round(retHalf * 2), L.RET_W, SCORE);
  addText(g, round(cx - retHalf - 1), round(lowRetY + L.RET_W / 2), '뒷면 ② 안내 띠', 2, 'end');

  addText(g, cx, round(PRINT.MARGIN + 3), '빛줄기 상승 슬라이드 (Rising Slide)', 3, 'middle');

  // ── WHITESPACE (lower half): loose slider + retainers + figure ───────────
  const xS = PRINT.MARGIN + 15;          // slider strip left edge
  const R = round(xS + sliderW);
  const top = round(spineY + 6);         // strip top (handle end)
  const flTop = round(top + stripLen - L.FLANGE_H - L.NECK_H);
  const flBot = round(top + stripLen - L.NECK_H);
  const bodyBot = round(top + stripLen);              // strip bottom = mount fold
  const mountBot = round(bodyBot + L.MOUNT_LEN);
  const Lf = round(xS - L.STOP_CATCH);
  const Rf = round(R + L.STOP_CATCH);

  // Single continuous outline: handle → right flange → mount tab → left flange.
  const outline =
    `M ${xS} ${top} L ${R} ${top} ` +
    `L ${R} ${flTop} L ${Rf} ${flTop} L ${Rf} ${flBot} L ${R} ${flBot} ` +
    `L ${R} ${bodyBot} L ${R} ${mountBot} L ${xS} ${mountBot} L ${xS} ${bodyBot} ` +
    `L ${xS} ${flBot} L ${Lf} ${flBot} L ${Lf} ${flTop} L ${xS} ${flTop} Z`;
  addPath(g, outline, CUT);

  // Mount-tab forward fold + its glue face for the figure.
  addPath(g, `M ${xS} ${bodyBot} L ${R} ${bodyBot}`, MOUNT);
  addRect(g, round(xS + 1), round(bodyBot + 1), round(sliderW - 2), round(L.MOUNT_LEN - 2), GLUE);

  // Labels on the slider.
  addText(g, round(xS + sliderW / 2), round(top - 2), '손잡이 (위로 당기기)', 2.4, 'middle');
  addText(g, Rf + 1, round((flTop + flBot) / 2), `← 멈춤 날개 (폭 ${geo.flangeW}mm)`, 2.2, 'start');
  addText(g, round(xS + sliderW / 2), round(mountBot + 3.5), '그림 붙이는 곳', 2.2, 'middle');
  addText(g, Lf - 1, round(top + stripLen * 0.5), `슬라이더 폭 ${sliderW}mm`, 2.2, 'end');
  addText(g, Rf + 1, round(top + 8), `이동 거리 ${travel}mm`, 2.2, 'start');

  // Two retainer strips to the right.
  const xRet = Math.min(round(R + L.STOP_CATCH + 42), round(PAPER_SIZES[geo.paperSize].width - PRINT.MARGIN - (channelGap + 2 * L.GLUE_END) - 2));
  drawRetainer(g, xRet, round(spineY + 12), geo, '① 위 멈춤 띠 (뒷면에)', isColor);
  drawRetainer(g, xRet, round(spineY + 30), geo, '② 안내 띠 (뒷면에)', isColor);

  // Placeholder figure to cut out and glue onto the mount tab — placed to the
  // SIDE of the mount (never adds to the piece's vertical extent).
  const figR = Math.min(9, sliderW / 2 + 3);
  const figCx = round(Rf + 14 + figR);
  const figCy = round(bodyBot);
  const pageW = PAPER_SIZES[geo.paperSize].width;
  if (figCx + figR < pageW - PRINT.MARGIN && figCy + figR < PAPER_SIZES[geo.paperSize].height - PRINT.MARGIN) {
    const star = generateStar(figCx, figCy, figR, figR * 0.45, 5, isColor ? 'color' : 'bw');
    const figStyle = { stroke: star.stroke, strokeWidth: star.strokeWidth, fill: star.fill };
    addPath(g, star.d, figStyle);
    addText(g, figCx, round(figCy + figR + 3), '작은 그림(예시)', 2, 'middle');
  }

  return g;
};

/**
 * Render the rising-slide onto a complete printable SVG template (page + spine).
 * @param {Object} [params={}]
 * @param {'A4'|'LETTER'} [params.paperSize='A4']
 * @param {'color'|'bw'} [params.colorMode='color']
 * @param {number} [params.riseFraction=0.62]
 * @param {number} [params.clearance=0.8]
 * @param {number} [params.sliderWidth=12]
 * @param {number} [params.grip=20]
 * @returns {{ svg: SVGSVGElement, geometry: RisingGeometry }}
 */
export function renderRisingSlide(params = {}) {
  const { paperSize = 'A4', colorMode = 'color', ...opts } = params;
  const { svg, contentGroup } = createTemplate(paperSize, colorMode);
  const geometry = resolveRisingSlide({ paperSize, ...opts });
  generateRisingSlide(contentGroup, {
    paperSize,
    ...opts,
    isColor: colorMode !== 'bw',
  });
  return { svg, geometry };
}
