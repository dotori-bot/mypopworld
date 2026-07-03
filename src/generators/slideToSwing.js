/**
 * @fileoverview Slide-to-Swing ("손잡이를 밀면 그림이 좌우로 흔들리는 장치") mechanism
 * generator — a paper realisation of the classic SCOTCH YOKE.
 *
 * A flat, in-plane mechanism mounted on ONE card face. A HANDLE-driven SLIDER
 * travels in a straight horizontal line; a rigid POST (arm) is pivoted at its
 * base and free to swing side-to-side. A pin at the post's top rides in a
 * VERTICAL SLOT cut into the slider. Because the pin traces a circular arc while
 * the slot can only move horizontally, the (near-)vertical slot absorbs the
 * pin's vertical excursion — the textbook Scotch-yoke conversion of straight
 * (slider) motion into oscillating (arm) motion. A decoration (heart, figure…)
 * glued to the post's top swings left-right as the handle is pushed left-right.
 *
 * ────────────────────────────────────────────────────────────────────────────
 *  KINEMATICS (derive first, then draw)
 * ────────────────────────────────────────────────────────────────────────────
 *  Post pivot fixed at P = (px, py) on the card. Post length r (pivot → pin).
 *  θ = swing angle from the centred rest (θ = 0 is the post pointing straight
 *  "up", toward the top edge / away from the spine). θ ∈ [−θmax, +θmax].
 *
 *      pin(θ) = ( px + r·sinθ ,  py − r·cosθ )
 *
 *  • Slider constraint. The slider only translates horizontally at a fixed
 *    height y = ySlot. Choose ySlot = py − r, i.e. the pin's height at θ = 0
 *    (its HIGHEST point — smallest y). As the arm swings either way the pin
 *    drops by
 *          Δy(θ) = (py − r·cosθ) − (py − r) = r·(1 − cosθ) ≥ 0.
 *    The pin therefore only ever moves DOWNWARD relative to the slider, by at
 *    most  slotCore = r·(1 − cos θmax).  The vertical slot must span this plus
 *    the pin's own footprint and clearance:
 *          slotLen = slotCore + PIN_NECK + 2·clearance.
 *    (Riskiest failure mode = slot too short → the pin jams at the swing
 *    extremes. resolveSlideToSwing sizes slotLen to slotCore BY CONSTRUCTION and
 *    the smoke test asserts  slotCore + PIN_NECK ≤ slotLen  over the whole θ
 *    range, so binding is impossible for any clamped param set.)
 *
 *  • The 1:1 drive relation. The slot is snug in x (slotWidthX = PIN_NECK +
 *    clearance), so the slider's x follows the pin's x exactly:
 *          xSlider(θ) = px + r·sinθ.
 *    Handle travel, peak-to-peak:  travel = 2·r·sin θmax.
 *    Swing amplitude of the pin:   A = r·sin θmax = travel / 2.
 *    The decoration is glued a little above the pin (centroid at r + DECO_OFF
 *    from the pivot), so it swings slightly WIDER than the handle — the handle
 *    goes straight, the decoration appears to follow it but arcs. That "near-
 *    sync but arcing" motion is the whole charm of the toy.
 *
 *  • Picking θmax. Want a comfortable finger-swipe travel (≈ 30–45 mm) with a
 *    card-reasonable post (r ≈ 25–45 mm). From travel = 2·r·sin θmax:
 *          sin θmax = travel / (2r).
 *    Defaults r = 34 mm, θmax = 35°  ⇒  travel = 2·34·sin35° ≈ 39.0 mm,
 *    slotCore = 34·(1 − cos35°) ≈ 6.15 mm, slotLen ≈ 10.8 mm. A 39 mm swipe is
 *    an easy child-sized push; a 6 mm slot excursion is trivial to cut cleanly.
 *
 * ────────────────────────────────────────────────────────────────────────────
 *  PHYSICAL STACK & RETENTION (all-paper, no metal fasteners) — front → back
 * ────────────────────────────────────────────────────────────────────────────
 *      1. DECORATION / cap  (front, visible, swings)
 *      2. SLIDER            (vertical slot; pin passes through it)
 *      3. POST              (arm; its pin folds FORWARD through the slot)
 *      4. CARD face         (fixed; pivot hole + guide-strip anchors)
 *
 *  • Pin-in-slot capture (reuses risingSlide's proven "fold a tab forward
 *    through a slot, glue a wider cap on the far side" idiom). The post's top
 *    pin is a PIN_NECK-wide paper tab folded forward (mountain) through the
 *    slider's slot; the decoration glued on the front is far wider than the
 *    3.8 mm slot, so the pin cannot pull back out toward the viewer, and the
 *    snug slot walls stop it escaping sideways. It stays free to slide the
 *    ~6 mm vertically the arc demands. The sturdy post — not the thin neck —
 *    takes the side-load, so the neck never tears.
 *
 *  • Slider track retention (reuses pullTab's guide strips + stop flanges). Two
 *    guide strips glue to the card above and below the slider's path, their
 *    inner lips folding over the slider edges to form a horizontal channel of
 *    height  channelGap = sliderH + LAT_CLEAR  (≈ 0.6 mm play → glides, no
 *    skew). Stop FLANGES at both ends of the slider are  2·STOP_CATCH  taller
 *    than the channel, so they ride OUTSIDE it and abut the guide-strip ends at
 *    the travel limits — a hard shove can't eject the slider. (The pin coupling
 *    is the primary tie; the flanges are the redundant hard stop, exactly the
 *    two-line-of-defence discipline used across this repo.)
 *
 *  • Base pivot — a paper rotary joint, NOT a crease. In-plane rotation cannot
 *    come from a fold line (a crease hinges OUT of plane and, bent repeatedly
 *    in-plane, fatigue-cracks — the very failure to avoid). Instead the post's
 *    base narrows to a PIVOT_TAB_W-wide neck that passes through a round
 *    PIVOT_HOLE (Ø 7 mm) in the card; a cap disc glued to the tab BEHIND the
 *    card (wider than the hole) captures it. The neck (5 mm) is narrower than
 *    the hole (7 mm), so the post spins freely about the hole with 1 mm of play;
 *    nothing creases, so nothing fatigues. This is the same "poke a paper tab
 *    through, cap it wider on the far side" capture used for the pin and in
 *    pullTab/risingSlide — a paper capture, not a rivet.
 *
 * ────────────────────────────────────────────────────────────────────────────
 *  FLAT-FOLDABILITY
 * ────────────────────────────────────────────────────────────────────────────
 *  Like risingSlide/pullTab this mechanism NEVER leaves the card plane. The
 *  whole stack (deco + slider + post + card) is 4 sheets ≈ 1.2 mm and stays flat
 *  at every handle position, so the folding card closes flat over it trivially.
 *  The only folds — the pin tab (forward through the slot), the pivot tab
 *  (back through the hole) and the guide-strip lips — are each glued/captured
 *  and need no collapsing mountain/valley pair. Real, closable card: ✓.
 *
 * ────────────────────────────────────────────────────────────────────────────
 *  FIT (A4 AND Letter; clamps below never let a part run off the page)
 * ────────────────────────────────────────────────────────────────────────────
 *  Display face = upper half, y ∈ [MARGIN, spineY]. Pivot sits PIVOT_SPINE_PAD
 *  above the spine: py = spineY − PIVOT_SPINE_PAD. Hard clamps on r:
 *      (vert)  decoTop = py − r − DECO_OFF − DECO_R ≥ MARGIN + TOP_PAD
 *              ⇒ r ≤ py − MARGIN − TOP_PAD − DECO_OFF − DECO_R
 *      (horz)  (r + DECO_OFF)·sin θmax + DECO_R ≤ px − MARGIN
 *              ⇒ r ≤ ((px − MARGIN − DECO_R)/sin θmax) − DECO_OFF
 *  and a defensive handle clamp reduces θmax if px + A + sliderHalf + grip would
 *  ever exceed the printable width. Garbage/oversize params are clamped, never
 *  thrown, and never push a part past the printable edge on either paper size.
 *
 * @module generators/slideToSwing
 */

