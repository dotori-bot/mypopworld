/**
 * @fileoverview Magic-shutter ("매직 셔터 — 손잡이를 밀면 창문 그림이 바뀌는 카드")
 * mechanism generator.
 *
 * A near-square picture-frame card. The card FRONT (upper half of the folded
 * sheet) has a rectangular WINDOW that is cut into a vertical PICKET GRILLE:
 * inside the window, columns of width `w` alternate between BARS (uncut card
 * paper, opaque, still joined to the frame top & bottom) and GAPS (cut-through
 * slots you see through). A SLIDER sheet rides behind the window carrying the
 * two pictures sliced into `w`-wide vertical strips, interleaved: picture ①
 * strips sit under the GAPS, picture ② strips sit under the BARS. Push the
 * handle sideways by exactly one column width `w` and the ② strips slide into
 * the gaps — the window's picture swaps ①→② ("짠!"). This is the classic,
 * physically self-evident "picket-fence / barrier-grid animation" — chosen over
 * the video's woven-slat interleave (see docs/mechanisms/magic-shutter.md for
 * why that candidate was rejected: its jam-free weave + one-pitch registration
 * can't be guaranteed for an 8-year-old from printed cut lines alone).
 *
 * ── The optics (why it swaps cleanly) ────────────────────────────────────────
 *   Window width  W = cols · w,  cols ODD so BARS bound both outer edges (each
 *   bar stays joined to the frame → the grille can't fall apart). With cols odd:
 *       bars = (cols+1)/2   at even column indices 0,2,…,cols−1
 *       gaps = (cols−1)/2   at odd  column indices 1,3,…,cols−2
 *   Slider offset u measured from the "show ①" rest. On the slider (local x from
 *   the slider's left, which maps to window-x = windowX0 − coverPad):
 *       ① strips centred at  x = coverPad + (k+0.5)·w  for ODD  k  (under gaps at u=0)
 *       ② strips centred at  x = coverPad + (k+0.5)·w  for EVEN k  (under bars at u=0)
 *   Shift the slider right by exactly one pitch (u = w) and every ② strip lands
 *   under a gap: the picture is now ② everywhere. travel = w.
 *
 * ── Registration = two hard mechanical stops (no "half-shown" rest) ───────────
 *   The slider carries a horizontal STOP-SLOT (length w + PIN_FOOT) in its lower
 *   margin, below the window. A fixed PIN (a tab on the lower guide, glued to the
 *   card) threads that slot. The slot bottoms on the pin at BOTH ends, so the
 *   only two rest positions are u = 0 (picture ①) and u = w (picture ②) — exactly
 *   one pitch apart, by construction. The child simply shoves the handle until it
 *   clicks against a stop; the picture can never rest half-①/half-② because there
 *   is no third detent. (Same "closed slot = inherent end stop" idiom as pullTab
 *   / risingSlide, here doing double duty as the pitch-perfect register.)
 *
 * ── The window is never empty (coverage proof) ───────────────────────────────
 *   The slider field must cover the whole window at BOTH stops and everywhere in
 *   between. Window spans [X0, X0+W]. At u=0 the slider (width S_x) starts at
 *   X0 − coverPad. At u=w its left edge is X0 − coverPad + w; to still cover the
 *   window's LEFT edge we need X0 − coverPad + w ≤ X0, i.e.
 *       coverPad ≥ travel = w.
 *   We use  coverPad = w + SAFETY_PAD  (strictly greater), and
 *       S_x = W + travel + 2·coverPad = W + 3w + 2·SAFETY_PAD.
 *   So both window edges stay covered through the entire stroke — no peek-through
 *   of blank paper at any handle position.
 *
 * ── Physical stack (front → back) & retention ────────────────────────────────
 *   1. CARD FRONT: printed frame; window cut into a picket grille (gap slots).
 *   2. SLIDER sheet: the two interleaved pictures; a grip extends past the card's
 *      RIGHT edge (the "손잡이", labelled 밀기 ↔) so the child grabs it directly —
 *      no forward fold, the grip is coplanar behind the front and simply sticks
 *      out to the right, matching the reel's protruding pull-tab.
 *   3. TOP GUIDE + BOTTOM/STOP GUIDE: two strips glued to the card ABOVE and
 *      BELOW the slider's path (glue lands on the frame, never on the slider);
 *      each folds a lip over the slider edge to capture it in Z (pullTab guide
 *      idiom). The bottom guide additionally carries the fixed stop-PIN.
 *   The slider is thus trapped front-to-back (card front + guide lips) and
 *   laterally limited to a one-pitch stroke (stop-slot on the pin). A hard tug on
 *   the grip bottoms the sturdy stop-slot on the pin, not the thin grip neck.
 *
 * ── Flat-foldability ─────────────────────────────────────────────────────────
 *   N/A in the pop-up sense: the whole assembly stays in-plane (< 1 mm thick) at
 *   every handle position, so the folding card closes flat over it trivially. The
 *   only fold is the bottom-guide's small pin tab; there is no mountain/valley
 *   pair to collapse.
 *
 * ── Sizing (fits A4 AND Letter) ──────────────────────────────────────────────
 *   Front face: y ∈ [MARGIN, spineY], height faceH = card.height − MARGIN
 *   (A4 143.5, Letter 134.7 — Letter governs height). Usable width
 *   faceW = paper.width − 2·MARGIN (A4 200, Letter 205.9 — A4 governs width).
 *   Two clamps bound the window so nothing runs off the printable page on either
 *   size (resolver clamps against the CURRENT paperSize, so whichever size is
 *   requested is guaranteed to fit):
 *       width : W ≤ min(faceW − 2·FRAME_MIN,  whitespaceW − 2·OUTER_PAD − 3w
 *                        − 2·SAFETY_PAD − gripLen − 1)   (slider+grip fits below)
 *       height: winH ≤ min(faceH − TOP_RESERVE − STOP_ZONE − RET_GAP − STOP_BRIDGE_W
 *                            − SPINE_PAD,                  (front face; slider runs
 *                                                           STOP_ZONE below the window)
 *                          whitespaceH − whitespaceOverhead(L) − 1)
 *                                                         (slider+2 guides stack below)
 *   where whitespaceOverhead sums the slider margins, both guide bands, the two
 *   inter-part gaps and the stop-pin tab (single-sourced from LIMITS so the clamp
 *   and generate()'s placement never drift). cols is then floored to the largest
 *   ODD count with cols·w ≤ that width.
 *
 * @module generators/magicShutter
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
export const MAGIC_SHUTTER_LIMITS = {
  PAPER_THICKNESS: 0.3,
  CLEARANCE: 0.8,        // pin-slot width = thickness + clearance = 1.1 mm base
  PITCH_MIN: 3,          // grille column (bar/gap) width w — also the throw (mm)
  PITCH_MAX: 10,
  WIN_W_MIN: 40,
  WIN_W_MAX: 150,        // window width target (mm); also fit-clamped
  WIN_H_MIN: 30,
  WIN_H_MAX: 90,         // window height (mm); also fit-clamped
  GRIP_MIN: 16,
  GRIP_MAX: 40,          // exposed handle grip length past the card edge (mm)
  GRIP_H: 16,            // handle grip height (y) — child-grippable (≥ 5 mm floor)
  PIN_FOOT: 4,           // stop-pin footprint along the stop-slot (mm) → stops
  PIN_ACROSS: 8,         // stop-pin extent across the slot (y) (mm)
  MOUNT_LEN: 12,         // bottom-guide pin tab fold length — reaches up into the
                         // slider stop-slot from below the slider bottom (mm)
  FRAME_MIN: 10,         // min frame border L/R around the window (mm)
  TOP_RESERVE: 12,       // sheet top → window top (mm)
  SPINE_PAD: 8,          // stop band bottom → spine (mm)
  COVER_PAD_Y: 3,        // slider overhang above the window (mm)
  SAFETY_PAD: 3,         // coverPad = travel + this (guarantees coverPad > travel)
  STOP_ZONE: 14,         // slider's lower margin that houses the stop-slot (mm)
  RET_W: 6,              // guide strip width (y) (mm)
  RET_LIP: 3,            // guide fold-over lip (mm)
  GLUE_END: 6,           // guide glue span (mm, > 5 grip floor)
  LAT_CLEAR: 0.6,        // vertical play of slider in the guide channel (mm)
  RET_GAP: 3,            // gap between window/slider edge and a guide (mm)
  STOP_BRIDGE_W: 12,     // bottom stop-guide band height on the face (mm)
  OUTER_PAD: 4,          // whitespace outer pad (mm)
  COLS_MIN: 5,           // minimum grille columns (odd) → ≥ 2 see-through gaps
  // Whitespace (lower-half) vertical layout spacings — single-sourced so the
  // resolver's whiteHeightLimit clamp and generate()'s part placement agree.
  WS_TOP_OFF: 7,         // spine → slider top (mm)
  WS_GUIDE_GAP: 5,       // slider bottom → top guide (mm)
  WS_GUIDE_GAP2: 8,      // top guide → bottom stop guide (mm)
  ALPHA_NOTE: 'push',    // driven by a lateral handle push, not a card angle
};

/** Whitespace vertical overhead (everything stacked below the spine except the
 *  window height itself): slider top offset + slider margins + both guides +
 *  the two inter-part gaps + the stop-pin tab. Kept as a function of LIMITS so
 *  the height clamp tracks any spacing change. */
