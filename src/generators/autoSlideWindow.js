/**
 * @fileoverview Auto-slide window ("열면 액자 속 그림이 바뀌는 카드") mechanism
 * generator.
 *
 * A book-shaped card. The card is one half-sheet folded along the central spine
 * (createTemplate's valley line at y = paper.height/2). Opening the card = the
 * dihedral angle α between the two faces going 0° (closed book) → 180° (flat).
 * A fixed decorative WINDOW FRAME (a door / picture-frame with a cut opening) is
 * mounted on the fixed BACK face; a MESSAGE STRIP slides behind it. As the card
 * opens, the strip is driven automatically by the card's own motion, so a
 * different message/picture passes into view — no separate handle is pulled
 * (this is what distinguishes it from pull-tab / rising-slide).
 *
 * ────────────────────────────────────────────────────────────────────────────
 *  THE DRIVE — an in-line slider-crank realised as a paper V-fold arm
 * ────────────────────────────────────────────────────────────────────────────
 *  Put the spine on the x-axis (the hinge). Cross-section in the plane
 *  perpendicular to the spine at a chosen column x = x₁ (coordinates written as
 *  (perpendicular-distance-from-spine, height-off-table)):
 *
 *    • BACK face is fixed in the table plane. A point at distance s: (s, 0).
 *    • FRONT (moving) face is hinged at the spine and makes dihedral α with the
 *      back face. A PIVOT P on it at distance p: P = (p·cos α, p·sin α).
 *    • A rigid STRUT of length L joins P to a SLIDER S = (s, 0) that is
 *      constrained to the back face (the track / guide channel). One length
 *      constraint |P − S| = L gives, expanding the law of cosines with the
 *      slider ON the line through the crank foot (offset e = 0):
 *
 *          s(α) = p·cos α + √(L² − p²·sin²α)                         (in-line slider-crank)
 *
 *  Monotonicity:  ds/dα = −p·sin α · [ 1 + p·cos α / √(L² − p²·sin²α) ].
 *  For α ∈ (0°,180°), sin α > 0, and the bracket stays > 0 **iff L > p**
 *  (worst case α→180° needs p² < L²). So for any L > p the slider position is
 *  STRICTLY MONOTONIC over the whole practical range 20°–160° — no dead point,
 *  no reversal. (The only stationary points are the singular ends α = 0° and
 *  180°, where ds/dα = 0; the card simply reaches full-close / full-flat there.)
 *  We enforce L ≥ p + L_MIN_OVER_P (default L=44, p=16). Travel over 0°..180° is
 *      s(0) − s(180) = (p+L) − (L−p) = 2p.
 *
 *  WHY THIS IS A CLEAN PAPER MECHANISM (and not the spatial linkage I flagged on
 *  the earlier Rotary-Twist candidate): the crank pivot column and the track are
 *  the SAME column x = x₁ (offset e = 0). Rotation of the front face about the
 *  spine (the x-axis) preserves every point's x-coordinate, so P, S and the strut
 *  all live in the single perpendicular plane x = x₁ for the full width of the
 *  strut — the mechanism is a PRISMATIC EXTRUSION of a planar slider-crank. Both
 *  strut creases (at P and at S) are lines PARALLEL TO THE SPINE, so they hinge
 *  as clean paper folds with zero twist. There is no out-of-plane mismatch to
 *  absorb, unlike a strut spanning two DIFFERENT columns (e ≠ 0), which would
 *  force the creases to twist and bind. I therefore commit to the RIGID STRUT
 *  here — it is bidirectional (push on open AND pull on close, so it self-erects
 *  and self-retracts) and is exactly the geometry of a standard V-fold pop-up
 *  arm. The one honest caveat: a single side-mounted strut applies its force off
 *  the strip's guide centroid, so it could rack the strip; this is countered by
 *  TWO guide bridges spaced along the travel (a couple that resists rotation),
 *  the same retention idea as risingSlide.
 *
 * ────────────────────────────────────────────────────────────────────────────
 *  FLAT-FOLDABILITY
 * ────────────────────────────────────────────────────────────────────────────
 *  • Closed (α=0): P folds onto the back face at distance p; s(0)=L+p; the strut
 *    lies FLAT on the back face spanning [p, L+p] (length L). Front face flat on
 *    back face. Fully collapsed.
 *  • Flat open (α=180): faces coplanar; s(180)=L−p; strut lies flat spanning
 *    [−p (on the front-face side of the spine) .. L−p], again length L.
 *  Between these the strut tents up and back down continuously (peak height
 *  p·sin α ≤ p). Every mountain crease (strut↔front-face pivot, spine side) is
 *  matched by the valley at the strut↔slider crease, so the arm collapses flat in
 *  both limits. The message strip and window overlay never leave the back face
 *  plane (< 1 mm stack), so they close flat trivially. Real pop-up: ✓.
 *
 * ────────────────────────────────────────────────────────────────────────────
 *  THE WINDOW & TWO READABLE MESSAGES
 * ────────────────────────────────────────────────────────────────────────────
 *  The window is fixed at distance W from the spine on the back face (height winH)
 *  and is placed at the MIDDLE of the slider's travel, W = L (the midpoint of
 *  [sOpen, sClosed] = [L−p, L+p]). This keeps the strip symmetric about its
 *  strut-attach point S and makes the window offsets symmetric: the material
 *  offset shown at opening α is u = W − s(α) ∈ [−p, +p]. We read out two design
 *  angles:
 *      partial-open  α = ALPHA_PARTIAL (25°)  → message 1 centred in window
 *      full-open     α = ALPHA_FULL   (155°)  → message 2 centred in window
 *  With W = L their separation on the strip is |s(25°) − s(155°)| = 2p·cos25° ≈
 *  1.81p (≈ 29 mm at defaults). We clamp winH < 1.6p ≤ 1.81p so it is always
 *  smaller than the separation and the two messages never appear half-cut
 *  together. The strip carries enough material to fully cover the window over the
 *  entire 0°..180° travel:
 *      uMin = W − s(0)   − winH/2 − STRIP_PAD = −p − winH/2 − STRIP_PAD
 *      uMax = W − s(180) + winH/2 + STRIP_PAD = +p + winH/2 + STRIP_PAD
 *      stripLen = uMax − uMin = 2p + winH + 2·STRIP_PAD.
 *  The strut-attach point S is material offset u = 0, always inside [uMin, uMax].
 *  The strip's assembled footprint (union over all slider positions) is
 *      span = 4p + winH + 2·STRIP_PAD , centred on W = L,
 *  which is what the fit-clamps below bound against the printable face.
 *
 * ────────────────────────────────────────────────────────────────────────────
 *  SIZING (fits A4 AND Letter; Letter governs)
 * ────────────────────────────────────────────────────────────────────────────
 *  Face depth from spine to free edge:  faceDepth = CARD.height − PRINT.MARGIN
 *  (A4 143.5, Letter 134.7). Two hard clamps guarantee nothing runs off the face:
 *      (1) footprint fit:  4p + winH + 2·STRIP_PAD ≤ faceDepth − SPINE_PAD − OUTER_PAD
 *          ⇒ p ≤ (faceDepth − SPINE_PAD − OUTER_PAD − winH − 2·STRIP_PAD)/4
 *      (2) strut-flat fit:  s(0) = L + p ≤ faceDepth − OUTER_PAD   ⇒  L ≤ faceDepth − OUTER_PAD − p
 *  W is then centred in the available band and clamped so the whole footprint sits
 *  inside [SPINE_PAD, faceDepth − OUTER_PAD]. Garbage / oversize params are
 *  clamped, never throw, and never push a piece past the printable edge on either
 *  paper size.
 *
 *  RISKIEST FAILURE MODE: racking of the side-driven strip (it skews and jams).
 *  Addressed by (a) two guide bridges spaced GUIDE spans apart along travel giving
 *  a rotation-resisting couple, and (b) a strip wide in x (SLIDER_WX = 44 mm) so
 *  the guide channel has a long bearing length. Stop flanges (flangeW = channel +
 *  2·STOP_CATCH) at both ends keep the strip captive so a hard tug can't eject it.
 *
 * @module generators/autoSlideWindow
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

/** Fixed design limits / clamps (see file header for the derivations). */
export const AUTO_SLIDE_LIMITS = {
  P_MIN: 8,
  P_MAX: 24,            // pivot arm on the moving face (mm)
  L_MIN_OVER_P: 10,     // strut length floor above p (guarantees L > p → monotonic)
  WIN_H_MIN: 8,
  WIN_H_MAX: 18,        // window opening height (mm)
  WIN_W: 40,            // window opening width, x (mm)
  FRAME_BORDER: 7,      // decorative frame border around the window (mm)
  STRIP_PAD: 3,         // strip overhang each side of the window (mm)
  SPINE_PAD: 3,         // keep the strip footprint this far from the spine (mm)
  OUTER_PAD: 4,         // keep the strip footprint this far from the free edge (mm)
  SLIDER_WX: 44,        // message-strip width, x — covers WIN_W with overlap (mm)
  DRIVE_GAP: 8,         // clearance from window edge to the drive column (mm)
  STRUT_W: 12,          // strut width, x (mm)
  GLUE_END: 6,          // strut / guide glue-end length (mm, > 5 grip floor)
  LAT_CLEAR: 0.6,       // total lateral play of strip in guide channel (mm)
  STOP_CATCH: 4,        // stop-flange overhang beyond channel each side (mm)
  FLANGE_H: 5,          // stop-flange band height (mm)
  GUIDE_W: 7,           // guide-bridge width, y (mm)
  ALPHA_PARTIAL: 25,    // "barely open" readout angle (deg) → message 1
  ALPHA_FULL: 155,      // "fully open" readout angle (deg)  → message 2
  ALPHA_MIN_OP: 20,     // stated practical operating range (deg)
  ALPHA_MAX_OP: 160,
};