import { PAPER_SIZES, CARD_SIZES, PRINT } from './constants.js';
import { clamp, round, degToRad } from '../utils/math.js';
import {
  addPath,
  addRect,
  addText,
  addGroup,
  getLineStyle,
  createTemplate,
} from './svgBuilder.js';
import { generateHeart } from './decorations.js';

/** Fixed design limits / clamps (see file header for the derivations). */
export const SLIDE_SWING_LIMITS = {
  R_MIN: 25,
  R_MAX: 45,             // post length pivot → pin (mm)
  THETA_MIN: 20,
  THETA_MAX: 45,         // swing half-angle θmax (deg)
  PAPER_THICKNESS: 0.3,
  CLEARANCE_MIN: 0.5,
  CLEARANCE_MAX: 1.5,
  PIN_NECK: 3,           // pin-tab width/footprint in the slot (mm)
  PIN_CAP: 4,            // pin cap length beyond the slot on the front (mm)
  SLIDER_BODY_W: 26,     // slider body length along travel (x) (mm)
  SLIDER_H_MIN: 18,      // slider height (y) floor (mm)
  SLOT_WALL: 4,          // slider material above/below the slot (mm)
  GRIP_MIN: 8,
  GRIP_MAX: 30,          // exposed handle grip (mm, ≥ 5 mm child-grip floor)
  GRIP_H: 12,            // handle height (mm)
  GUIDE_W: 5,            // guide-strip width incl. fold lip (mm)
  GUIDE_LIP: 2,          // lip that folds over the slider edge (mm)
  GLUE_END: 6,           // guide-strip glue foot each end (mm, > 5 grip floor)
  LAT_CLEAR: 0.6,        // total vertical play of slider in channel (mm)
  STOP_CATCH: 3,         // flange overhang beyond channel each side (mm)
  FLANGE_W: 4,           // flange thickness along travel (x) (mm)
  PIVOT_HOLE: 7,         // pivot hole diameter in the card (mm)
  PIVOT_TAB_W: 5,        // pivot neck width through the hole (< hole → free) (mm)
  PIVOT_TAB_LEN: 10,     // pivot neck+splay length through the hole (mm)
  PIVOT_CAP_R: 6,        // back cap radius (> hole/2 → captured) (mm)
  POST_W: 8,             // post arm width (mm)
  DECO_R: 11,            // decoration radius (mm)
  DECO_OFF: 6,           // decoration centroid above the pin (mm)
  PIVOT_SPINE_PAD: 10,   // pivot distance above the spine (mm)
  TOP_PAD: 6,            // decoration top → sheet margin (mm)
};