function whitespaceOverhead(L) {
  return (
    L.WS_TOP_OFF +
    (L.COVER_PAD_Y + L.STOP_ZONE) +        // sliderH − winH
    L.WS_GUIDE_GAP +
    (L.RET_W + L.RET_LIP) +                // top guide band
    L.WS_GUIDE_GAP2 +
    (L.RET_W + L.RET_LIP) +                // bottom guide band
    L.MOUNT_LEN                            // stop-pin tab
  );
}

/** NaN/garbage-safe numeric intake (?? only guards null/undefined). */
const numOr = (v, d) => (Number.isFinite(Number(v)) ? Number(v) : d);

/** Force an integer to the nearest ODD value ≤ it (keeps bars on both edges). */
function toOdd(n) {
  const i = Math.floor(n);
  return i % 2 === 0 ? i - 1 : i;
}

/**
 * @typedef {Object} MagicShutterGeometry
 * @property {'A4'|'LETTER'} paperSize
 * @property {number} spineY        - Spine y on the sheet (mm)
 * @property {number} faceW         - Printable front-face width (mm)
 * @property {number} faceH         - Printable front-face height from spine (mm)
 * @property {number} whitespaceH   - Lower-half free height (mm)
 * @property {number} pitch         - Grille column width w = bar = gap = travel (mm)
 * @property {number} travel        - Handle throw = one pitch = w (mm)
 * @property {number} cols          - Grille column count (odd)
 * @property {number} bars          - Opaque bar count = (cols+1)/2
 * @property {number} gaps          - See-through gap count = (cols−1)/2
 * @property {number} winW          - Window opening width = cols·w (mm)
 * @property {number} winH          - Window opening height (mm)
 * @property {number} windowX0      - Window left edge on the card front (mm)
 * @property {number} windowY0      - Window top edge on the card front (mm)
 * @property {number} windowCx      - Window centre x (mm)
 * @property {number} windowCy      - Window centre y (mm)
 * @property {number} coverPad      - Slider x-overhang each side of window (mm)
 * @property {number} coverPadY     - Slider y-overhang above the window (mm)
 * @property {number} sliderW       - Slider field width S_x (mm)
 * @property {number} sliderH       - Slider field height S_y (mm)
 * @property {number} sliderRestX   - Slider left edge x when showing ① (u=0) (mm)
 * @property {number} gripLen       - Exposed grip length past the card edge (mm)
 * @property {number} gripH         - Grip height (mm)
 * @property {number} stopSlotLen   - Stop-slot length = w + PIN_FOOT (mm)
 * @property {number} stopSlotH     - Stop-slot height = PIN_ACROSS + LAT_CLEAR (mm)
 * @property {number} stopSlotCx    - Stop-slot centre x, slider-local (mm)
 * @property {number} stopZoneCy    - Stop-slot centre y, slider-local (mm)
 * @property {number} channelH      - Guide channel height = sliderH + LAT_CLEAR (mm)
 * @property {number} guideLen      - Guide strip length in x (mm)
 * @property {number[]} restOffsets - Handle offsets of the two register stops [0, w]
 */

