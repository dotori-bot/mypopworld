/**
 * @fileoverview Camera-print-pull ("카메라 인화 손잡이") mechanism generator.
 *
 * A flat, instant-camera-shaped card. A rectangular PHOTO peeks out of a slot at
 * the TOP of the camera body; a printed "PULL ↓" tab hangs from a slot lower on
 * the body. Pull the tab DOWN and the photo rises UP out of the top — as if the
 * camera just ejected an instax print. Modelled on katemade.art's viral
 * "GUESS WHO I SEE" reel template.
 *
 * ── WHY a straight slider can't do this (the whole design problem) ────────────
 *   A single rigid strip translates as ONE body: pull its bottom end down and its
 *   top end goes down too — same direction. rising-slide works precisely because
 *   you pull the grip UP and the figure rises UP (same direction, one straight
 *   slot). Here the demand is OPPOSITE directions (pull DOWN → photo UP), which is
 *   physically impossible for a single rigid slider. You need a genuine DIRECTION
 *   REVERSAL. Only two paper-only reversals exist: a lever/pin-slot (Scotch-yoke,
 *   as in slideToSwing.js) or a strip over a fixed PULLEY (a 180° turnback). The
 *   lever's rise is bounded by arm swing (h = a·(1−cos θ)) and drags a big sideways
 *   footprint; the pulley gives clean 1:1 travel and — decisively — matches the
 *   user's own description of "a rolled-up strip behind the front that you pull to
 *   raise the photo." So this mechanism is a PAPER PULLEY.
 *
 * ── Physical stack (front → back) & strip path ───────────────────────────────
 *   1. Card FRONT (upper half-sheet): printed instant-camera art, with a vertical
 *      PHOTO SLOT near the top and a horizontal BOTTOM SLOT just below it.
 *   2. The PHOTO glues to a forward-folded MOUNT at one end of the reversing strip
 *      (rising-slide's exact front interface: mount fed through the vertical slit,
 *      photo glued on the front, photo + mount both wider than the 1.2 mm slit so
 *      the assembly is captured front-to-back and can only slide up/down).
 *   3. The REVERSING STRIP runs UP the back from the mount, wraps 180° OVER a paper
 *      ROLLER (a rolled tube glued by its two ends across the top of the back — the
 *      centre arches free so the strip slides over it), comes back DOWN the back,
 *      and passes out through the BOTTOM SLOT to the front as the grippable PULL tab.
 *   4. A back RETAINER bridge above the photo slot keeps the photo-run aligned and
 *      seats the strip's STOP FLANGE at top-of-travel.
 *
 *   Pull the tab down by Δ ⇒ the tab-run behind lengthens by Δ ⇒ (inextensible
 *   strip, constant wrap) the photo-run shortens by Δ ⇒ the mount rises Δ up the
 *   slot ⇒ the photo ejects Δ. Travel is 1:1 and unbounded by geometry (only by
 *   the slot length and the printable sheet). Reset by pushing the rigid photo back
 *   down (that lengthens the photo-run, feeding strip back over the roller, so the
 *   tab rises) — a one-way pull-to-reveal with a push-to-reset, exactly the reel's
 *   usage. Friction is a 180° paper-on-paper wrap (capstan T₂/T₁ = e^{μπ} ≈ 2.7–5),
 *   but the photo weighs well under a gram, so the absolute drag is trivial; the
 *   real care-item is not CREASING the strip at the wrap — mitigated by the rounded
 *   Ø7 mm roller (not a knife edge) and by pre-scoring the strip's two bend lines.
 *
 * ── Travel vs. the printable sheet (both A4 AND Letter) ───────────────────────
 *   faceH = card.height − MARGIN. Target rise T = riseFraction · faceH. Because the
 *   reversal needs the strip to span DOWN-to-photo PLUS DOWN-to-tab from the roller,
 *   the loose strip length is stripLen = grip + tabRun + wrap + photoRun + flange,
 *   with tabRun = botSlotY − yRoller and photoRun = slotBotY − yRoller both growing
 *   with T. Writing baseRun = slotTopY + NECK_H − yRoller,
 *       stripLen = K + 2·T,  K = grip + BOT_SLOT_GAP + wrap + flangeExtra + 2·baseRun.
 *   To keep it ONE straight piece laid HORIZONTALLY in the lower half (so a child
 *   never has to splice a ribbon), we clamp
 *       stripLen ≤ (paper.width − 2·MARGIN) − STRIP_END_SAFE
 *       ⇒ T ≤ oneStripLimit = ((printableW − STRIP_END_SAFE) − K) / 2.
 *   T is also clamped by the photo slot fitting the face:
 *       T ≤ frontLimit = spineY − BOTTOM_PAD − slotTopY − NECK_H.
 *   T = clamp( min(target, frontLimit, oneStripLimit), T_FLOOR, … ), never off page.
 *   (Placing the BOTTOM SLOT just below the photo slot — not at the very bottom
 *   edge — is what keeps tabRun short enough to avoid a splice; the long printed
 *   "PULL ↓" tab then hangs DOWN over the lower camera body, reading as a
 *   bottom-of-camera handle just like the reel.)
 *
 * ── Slot / strip clearance (same logic as pullTab / risingSlide) ─────────────
 *   slotWidth = paperThickness + clearance = 0.3 + 0.9 = 1.2 mm. The strip passes
 *   through flat-wise (0.3 mm) with (1.2−0.3)/2 = 0.45 mm each side. Laterally the
 *   photo-run rides a retainer channel of channelGap = stripW + LAT_CLEAR
 *   (0.3 mm each side): glides without skewing. Both back runs share the centre
 *   column as a flat two-ply U (0.6 mm total) — negligible in the channel.
 *
 * ── THE retention catch (top of travel) — the safety-critical number ─────────
 *   A STOP FLANGE on the photo-run is wider than the retainer channel by 2·stopCatch
 *   (stopCatch = 4 mm ⇒ flangeW = channelGap + 8 mm), and the top retainer's glued
 *   ends are GLUE_END = 6 mm each (> 4 mm overhang), so the flange seats on glued
 *   paper and CANNOT pass up through the channel — the photo can never be yanked out
 *   the top of the slot. The closed slot BOTTOM is the redundant reset stop (mount
 *   trapped in a closed slit). Throughout travel only the strip body (stripW) is in
 *   the channel with 0.3 mm/side clearance; the flange adds zero running friction and
 *   is felt only at the very end — identical in spirit to risingSlide.js's proof.
 *
 * ── Flat-foldability ─────────────────────────────────────────────────────────
 *   N/A in the pop-up sense: this mechanism NEVER leaves the plane. The whole
 *   assembly (card + strip + roller + retainer) is a couple mm thick and stays flat
 *   at every handle position, so it needs no matching mountain/valley collapse. The
 *   only folds are the forward MOUNT fold, the strip's two pre-scored bend lines,
 *   and the rolled roller tube — none require a flat-fold pair.
 *
 * @module generators/cameraPrintPull
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

/** Fixed design limits / clamps (see file header for the derivations). */
export const CAMERA_PULL_LIMITS = {
  PAPER_THICKNESS: 0.3,
  CLEARANCE_MIN: 0.6,
  CLEARANCE_MAX: 1.3,    // slotWidth = thickness + clearance
  RISE_MIN: 0.3,
  RISE_MAX: 0.6,         // riseFraction of the printable face height
  STRIP_W_MIN: 12,
  STRIP_W_MAX: 18,       // reversing-strip width (mm)
  PHOTO_W_MIN: 34,
  PHOTO_W_MAX: 56,       // photo width (mm)
  PHOTO_RATIO: 1.2,      // photoH = photoW · ratio (portrait instax print)
  GRIP_MIN: 16,
  GRIP_MAX: 28,          // exposed "PULL" grip below the bottom slot (mm)
  LAT_CLEAR: 0.6,        // total lateral play of the strip in the channel (mm)
  RET_W: 6,              // retainer strip width (mm)
  GLUE_END: 6,           // retainer glue end each side (mm, > 5 grip floor)
  STOP_CATCH: 4,         // flange overhang beyond channel each side (mm)
  FLANGE_H: 5,           // length of the stop-flange band along the strip (mm)
  NECK_H: 3,             // mount-tab footprint in the slot (mm) → travel headroom
  MOUNT_LEN: 8,          // forward-folding mount tab length (mm)
  ROLLER_R: 3.5,         // paper-roller (pulley) radius (mm) → Ø7 rounded turn
  ROLLER_END_GLUE: 8,    // each roller end glued to the back (bridge) (mm)
  ROLLER_MARGIN: 8,      // roller sticks out beyond the strip each side (mm)
  TOP_RESERVE: 6,        // sheet-top margin → roller top (mm)
  SLOT_TOP_PAD: 20,      // sheet-top margin → photo slot top (mm)
  BOTTOM_PAD: 8,         // photo slot bottom → spine (face bottom) (mm)
  BOT_SLOT_GAP: 8,       // photo slot bottom → bottom (tab) slot (mm)
  T_FLOOR: 18,           // absolute minimum travel (mm)
  PHOTO_OVERHANG: 6,     // photo wider than the mount each side (capture) (mm)
  STRIP_END_SAFE: 8,     // safety gap from the printable width edge (mm)
};