/** NaN/garbage-safe numeric intake (?? only guards null/undefined). */
const numOr = (v, d) => (Number.isFinite(Number(v)) ? Number(v) : d);

/**
 * Pin position for a given swing angle. pin(θ) = (px + r·sinθ, py − r·cosθ).
 * @param {number} thetaDeg
 * @param {number} px @param {number} py @param {number} r
 * @returns {{ x: number, y: number }}
 */
export function pinPosition(thetaDeg, px, py, r) {
  const a = degToRad(thetaDeg);
  return { x: px + r * Math.sin(a), y: py - r * Math.cos(a) };
}

/**
 * @typedef {Object} SlideSwingGeometry
 * @property {'A4'|'LETTER'} paperSize
 * @property {number} spineY      - Spine y on the sheet (mm)
 * @property {number} px          - Pivot x (card centre) (mm)
 * @property {number} py          - Pivot y (mm)
 * @property {number} r           - Post length pivot → pin (mm)
 * @property {number} thetaMax    - Swing half-angle (deg)
 * @property {number} amplitude   - Pin/slider x-amplitude A = r·sinθmax (mm)
 * @property {number} travel      - Handle peak-to-peak travel 2A (mm)
 * @property {number} ySlot       - Slider centre-line y (pin y at θ=0) (mm)
 * @property {number} slotCore     - Pin vertical excursion r·(1−cosθmax) (mm)
 * @property {number} slotWidthX  - Slot width across travel (mm)
 * @property {number} slotLen     - Slot length along the pin's drop (mm)
 * @property {number} slotTopY    - Slot top y on the card (mm)
 * @property {number} slotBotY    - Slot bottom y on the card (mm)
 * @property {number} sliderH     - Slider height (y) (mm)
 * @property {number} channelGap  - Guide channel height (mm)
 * @property {number} flangeSpan  - Flange outer height (mm)
 * @property {number} grip        - Handle grip length (mm)
 * @property {number} clearance   - Slot/pin clearance (mm)
 * @property {number} decoRestY   - Decoration centre y at θ=0 (mm)
 * @property {number} decoR       - Decoration radius (mm)
 * @property {number} guideLen    - Guide-strip length (channel length) (mm)
 */