/** NaN/garbage-safe numeric intake (?? only guards null/undefined). */
const numOr = (v, d) => (Number.isFinite(Number(v)) ? Number(v) : d);

/**
 * In-line slider-crank slider position: distance of the slider from the spine as
 * a function of the card opening angle. s(α) = p·cosα + √(L² − p²·sin²α).
 * @param {number} alphaDeg
 * @param {number} p - Pivot arm length (mm)
 * @param {number} L - Strut length (mm)
 * @returns {number} Slider distance from spine (mm)
 */
export function sliderDistance(alphaDeg, p, L) {
  const a = degToRad(alphaDeg);
  const under = L * L - p * p * Math.sin(a) * Math.sin(a);
  return p * Math.cos(a) + Math.sqrt(Math.max(0, under));
}

/**
 * @typedef {Object} AutoSlideGeometry
 * @property {'A4'|'LETTER'} paperSize
 * @property {number} spineY        - Spine y on the sheet (mm)
 * @property {number} faceDepth     - Printable face depth from spine (mm)
 * @property {number} cx            - Window centre x (mm)
 * @property {number} x1            - Drive column x (pivot + strut + slider tab) (mm)
 * @property {number} p             - Pivot arm length (mm)
 * @property {number} L             - Strut length (mm)
 * @property {number} winW          - Window opening width (mm)
 * @property {number} winH          - Window opening height (mm)
 * @property {number} W             - Window distance from spine (mm)
 * @property {number} sOpen         - s(180°) = L − p (mm)
 * @property {number} sClosed       - s(0°)   = L + p (mm)
 * @property {number} travel        - Full slider travel 2p (mm)
 * @property {number} sPartial      - s(ALPHA_PARTIAL) (mm)
 * @property {number} sFull         - s(ALPHA_FULL)   (mm)
 * @property {number} readoutSep    - |sPartial − sFull|, message separation (mm)
 * @property {number} u1            - message-1 material offset from S (mm)
 * @property {number} u2            - message-2 material offset from S (mm)
 * @property {number} uMin          - strip inner material extent from S (mm)
 * @property {number} uMax          - strip outer material extent from S (mm)
 * @property {number} stripLen      - strip length in y (mm)
 * @property {number} sliderWx      - strip width in x (mm)
 * @property {number} channelGap    - guide channel width (mm)
 * @property {number} flangeW       - stop-flange full width (mm)
 * @property {number} footprintSpan - assembled strip footprint span (mm)
 */