/**
 * Resolve + clamp magic-shutter geometry against the printable card face.
 * Pure numbers only (no DOM) so it can be bounds/probe tested headlessly and is
 * safe for the extreme probes (9999 / 0 / NaN / undefined) paramSchemas.js uses.
 *
 * @param {{ paperSize?:'A4'|'LETTER', windowWidth?:number, windowHeight?:number,
 *           pitch?:number, grip?:number }} [opts]
 * @returns {MagicShutterGeometry}
 */
export function resolveMagicShutter(opts = {}) {
  const L = MAGIC_SHUTTER_LIMITS;
  const paper = PAPER_SIZES[opts.paperSize] || PAPER_SIZES.A4;
  const card = CARD_SIZES[opts.paperSize] || CARD_SIZES.A4;
  const paperSize = CARD_SIZES[opts.paperSize] ? opts.paperSize : 'A4';

  const spineY = paper.height / 2;
  const faceW = paper.width - 2 * PRINT.MARGIN;
  const faceH = card.height - PRINT.MARGIN;                 // spine-side to top
  const whitespaceW = paper.width - 2 * PRINT.MARGIN;
  const whitespaceH = paper.height - spineY - PRINT.MARGIN;

  // ── User params (all clamped, NaN-safe) ─────────────────────────────────────
  const w = clamp(numOr(opts.pitch, 6), L.PITCH_MIN, L.PITCH_MAX);
  const gripLen = clamp(numOr(opts.grip, 24), L.GRIP_MIN, L.GRIP_MAX);
  const travel = w;
  const coverPad = w + L.SAFETY_PAD;                        // > travel (coverage proof)

  // ── Window WIDTH → odd column count ─────────────────────────────────────────
  const winWtarget = clamp(numOr(opts.windowWidth, 96), L.WIN_W_MIN, L.WIN_W_MAX);
  const frontWidthLimit = faceW - 2 * L.FRAME_MIN;
  // whitespace must hold: OUTER + S_x + gripLen + OUTER, with S_x = W + 3w + 2·SAFETY.
  const whiteWidthLimit =
    whitespaceW - 2 * L.OUTER_PAD - (3 * w + 2 * L.SAFETY_PAD) - gripLen - 1;
  const wCap = Math.max(L.COLS_MIN * w, Math.min(winWtarget, frontWidthLimit, whiteWidthLimit));
  let cols = toOdd(Math.round(winWtarget / w));
  cols = Math.max(L.COLS_MIN, cols);
  while (cols > L.COLS_MIN && cols * w > wCap) cols -= 2;   // shrink to fit (stay odd)
  const winW = round(cols * w, 2);
  const gaps = (cols - 1) / 2;
  const bars = (cols + 1) / 2;

  // ── Window HEIGHT ───────────────────────────────────────────────────────────
  const winHtarget = clamp(numOr(opts.windowHeight, 60), L.WIN_H_MIN, L.WIN_H_MAX);
  // Front face must reserve: top guide band (within TOP_RESERVE) + window + the
  // slider's below-window STOP_ZONE extent + gap + bottom guide band + spine pad.
  const frontHeightLimit =
    faceH - L.TOP_RESERVE - L.STOP_ZONE - L.RET_GAP - L.STOP_BRIDGE_W - L.SPINE_PAD;
  const whiteHeightLimit = whitespaceH - whitespaceOverhead(L) - 1;
  const winH = clamp(
    winHtarget,
    L.WIN_H_MIN,
    Math.max(L.WIN_H_MIN, Math.min(L.WIN_H_MAX, frontHeightLimit, whiteHeightLimit)),
  );

  // ── Front-face placement ────────────────────────────────────────────────────
  // Window is RIGHT-biased (right frame border = FRAME_MIN) so that, in assembly,
  // the slider's grip pokes out past the card's right edge — the reel's signature
  // protruding "Pull" handle. Left frame border ≥ FRAME_MIN for every clamped winW
  // (proof: winW ≤ faceW − 2·FRAME_MIN ⇒ windowX0 ≥ MARGIN + FRAME_MIN).
  const windowX0 = round(paper.width - PRINT.MARGIN - L.FRAME_MIN - (cols * w), 2);
  const windowY0 = round(PRINT.MARGIN + L.TOP_RESERVE, 2);
  const windowCx = round(windowX0 + winW / 2, 2);
  const windowCy = round(windowY0 + winH / 2, 2);

  // ── Slider field ────────────────────────────────────────────────────────────
  const sliderW = round(winW + travel + 2 * coverPad, 2); // = W + 3w + 2·SAFETY
  const sliderH = round(L.COVER_PAD_Y + winH + L.STOP_ZONE, 2);
  const sliderRestX = round(windowX0 - coverPad, 2);       // slider left @ u=0 (shows ①)

  // Stop-slot (slider-local coords: origin at slider top-left).
  const stopSlotLen = round(travel + L.PIN_FOOT, 2);
  const stopSlotH = round(L.PIN_ACROSS + L.LAT_CLEAR, 2);
  const stopSlotCx = round(coverPad + winW / 2, 2);        // aligned to window centre
  const stopZoneCy = round(L.COVER_PAD_Y + winH + L.STOP_ZONE / 2, 2);

  const channelH = round(sliderH + L.LAT_CLEAR, 2);
  const guideLen = round(sliderW + travel + 2 * L.GLUE_END, 2);

  return {
    paperSize,
    spineY: round(spineY, 2),
    faceW: round(faceW, 2),
    faceH: round(faceH, 2),
    whitespaceH: round(whitespaceH, 2),
    pitch: round(w, 2),
    travel: round(travel, 2),
    cols,
    bars,
    gaps,
    winW,
    winH: round(winH, 2),
    windowX0,
    windowY0,
    windowCx,
    windowCy,
    coverPad: round(coverPad, 2),
    coverPadY: L.COVER_PAD_Y,
    sliderW,
    sliderH,
    sliderRestX,
    gripLen: round(gripLen, 2),
    gripH: L.GRIP_H,
    stopSlotLen,
    stopSlotH,
    stopSlotCx,
    stopZoneCy,
    channelH,
    guideLen,
    restOffsets: [0, round(travel, 2)],
  };
}