/**
 * Resolve + clamp slide-to-swing geometry against the printable face. Pure
 * numbers only (no DOM) so it can be bounds/kinematics tested headlessly.
 *
 * @param {{ paperSize?:'A4'|'LETTER', armLength?:number, swingAngle?:number,
 *           clearance?:number, grip?:number }} [opts]
 * @returns {SlideSwingGeometry}
 */
export function resolveSlideToSwing(opts = {}) {
  const L = SLIDE_SWING_LIMITS;
  const paper = PAPER_SIZES[opts.paperSize] || PAPER_SIZES.A4;
  const paperSize = CARD_SIZES[opts.paperSize] ? opts.paperSize : 'A4';

  const spineY = paper.height / 2;
  const M = PRINT.MARGIN;
  const px = round(paper.width / 2, 2);
  const py = round(spineY - L.PIVOT_SPINE_PAD, 2);

  const clearance = clamp(numOr(opts.clearance, 0.8), L.CLEARANCE_MIN, L.CLEARANCE_MAX);
  let thetaMax = clamp(numOr(opts.swingAngle, 35), L.THETA_MIN, L.THETA_MAX);
  let sinT = Math.sin(degToRad(thetaMax));

  // Fit clamps on r (vertical stack + horizontal swing), see header.
  const rFitVert = py - M - L.TOP_PAD - L.DECO_OFF - L.DECO_R;
  const rFitHorz = sinT > 1e-6 ? (px - M - L.DECO_R) / sinT - L.DECO_OFF : L.R_MAX;
  const rMax = Math.max(L.R_MIN, Math.min(L.R_MAX, rFitVert, rFitHorz));
  const r = clamp(numOr(opts.armLength, 34), L.R_MIN, rMax);

  // Defensive handle clamp: keep px + A + sliderHalf + grip inside the width.
  // If even the minimum grip would overflow, pull θmax down so A fits.
  const sliderHalf = L.SLIDER_BODY_W / 2 + L.FLANGE_W;
  const aRoom = paper.width - M - px - sliderHalf - L.GRIP_MIN;
  let amplitude = r * sinT;
  if (amplitude > aRoom && r > 0) {
    amplitude = Math.max(0, aRoom);
    sinT = clamp(amplitude / r, 0, Math.sin(degToRad(L.THETA_MAX)));
    thetaMax = clamp((Math.asin(sinT) * 180) / Math.PI, L.THETA_MIN, L.THETA_MAX);
    amplitude = r * Math.sin(degToRad(thetaMax));
  }
  const travel = 2 * amplitude;

  const gripMax = Math.max(L.GRIP_MIN, paper.width - M - px - amplitude - sliderHalf);
  const grip = clamp(numOr(opts.grip, 22), L.GRIP_MIN, Math.min(L.GRIP_MAX, gripMax));

  // Slot sizing — sized to slotCore BY CONSTRUCTION so the pin never binds.
  const slotCore = r * (1 - Math.cos(degToRad(thetaMax)));
  const slotWidthX = round(L.PIN_NECK + clearance, 2);
  const slotLen = round(slotCore + L.PIN_NECK + 2 * clearance, 2);
  const sliderH = round(Math.max(L.SLIDER_H_MIN, slotLen + 2 * L.SLOT_WALL), 2);

  const ySlot = round(py - r, 2);
  const slotTopY = round(ySlot - L.PIN_NECK / 2 - clearance, 2);
  const slotBotY = round(slotTopY + slotLen, 2);

  const channelGap = round(sliderH + L.LAT_CLEAR, 2);
  const flangeSpan = round(sliderH + 2 * L.STOP_CATCH, 2);
  const guideLen = round(travel + L.SLIDER_BODY_W + 2 * L.GLUE_END + 6, 2);

  return {
    paperSize,
    spineY: round(spineY, 2),
    px,
    py,
    r: round(r, 2),
    thetaMax: round(thetaMax, 2),
    amplitude: round(amplitude, 2),
    travel: round(travel, 2),
    ySlot,
    slotCore: round(slotCore, 2),
    slotWidthX,
    slotLen,
    slotTopY,
    slotBotY,
    sliderH,
    channelGap,
    flangeSpan,
    grip: round(grip, 2),
    clearance,
    decoRestY: round(ySlot - L.DECO_OFF, 2),
    decoR: L.DECO_R,
    guideLen,
  };
}