/**
 * Resolve + clamp auto-slide-window geometry against the printable face.
 * Pure numbers only (no DOM) so it can be bounds/monotonicity tested headlessly.
 *
 * @param {{ paperSize?:'A4'|'LETTER', pivotArm?:number, strut?:number,
 *           windowHeight?:number }} [opts]
 * @returns {AutoSlideGeometry}
 */
export function resolveAutoSlideWindow(opts = {}) {
  const L_ = AUTO_SLIDE_LIMITS;
  const paper = PAPER_SIZES[opts.paperSize] || PAPER_SIZES.A4;
  const card = CARD_SIZES[opts.paperSize] || CARD_SIZES.A4;
  const paperSize = CARD_SIZES[opts.paperSize] ? opts.paperSize : 'A4';

  const spineY = paper.height / 2;
  const faceDepth = card.height - PRINT.MARGIN;
  const availLo = L_.SPINE_PAD;
  const availHi = faceDepth - L_.OUTER_PAD;

  const winH = clamp(numOr(opts.windowHeight, 12), L_.WIN_H_MIN, L_.WIN_H_MAX);

  // (1) footprint-fit clamp on p:  4p + winH + 2·STRIP_PAD ≤ availHi − availLo
  const pFit = (availHi - availLo - winH - 2 * L_.STRIP_PAD) / 4;
  const p = clamp(numOr(opts.pivotArm, 16), L_.P_MIN, Math.max(L_.P_MIN, Math.min(L_.P_MAX, pFit)));

  // (2) L clamps. The window MUST sit at the travel midpoint, W = L (see header:
  // symmetric window offsets, and the strut-attach point u = 0 always inside the
  // strip). So instead of sliding W away from L to make the footprint fit the
  // page — which pushed the strut-attach row clean OFF the end of the strip
  // (vAttach went negative at defaults) — we clamp L itself, since the strip's
  // footprint is centred on W = L:
  //   L ≥ p + L_MIN_OVER_P     (monotonic slider-crank, L > p)
  //   L − halfSpan ≥ availLo   (footprint clears the spine side)
  //   L + halfSpan ≤ availHi   (footprint clears the free edge; halfSpan > p so
  //                             this also satisfies the strut-flat fit L + p)
  // The (1) footprint clamp on p keeps this interval non-empty on A4 AND Letter.
  const halfSpan = 2 * p + winH / 2 + L_.STRIP_PAD;
  const Lfloor = Math.max(p + L_.L_MIN_OVER_P, availLo + halfSpan);
  const Lceil = Math.max(Lfloor, availHi - halfSpan);
  const L = clamp(numOr(opts.strut, 44), Lfloor, Lceil);

  const sOpen = L - p;              // s(180°)
  const sClosed = L + p;            // s(0°)
  const travel = 2 * p;
  const footprintSpan = 4 * p + winH + 2 * L_.STRIP_PAD;

  // Window at the travel midpoint (midpoint of [sOpen, sClosed] = [L−p, L+p]).
  const W = L;

  const sPartial = sliderDistance(L_.ALPHA_PARTIAL, p, L);
  const sFull = sliderDistance(L_.ALPHA_FULL, p, L);
  const readoutSep = Math.abs(sPartial - sFull);

  const u1 = W - sPartial;          // material offset shown at partial-open
  const u2 = W - sFull;             // material offset shown at full-open
  const uMin = W - sClosed - winH / 2 - L_.STRIP_PAD;
  const uMax = W - sOpen + winH / 2 + L_.STRIP_PAD;
  const stripLen = uMax - uMin;

  const sliderWx = L_.SLIDER_WX;
  const channelGap = round(sliderWx + L_.LAT_CLEAR, 2);
  const flangeW = round(channelGap + 2 * L_.STOP_CATCH, 2);

  const cx = round(paper.width / 2, 2);
  const x1 = round(cx + L_.WIN_W / 2 + L_.DRIVE_GAP, 2);

  return {
    paperSize,
    spineY: round(spineY, 2),
    faceDepth: round(faceDepth, 2),
    cx,
    x1,
    p: round(p, 2),
    L: round(L, 2),
    winW: L_.WIN_W,
    winH: round(winH, 2),
    W: round(W, 2),
    sOpen: round(sOpen, 2),
    sClosed: round(sClosed, 2),
    travel: round(travel, 2),
    sPartial: round(sPartial, 2),
    sFull: round(sFull, 2),
    readoutSep: round(readoutSep, 2),
    u1: round(u1, 2),
    u2: round(u2, 2),
    uMin: round(uMin, 2),
    uMax: round(uMax, 2),
    stripLen: round(stripLen, 2),
    sliderWx,
    channelGap,
    flangeW,
    footprintSpan: round(footprintSpan, 2),
  };
}

