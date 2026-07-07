/**
 * @fileoverview Gate-curtain ("게이트폴드 커튼 카드") mechanism generator.
 *
 * A GATE-FOLD card. One flat cut-out = a central BACK PANEL (width panelW) with a
 * LEFT DOOR and RIGHT DOOR, each half the panel width (doorW = panelW/2), hinged
 * at the panel's left/right edges by two VERTICAL valley folds. The doors fold
 * inward over the panel; their free edges meet at the vertical centre when closed.
 * A character (Jesus / bunny / …) is glued flat at panel centre. TWO yellow
 * "bowtie" CURTAINS lie on the panel over the character; opening BOTH doors drags
 * the curtains outward, uncovering a diamond window around the character.
 *
 * ────────────────────────────────────────────────────────────────────────────
 *  THE DRIVE — a strap slider-crank with a VERTICAL hinge axis
 * ────────────────────────────────────────────────────────────────────────────
 *  Consider the RIGHT door only (the left is a mirror). Put the right hinge on a
 *  VERTICAL axis at global x = cX + doorW. Take a HORIZONTAL cross-section (top
 *  view) at any height y; write points as (ξ, z) where ξ = signed horizontal
 *  distance from the hinge measured toward the panel centre (leftward, +) and
 *  z = height off the panel plane.
 *
 *    • BACK PANEL is fixed in the table plane, z = 0.
 *    • DOOR is hinged at the vertical axis and makes dihedral α with the panel.
 *      A PIVOT point on the door at distance d from the hinge sits at
 *          P = (d·cos α, d·sin α).
 *      α = 0  → door folded flat ONTO the panel (closed), P = ( d, 0).
 *      α = 180→ door coplanar, folded away (open),        P = (−d, 0).
 *    • A creased STRAP of length L joins P to the curtain attach point
 *      S = (s, 0), which is constrained to slide in a HORIZONTAL channel on the
 *      panel (the frame's top+bottom rails). One length constraint |P − S| = L,
 *      with the pivot column and the slider on the SAME vertical cross-section
 *      (offset e = 0), gives an in-line slider-crank:
 *
 *          s(α) = d·cos α + √(L² − d²·sin²α)        (identical form to autoSlideWindow)
 *
 *  Monotonicity:  ds/dα = −d·sinα·[ 1 + d·cosα / √(L² − d²·sin²α) ], which stays
 *  strictly one-signed on (0°,180°) **iff L > d**. We force L = doorW − d − GAP
 *  and clamp d ≤ (doorW − GAP − L_MIN_OVER_D)/2, so L ≥ d + L_MIN_OVER_D > d —
 *  monotonic, no dead point, over the whole 0°..180° travel.
 *
 *  WHY THIS IS A CLEAN PAPER MECHANISM (candidate (b), chosen): the door pivot
 *  column and the curtain-attach column are the SAME vertical cross-section
 *  (e = 0). Rotation of the door about the VERTICAL hinge preserves every point's
 *  y-coordinate, so P, S and the strap all live in one horizontal plane across the
 *  strap's whole height — a PRISMATIC EXTRUSION of a planar slider-crank. Both
 *  strap creases (at P and at S) are lines PARALLEL TO THE HINGE, i.e. VERTICAL,
 *  so they hinge as clean paper folds with zero twist. The strap is bidirectional
 *  (pushes the curtain out on open, pulls it back on close), so the curtain
 *  self-retracts and the card self-covers when shut.
 *
 *  REJECTED candidates:
 *    (a) Curtain glued directly to the door near the hinge: at intermediate α the
 *        glued strip is lifted out of the panel plane by z = d·sinα (up to d≈16mm)
 *        — the curtain would tent up and NOT stay flat on the panel. Fails.
 *    (c) Curtain hinged to the door's free edge (fold-back flap): the curtain
 *        would swing up with the door, not translate flat across the panel — no
 *        horizontal reveal, and it stands vertical at α=90°. Fails.
 *  Only (b) keeps the curtain flat AND translating; committed.
 *
 * ────────────────────────────────────────────────────────────────────────────
 *  TRAVEL, THE BOWTIE CURTAIN, AND THE DIAMOND REVEAL
 * ────────────────────────────────────────────────────────────────────────────
 *  Travel of S from closed to open:  s(0) − s(180) = (d+L) − (L−d) = 2d.
 *  The curtain rigidly translates with S. Global x of S = (cX + doorW) − s(α):
 *      closed:  cX + doorW − (d+L) = cX + GAP           (S stays GAP right of centre)
 *      open  :  cX + doorW − (L−d) = cX + 2d + GAP.
 *  Each curtain's inner edge is a rightward chevron (a "‹"): FULL width at top and
 *  bottom (tips reach the centreline) and pinched to width wMin at mid-height,
 *  notch depth = revealW/2. The two mirrored chevrons frame a rhombus opening of
 *  horizontal diagonal revealW (at mid-height) and vertical diagonal ≈ Hc.
 *
 *  Reveal bookkeeping — let revealHalf(α) = (doorW − s(α)) − wMin be the distance
 *  from centre to the right curtain's inner-mid edge:
 *      wMin := doorW − s(ALPHA_REVEAL) − revealW/2      (sizing choice)
 *   ⇒ revealHalf(ALPHA_REVEAL=150°) = revealW/2  → diamond FULLY open by 150°.
 *      revealHalf(0°) = GAP − wMin < 0                  → curtains OVERLAP centre
 *                                                          when closed (character
 *                                                          fully covered).
 *  So the character is hidden at α=0 and fully framed by α≥150° (verified numeric
 *  values in the design report). revealW is clamped so wMin ≥ WMIN_FLOOR (the
 *  pinch never becomes a paper sliver).
 *
 * ────────────────────────────────────────────────────────────────────────────
 *  THE FRAME IS THE RETAINER (honest mechanics)
 * ────────────────────────────────────────────────────────────────────────────
 *  The user calls the frame "decorative", but paper NEEDS a retainer: without one
 *  the strap's vertical pull component (up to d·sinα) would peel the curtain off
 *  the panel. The decorative arch frame doubles as that retainer. Because the
 *  curtains travel HORIZONTALLY, the open sides of the channel must be LEFT/RIGHT
 *  and the glued sides TOP/BOTTOM — the mirror of autoSlideWindow (whose strip
 *  travelled vertically, so it glued left/right). The frame is therefore glued to
 *  the panel along its TOP and BOTTOM rails ONLY; its left/right pillars stay
 *  unglued so the curtains slide out under them. The two rails, spanning the full
 *  panel height, form a rotation-resisting couple that also stops the curtain from
 *  racking. Curtain height Hc = channel + 2·TUCK so each curtain stays tucked
 *  under both rails across its whole travel.
 *
 * ────────────────────────────────────────────────────────────────────────────
 *  FLAT-FOLDABILITY & LAYER STACK
 * ────────────────────────────────────────────────────────────────────────────
 *  • Both door hinges are single VALLEY folds (printed inside faces meet on close);
 *    a plain gate fold is trivially flat-foldable — each door collapses onto the
 *    panel independently, free edges abutting at centre.
 *  • Each strap: closed (α=0) it lies FLAT on the panel spanning ξ∈[d, d+L]
 *    (length L, z=0); open (α=180) it lies flat spanning ξ∈[−d, L−d]. Between, it
 *    tents to peak z = d·sinα ≤ d. Its door-end crease (mountain) is matched by its
 *    curtain-end crease (valley) → collapses flat at both limits. Real pop-up: ✓.
 *  • Closed layer stack at centre: panel + curtain₁ + curtain₂ + frame = 4 paper
 *    layers (~0.8 mm at 0.2 mm stock); the two door leaves abut (not overlap) at
 *    centre adding 1 leaf (~1.0 mm total). Tolerance: keep the stack < 1.5 mm — a
 *    gate card is not glued shut, so ≤1.0 mm closes cleanly with slight puffiness.
 *    Straps sit near the hinges (panel+curtain+strap+frame-rail ≈ 4 layers), also
 *    < 1.5 mm and clear of the abutting door edges at centre.
 *
 * ────────────────────────────────────────────────────────────────────────────
 *  PAGE LAYOUT — ONE SHEET, fits A4 AND Letter (binding size governs each axis)
 * ────────────────────────────────────────────────────────────────────────────
 *  Width  (A4 governs, 210 < 215.9): unfolded card = 2·panelW, centred. Clamp
 *         panelW ≤ (paperW − 2·MARGIN)/2 ⇒ ≤ 100 on A4 ⇒ 2·panelW ≤ 200 ≤ usable.
 *         Loose row-1 (2 curtains + frame) width = 2·Wc + frameW + 2·CURTAIN_GAP
 *         ≤ 200 by construction.
 *  Height (Letter governs, 279.4 < 297): the sheet carries, top→bottom,
 *         title(6) + card(panelH) + gap + row1(max(Hc,frameH)=frameH=panelH−12) +
 *         gap + row2(stones+straps = STONE_H) + margins. Total = 2·panelH + K.
 *         Clamp panelH ≤ (paperH − 2·MARGIN − belowReserve)/2 so the whole column
 *         fits with a SAFETY pad on BOTH papers. Garbage params clamp, never throw.
 *
 *  NOTE ON PAGE BUILDER: createTemplate() draws a HORIZONTAL spine valley at
 *  paper.height/2 — WRONG for a gate card (its folds are two VERTICAL lines and it
 *  is NOT folded in half through the middle). This generator therefore builds its
 *  own page with createSVG + its own trim rect + its own two vertical valley
 *  folds, and does not call createTemplate.
 *
 * @module generators/gateCurtain
 */