/**
 * Draw the front-face picket-grille window: the frame outline, the see-through
 * GAP slots (cut), and the placement guides for the two back guides.
 */
function drawFrontWindow(g, geo, isColor) {
  const L = MAGIC_SHUTTER_LIMITS;
  const CUT = getLineStyle('CUT', isColor);
  const SCORE = getLineStyle('SCORE', isColor);
  const { windowX0, windowY0, winW, winH, pitch, cols } = geo;

  // Decorative frame border (score guide, clamped inside the trim).
  const fb = L.FRAME_MIN;
  const fx = round(Math.max(PRINT.MARGIN, windowX0 - fb));
  const fy = round(Math.max(PRINT.MARGIN, windowY0 - fb));
  const fr = round(Math.min(PAPER_SIZES[geo.paperSize].width - PRINT.MARGIN, windowX0 + winW + fb));
  const fbBot = round(windowY0 + winH + fb);
  addRect(g, fx, fy, round(fr - fx), round(fbBot - fy), SCORE);

  // Picket grille: cut the GAP columns (odd indices); BARS (even) stay joined to
  // the frame top & bottom. Slots are strictly inside the frame, so every bar is
  // anchored at both ends and the grille cannot come apart.
  for (let k = 1; k < cols; k += 2) {
    const gx = round(windowX0 + k * pitch);
    addRect(g, gx, round(windowY0), round(pitch), round(winH), CUT);
  }

  // Back-guide placement guides (score targets). The slider (behind the front)
  // extends coverPadY above the window and STOP_ZONE below it, so the guides glue
  // to the FRAME just above the slider's top edge and just below its bottom edge —
  // never onto the slider itself.
  const guideL = round(geo.sliderRestX - L.GLUE_END);
  const guideW = geo.guideLen;
  const sliderTopFront = round(windowY0 - geo.coverPadY);
  const sliderBotFront = round(windowY0 + winH + L.STOP_ZONE);   // = sliderTop + sliderH
  const topGuideY = round(sliderTopFront - L.RET_GAP - L.RET_W);
  const botGuideY = round(sliderBotFront + L.RET_GAP);
  const clampX = (x) => clamp(x, PRINT.MARGIN, PAPER_SIZES[geo.paperSize].width - PRINT.MARGIN);
  const gl = clampX(guideL);
  const gr = clampX(guideL + guideW);
  addRect(g, gl, round(Math.max(PRINT.MARGIN, topGuideY)), round(gr - gl), L.RET_W, SCORE);
  addRect(g, gl, botGuideY, round(gr - gl), L.STOP_BRIDGE_W, SCORE);
  addText(g, round((gl + gr) / 2), round(botGuideY + L.STOP_BRIDGE_W / 2 + 0.7),
    '아래 안내·멈춤 다리 자리 (양 끝만 풀칠 · 핀=멈춤)', 1.9, 'middle');
}