/**
 * Rounded-rectangle helper as an SVG path "d".
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
 * Draw the loose MESSAGE STRIP (slider) piece in whitespace. Long axis = y,
 * outward (larger spine-distance) = downward, drawn as it sits at full-open so
 * message 2 aligns to the window guide. Includes stop flanges at both ends, the
 * side drive tab with the strut-attach crease, and the two message zones.
 *
 * @param {SVGElement} g
 * @param {number} ox - piece left x
 * @param {number} oy - piece top y (inner / spine-side end)
 * @param {AutoSlideGeometry} geo
 * @param {boolean} isColor
 */
function drawSliderPiece(g, ox, oy, geo, isColor) {
  const L_ = AUTO_SLIDE_LIMITS;
  const CUT = getLineStyle('CUT', isColor);
  const SCORE = getLineStyle('SCORE', isColor);
  const MOUNT = getLineStyle('MOUNTAIN_FOLD', isColor);
  const GLUE = getLineStyle('GLUE_TAB', isColor);

  const w = geo.sliderWx;
  const h = geo.stripLen;
  const sc = L_.STOP_CATCH;
  const fh = L_.FLANGE_H;
  const rx = round(ox + w);

  // Material coordinate on the piece: v = distance from top (inner end).
  // The strut-attach point is material offset u = 0 → v_attach = 0 − uMin.
  // With W = L this is always the strip's midpoint, so the drive tab sits safely
  // between the two end bars.
  const vAttach = 0 - geo.uMin;
  const tabLen = L_.STRUT_W + L_.GLUE_END;
  const tabTop = round(oy + vAttach - L_.STRUT_W / 2);
  const tabBot = round(oy + vAttach + L_.STRUT_W / 2);

  // ── Single continuous strip outline (한 조각) ─────────────────────────────
  // I-beam: wide stop bars (w + 2·STOP_CATCH) at both ends, a narrow web (w) in
  // between, and the side drive tab as an integral bump on the web. Earlier the
  // body was a full closed rect and the flanges/drive-tab were separate shapes
  // sharing (and thus re-cutting) the body edge — cutting every solid line would
  // have detached the stop bars and the drive tab from the strip. Tracing one
  // perimeter keeps it a single connected piece.
  addPath(
    g,
    `M ${round(ox - sc)} ${oy} ` +
    `L ${round(ox + w + sc)} ${oy} ` +                 // top bar top edge
    `L ${round(ox + w + sc)} ${round(oy + fh)} ` +     // down top bar right
    `L ${rx} ${round(oy + fh)} ` +                     // step in to web right
    `L ${rx} ${tabTop} ` +                             // down web to drive tab
    `L ${round(rx + tabLen)} ${tabTop} ` +             // out along tab top
    `L ${round(rx + tabLen)} ${tabBot} ` +             // down tab right
    `L ${rx} ${tabBot} ` +                             // back to web
    `L ${rx} ${round(oy + h - fh)} ` +                 // down web to bottom bar
    `L ${round(ox + w + sc)} ${round(oy + h - fh)} ` + // step out to bottom bar
    `L ${round(ox + w + sc)} ${round(oy + h)} ` +      // down bottom bar right
    `L ${round(ox - sc)} ${round(oy + h)} ` +          // bottom bar bottom edge
    `L ${round(ox - sc)} ${round(oy + h - fh)} ` +     // up bottom bar left
    `L ${ox} ${round(oy + h - fh)} ` +                 // step in to web left
    `L ${ox} ${round(oy + fh)} ` +                     // up web left
    `L ${round(ox - sc)} ${round(oy + fh)} Z`,         // step out to top bar, close
    CUT,
  );

  // Message zones: material offset u → v = u − uMin.
  const v1 = geo.u1 - geo.uMin;   // message 1 (partial-open)
  const v2 = geo.u2 - geo.uMin;   // message 2 (full-open)
  const mzW = Math.min(geo.winW, w - 4);
  const mzX = round(ox + (w - mzW) / 2);
  const drawMsg = (v, label) => {
    const y0 = round(oy + v - geo.winH / 2);
    addRect(g, mzX, y0, round(mzW), round(geo.winH), SCORE);
    addText(g, round(ox + w / 2), round(y0 + geo.winH / 2 + 1), label, 2.4, 'middle');
  };
  drawMsg(v1, '메시지 ①(살짝 열 때)');
  drawMsg(v2, '메시지 ②(활짝 열 때)');

  // Drive-tab glue face + strut-attach crease (parallel to spine → horizontal),
  // both interior to the tab so neither coincides with a cut.
  addRect(g, round(rx + 1), round(tabTop + 1), round(tabLen - 2), round(L_.STRUT_W - 2), GLUE);
  addPath(g, `M ${rx} ${round(oy + vAttach)} L ${round(rx + tabLen)} ${round(oy + vAttach)}`, MOUNT);
  addText(g, round(rx + tabLen + 1), round(oy + vAttach), '② 지지대 아래 끝 붙이는 곳', 2.2, 'start');

  addText(g, round(ox + w / 2), round(oy - sc - 1.5), '메시지 띠(슬라이더) — 한 조각', 2.6, 'middle');
  addText(g, round(ox + w / 2), round(oy + h + fh + 3), `이동 거리 ${geo.travel}mm`, 2.2, 'middle');
}