import { PAPER_SIZES, PRINT } from './constants.js';
import { clamp, round, degToRad } from '../utils/math.js';
import {
  createSVG,
  addPath,
  addRect,
  addText,
  addGroup,
  getLineStyle,
} from './svgBuilder.js';

/** Fixed design limits / clamps (see file header for the derivations). */
export const GATE_CURTAIN_LIMITS = {
  PANEL_W_MIN: 70,
  PANEL_W_MAX: 100,      // 2·panelW ≤ 200 fits A4 width (governs)
  PANEL_ASPECT: 1.15,    // default panelH = panelW·aspect (then page-clamped)
  PANEL_H_MIN: 80,
  PANEL_H_MAX: 130,
  D_MIN: 8,              // min hinge offset d (mm)
  GAP: 3,               // closed strap-attach offset from centre (mm)
  L_MIN_OVER_D: 6,      // strap length floor above d → guarantees L > d (monotonic)
  DOOR_EDGE_PAD: 6,     // keep the door pivot ≥ this from the door free edge (mm)
  REVEAL_W_MIN: 24,     // min diamond window width (mm)
  WMIN_FLOOR: 8,        // min curtain pinch width at mid-height (mm)
  ALPHA_REVEAL: 150,    // door angle at which the diamond is fully open (deg)
  ALPHA_MIN_OP: 20,     // stated practical operating range (deg)
  ALPHA_MAX_OP: 175,
  FRAME_V_MARGIN: 6,    // frame inset from panel top/bottom edges (mm)
  FRAME_BORDER: 8,      // frame top/bottom rail height, GLUED to panel (mm, >5 grip)
  FRAME_SIDE: 12,       // frame pillar width, unglued (mm)
  TUCK: 4,              // curtain overlap tucked under each rail (mm)
  STRAP_W: 12,          // strap width (mm)
  GLUE_END: 6,          // strap / curtain glue-end length (mm, > 5 grip floor)
  STONE_W: 30,          // door-stone decoration width (mm)
  STONE_H: 40,          // door-stone decoration height (mm)
  ROW_GAP: 6,           // vertical gap between layout rows (mm)
  ROW_LEAD: 4,          // extra lead above each loose row for its piece top labels (mm)
  LABEL_PAD: 3,         // space under the last row for its caption text (mm)
  CURTAIN_GAP: 6,       // horizontal gap between loose pieces (mm)
  SAFETY: 4,            // extra bottom slack so the column never touches the edge (mm)
  TITLE_H: 6,           // title band above the card (mm)
};