/**
 * Draw the loose SLIDER piece: body + ①/② strip zones + lower stop-slot + the
 * grip that sticks out past the card's right edge.
 */
function drawSliderPiece(g, ox, oy, geo, isColor) {
  const L = MAGIC_SHUTTER_LIMITS;
  const CUT = getLineStyle('CUT', isColor);
  const SCORE = getLineStyle('SCORE', isColor);
  const { sliderW, sliderH, gripLen, gripH, pitch, cols, coverPad, winH, coverPadY } = geo;

  // Single outline: body + right-side grip bump.
  const gy0 = round(oy + sliderH / 2 - gripH / 2);
  const outline =
    `M ${round(ox)} ${round(oy)} ` +
    `L ${round(ox + sliderW)} ${round(oy)} ` +
    `L ${round(ox + sliderW)} ${gy0} ` +
    `L ${round(ox + sliderW + gripLen)} ${gy0} ` +
    `L ${round(ox + sliderW + gripLen)} ${round(gy0 + gripH)} ` +
    `L ${round(ox + sliderW)} ${round(gy0 + gripH)} ` +
    `L ${round(ox + sliderW)} ${round(oy + sliderH)} ` +
    `L ${round(ox)} ${round(oy + sliderH)} Z`;
  addPath(g, outline, CUT);

  // ①/② strip dividers over the window-visible band, labelled.
  const bandTop = round(oy + coverPadY);
  const bandBot = round(oy + coverPadY + winH);
  for (let k = 0; k <= cols; k += 1) {
    const sx = round(ox + coverPad + k * pitch);
    addPath(g, `M ${sx} ${bandTop} L ${sx} ${bandBot}`, SCORE);
  }
  // Label one ① strip (odd k, under a gap at rest) and one ② strip (even k).
  const midOdd = Math.max(1, cols - 2 - ((cols - 2) % 2 === 0 ? 0 : 1));  // an odd index
  const oddK = (midOdd % 2 === 1) ? midOdd : midOdd - 1;
  const evenK = oddK + 1;
  addText(g, round(ox + coverPad + (oddK + 0.5) * pitch), round((bandTop + bandBot) / 2), '①', 3, 'middle');
  addText(g, round(ox + coverPad + (evenK + 0.5) * pitch), round((bandTop + bandBot) / 2), '②', 3, 'middle');

  // Lower STOP-SLOT (cut) — the fixed pin threads this; both ends = the two
  // register stops (u=0 → ①, u=w → ②).
  const slL = round(ox + geo.stopSlotCx - geo.stopSlotLen / 2);
  const slT = round(oy + geo.stopZoneCy - geo.stopSlotH / 2);
  addRect(g, slL, slT, round(geo.stopSlotLen), round(geo.stopSlotH), CUT);

  // Grip label (rides on the grip; hidden behind nothing — it's a free tab, so a
  // label here does NOT print on the finished card face).
  addText(g, round(ox + sliderW + gripLen / 2), round(gy0 + gripH / 2 + 0.9), '밀기 ↔ (손잡이)', 2.2, 'middle');
}