/**
 * @typedef {Object} CameraPullGeometry
 * @property {'A4'|'LETTER'} paperSize
 * @property {number} spineY       - Face bottom / sheet mid-fold (mm)
 * @property {number} faceH        - Printable front-face depth (mm)
 * @property {number} cx           - Slot centre X (mm)
 * @property {number} slotWidth    - Slit width = thickness + clearance (mm)
 * @property {number} slotLen      - Photo slot length (mm)
 * @property {number} slotTopY     - Photo slot top Y on the face (mm)
 * @property {number} slotBotY     - Photo slot bottom Y (photo mount rest) (mm)
 * @property {number} botSlotY     - Bottom (tab) slot Y (mm)
 * @property {number} travel       - Photo rise distance (mm)
 * @property {number} stripW       - Reversing-strip width (mm)
 * @property {number} channelGap   - Retainer channel width (mm)
 * @property {number} flangeW      - Stop-flange full width (mm)
 * @property {number} stopCatch    - Flange overhang beyond channel each side (mm)
 * @property {number} grip         - Exposed PULL grip length (mm)
 * @property {number} stripLen     - Loose reversing-strip length (mm)
 * @property {number} photoRun     - Roller → photo mount (rest) run (mm)
 * @property {number} tabRun       - Roller → bottom slot run (mm)
 * @property {number} wrap         - 180° wrap arc over the roller (mm)
 * @property {number} yRoller      - Roller top Y on the face (mm)
 * @property {number} rollerR      - Roller radius (mm)
 * @property {number} rollerLen    - Roller length along the top (mm)
 * @property {number} photoW       - Photo width (mm)
 * @property {number} photoH       - Photo height (mm)
 * @property {number} mountW       - Photo mount width fed through the slit (mm)
 */