/** NaN/garbage-safe numeric intake. */
const numOr = (v, d) => (Number.isFinite(Number(v)) ? Number(v) : d);

/**
 * In-line slider-crank position of the curtain attach point, measured from the
 * hinge toward the panel centre:  s(α) = d·cosα + √(L² − d²·sin²α).
 * @param {number} alphaDeg  Door opening angle (0=closed, 180=flat open)
 * @param {number} d  Hinge offset / half-travel (mm)
 * @param {number} L  Strap length (mm)
 * @returns {number} Attach distance from hinge (mm)
 */
export function sGate(alphaDeg, d, L) {
  const a = degToRad(alphaDeg);
  const under = L * L - d * d * Math.sin(a) * Math.sin(a);
  return d * Math.cos(a) + Math.sqrt(Math.max(0, under));
}

/**
 * Horizontal displacement of a curtain from its CLOSED position as the door
 * opens (0 at α=0, +2d at α=180). Right curtain moves +x, left curtain −x.
 * curtainOffset(α) = s(0) − s(α) = (d + L) − s(α).
 * @param {number} alphaDeg
 * @param {number} d
 * @param {number} L
 * @returns {number} Outward displacement magnitude (mm)
 */
export function curtainOffset(alphaDeg, d, L) {
  return d + L - sGate(alphaDeg, d, L);
}