/**
 * Draw the loose STRUT (drive arm) piece: a strip of length L with a glue tab +
 * crease at each end. Top end → moving-face pivot anchor; bottom end → slider
 * drive tab. Both creases are parallel to the spine (drawn horizontal here).
 */
function drawStrutPiece(g, ox, oy, geo, isColor) {
  const L_ = AUTO_SLIDE_LIMITS;
  const CUT = getLineStyle('CUT', isColor);
  const GLUE = getLineStyle('GLUE_TAB', isColor);
  const MOUNT = getLineStyle('MOUNTAIN_FOLD', isColor);

  const w = L_.STRUT_W;
  const ge = L_.GLUE_END;
  const total = geo.L + 2 * ge; // body L + glue tab each end

  addRect(g, ox, oy, w, round(total), CUT);
  // glue tabs at both ends
  addRect(g, round(ox + 1), round(oy + 1), round(w - 2), round(ge - 2), GLUE);
  addRect(g, round(ox + 1), round(oy + total - ge + 1), round(w - 2), round(ge - 2), GLUE);
  // creases between tabs and body
  addPath(g, `M ${ox} ${round(oy + ge)} L ${round(ox + w)} ${round(oy + ge)}`, MOUNT);
  addPath(g, `M ${ox} ${round(oy + total - ge)} L ${round(ox + w)} ${round(oy + total - ge)}`, MOUNT);

  addText(g, round(ox + w / 2), round(oy - 1.5), '지지대(팔) — 한 조각', 2.4, 'middle');
  addText(g, round(ox + w + 1), round(oy + ge / 2 + 1), '① 위: 앞면에', 2, 'start');
  addText(g, round(ox + w + 1), round(oy + total - ge / 2 + 1), '② 아래: 띠에', 2, 'start');
  addText(g, round(ox + w + 1), round(oy + total / 2), `길이 ${geo.L}mm`, 2, 'start');
}