/** Circle as an SVG path "d" (two half-arcs). */
function circlePath(cx, cy, r) {
  return (
    `M ${round(cx - r)} ${round(cy)} ` +
    `a ${round(r)} ${round(r)} 0 1 0 ${round(2 * r)} 0 ` +
    `a ${round(r)} ${round(r)} 0 1 0 ${round(-2 * r)} 0 Z`
  );
}

/**
 * Draw the loose POST (arm) piece: a POST_W-wide strip of length r, a forward-
 * folding pin tab at the top, and a pivot neck + splay tab at the base.
 */
function drawPostPiece(g, ox, oy, geo, isColor) {
  const L = SLIDE_SWING_LIMITS;
  const CUT = getLineStyle('CUT', isColor);
  const MOUNT = getLineStyle('MOUNTAIN_FOLD', isColor);
  const VALLEY = getLineStyle('VALLEY_FOLD', isColor);
  const GLUE = getLineStyle('GLUE_TAB', isColor);

  const w = L.POST_W;
  const cx = round(ox + w / 2);
  const pinTop = oy;                        // top of pin tab
  const bodyTop = round(oy + L.PIN_NECK);   // pin tab height = PIN_NECK
  const bodyBot = round(bodyTop + geo.r);   // pivot centre row (post length r)
  const neckBot = round(bodyBot + L.PIVOT_TAB_LEN);

  // Body (pivot → pin) as a solid strip.
  addRect(g, ox, bodyTop, w, round(geo.r), CUT);

  // Pin tab on top (narrower neck, folds FORWARD through the slider slot).
  const pinL = round(cx - L.PIN_NECK / 2);
  addRect(g, pinL, pinTop, L.PIN_NECK, L.PIN_NECK, CUT);
  addPath(g, `M ${pinL} ${bodyTop} L ${round(pinL + L.PIN_NECK)} ${bodyTop}`, MOUNT);
  addText(g, round(cx + w / 2 + 1), round(bodyTop - 1), '핀: 앞으로 접어 슬롯에 끼우기', 2.1, 'start');

  // Pivot neck + splay tab at the base (passes through the card hole).
  const neckL = round(cx - L.PIVOT_TAB_W / 2);
  addRect(g, neckL, bodyBot, L.PIVOT_TAB_W, L.PIVOT_TAB_LEN, CUT);
  addPath(g, `M ${neckL} ${bodyBot} L ${round(neckL + L.PIVOT_TAB_W)} ${bodyBot}`, VALLEY);
  addRect(g, round(neckL + 0.6), round(bodyBot + 1.5), round(L.PIVOT_TAB_W - 1.2), round(L.PIVOT_TAB_LEN - 3), GLUE);
  addText(g, round(cx + w / 2 + 1), round((bodyBot + neckBot) / 2), '회전축 목: 구멍에 끼워 뒤에서 캡으로 고정', 2.1, 'start');

  addText(g, cx, round(pinTop - 2), '기둥(팔) — 한 조각', 2.4, 'middle');
  addText(g, round(ox - 1), round((bodyTop + bodyBot) / 2), `길이 ${geo.r}mm`, 2.1, 'end');
}