/**
 * @typedef {Object} GateCurtainGeometry
 * @property {'A4'|'LETTER'} paperSize
 * @property {number} panelW    Back-panel width (mm)
 * @property {number} panelH    Back-panel height (mm)
 * @property {number} doorW     Door width = panelW/2 (mm)
 * @property {number} cardW     Unfolded card width = 2·panelW (mm)
 * @property {number} d         Hinge offset / half-travel (mm)
 * @property {number} L         Strap length (mm)
 * @property {number} travel    Full curtain travel 2d (mm)
 * @property {number} sClosed   s(0) (mm)
 * @property {number} sOpen     s(180) (mm)
 * @property {number} sReveal   s(ALPHA_REVEAL) (mm)
 * @property {number} revealW   Diamond window width (mm)
 * @property {number} revealH   Diamond window height (mm)
 * @property {number} wMin      Curtain pinch width at mid-height (mm)
 * @property {number} notchDepth Curtain chevron notch depth = revealW/2 (mm)
 * @property {number} Wc        Curtain full width (mm)
 * @property {number} Hc        Curtain height (mm)
 * @property {number} frameW    Frame outer width (mm)
 * @property {number} frameH    Frame outer height (mm)
 * @property {number} channel   Clear channel between frame rails (mm)
 * @property {number} closedOffset  Closed S offset right of centre = GAP (mm)
 * @property {number} openOffset    Open S offset right of centre = 2d+GAP (mm)
 */

/**
 * Resolve + clamp gate-curtain geometry against the printable sheet. Pure numbers
 * only (no DOM) so it can be bounds/monotonicity tested headlessly.
 *
 * @param {{ paperSize?:'A4'|'LETTER', panelWidth?:number, revealWidth?:number,
 *           hingeOffset?:number }} [opts]
 * @returns {GateCurtainGeometry}
 */
export function resolveGateCurtain(opts = {}) {
  const K = GATE_CURTAIN_LIMITS;
  const paper = PAPER_SIZES[opts.paperSize] ? PAPER_SIZES[opts.paperSize] : PAPER_SIZES.A4;
  const paperSize = PAPER_SIZES[opts.paperSize] ? opts.paperSize : 'A4';

  const usableW = paper.width - 2 * PRINT.MARGIN;

  // Panel width — unfolded card 2·panelW must fit the printable width.
  const panelW = clamp(
    numOr(opts.panelWidth, 90),
    K.PANEL_W_MIN,
    Math.min(K.PANEL_W_MAX, Math.floor(usableW / 2)),
  );
  const doorW = panelW / 2;

  // Hinge offset d — clamp so L = doorW − d − GAP ≥ d + L_MIN_OVER_D (monotonic)
  // and the door pivot stays off the door free edge.
  const dMax = Math.min((doorW - K.GAP - K.L_MIN_OVER_D) / 2, doorW - K.DOOR_EDGE_PAD);
  const d = clamp(numOr(opts.hingeOffset, 16), K.D_MIN, Math.max(K.D_MIN, dMax));
  const L = doorW - d - K.GAP;

  const sClosed = d + L;              // s(0)  = doorW − GAP
  const sOpen = L - d;                // s(180)
  const travel = 2 * d;
  const sReveal = sGate(K.ALPHA_REVEAL, d, L);

  // Reveal width — clamp so the curtain pinch wMin ≥ WMIN_FLOOR.
  const revMax = 2 * (doorW - sReveal - K.WMIN_FLOOR);
  const revealW = clamp(
    numOr(opts.revealWidth, 44),
    K.REVEAL_W_MIN,
    Math.max(K.REVEAL_W_MIN, revMax),
  );
  const wMin = doorW - sReveal - revealW / 2;   // pinch width (≥ WMIN_FLOOR)
  const notchDepth = revealW / 2;
  const Wc = wMin + notchDepth;                 // curtain full width

  // Panel height — page-height budget matching the exact generate() layout:
  //   maxY = 2·panelH + rowsC ,  rowsC = topMargin + title + 2·(ROW_GAP+ROW_LEAD)
  //          − 2·FRAME_V_MARGIN + STONE_H + LABEL_PAD   (row1 height = frameH = panelH−12)
  // require maxY ≤ paper.height − bottomMargin − SAFETY.
  const rowsC =
    PRINT.MARGIN + K.TITLE_H + 2 * (K.ROW_GAP + K.ROW_LEAD)
    - 2 * K.FRAME_V_MARGIN + K.STONE_H + K.LABEL_PAD;
  const panelHFit = (paper.height - PRINT.MARGIN - K.SAFETY - rowsC) / 2;
  const panelH = clamp(
    Math.round(panelW * K.PANEL_ASPECT),
    K.PANEL_H_MIN,
    Math.max(K.PANEL_H_MIN, Math.min(K.PANEL_H_MAX, panelHFit)),
  );

  const frameH = panelH - 2 * K.FRAME_V_MARGIN;
  const channel = frameH - 2 * K.FRAME_BORDER;
  const Hc = channel + 2 * K.TUCK;
  const frameW = revealW + 2 * K.FRAME_SIDE;
  const revealH = clamp(round(channel - 8), 20, Math.max(20, Hc - 8));

  return {
    paperSize,
    panelW: round(panelW, 2),
    panelH: round(panelH, 2),
    doorW: round(doorW, 2),
    cardW: round(2 * panelW, 2),
    d: round(d, 2),
    L: round(L, 2),
    travel: round(travel, 2),
    sClosed: round(sClosed, 2),
    sOpen: round(sOpen, 2),
    sReveal: round(sReveal, 2),
    revealW: round(revealW, 2),
    revealH: round(revealH, 2),
    wMin: round(wMin, 2),
    notchDepth: round(notchDepth, 2),
    Wc: round(Wc, 2),
    Hc: round(Hc, 2),
    frameW: round(frameW, 2),
    frameH: round(frameH, 2),
    channel: round(channel, 2),
    closedOffset: round(K.GAP, 2),
    openOffset: round(2 * d + K.GAP, 2),
  };
}