/**
 * Resolve + clamp camera-print-pull geometry against the printable card face and
 * the printable sheet width (so the loose strip is one un-spliced piece). Pure
 * numbers only (no DOM) so it can be unit/bounds tested headlessly.
 *
 * @param {{ paperSize?: 'A4'|'LETTER', riseFraction?: number, clearance?: number,
 *           stripWidth?: number, grip?: number, photoWidth?: number }} [opts]
 * @returns {CameraPullGeometry}
 */
export function resolveCameraPull(opts = {}) {
  const L = CAMERA_PULL_LIMITS;
  const paper = PAPER_SIZES[opts.paperSize] || PAPER_SIZES.A4;
  const card = CARD_SIZES[opts.paperSize] || CARD_SIZES.A4;
  const paperSize = CARD_SIZES[opts.paperSize] ? opts.paperSize : 'A4';

  // NaN-safe numeric intake (?? only guards null/undefined, not NaN/garbage).
  const numOr = (v, d) => (Number.isFinite(Number(v)) ? Number(v) : d);

  const spineY = paper.height / 2;
  const faceH = card.height - PRINT.MARGIN;
  const printableW = paper.width - 2 * PRINT.MARGIN;

  const t = L.PAPER_THICKNESS;
  const c = clamp(numOr(opts.clearance, 0.9), L.CLEARANCE_MIN, L.CLEARANCE_MAX);
  const slotWidth = round(t + c, 2);
  const stripW = clamp(numOr(opts.stripWidth, 14), L.STRIP_W_MIN, L.STRIP_W_MAX);
  const grip = clamp(numOr(opts.grip, 24), L.GRIP_MIN, L.GRIP_MAX);
  const f = clamp(numOr(opts.riseFraction, 0.5), L.RISE_MIN, L.RISE_MAX);

  // Photo must leave a print margin on both sides of the face.
  const photoMax = Math.min(L.PHOTO_W_MAX, printableW - 20);
  const photoW = clamp(numOr(opts.photoWidth, 46), L.PHOTO_W_MIN, photoMax);
  const photoH = round(photoW * L.PHOTO_RATIO, 1);
  const mountW = round(Math.min(stripW, photoW - 2 * L.PHOTO_OVERHANG), 1);

  const channelGap = round(stripW + L.LAT_CLEAR, 2);
  const flangeW = round(channelGap + 2 * L.STOP_CATCH, 2);

  const cx = round(paper.width / 2);
  const rollerR = L.ROLLER_R;
  const rollerLen = round(stripW + 2 * L.ROLLER_MARGIN, 1);
  const yRoller = round(PRINT.MARGIN + L.TOP_RESERVE + rollerR, 1);
  const slotTopY = round(PRINT.MARGIN + L.SLOT_TOP_PAD, 1);

  const wrap = round(Math.PI * rollerR, 1);
  const flangeExtra = L.FLANGE_H + 4;
  const baseRun = slotTopY + L.NECK_H - yRoller; // = (slotBotY − yRoller) − T

  // Two hard limits on travel (see header): the photo slot fits the face, and the
  // loose strip fits the printable sheet WIDTH as one horizontal un-spliced piece.
  const target = f * faceH;
  const frontLimit = spineY - L.BOTTOM_PAD - slotTopY - L.NECK_H;
  const K = grip + L.BOT_SLOT_GAP + wrap + flangeExtra + 2 * baseRun;
  const oneStripLimit = ((printableW - L.STRIP_END_SAFE) - K) / 2;
  const tMax = Math.max(L.T_FLOOR, Math.min(frontLimit, oneStripLimit));
  const T = round(clamp(Math.min(target, frontLimit, oneStripLimit), L.T_FLOOR, tMax), 1);

  const slotLen = round(T + L.NECK_H, 1);
  const slotBotY = round(slotTopY + slotLen, 1);
  const botSlotY = round(slotBotY + L.BOT_SLOT_GAP, 1);
  const photoRun = round(slotBotY - yRoller, 1);
  const tabRun = round(botSlotY - yRoller, 1);
  const stripLen = round(grip + tabRun + wrap + photoRun + flangeExtra, 1);

  return {
    paperSize,
    spineY: round(spineY, 1),
    faceH: round(faceH, 1),
    cx,
    slotWidth,
    slotLen,
    slotTopY,
    slotBotY,
    botSlotY,
    travel: round(T, 1),
    stripW: round(stripW, 1),
    channelGap,
    flangeW,
    stopCatch: L.STOP_CATCH,
    grip: round(grip, 1),
    stripLen,
    photoRun,
    tabRun,
    wrap,
    yRoller,
    rollerR,
    rollerLen,
    photoW: round(photoW, 1),
    photoH,
    mountW,
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
 * Draw one retainer bridge (glued at both ends over the strip): a cut rectangle
 * with two green glue-end zones and a central un-glued channel.
 * @param {SVGElement} g @param {number} x @param {number} y
 * @param {CameraPullGeometry} geo @param {string} label @param {boolean} isColor
 */
function drawRetainer(g, x, y, geo, label, isColor) {
  const L = CAMERA_PULL_LIMITS;
  const w = round(geo.channelGap + 2 * L.GLUE_END);
  const h = L.RET_W;
  addRect(g, x, y, w, h, getLineStyle('CUT', isColor));
  addRect(g, x, y, L.GLUE_END, h, getLineStyle('GLUE_TAB', isColor));
  addRect(g, round(x + w - L.GLUE_END), y, L.GLUE_END, h, getLineStyle('GLUE_TAB', isColor));
  const chL = round(x + L.GLUE_END);
  const chR = round(x + w - L.GLUE_END);
  addPath(g, `M ${chL} ${y} L ${chL} ${round(y + h)}`, getLineStyle('SCORE', isColor));
  addPath(g, `M ${chR} ${y} L ${chR} ${round(y + h)}`, getLineStyle('SCORE', isColor));
  addText(g, round(x + w / 2), round(y + h + 3.5), label, 2.2, 'middle');
  addText(g, round(x + w / 2), round(y - 1.5), '가운데는 붙이지 마세요', 2, 'middle');
}

/**
 * Draw a simple instant-camera silhouette guide (score lines only, so it prints
 * as a "trace-here" hint that the AI/hand decoration fills in).
 * @param {SVGElement} g @param {CameraPullGeometry} geo @param {string} style
 */
function drawCameraBody(g, geo, style) {
  const { cx, spineY } = geo;
  const bodyW = Math.min(120, (geo.cx - PRINT.MARGIN) * 1.7);
  const bodyTop = round(geo.slotTopY + 6);
  const bodyBot = round(spineY - 6);
  const bx = round(cx - bodyW / 2);
  addPath(g, roundRectPath(bx, bodyTop, bodyW, bodyBot - bodyTop, 8), style);
  // Lens (big circle) centred low-mid.
  const lensR = Math.min(18, bodyW / 4);
  const lensCy = round((bodyTop + bodyBot) / 2 + 6);
  addPath(g, `M ${round(cx + lensR)} ${lensCy} A ${lensR} ${lensR} 0 1 1 ${round(cx - lensR)} ${lensCy} A ${lensR} ${lensR} 0 1 1 ${round(cx + lensR)} ${lensCy} Z`, style);
  addPath(g, `M ${round(cx + lensR * 0.6)} ${lensCy} A ${round(lensR * 0.6)} ${round(lensR * 0.6)} 0 1 1 ${round(cx - lensR * 0.6)} ${lensCy} A ${round(lensR * 0.6)} ${round(lensR * 0.6)} 0 1 1 ${round(cx + lensR * 0.6)} ${lensCy} Z`, style);
  // Flash (small rounded rect, upper-left) and viewfinder (upper-right).
  addPath(g, roundRectPath(round(bx + 8), round(bodyTop + 6), 14, 9, 2), style);
  addPath(g, roundRectPath(round(cx + bodyW / 2 - 20), round(bodyTop + 6), 12, 8, 2), style);
}

/**
 * Draw the camera-print-pull flat pattern into a passed-in SVG/group.
 *
 * @param {SVGElement} svg - Target element (a content group from createTemplate)
 * @param {Object} [options]
 * @param {'A4'|'LETTER'} [options.paperSize='A4']
 * @param {number} [options.riseFraction=0.5]
 * @param {number} [options.clearance=0.9]
 * @param {number} [options.stripWidth=14]
 * @param {number} [options.grip=24]
 * @param {number} [options.photoWidth=46]
 * @param {boolean} [options.isColor=true]
 * @returns {SVGGElement}
 */
export const generateCameraPrintPull = (svg, options = {}) => {
  const { isColor = true } = options;
  const L = CAMERA_PULL_LIMITS;
  const geo = resolveCameraPull(options);
  const {
    cx, slotWidth, slotTopY, slotBotY, botSlotY, travel, stripW,
    channelGap, flangeW, stripLen, grip, spineY, yRoller, rollerLen,
    photoW, photoH, mountW, tabRun, photoRun,
  } = geo;

  const g = addGroup(svg, 'camera-print-pull-group');
  const CUT = getLineStyle('CUT', isColor);
  const SCORE = getLineStyle('SCORE', isColor);
  const MOUNT = getLineStyle('MOUNTAIN_FOLD', isColor);
  const GLUE = getLineStyle('GLUE_TAB', isColor);
  const paper = PAPER_SIZES[geo.paperSize];

  addText(g, cx, round(PRINT.MARGIN + 3), '카메라 인화 손잡이 (Camera-Print Pull)', 3, 'middle');

  // ── FRONT FACE: camera art, photo slot, roller/retainer targets, tab slot ──
  drawCameraBody(g, geo, SCORE);
  addText(g, cx, round(slotTopY + 4), '앞면: 인스타 카메라 그림 영역', 2.4, 'middle');

  // Vertical photo slit (closed rectangle = inherent reset stop at the bottom).
  const slotLeft = round(cx - slotWidth / 2);
  addRect(g, slotLeft, slotTopY, slotWidth, round(slotBotY - slotTopY), CUT);
  addText(g, round(cx + 6), slotTopY, `↑ 사진 나오는 슬롯 ${round(slotBotY - slotTopY)}×${slotWidth}mm`, 2.2, 'start');
  addText(g, cx, round(slotBotY + 3.5), '사진 시작 위치(살짝 보임)', 2.2, 'middle');

  // Roller (tube) glue TARGETS at the very top — glued by the two ends only, so
  // the centre arches free and the strip slides 180° over it.
  const rollHalf = round(rollerLen / 2);
  const yRollTarget = round(PRINT.MARGIN + 2);
  addRect(g, round(cx - rollHalf), yRollTarget, L.ROLLER_END_GLUE, L.RET_W, GLUE);
  addRect(g, round(cx + rollHalf - L.ROLLER_END_GLUE), yRollTarget, L.ROLLER_END_GLUE, L.RET_W, GLUE);
  addPath(g, `M ${round(cx - rollHalf + L.ROLLER_END_GLUE)} ${round(yRollTarget + L.RET_W / 2)} L ${round(cx + rollHalf - L.ROLLER_END_GLUE)} ${round(yRollTarget + L.RET_W / 2)}`, SCORE);
  addText(g, cx, round(yRollTarget - 1.5), '뒷면 ① 롤러(튜브): 양 끝만 붙여 다리처럼', 2, 'middle');

  // Retainer glue target just above the photo slot (seats the stop flange).
  const retHalf = round(channelGap / 2 + L.GLUE_END);
  const topRetY = round(slotTopY - L.RET_W - 1);
  addRect(g, round(cx - retHalf), topRetY, round(retHalf * 2), L.RET_W, SCORE);
  addText(g, round(cx - retHalf - 1), round(topRetY + L.RET_W / 2), '뒷면 ② 멈춤/안내 띠', 2, 'end');

  // Bottom (tab) slit — the strip passes back→front here and hangs down as PULL.
  const botSlotLen = round(stripW + slotWidth * 2);
  addRect(g, round(cx - botSlotLen / 2), round(botSlotY - slotWidth / 2), botSlotLen, slotWidth, CUT);
  addText(g, round(cx + botSlotLen / 2 + 2), botSlotY, `손잡이 나오는 슬롯 ${botSlotLen}×${slotWidth}mm`, 2.2, 'start');
  // Printed "PULL ↓" hint on the tab that hangs below this slot.
  const pullTop = round(botSlotY + 3);
  addPath(g, `M ${cx} ${pullTop} L ${cx} ${round(pullTop + grip - 4)} M ${round(cx - 3)} ${round(pullTop + grip - 7)} L ${cx} ${round(pullTop + grip - 4)} L ${round(cx + 3)} ${round(pullTop + grip - 7)}`, SCORE);
  addText(g, cx, round(pullTop + grip / 2), 'PULL ↓ (아래로 당기기)', 2.4, 'middle');

  // ── WHITESPACE (lower half): reversing strip + roller tube + retainer + photo ──
  // Reversing strip — ONE straight horizontal piece. Left end = grip/PULL tab;
  // then tab-run; the roller-wrap score; the photo-run; the flange; the mount.
  const yMid = round(spineY + 16 + flangeW / 2);
  const xL = round((paper.width - stripLen) / 2);       // strip left (grip end)
  const xR = round(xL + stripLen);                      // strip right (mount end)
  const top = round(yMid - stripW / 2);
  const bot = round(yMid + stripW / 2);
  // Flange band sits just inboard of the mount (right) end.
  const flInR = round(xR - L.MOUNT_LEN - L.FLANGE_H);
  const flOutR = round(xR - L.MOUNT_LEN);
  const flTop = round(yMid - flangeW / 2);
  const flBot = round(yMid + flangeW / 2);

  // Continuous outline: grip end → top edge → up-flange → mount → down-flange → back.
  const outline =
    `M ${xL} ${top} L ${flInR} ${top} ` +
    `L ${flInR} ${flTop} L ${flOutR} ${flTop} L ${flOutR} ${top} ` +
    `L ${xR} ${top} L ${xR} ${bot} L ${flOutR} ${bot} ` +
    `L ${flOutR} ${flBot} L ${flInR} ${flBot} L ${flInR} ${bot} ` +
    `L ${xL} ${bot} Z`;
  addPath(g, outline, CUT);

  // Forward MOUNT fold + photo glue face at the mount (right) end.
  addPath(g, `M ${flOutR} ${top} L ${flOutR} ${bot}`, MOUNT);
  addRect(g, round(flOutR + 1), round(top + 1), round(L.MOUNT_LEN - 2), round(stripW - 2), GLUE);

  // Two pre-score bend lines: over the roller, and at the bottom-slot turn.
  const xWrap = round(xR - L.MOUNT_LEN - L.FLANGE_H - photoRun);   // roller-wrap point
  const xTurn = round(xL + grip);                                  // bottom-slot turn
  addPath(g, `M ${xWrap} ${top} L ${xWrap} ${bot}`, SCORE);
  addPath(g, `M ${xTurn} ${top} L ${xTurn} ${bot}`, SCORE);

  addText(g, round((xL + xTurn) / 2), round(top - 2), 'PULL 손잡이', 2.2, 'middle');
  addText(g, round((xTurn + xWrap) / 2), round(top - 2), '뒤로 내려가는 부분 (당김)', 2.2, 'middle');
  addText(g, xWrap, round(bot + 3.5), '↑ 롤러 넘는 곳(살짝 접기)', 2, 'middle');
  addText(g, round((xWrap + flInR) / 2), round(top - 2), '사진 올리는 부분', 2.2, 'middle');
  addText(g, flOutR, round(flTop - 1.5), '멈춤 날개', 2, 'middle');
  addText(g, round(flOutR + L.MOUNT_LEN / 2), round(bot + 3.5), '사진', 2, 'middle');
  addText(g, round((xL + xR) / 2), round(flBot + 4.5), `되돌림 띠 길이 ${stripLen}mm · 이동 ${travel}mm`, 2.2, 'middle');

  // Roller tube roll-up piece.
  const rollCirc = round(2 * Math.PI * geo.rollerR + 6);   // roll width incl. glue lap
  const rollX = round(PRINT.MARGIN + 4);
  const rollY = round(flBot + 12);
  addRect(g, rollX, rollY, rollCirc, rollerLen, CUT);
  addRect(g, round(rollX + rollCirc - 6), rollY, 6, rollerLen, GLUE);
  for (let k = 1; k <= 3; k += 1) {
    const xs = round(rollX + (rollCirc - 6) * (k / 4));
    addPath(g, `M ${xs} ${rollY} L ${xs} ${round(rollY + rollerLen)}`, SCORE);
  }
  addText(g, round(rollX + rollCirc / 2), round(rollY - 1.5), '① 롤러: 둥글게 말기', 2.2, 'middle');

  // Retainer bridge piece.
  const retX = round(rollX + rollCirc + 14);
  drawRetainer(g, retX, round(flBot + 16), geo, '② 멈춤 띠 (뒷면에)', isColor);

  // Photo placeholder to cut out and glue on the mount.
  const photoX = round(paper.width - PRINT.MARGIN - photoW - 4);
  const photoY = round(flBot + 12);
  if (photoY + photoH < paper.height - PRINT.MARGIN) {
    addPath(g, roundRectPath(photoX, photoY, photoW, photoH, 3), CUT);
    // instax-style bottom border band.
    addPath(g, `M ${photoX} ${round(photoY + photoH - photoH * 0.22)} L ${round(photoX + photoW)} ${round(photoY + photoH - photoH * 0.22)}`, SCORE);
    // Mount glue mark at the photo bottom (where it grips the strip mount).
    const gmW = Math.min(mountW, photoW - 8);
    addRect(g, round(photoX + (photoW - gmW) / 2), round(photoY + photoH - 8), gmW, 6, GLUE);
    addText(g, round(photoX + photoW / 2), round(photoY - 1.5), '사진 (여기에 인물 사진)', 2.2, 'middle');
    addText(g, round(photoX + photoW / 2), round(photoY + photoH + 3.5), '아래 초록칸을 되돌림 띠 끝(사진)에 붙이기', 2, 'middle');
  }

  return g;
};

/**
 * Render the camera-print-pull onto a complete printable SVG template.
 * @param {Object} [params={}]
 * @param {'A4'|'LETTER'} [params.paperSize='A4']
 * @param {'color'|'bw'} [params.colorMode='color']
 * @param {number} [params.riseFraction=0.5]
 * @param {number} [params.clearance=0.9]
 * @param {number} [params.stripWidth=14]
 * @param {number} [params.grip=24]
 * @param {number} [params.photoWidth=46]
 * @returns {{ svg: SVGSVGElement, geometry: CameraPullGeometry }}
 */
export function renderCameraPrintPull(params = {}) {
  const { paperSize = 'A4', colorMode = 'color', ...opts } = params;
  const { svg, contentGroup } = createTemplate(paperSize, colorMode);
  const geometry = resolveCameraPull({ paperSize, ...opts });
  generateCameraPrintPull(contentGroup, {
    paperSize,
    ...opts,
    isColor: colorMode !== 'bw',
  });
  return { svg, geometry };
}