/**
 * Draw the loose SLIDER piece: body with a central vertical slot, stop flanges
 * at both ends, and a side handle grip.
 */
function drawSliderPiece(g, ox, oy, geo, isColor) {
  const L = SLIDE_SWING_LIMITS;
  const CUT = getLineStyle('CUT', isColor);
  const VALLEY = getLineStyle('VALLEY_FOLD', isColor);

  const w = L.SLIDER_BODY_W;
  const h = geo.sliderH;
  const sc = L.STOP_CATCH;
  const fw = L.FLANGE_W;

  // Body outline with a stop flange bumping out (in y) at each x-end.
  const outline =
    `M ${ox} ${round(oy - sc)} ` +
    `L ${round(ox + fw)} ${round(oy - sc)} L ${round(ox + fw)} ${oy} ` +
    `L ${round(ox + w - fw)} ${oy} L ${round(ox + w - fw)} ${round(oy - sc)} ` +
    `L ${round(ox + w)} ${round(oy - sc)} ` +
    `L ${round(ox + w)} ${round(oy + h + sc)} ` +
    `L ${round(ox + w - fw)} ${round(oy + h + sc)} L ${round(ox + w - fw)} ${round(oy + h)} ` +
    `L ${round(ox + fw)} ${round(oy + h)} L ${round(ox + fw)} ${round(oy + h + sc)} ` +
    `L ${ox} ${round(oy + h + sc)} Z`;
  addPath(g, outline, CUT);

  // Central vertical slot (cut).
  const slotX = round(ox + w / 2 - geo.slotWidthX / 2);
  const slotY = round(oy + (h - geo.slotLen) / 2);
  addRect(g, slotX, slotY, geo.slotWidthX, geo.slotLen, CUT);
  addText(g, round(ox + w / 2), round(oy - sc - 1.5), '슬라이더 — 한 조각', 2.4, 'middle');
  addText(g, round(ox + w / 2 + geo.slotWidthX), round(oy + h / 2), `세로 슬롯 ${geo.slotLen}mm`, 2, 'start');

  // Side handle grip (extends +x), with a fold-free grip (single sheet).
  const hx = round(ox + w);
  const hy = round(oy + (h - L.GRIP_H) / 2);
  addRect(g, hx, hy, geo.grip, L.GRIP_H, CUT);
  addPath(g, `M ${hx} ${hy} L ${hx} ${round(hy + L.GRIP_H)}`, VALLEY);
  addText(g, round(hx + geo.grip / 2), round(hy + L.GRIP_H / 2 + 0.8), '손잡이', 2.2, 'middle');
  addText(g, round(ox + w / 2), round(oy + h + sc + 3), `이동 거리 ${geo.travel}mm`, 2.1, 'middle');
}

/**
 * Draw one guide strip (glued to the card along its length, inner lip folds
 * over the slider edge to form the horizontal channel).
 */