/** Rounded-rectangle helper as an SVG path "d". */
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
 * Draw one loose bowtie CURTAIN. Outer (hinge-side) edge is straight; inner edge
 * is a chevron pinched to wMin at mid-height (notch depth = revealW/2). The
 * strap-attach glue patch + vertical crease sit on the outer edge at mid-height.
 * @param {SVGElement} g
 * @param {number} ox left x of the piece bounding box
 * @param {number} oy top y
 * @param {GateCurtainGeometry} geo
 * @param {'L'|'R'} side  'R' = right curtain (outer edge on right)
 * @param {boolean} isColor
 */
function drawCurtainPiece(g, ox, oy, geo, side, isColor) {
  const K = GATE_CURTAIN_LIMITS;
  const CUT = getLineStyle('CUT', isColor);
  const GLUE = getLineStyle('GLUE_TAB', isColor);
  const VALLEY = getLineStyle('VALLEY_FOLD', isColor);

  const w = geo.Wc;
  const h = geo.Hc;
  const nd = geo.notchDepth;
  const midY = round(oy + h / 2);

  // Bowtie polygon. For 'R': outer edge = right (x=ox+w), chevron on the left,
  // its mid vertex pushed right by nd. 'L' is the mirror.
  let d;
  if (side === 'R') {
    d =
      `M ${round(ox)} ${round(oy)} ` +
      `L ${round(ox + w)} ${round(oy)} ` +
      `L ${round(ox + w)} ${round(oy + h)} ` +
      `L ${round(ox)} ${round(oy + h)} ` +
      `L ${round(ox + nd)} ${midY} Z`;
  } else {
    d =
      `M ${round(ox + w)} ${round(oy)} ` +
      `L ${round(ox)} ${round(oy)} ` +
      `L ${round(ox)} ${round(oy + h)} ` +
      `L ${round(ox + w)} ${round(oy + h)} ` +
      `L ${round(ox + w - nd)} ${midY} Z`;
  }
  addPath(g, d, CUT);

  // Strap-attach glue patch + vertical crease on the OUTER edge at mid-height.
  const gh = K.STRAP_W;
  const gwid = K.GLUE_END;
  const gy = round(midY - gh / 2);
  const gx = side === 'R' ? round(ox + w - gwid) : round(ox);
  addRect(g, gx, gy, gwid, gh, GLUE);
  const creaseX = side === 'R' ? round(ox + w - gwid) : round(ox + gwid);
  addPath(g, `M ${creaseX} ${gy} L ${creaseX} ${round(gy + gh)}`, VALLEY);

  const label = side === 'R' ? '오른쪽 커튼' : '왼쪽 커튼';
  addText(g, round(ox + w / 2), round(oy - 1.5), `${label} (노란색)`, 2.6, 'middle');
  addText(g, round(ox + w / 2), round(oy + h + 3.5), '④ 바깥 끝에 지지대 붙이기', 2.1, 'middle');
}