/**
 * Draw the loose WINDOW FRAME overlay: a rounded picture-frame with the window
 * cut out, glued to the back face along its LEFT and RIGHT borders only (leaving
 * a vertical channel for the strip to slide through underneath).
 */
function drawFramePiece(g, ox, oy, geo, isColor) {
  const L_ = AUTO_SLIDE_LIMITS;
  const CUT = getLineStyle('CUT', isColor);
  const GLUE = getLineStyle('GLUE_TAB', isColor);

  const b = L_.FRAME_BORDER;
  const outerW = geo.winW + 2 * b;
  const outerH = geo.winH + 2 * b;

  addPath(g, roundRectPath(ox, oy, outerW, outerH, 4), CUT);
  // window opening (cut)
  addRect(g, round(ox + b), round(oy + b), geo.winW, round(geo.winH), CUT);
  // glue only on left / right borders → strip slides vertically underneath
  addRect(g, round(ox + 1), round(oy + 1), round(b - 2), round(outerH - 2), GLUE);
  addRect(g, round(ox + outerW - b + 1), round(oy + 1), round(b - 2), round(outerH - 2), GLUE);

  addText(g, round(ox + outerW / 2), round(oy - 1.5), '창문 액자(뒷면에 덮어 붙이기)', 2.4, 'middle');
  addText(g, round(ox + outerW / 2), round(oy + outerH + 3), '좌·우만 풀칠 (위·아래는 열어두기)', 2.1, 'middle');
}