function drawGuidePiece(g, ox, oy, geo, label, isColor) {
  const L = SLIDE_SWING_LIMITS;
  const CUT = getLineStyle('CUT', isColor);
  const GLUE = getLineStyle('GLUE_TAB', isColor);
  const VALLEY = getLineStyle('VALLEY_FOLD', isColor);

  const w = geo.guideLen;
  const h = L.GUIDE_W;
  addRect(g, ox, oy, w, h, CUT);
  // Glue foot along the OUTER band (the lip along the inner band folds over the
  // slider edge and must stay free).
  const glueH = round(h - L.GUIDE_LIP);
  addRect(g, round(ox + 0.6), round(oy + 0.6), round(w - 1.2), round(glueH - 0.6), GLUE);
  addPath(g, `M ${ox} ${round(oy + glueH)} L ${round(ox + w)} ${round(oy + glueH)}`, VALLEY);
  addText(g, round(ox + w / 2), round(oy + h + 3), label, 2, 'middle');
}

/**
 * Draw the slide-to-swing flat pattern into a passed-in SVG/group.
 *
 * Upper half = the DISPLAY face: the pivot hole cut into the card plus dashed
 * placement/motion guides (decoration rest + swing ghosts, slider band, guide
 * anchors). Lower half = the loose parts to cut out and assemble.
 *
 * @param {SVGElement} svg
 * @param {Object} [options]
 * @param {'A4'|'LETTER'} [options.paperSize='A4']
 * @param {number} [options.armLength=34]
 * @param {number} [options.swingAngle=35]
 * @param {number} [options.clearance=0.8]
 * @param {number} [options.grip=22]
 * @param {boolean} [options.isColor=true]
 * @returns {SVGGElement}
 */