/**
 * Draw the loose FRAME overlay: a decorative arch with a diamond window cut out,
 * glued to the panel along its TOP and BOTTOM rails ONLY (left/right pillars stay
 * open so the curtains slide out horizontally underneath).
 */
function drawFramePiece(g, ox, oy, geo, isColor) {
  const K = GATE_CURTAIN_LIMITS;
  const CUT = getLineStyle('CUT', isColor);
  const GLUE = getLineStyle('GLUE_TAB', isColor);

  const w = geo.frameW;
  const h = geo.frameH;
  const b = K.FRAME_BORDER;

  addPath(g, roundRectPath(ox, oy, w, h, 6), CUT);

  // Diamond window (the reveal opening).
  const cx = round(ox + w / 2);
  const cy = round(oy + h / 2);
  const hw = geo.revealW / 2;
  const hh = geo.revealH / 2;
  addPath(
    g,
    `M ${cx} ${round(cy - hh)} L ${round(cx + hw)} ${cy} L ${cx} ${round(cy + hh)} L ${round(cx - hw)} ${cy} Z`,
    CUT,
  );

  // Glue TOP and BOTTOM rails only.
  addRect(g, round(ox + 1), round(oy + 1), round(w - 2), round(b - 2), GLUE);
  addRect(g, round(ox + 1), round(oy + h - b + 1), round(w - 2), round(b - 2), GLUE);

  addText(g, cx, round(oy - 1.5), '장식 액자(뒷면에 덮어 붙이기)', 2.5, 'middle');
  addText(g, cx, round(oy + h + 3.5), '위·아래만 풀칠 (좌·우는 열어두기)', 2.2, 'middle');
}

/**
 * Draw one loose STRAP: a bar of length L with a glue tab + vertical crease at
 * each end. One end → door pivot (mountain in use), other → curtain (valley).
 * Drawn horizontally; both creases are vertical (parallel to the hinge in use).
 */
function drawStrapPiece(g, ox, oy, geo, label, isColor) {
  const K = GATE_CURTAIN_LIMITS;
  const CUT = getLineStyle('CUT', isColor);
  const GLUE = getLineStyle('GLUE_TAB', isColor);
  const MOUNT = getLineStyle('MOUNTAIN_FOLD', isColor);

  const ge = K.GLUE_END;
  const total = geo.L + 2 * ge;   // body L + glue tab each end
  const h = K.STRAP_W;

  addRect(g, ox, oy, round(total), h, CUT);
  addRect(g, round(ox + 1), round(oy + 1), round(ge - 2), round(h - 2), GLUE);
  addRect(g, round(ox + total - ge + 1), round(oy + 1), round(ge - 2), round(h - 2), GLUE);
  addPath(g, `M ${round(ox + ge)} ${oy} L ${round(ox + ge)} ${round(oy + h)}`, MOUNT);
  addPath(g, `M ${round(ox + total - ge)} ${oy} L ${round(ox + total - ge)} ${round(oy + h)}`, MOUNT);

  addText(g, round(ox + total / 2), round(oy - 1.5), label, 2.3, 'middle');
  addText(g, round(ox + ge / 2), round(oy + h + 3), '문에', 2, 'middle');
  addText(g, round(ox + total - ge / 2), round(oy + h + 3), '커튼에', 2, 'middle');
  addText(g, round(ox + total / 2), round(oy + h / 2 + 1), `${geo.L}mm`, 2, 'middle');
}

/** Draw one loose door STONE decoration (optional, glued to the outer door face). */
function drawStonePiece(g, ox, oy, geo, isColor) {
  const K = GATE_CURTAIN_LIMITS;
  const CUT = getLineStyle('CUT', isColor);
  addPath(g, roundRectPath(ox, oy, K.STONE_W, K.STONE_H, 12), CUT);
  addText(g, round(ox + K.STONE_W / 2), round(oy + K.STONE_H / 2 + 1), '돌', 3, 'middle');
  addText(g, round(ox + K.STONE_W / 2), round(oy + K.STONE_H + 3), '문 바깥에(장식)', 2, 'middle');
}