/**
 * Draw a pullTab-style top guide: a strip whose upper half glues to the frame
 * above the slider and whose lower LIP folds over the slider's top edge.
 */
function drawTopGuide(g, ox, oy, geo, isColor) {
  const L = MAGIC_SHUTTER_LIMITS;
  const CUT = getLineStyle('CUT', isColor);
  const GLUE = getLineStyle('GLUE_TAB', isColor);
  const MOUNT = getLineStyle('MOUNTAIN_FOLD', isColor);

  const w = geo.guideLen;
  const h = round(L.RET_W + L.RET_LIP);
  addRect(g, ox, oy, w, h, CUT);
  // Glue face = the RET_W band that lands on the card (NOT on the slider).
  addRect(g, round(ox + 1), round(oy + 1), round(w - 2), round(L.RET_W - 2), GLUE);
  // Fold line between glue band and the fold-over lip.
  addPath(g, `M ${ox} ${round(oy + L.RET_W)} L ${round(ox + w)} ${round(oy + L.RET_W)}`, MOUNT);
  addText(g, round(ox + w / 2), round(oy - 1.5), '위 안내 다리 (윗면만 풀칠 · 립은 슬라이더에 안 붙임)', 1.9, 'middle');
}

/**
 * Draw the bottom guide + fixed stop-PIN: glue band on the frame below the
 * slider, a fold-over lip, and a small PIN tab that threads the slider stop-slot.
 */