/**
 * Draw one guide bridge (retainer) piece: glued at both x-ends, open channel in
 * the middle for the strip to slide through. Reused twice (spaced along travel).
 */
function drawGuidePiece(g, ox, oy, geo, label, isColor) {
  const L_ = AUTO_SLIDE_LIMITS;
  const CUT = getLineStyle('CUT', isColor);
  const GLUE = getLineStyle('GLUE_TAB', isColor);
  const SCORE = getLineStyle('SCORE', isColor);

  const w = round(geo.channelGap + 2 * L_.GLUE_END);
  const h = L_.GUIDE_W;
  addRect(g, ox, oy, w, h, CUT);
  addRect(g, ox, oy, L_.GLUE_END, h, GLUE);
  addRect(g, round(ox + w - L_.GLUE_END), oy, L_.GLUE_END, h, GLUE);
  const chL = round(ox + L_.GLUE_END);
  const chR = round(ox + w - L_.GLUE_END);
  addPath(g, `M ${chL} ${oy} L ${chL} ${round(oy + h)}`, SCORE);
  addPath(g, `M ${chR} ${oy} L ${chR} ${round(oy + h)}`, SCORE);
  addText(g, round(ox + w / 2), round(oy + h + 3), label, 2.1, 'middle');
  addText(g, round(ox + w / 2), round(oy - 1.5), '가운데는 붙이지 마세요', 2, 'middle');
}

/**
 * Draw the auto-slide-window flat pattern into a passed-in SVG/group.
 *
 * Lower half (below the spine) = fixed BACK face: placement guides only (nothing
 * is cut from the display face). Upper half = moving FRONT face + parts area: the
 * pivot anchor near the spine and all loose parts (strip, strut, frame, guides).
 *
 * @param {SVGElement} svg - Target element (a content group from createTemplate)
 * @param {Object} [options]
 * @param {'A4'|'LETTER'} [options.paperSize='A4']
 * @param {number} [options.pivotArm=16]
 * @param {number} [options.strut=44]
 * @param {number} [options.windowHeight=12]
 * @param {boolean} [options.isColor=true]
 * @returns {SVGGElement}
 */