/**
 * Draw the gate-curtain flat pattern into a passed-in SVG/group: the unfolded
 * gate card (with two vertical valley folds + placement guides on the panel) and
 * all loose pieces (2 curtains, frame, 2 straps, 2 stones) laid out below it.
 *
 * @param {SVGElement} svg Target element (the SVG root or a group)
 * @param {Object} [options]
 * @param {'A4'|'LETTER'} [options.paperSize='A4']
 * @param {number} [options.panelWidth=90]
 * @param {number} [options.revealWidth=44]
 * @param {number} [options.hingeOffset=16]
 * @param {boolean} [options.isColor=true]
 * @returns {SVGGElement}
 */
export const generateGateCurtain = (svg, options = {}) => {
  const { isColor = true } = options;
  const K = GATE_CURTAIN_LIMITS;
  const geo = resolveGateCurtain(options);
  const paper = PAPER_SIZES[geo.paperSize];

  const g = addGroup(svg, 'gate-curtain-group');
  const CUT = getLineStyle('CUT', isColor);
  const VALLEY = getLineStyle('VALLEY_FOLD', isColor);
  const GLUE = getLineStyle('GLUE_TAB', isColor);
  const SCORE = getLineStyle('SCORE', isColor);

  const { panelW, panelH, doorW, cardW, frameW, frameH, revealW, revealH } = geo;
  const cX = round(paper.width / 2);

  // Title.
  addText(g, cX, round(PRINT.MARGIN + 4), '커튼 문 카드 (문을 열면 커튼이 걷히는 카드)', 3, 'middle');

  // ── UNFOLDED GATE CARD (one cut-out, two vertical valley folds) ────────────
  const cardTop = round(PRINT.MARGIN + K.TITLE_H);
  const cardLeft = round(cX - panelW);
  const cardBot = round(cardTop + panelH);
  const hingeLx = round(cX - doorW);   // left hinge (panel left edge)
  const hingeRx = round(cX + doorW);   // right hinge (panel right edge)

  addRect(g, cardLeft, cardTop, cardW, panelH, CUT);                 // outline
  addPath(g, `M ${hingeLx} ${cardTop} L ${hingeLx} ${cardBot}`, VALLEY);  // left hinge
  addPath(g, `M ${hingeRx} ${cardTop} L ${hingeRx} ${cardBot}`, VALLEY);  // right hinge

  addText(g, round((cardLeft + hingeLx) / 2), round(cardTop + 4), '왼쪽 문', 2.6, 'middle');
  addText(g, cX, round(cardTop + 4), '가운데(뒷판) — 그림·커튼·액자를 이 면에', 2.4, 'middle');
  addText(g, round((hingeRx + cardLeft + cardW) / 2), round(cardTop + 4), '오른쪽 문', 2.6, 'middle');

  const pcY = round(cardTop + panelH / 2);

  // Character placement guide (centre of the panel, under the curtains).
  addRect(g, round(cX - revealW / 2), round(pcY - revealH / 2), round(revealW), round(revealH), SCORE);
  addText(g, cX, round(pcY + revealH / 2 + 3), '① 주인공 그림 붙이는 곳', 2.2, 'middle');

  // Frame rail glue guides (top + bottom rails land here; curtains slide between).
  const frTop = round(pcY - frameH / 2);
  const frBot = round(pcY + frameH / 2);
  addRect(g, round(cX - frameW / 2), frTop, round(frameW), K.FRAME_BORDER, SCORE);
  addRect(g, round(cX - frameW / 2), round(frBot - K.FRAME_BORDER), round(frameW), K.FRAME_BORDER, SCORE);
  addText(g, round(cX - frameW / 2 - 1), round(frTop + K.FRAME_BORDER / 2), '③ 액자 윗변 풀칠', 2, 'end');
  addText(g, round(cX - frameW / 2 - 1), round(frBot - K.FRAME_BORDER / 2), '③ 액자 아랫변 풀칠', 2, 'end');

  // Curtain travel band (where the two curtains sweep, dashed guide).
  addPath(g, `M ${round(cX - doorW + K.FRAME_BORDER)} ${round(pcY - geo.Hc / 2)} L ${round(cX + doorW - K.FRAME_BORDER)} ${round(pcY - geo.Hc / 2)}`, SCORE);
  addPath(g, `M ${round(cX - doorW + K.FRAME_BORDER)} ${round(pcY + geo.Hc / 2)} L ${round(cX + doorW - K.FRAME_BORDER)} ${round(pcY + geo.Hc / 2)}`, SCORE);

  // Strap→door attach points, on each door at distance d from its hinge, at pcY.
  const attachR = round(hingeRx + geo.d);
  const attachL = round(hingeLx - geo.d);
  for (const [ax, tag] of [[attachR, 'Ⓡ'], [attachL, 'Ⓛ']]) {
    addRect(g, round(ax - K.GLUE_END / 2), round(pcY - K.STRAP_W / 2), K.GLUE_END, K.STRAP_W, GLUE);
    addText(g, ax, round(pcY - K.STRAP_W / 2 - 1.5), `② ${tag} 지지대 붙이는 곳`, 2, 'middle');
  }

  // ── LOOSE PIECES ───────────────────────────────────────────────────────────
  // Row 1: left curtain, right curtain, frame.
  const row1Y = round(cardBot + K.ROW_GAP + K.ROW_LEAD);
  const row1W = 2 * geo.Wc + frameW + 2 * K.CURTAIN_GAP;
  let x = round(cX - row1W / 2);
  drawCurtainPiece(g, x, row1Y, geo, 'L', isColor);
  x = round(x + geo.Wc + K.CURTAIN_GAP);
  drawCurtainPiece(g, x, row1Y, geo, 'R', isColor);
  x = round(x + geo.Wc + K.CURTAIN_GAP);
  drawFramePiece(g, x, row1Y, geo, isColor);

  // Row 2: two straps + two stones.
  const row2Y = round(row1Y + Math.max(geo.Hc, frameH) + K.ROW_GAP + K.ROW_LEAD);
  const strapTotal = geo.L + 2 * K.GLUE_END;
  const row2W = 2 * strapTotal + 2 * K.STONE_W + 3 * K.CURTAIN_GAP;
  let x2 = round(cX - row2W / 2);
  drawStrapPiece(g, x2, round(row2Y + (K.STONE_H - K.STRAP_W) / 2), geo, '② 지지대 Ⓡ(오른쪽 문)', isColor);
  x2 = round(x2 + strapTotal + K.CURTAIN_GAP);
  drawStrapPiece(g, x2, round(row2Y + (K.STONE_H - K.STRAP_W) / 2), geo, '② 지지대 Ⓛ(왼쪽 문)', isColor);
  x2 = round(x2 + strapTotal + K.CURTAIN_GAP);
  drawStonePiece(g, x2, row2Y, geo, isColor);
  x2 = round(x2 + K.STONE_W + K.CURTAIN_GAP);
  drawStonePiece(g, x2, row2Y, geo, isColor);

  return g;
};