function drawBottomStopGuide(g, ox, oy, geo, isColor) {
  const L = MAGIC_SHUTTER_LIMITS;
  const CUT = getLineStyle('CUT', isColor);
  const GLUE = getLineStyle('GLUE_TAB', isColor);
  const MOUNT = getLineStyle('MOUNTAIN_FOLD', isColor);

  const w = geo.guideLen;
  const h = round(L.RET_W + L.RET_LIP);
  addRect(g, ox, oy, w, h, CUT);
  addRect(g, round(ox + 1), round(oy + L.RET_LIP + 1), round(w - 2), round(L.RET_W - 2), GLUE);
  addPath(g, `M ${ox} ${round(oy + L.RET_LIP)} L ${round(ox + w)} ${round(oy + L.RET_LIP)}`, MOUNT);

  // Fixed stop-PIN at centre: a small tab that folds up/forward into the slider
  // stop-slot. Its footprint (PIN_FOOT wide) sets the two hard register stops.
  const pinW = round(L.PIN_FOOT);
  const pinCx = round(ox + w / 2);
  const pinTop = round(oy + h);
  addRect(g, round(pinCx - pinW / 2), pinTop, pinW, round(L.MOUNT_LEN), CUT);
  addPath(g, `M ${round(pinCx - pinW / 2)} ${pinTop} L ${round(pinCx + pinW / 2)} ${pinTop}`, MOUNT);
  addText(g, round(ox + w / 2), round(oy - 1.5), '아래 안내·멈춤 다리 (아랫면만 풀칠 · 핀=멈춤)', 1.9, 'middle');
  addText(g, pinCx, round(pinTop + L.MOUNT_LEN + 3), '멈춤 핀 → 슬라이더 슬롯에 끼움', 1.9, 'middle');
}