export const generateSlideToSwing = (svg, options = {}) => {
  const { isColor = true } = options;
  const L = SLIDE_SWING_LIMITS;
  const geo = resolveSlideToSwing(options);
  const paper = PAPER_SIZES[geo.paperSize];
  const M = PRINT.MARGIN;

  const g = addGroup(svg, 'slide-to-swing-group');
  const CUT = getLineStyle('CUT', isColor);
  const SCORE = getLineStyle('SCORE', isColor);
  const GLUE = getLineStyle('GLUE_TAB', isColor);

  const { px, py, r, thetaMax, ySlot } = geo;

  addText(g, px, round(M + 3), '손잡이를 밀면 흔들리는 장치 (Slide-to-Swing / Scotch Yoke)', 3, 'middle');

  // ── UPPER HALF — display face: real pivot-hole cut + dashed guides ─────────
  // Pivot hole (a real cut — the post's neck passes through it).
  addPath(g, circlePath(px, py, L.PIVOT_HOLE / 2), CUT);
  addText(g, round(px + L.PIVOT_HOLE / 2 + 2), round(py + 1), '기둥 회전축 구멍', 2.2, 'start');

  // Post rest + swing ghosts (score) and decoration rest + swing ghosts.
  const decoDist = r + L.DECO_OFF;
  for (const th of [-thetaMax, 0, thetaMax]) {
    const pin = pinPosition(th, px, py, r);
    const a = degToRad(th);
    const decoC = { x: px + decoDist * Math.sin(a), y: py - decoDist * Math.cos(a) };
    addPath(g, `M ${round(px)} ${round(py)} L ${round(pin.x)} ${round(pin.y)}`, SCORE);
    addPath(g, circlePath(decoC.x, decoC.y, geo.decoR), SCORE);
  }
  addText(g, px, round(py - decoDist - geo.decoR - 2), '장식이 흔들리는 범위 (점선)', 2.2, 'middle');

  // Slider band + slot placement (score) centred on ySlot.
  const bandX = round(px - geo.amplitude - L.SLIDER_BODY_W / 2);
  const bandW = round(geo.travel + L.SLIDER_BODY_W);
  const bandTop = round(ySlot - geo.sliderH / 2);
  addRect(g, bandX, bandTop, bandW, geo.sliderH, SCORE);
  addRect(g, round(px - geo.slotWidthX / 2), geo.slotTopY, geo.slotWidthX, geo.slotLen, SCORE);
  addText(g, round(bandX + bandW / 2), round(bandTop - 1.5), '슬라이더 이동 범위 (여기서 좌우로)', 2.1, 'middle');

  // Guide-strip glue anchors (dashed) above & below the band.
  const gTopY = round(bandTop - L.GUIDE_W - 1);
  const gBotY = round(bandTop + geo.sliderH + 1);
  for (const [gy, tag] of [[gTopY, 'Ⓐ 위 안내띠'], [gBotY, 'Ⓑ 아래 안내띠']]) {
    addRect(g, bandX, gy, bandW, L.GUIDE_W, SCORE);
    addText(g, round(bandX - 1), round(gy + L.GUIDE_W / 2), tag, 2, 'end');
  }

  // ── LOWER HALF — loose parts to cut ───────────────────────────────────────
  const partTop = round(geo.spineY + 10);
  addText(g, px, round(geo.spineY + 4), '↓ 아래: 오려서 조립하는 부품들', 2.6, 'middle');

  // Post (leftmost).
  const postX = round(M + 8);
  drawPostPiece(g, postX, partTop, geo, isColor);

  // Slider to the right of the post.
  const sliderX = round(postX + L.POST_W + 22);
  drawSliderPiece(g, sliderX, round(partTop + 4), geo, isColor);

  // Two guide strips below the slider, kept on-page.
  const guideX = Math.min(round(M + 8), round(paper.width - M - geo.guideLen - 2));
  const guideY = round(partTop + Math.max(geo.sliderH, geo.r) + L.GRIP_H + 8);
  drawGuidePiece(g, guideX, guideY, geo, 'Ⓐ 위 안내띠 (카드에 붙이기)', isColor);
  drawGuidePiece(g, guideX, round(guideY + L.GUIDE_W + 8), geo, 'Ⓑ 아래 안내띠 (카드에 붙이기)', isColor);

  // Pivot cap disc (glued behind the card to capture the pivot neck).
  const capX = round(Math.min(sliderX + L.SLIDER_BODY_W + geo.grip + 14 + L.PIVOT_CAP_R,
    paper.width - M - L.PIVOT_CAP_R - 2));
  const capY = round(partTop + L.PIVOT_CAP_R + 4);
  addPath(g, circlePath(capX, capY, L.PIVOT_CAP_R), CUT);
  addPath(g, circlePath(capX, capY, round(L.PIVOT_CAP_R - 1.5)), GLUE);
  addText(g, capX, round(capY + L.PIVOT_CAP_R + 3), '회전축 캡 (뒤에서 목에 붙이기)', 2, 'middle');

  // Decoration (heart example) to cut and glue onto the pin.
  const decoCx = capX;
  const decoCy = round(capY + 2 * L.PIVOT_CAP_R + geo.decoR + 8);
  if (decoCy + geo.decoR < paper.height - M) {
    const heart = generateHeart(decoCx, decoCy, geo.decoR * 2, isColor ? 'color' : 'bw');
    addPath(g, heart.d, { stroke: heart.stroke, strokeWidth: heart.strokeWidth, fill: heart.fill });
    addText(g, decoCx, round(decoCy + geo.decoR + 4), '장식(예: 하트) — 핀에 붙이기', 2, 'middle');
  }

  return g;
};

/**
 * Render the slide-to-swing onto a complete printable SVG template.
 * @param {Object} [params={}]
 * @param {'A4'|'LETTER'} [params.paperSize='A4']
 * @param {'color'|'bw'} [params.colorMode='color']
 * @param {number} [params.armLength=34]
 * @param {number} [params.swingAngle=35]
 * @param {number} [params.clearance=0.8]
 * @param {number} [params.grip=22]
 * @returns {{ svg: SVGSVGElement, geometry: SlideSwingGeometry }}
 */
export function renderSlideToSwing(params = {}) {
  const { paperSize = 'A4', colorMode = 'color', ...opts } = params;
  const { svg, contentGroup } = createTemplate(paperSize, colorMode);
  const geometry = resolveSlideToSwing({ paperSize, ...opts });
  generateSlideToSwing(contentGroup, {
    paperSize,
    ...opts,
    isColor: colorMode !== 'bw',
  });
  return { svg, geometry };
}