/**
 * Render the gate-curtain onto a complete printable SVG page. Builds its OWN page
 * (createSVG + trim rect + two vertical valley folds) — NOT createTemplate, whose
 * horizontal centre spine is wrong for a gate card.
 *
 * @param {Object} [params={}]
 * @param {'A4'|'LETTER'} [params.paperSize='A4']
 * @param {'color'|'bw'} [params.colorMode='color']
 * @param {number} [params.panelWidth=90]
 * @param {number} [params.revealWidth=44]
 * @param {number} [params.hingeOffset=16]
 * @returns {{ svg: SVGSVGElement, geometry: GateCurtainGeometry }}
 */
export function renderGateCurtain(params = {}) {
  const { paperSize = 'A4', colorMode = 'color', ...opts } = params;
  const geometry = resolveGateCurtain({ paperSize, ...opts });
  const paper = PAPER_SIZES[geometry.paperSize];
  const isColor = colorMode !== 'bw';

  const svg = createSVG(paper.width, paper.height);
  // Outer trim / cut guide at the safe margin (own page — no createTemplate).
  addRect(
    svg,
    PRINT.MARGIN,
    PRINT.MARGIN,
    paper.width - 2 * PRINT.MARGIN,
    paper.height - 2 * PRINT.MARGIN,
    getLineStyle('CUT', isColor),
  );
  const contentGroup = addGroup(svg, 'content');
  generateGateCurtain(contentGroup, { paperSize, ...opts, isColor });
  return { svg, geometry };
}