/**
 * Draw the magic-shutter flat pattern into a passed-in SVG/group.
 *
 * Upper half = card FRONT (picket-grille window + guide placement targets).
 * Lower half = whitespace: loose slider + top guide + bottom stop-guide.
 *
 * @param {SVGElement} svg - Target element (a content group from createTemplate)
 * @param {Object} [options]
 * @param {'A4'|'LETTER'} [options.paperSize='A4']
 * @param {number} [options.windowWidth=96]
 * @param {number} [options.windowHeight=60]
 * @param {number} [options.pitch=6]
 * @param {number} [options.grip=24]
 * @param {boolean} [options.isColor=true]
 * @returns {SVGGElement}
 */
export const generateMagicShutter = (svg, options = {}) => {
  const { isColor = true } = options;
  const L = MAGIC_SHUTTER_LIMITS;
  const geo = resolveMagicShutter(options);
  const paper = PAPER_SIZES[geo.paperSize];

  const g = addGroup(svg, 'magic-shutter-group');

  // ── FRONT FACE (upper half): picket-grille window + guide targets ───────────
  drawFrontWindow(g, geo, isColor);

  // One-line summary in the outer waste margin (no free text inside the trim —
  // the upper half IS the card front).
  addText(
    g,
    round(paper.width / 2),
    PRINT.MARGIN - 1.5,
    `매직 셔터 — 창문 ${geo.winW}×${geo.winH}mm, 세로살 ${geo.cols}칸(살폭 ${geo.pitch}mm) · ` +
    `손잡이를 ${geo.travel}mm 밀면 그림 ①↔② 전환 · 뒷면에 슬라이더 + 위/아래 안내다리`,
    2.2,
    'middle',
  );

  // ── WHITESPACE (lower half): loose parts ────────────────────────────────────
  // Vertical placement uses the same WS_* spacings the resolver's whiteHeightLimit
  // budgets against, so every part sits inside the trim on A4 AND Letter for any
  // clamped param set (verified by the boundary probe).
  const ox = round(PRINT.MARGIN + L.OUTER_PAD);
  const sliderY = round(geo.spineY + L.WS_TOP_OFF);
  drawSliderPiece(g, ox, sliderY, geo, isColor);

  const topGuideY = round(sliderY + geo.sliderH + L.WS_GUIDE_GAP);
  const botGuideY = round(topGuideY + (L.RET_W + L.RET_LIP) + L.WS_GUIDE_GAP2);
  drawTopGuide(g, ox, topGuideY, geo, isColor);
  drawBottomStopGuide(g, ox, botGuideY, geo, isColor);

  return g;
};

/**
 * Render the magic-shutter onto a complete printable SVG template (page + spine).
 * @param {Object} [params={}]
 * @param {'A4'|'LETTER'} [params.paperSize='A4']
 * @param {'color'|'bw'} [params.colorMode='color']
 * @param {number} [params.windowWidth=96]
 * @param {number} [params.windowHeight=60]
 * @param {number} [params.pitch=6]
 * @param {number} [params.grip=24]
 * @returns {{ svg: SVGSVGElement, geometry: MagicShutterGeometry }}
 */
export function renderMagicShutter(params = {}) {
  const { paperSize = 'A4', colorMode = 'color', ...opts } = params;
  const { svg, contentGroup } = createTemplate(paperSize, colorMode);
  const geometry = resolveMagicShutter({ paperSize, ...opts });
  generateMagicShutter(contentGroup, {
    paperSize,
    ...opts,
    isColor: colorMode !== 'bw',
  });
  return { svg, geometry };
}