export const generateAutoSlideWindow = (svg, options = {}) => {
  const { isColor = true } = options;
  const L_ = AUTO_SLIDE_LIMITS;
  const geo = resolveAutoSlideWindow(options);
  const paper = PAPER_SIZES[geo.paperSize];

  const g = addGroup(svg, 'auto-slide-window-group');
  const CUT = getLineStyle('CUT', isColor);
  const SCORE = getLineStyle('SCORE', isColor);
  const GLUE = getLineStyle('GLUE_TAB', isColor);

  const { spineY, cx, x1, W, winW, winH } = geo;

  // ── LOWER HALF — fixed BACK face: placement guides (no cuts) ───────────────
  addText(g, cx, round(spineY + 4), '↓ 아래쪽: 고정 뒷면 (붙이는 위치 안내만)', 2.6, 'middle');

  // Window placement guide.
  const winY = round(spineY + W - winH / 2);
  addRect(g, round(cx - winW / 2), winY, winW, round(winH), SCORE);
  addText(g, round(cx), round(spineY + W + winH / 2 + 3), `창문 액자 위치 (척추에서 ${W}mm)`, 2.3, 'middle');

  // Strip travel band guide (where the message strip sweeps, hero = full open).
  const bandTop = round(spineY + geo.sFull + geo.uMin);
  const bandBot = round(spineY + geo.sFull + geo.uMax);
  addPath(g, `M ${round(cx - geo.sliderWx / 2)} ${bandTop} L ${round(cx - geo.sliderWx / 2)} ${bandBot}`, SCORE);
  addPath(g, `M ${round(cx + geo.sliderWx / 2)} ${bandTop} L ${round(cx + geo.sliderWx / 2)} ${bandBot}`, SCORE);

  // Two guide-bridge glue targets, spaced along travel to resist racking.
  const gHalf = round(geo.channelGap / 2 + L_.GLUE_END);
  const gy1 = round(spineY + W - winH / 2 - L_.GUIDE_W - 2);
  const gy2 = round(spineY + W + winH / 2 + 2);
  for (const [gy, tag] of [[gy1, 'Ⓐ 위 안내다리'], [gy2, 'Ⓑ 아래 안내다리']]) {
    addRect(g, round(cx - gHalf), gy, round(gHalf * 2), L_.GUIDE_W, SCORE);
    addText(g, round(cx - gHalf - 1), round(gy + L_.GUIDE_W / 2), tag, 2, 'end');
  }

  // ── UPPER HALF — moving FRONT face pivot anchor + parts area ───────────────
  addText(g, cx, round(spineY - 3), '↑ 위쪽: 여는 앞면 + 부품 (오려서 조립)', 2.6, 'middle');

  // Pivot anchor on the moving face at (x1, spine − p). Keep this solid.
  const anchorY = round(spineY - geo.p - 3);
  addRect(g, round(x1 - L_.STRUT_W / 2), anchorY, L_.STRUT_W, 6, GLUE);
  addText(g, round(x1 + L_.STRUT_W / 2 + 1), round(anchorY + 3), `① 지지대 위 끝 붙이는 곳 (척추에서 ${geo.p}mm)`, 2.1, 'start');

  addText(g, cx, round(PRINT.MARGIN + 3), '열면 바뀌는 액자 카드 (Auto-Slide Window)', 3, 'middle');

  // Loose parts, laid out across the upper half's free area, left → right, kept
  // inside [MARGIN, paper.width − MARGIN] and above the spine.
  const topY = round(PRINT.MARGIN + 8);
  // Slider piece (leftmost).
  const sliderX = round(PRINT.MARGIN + 6 + L_.STOP_CATCH);
  drawSliderPiece(g, sliderX, topY, geo, isColor);

  // Strut piece to the right of the slider.
  const strutX = round(sliderX + geo.sliderWx + L_.STRUT_W + L_.GLUE_END + 30);
  drawStrutPiece(g, strutX, topY, geo, isColor);

  // Frame overlay under the strut column.
  const frameX = round(strutX + L_.STRUT_W + 16);
  drawFramePiece(g, Math.min(frameX, round(paper.width - PRINT.MARGIN - (winW + 2 * L_.FRAME_BORDER) - 2)), topY + 6, geo, isColor);

  // Two guide bridges near the bottom-left of the upper half.
  const guideY = Math.min(round(topY + geo.stripLen + 14), round(spineY - 2 * L_.GUIDE_W - 12));
  drawGuidePiece(g, sliderX, guideY, geo, 'Ⓐ 위 안내다리 (뒷면에)', isColor);
  drawGuidePiece(g, sliderX, round(guideY + L_.GUIDE_W + 10), geo, 'Ⓑ 아래 안내다리 (뒷면에)', isColor);

  return g;
};

/**
 * Render the auto-slide-window onto a complete printable SVG template.
 * @param {Object} [params={}]
 * @param {'A4'|'LETTER'} [params.paperSize='A4']
 * @param {'color'|'bw'} [params.colorMode='color']
 * @param {number} [params.pivotArm=16]
 * @param {number} [params.strut=44]
 * @param {number} [params.windowHeight=12]
 * @returns {{ svg: SVGSVGElement, geometry: AutoSlideGeometry }}
 */
export function renderAutoSlideWindow(params = {}) {
  const { paperSize = 'A4', colorMode = 'color', ...opts } = params;
  const { svg, contentGroup } = createTemplate(paperSize, colorMode);
  const geometry = resolveAutoSlideWindow({ paperSize, ...opts });
  generateAutoSlideWindow(contentGroup, {
    paperSize,
    ...opts,
    isColor: colorMode !== 'bw',
  });
  return { svg, geometry };
}
