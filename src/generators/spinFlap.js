/**
 * @fileoverview Spin-flap ("돌려 펼치는 꽃잎 / 숨은 글자 꽃") mechanism generator.
 *
 * A paper daisy whose ring of petals looks complete at rest, but ONE petal is
 * mounted on a free-spinning paper pivot at the flower's centre. Grab that one
 * petal's tip and twist it a full turn around the pivot; it swings away over an
 * adjacent fixed petal and UNCOVERS a short message printed on the background
 * disc beneath it ("좋아해… 좋아하지 않아…" style hidden text). Let it swing back
 * and the ring is whole again and the message hidden.
 *
 * This is a NEW mechanism, distinct from the three existing rotary/hinge ones:
 *   • volvelle  — a FULL disc spins behind a fixed window, rim-captured only,
 *                 NO pivot point, NO fastener; reveals sector art through a hole.
 *   • flip-disc — half-disc "pages" hinged on a straight diameter, TURNED like a
 *                 book; nothing rotates about a point.
 *   • slide-to-swing — a post on the SAME paper-rivet pivot used here, but a
 *                 slider + pin-in-slot Scotch-yoke CONSTRAINS it to a bounded ±35°
 *                 arc. Here there is NO slider, NO slot, NO linkage: the single
 *                 flap is grabbed directly and free to spin the full 360°, and its
 *                 job is reveal/hide of printed content, not oscillating motion.
 *
 * ────────────────────────────────────────────────────────────────────────────
 *  GEOMETRY (derive first, then draw)
 * ────────────────────────────────────────────────────────────────────────────
 *  Background disc radius R, centre O = (cx, cy). N total petals (default 6:
 *  5 fixed + 1 rotating), one per sector of width σ = 360°/N. Angles measured
 *  from the top (0° = up) clockwise, matching polarToCartesian(cx,cy,r,θ).
 *
 *  • Petal shape. A rounded leaf (lozenge) laid along a radial spoke, from an
 *    inner tip at rIn = 0.16·R to an outer tip at rOut = R − 2 mm, with a max
 *    half-width halfW at its mid radius rMid = (rIn+rOut)/2. To fill the sector
 *    with a small inter-petal gap g (= PETAL_GAP_DEG), the leaf's angular half
 *    at mid is (σ/2 − g), so
 *          halfW = rMid · tan(σ/2 − g).
 *    The leaf's local half-width at radius r follows a sine bulge
 *          w(r) = halfW · sin(π·t),   t = (r − rIn)/(rOut − rIn) ∈ [0,1],
 *    so its angular half-extent at radius r is  α(r) = atan(w(r)/r).
 *
 *  • Hidden-text band. The message lives in an annular sector in the ROTATING
 *    petal's rest sector (centred on 0°), radial band [rTin, rTout] =
 *    [0.30·R, 0.62·R] — deliberately the FAT MIDDLE of the leaf, not the thin
 *    tips. For the resting petal to fully cover it, the text half-angle must sit
 *    inside the leaf at every band radius, with a guard δ = TEXT_GUARD_DEG:
 *          θ_text/2 = min_{r∈[rTin,rTout]} α(r) − δ.
 *    (The binding radius is the OUTER band edge, where r is largest and w
 *    smallest.) So the text is covered at rest BY CONSTRUCTION; resolve() also
 *    clamps θ_text ≤ σ − 2δ so it can never bleed past its own sector.
 *
 *  • Reveal angle. Rotating the petal by θ brings its trailing edge to
 *    θ − α(r). The text is FULLY exposed once that clears the text's far edge at
 *    every band radius (worst = largest α, the INNER edge):
 *          θ_reveal ≥ max_r α(r) + θ_text/2 + REVEAL_GUARD_DEG  ( = minReveal ).
 *    The designed reveal is θ_reveal = clamp(max(minReveal+4, σ+12), minReveal,
 *    90°) — a bit past one whole sector, so the swung petal visibly overlaps the
 *    neighbouring fixed petal (the charm of the reference) while staying an easy
 *    finger-twist. Convention: θ = 0° is REST (petal covering the text); positive
 *    θ is clockwise, toward the +σ neighbour.
 *
 * ────────────────────────────────────────────────────────────────────────────
 *  PHYSICAL STACK & RETENTION (all-paper, no metal fasteners) — front → back
 * ────────────────────────────────────────────────────────────────────────────
 *      1. HUB (yellow flower centre)  — glued to the rotating petal's base on the
 *         FRONT; a centred circle, so spinning with the petal is invisible. It
 *         doubles as the decorative washer hiding the pivot fold.
 *      2. ROTATING PETAL             — on TOP of everything; sweeps over the
 *         fixed petals, so nothing above it can catch it.
 *      3. FIXED PETALS (×N−1)        — glued flat to the background disc.
 *      4. BACKGROUND DISC            — bears the printed hidden text + pivot hole.
 *      5. RETENTION CAP              — glued to the pivot neck BEHIND the disc.
 *
 *  • Pivot — the SAME paper rotary joint as slide-to-swing (a capture, not a
 *    crease; an in-plane crease fatigue-cracks). The rotating petal's base
 *    narrows to a PIVOT_TAB_W (5 mm) neck at the flower centre; the neck is
 *    valley-folded BACK through a round PIVOT_HOLE (Ø 7 mm) cut in the background
 *    disc, and a cap disc of radius PIVOT_CAP_R (6 mm > hole/2) glued to the neck
 *    behind the disc captures it. Neck (5) < hole (7) ⇒ the petal spins with
 *    1 mm of play; nothing creases in-plane, so nothing fatigues. Because the
 *    petal rides on TOP of the fixed petals and the only thing above it (the hub)
 *    turns WITH it, it spins freely — the sole clearance rule is neck < hole.
 *
 * ────────────────────────────────────────────────────────────────────────────
 *  FLAT-FOLDABILITY
 * ────────────────────────────────────────────────────────────────────────────
 *  Like slide-to-swing / volvelle, this mechanism NEVER leaves the card plane —
 *  the whole flower (hub + petal + fixed petals + disc + cap) is ~5 sheets
 *  ≈ 1.5 mm and stays flat at every rotation angle, so a folding card closes flat
 *  over it. The only fold — the pivot neck, valley-folded back through the hole —
 *  is captured by the cap and needs no collapsing mountain/valley pair. There is
 *  therefore no pop-up mountain/valley pairing to verify; correctness is the
 *  pivot/cap capture only.
 *
 * ────────────────────────────────────────────────────────────────────────────
 *  PRINT FIT (A4 AND Letter; clamps below never let a part run off the page)
 * ────────────────────────────────────────────────────────────────────────────
 *  Display face = upper half, y ∈ [MARGIN, spineY]; loose die-cut parts fill the
 *  lower half. The background disc (radius R) is centred at
 *      cx = paper.width/2,  cy = MARGIN + TOP_PAD + R.
 *  Its bottom cy+R must clear the spine and its sides the margins:
 *      (vert)  MARGIN + TOP_PAD + 2R ≤ spineY   ⇒ R ≤ (spineY − MARGIN − TOP_PAD)/2
 *      (horz)  R ≤ paper.width/2 − MARGIN
 *  Height binds: A4 → R ≤ (148.5−5−12)/2 = 65.8, Letter → R ≤ (139.7−17)/2 = 61.4.
 *  R is clamped to [R_MIN, min(R_MAX=55, R_fit)], so the default R = 38 (and any
 *  garbage input) fits BOTH paper sizes with room for labels. The loose parts are
 *  flowed left→right across the lower half and each x-cursor is clamped to
 *  paper.width − MARGIN, so no part ever crosses the printable edge either.
 *
 * @module generators/spinFlap
 */

import { PAPER_SIZES, CARD_SIZES, PRINT } from './constants.js';
import { clamp, round, degToRad, polarToCartesian } from '../utils/math.js';
import {
  addPath,
  addRect,
  addText,
  addGroup,
  getLineStyle,
  createTemplate,
} from './svgBuilder.js';

/** Fixed design limits / clamps (see file header for the derivations). */
export const SPIN_FLAP_LIMITS = {
  R_MIN: 25,
  R_MAX: 55,               // background disc / flower radius (mm)
  PETAL_COUNT_MIN: 5,
  PETAL_COUNT_MAX: 8,      // total petals (1 of them rotates)
  HUB_RATIO: 0.24,         // yellow hub radius = HUB_RATIO·R …
  HUB_MIN: 7,              // … but at least this (mm)
  PETAL_INNER_RATIO: 0.16, // petal inner-tip radius / R
  PETAL_OUTER_MARGIN: 2,   // petal outer tip = R − this (mm)
  PETAL_GAP_DEG: 8,        // inter-petal angular gap g (deg)
  TEXT_RIN_RATIO: 0.30,    // hidden-text band inner radius / R
  TEXT_ROUT_RATIO: 0.62,   // hidden-text band outer radius / R
  TEXT_GUARD_DEG: 4,       // δ: text-coverage guard each side (deg)
  REVEAL_GUARD_DEG: 6,     // extra clearance the reveal must beat (deg)
  PAPER_THICKNESS: 0.3,    // (per slide-to-swing) (mm)
  PIVOT_HOLE: 7,           // pivot hole diameter in the disc (mm)
  PIVOT_TAB_W: 5,          // pivot neck width (< hole → free) (mm)
  PIVOT_TAB_LEN: 10,       // pivot neck+splay length through the hole (mm)
  PIVOT_CAP_R: 6,          // back cap radius (> hole/2 → captured) (mm)
  TOP_PAD: 12,             // disc top → sheet margin (title room) (mm)
};

/** NaN/garbage-safe numeric intake (?? only guards null/undefined). */
const numOr = (v, d) => (Number.isFinite(Number(v)) ? Number(v) : d);
/** radians → degrees (local; math.js only guarantees the four listed helpers). */
const toDeg = (rad) => (rad * 180) / Math.PI;

/** Full-circle SVG path "d" (two half-arcs) — local helper per repo convention. */
function circlePath(cx, cy, r) {
  return (
    `M ${round(cx - r)} ${round(cy)} ` +
    `a ${round(r)} ${round(r)} 0 1 0 ${round(2 * r)} 0 ` +
    `a ${round(r)} ${round(r)} 0 1 0 ${round(-2 * r)} 0 Z`
  );
}

/** Closed annular-sector (pie-with-hole) path, angles in deg (0 = up). */
function sectorPath(cx, cy, rIn, rOut, startDeg, endDeg) {
  const oL = polarToCartesian(cx, cy, rOut, startDeg);
  const oR = polarToCartesian(cx, cy, rOut, endDeg);
  const iL = polarToCartesian(cx, cy, rIn, startDeg);
  const iR = polarToCartesian(cx, cy, rIn, endDeg);
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${round(iL.x)} ${round(iL.y)} ` +
         `L ${round(oL.x)} ${round(oL.y)} ` +
         `A ${round(rOut)} ${round(rOut)} 0 ${large} 1 ${round(oR.x)} ${round(oR.y)} ` +
         `L ${round(iR.x)} ${round(iR.y)} ` +
         `A ${round(rIn)} ${round(rIn)} 0 ${large} 0 ${round(iL.x)} ${round(iL.y)} Z`;
}

/**
 * Rounded-leaf ("petal") path along a radial spoke from a centre O.
 * The leaf runs from an inner tip at radius rIn to an outer tip at rOut along
 * direction phiDeg (0 = up, clockwise), bulging to ±halfW at its mid radius.
 * Built as two quadratic Béziers (control offset 2·halfW so the curve passes
 * near halfW at the mid), matching this repo's tiny-local-helper style.
 *
 * @param {number} cx @param {number} cy - Leaf's radial origin O (the pivot/centre)
 * @param {number} phiDeg - Radial direction (0 = up, clockwise)
 * @param {number} rIn @param {number} rOut - Inner/outer tip radii from O (mm)
 * @param {number} halfW - Max half-width at the mid radius (mm)
 * @returns {string} SVG path "d"
 */
function petalPath(cx, cy, phiDeg, rIn, rOut, halfW) {
  const a = degToRad(phiDeg - 90);         // radial angle (x right, y down)
  const ux = Math.cos(a), uy = Math.sin(a);  // radial outward unit
  const px = -uy, py = ux;                    // perpendicular unit (+90°)
  const rMid = (rIn + rOut) / 2;
  const ax = cx + rIn * ux, ay = cy + rIn * uy;   // inner tip A
  const bx = cx + rOut * ux, by = cy + rOut * uy; // outer tip B
  const mx = cx + rMid * ux, my = cy + rMid * uy;  // mid centreline
  const off = 2 * halfW;
  const lx = mx + px * off, ly = my + py * off;   // left control
  const rx = mx - px * off, ry = my - py * off;   // right control
  return `M ${round(ax)} ${round(ay)} ` +
         `Q ${round(lx)} ${round(ly)} ${round(bx)} ${round(by)} ` +
         `Q ${round(rx)} ${round(ry)} ${round(ax)} ${round(ay)} Z`;
}

/**
 * World position of the rotating petal's OUTER tip at rotation angle θ.
 * Provided so a future 3D preview builder (flatScenes.jsx) can place the grab
 * target without re-deriving trig. θ = 0 is rest (covering the text); +θ is
 * clockwise. The petal's rest spoke is the top sector (restAngleDeg default 0).
 *
 * @param {number} thetaDeg @param {number} cx @param {number} cy
 * @param {number} rOut @param {number} [restAngleDeg=0]
 * @returns {{ x:number, y:number }}
 */
export function petalTipPosition(thetaDeg, cx, cy, rOut, restAngleDeg = 0) {
  return polarToCartesian(cx, cy, rOut, restAngleDeg + thetaDeg);
}

/**
 * @typedef {Object} SpinFlapGeometry
 * @property {'A4'|'LETTER'} paperSize
 * @property {number} spineY          - Spine y on the sheet (mm)
 * @property {number} cx @property {number} cy - Flower centre / pivot (mm)
 * @property {number} R               - Background disc / flower radius (mm)
 * @property {number} flowerDiameter  - 2R (mm)
 * @property {number} petalCount      - Total petals N
 * @property {number} fixedPetals     - N − 1 (glued petals)
 * @property {number} sigma           - Sector angle 360/N (deg)
 * @property {number} petalRIn        - Petal inner-tip radius (mm)
 * @property {number} petalROut       - Petal outer-tip radius (mm)
 * @property {number} petalHalfW      - Petal max half-width (mm)
 * @property {number} hubR            - Yellow hub radius (mm)
 * @property {number} restAngle       - Rotating-petal rest spoke (deg, = 0 top)
 * @property {number} revealAngle     - Designed full-reveal rotation (deg)
 * @property {number} minReveal       - Minimum rotation that fully exposes text (deg)
 * @property {number} textRIn @property {number} textROut - Hidden-text band radii (mm)
 * @property {number} textThetaDeg    - Hidden-text angular width (deg)
 * @property {number} textWidthMM     - Text arc length at band mid (mm) → deco slot W
 * @property {number} textHeightMM    - Text band radial thickness (mm) → deco slot H
 * @property {number} pivotHole @property {number} pivotTabW
 * @property {number} pivotTabLen @property {number} pivotCapR
 */

/**
 * Resolve + clamp spin-flap geometry against the printable face. Pure numbers
 * only (no DOM) so it can be bounds/coverage tested headlessly.
 *
 * @param {{ paperSize?:'A4'|'LETTER', R?:number, petalCount?:number }} [opts]
 * @returns {SpinFlapGeometry}
 */
export function resolveSpinFlapGeometry(opts = {}) {
  const L = SPIN_FLAP_LIMITS;
  const paper = PAPER_SIZES[opts.paperSize] || PAPER_SIZES.A4;
  const paperSize = CARD_SIZES[opts.paperSize] ? opts.paperSize : 'A4';
  const spineY = paper.height / 2;
  const M = PRINT.MARGIN;

  const petalCount = clamp(Math.round(numOr(opts.petalCount, 6)),
    L.PETAL_COUNT_MIN, L.PETAL_COUNT_MAX);
  const fixedPetals = petalCount - 1;
  const sigma = 360 / petalCount;

  // R fit clamp (height binds on both sheets — see header).
  const rFitVert = (spineY - M - L.TOP_PAD) / 2;
  const rFitHorz = paper.width / 2 - M;
  const rMax = Math.max(L.R_MIN, Math.min(L.R_MAX, rFitVert, rFitHorz));
  const R = clamp(numOr(opts.R, 38), L.R_MIN, rMax);

  const cx = round(paper.width / 2, 2);
  const cy = round(M + L.TOP_PAD + R, 2);

  const hubR = round(Math.max(L.HUB_MIN, L.HUB_RATIO * R), 2);
  const petalRIn = round(L.PETAL_INNER_RATIO * R, 2);
  const petalROut = round(R - L.PETAL_OUTER_MARGIN, 2);
  const petalRMid = (petalRIn + petalROut) / 2;
  const petalHalfAngle = Math.max(6, sigma / 2 - L.PETAL_GAP_DEG); // deg
  const petalHalfW = round(Math.max(4, petalRMid * Math.tan(degToRad(petalHalfAngle))), 2);

  // Leaf local half-width w(r) = halfW·sin(π·t).
  const wAt = (r) => {
    const t = clamp((r - petalRIn) / (petalROut - petalRIn), 0, 1);
    return petalHalfW * Math.sin(Math.PI * t);
  };

  // Hidden-text band + coverage-limited angular width (see header).
  const textRIn = round(L.TEXT_RIN_RATIO * R, 2);
  const textROut = round(L.TEXT_ROUT_RATIO * R, 2);
  let minAng = Infinity, maxAng = 0;
  for (let r = textRIn; r <= textROut + 1e-6; r += 0.5) {
    const ang = Math.atan2(wAt(r), r);
    if (ang < minAng) minAng = ang;
    if (ang > maxAng) maxAng = ang;
  }
  let textHalfDeg = Math.max(4, toDeg(minAng) - L.TEXT_GUARD_DEG);
  textHalfDeg = Math.min(textHalfDeg, sigma / 2 - L.TEXT_GUARD_DEG); // never leave the sector
  const textThetaDeg = round(2 * textHalfDeg, 2);
  const textMidR = (textRIn + textROut) / 2;
  const textWidthMM = round(textMidR * degToRad(textThetaDeg), 2);
  const textHeightMM = round(textROut - textRIn, 2);

  // Reveal: clear the far text edge at the worst (largest-α, inner) radius.
  const minReveal = round(toDeg(maxAng) + textHalfDeg + L.REVEAL_GUARD_DEG, 2);
  const revealAngle = round(clamp(Math.max(minReveal + 4, sigma + 12), minReveal, 90), 2);

  return {
    paperSize,
    spineY: round(spineY, 2),
    cx,
    cy,
    R: round(R, 2),
    flowerDiameter: round(2 * R, 2),
    petalCount,
    fixedPetals,
    sigma: round(sigma, 2),
    petalRIn,
    petalROut,
    petalHalfW,
    hubR,
    restAngle: 0,
    revealAngle,
    minReveal,
    textRIn,
    textROut,
    textThetaDeg,
    textWidthMM,
    textHeightMM,
    pivotHole: L.PIVOT_HOLE,
    pivotTabW: L.PIVOT_TAB_W,
    pivotTabLen: L.PIVOT_TAB_LEN,
    pivotCapR: L.PIVOT_CAP_R,
  };
}

/**
 * Draw the loose ROTATING petal: a leaf running from the centre out to rOut,
 * with a pivot neck + splay tab at its base (folds back through the disc hole)
 * and a hub-glue mark on its front.
 */
function drawRotatingPetal(g, ox, oy, geo, isColor) {
  const L = SPIN_FLAP_LIMITS;
  const CUT = getLineStyle('CUT', isColor);
  const VALLEY = getLineStyle('VALLEY_FOLD', isColor);
  const GLUE = getLineStyle('GLUE_TAB', isColor);
  const SCORE = getLineStyle('SCORE', isColor);

  // Pivot origin at (ox, oy); leaf points UP, neck hangs DOWN.
  addPath(g, petalPath(ox, oy, 0, 0, geo.petalROut, geo.petalHalfW), CUT);

  // Pivot neck + splay tab (through the disc hole; valley-folded to the back).
  const neckL = round(ox - L.PIVOT_TAB_W / 2);
  addRect(g, neckL, oy, L.PIVOT_TAB_W, L.PIVOT_TAB_LEN, CUT);
  addPath(g, `M ${neckL} ${round(oy)} L ${round(neckL + L.PIVOT_TAB_W)} ${round(oy)}`, VALLEY);
  addRect(g, round(neckL + 0.6), round(oy + 1.5),
    round(L.PIVOT_TAB_W - 1.2), round(L.PIVOT_TAB_LEN - 3), GLUE);

  // Hub-glue mark on the FRONT base (where the yellow hub is glued on).
  addPath(g, circlePath(ox, round(oy - geo.hubR - 1), geo.hubR), SCORE);

  addText(g, ox, round(oy - geo.petalROut - 2), '회전 꽃잎 — 한 조각 (제일 위에 오게)', 2.4, 'middle');
  addText(g, round(ox + L.PIVOT_TAB_W / 2 + 1), round(oy + L.PIVOT_TAB_LEN / 2 + 1),
    '축 목: 뒤로 접어 구멍에 끼우기', 2.1, 'start');
  addText(g, ox, round(oy - geo.hubR - 1), '노란 꽃술 붙일 자리', 2, 'middle');
}

/** Draw one loose FIXED petal (leaf rIn→rOut) with a glue fill; glued to disc. */
function drawFixedPetal(g, ox, oy, geo, label, isColor) {
  const CUT = getLineStyle('CUT', isColor);
  const GLUE = getLineStyle('GLUE_TAB', isColor);
  // Origin at (ox, oy); leaf points UP so its inner tip is at oy − rIn.
  addPath(g, petalPath(ox, oy, 0, geo.petalRIn, geo.petalROut, geo.petalHalfW), CUT);
  // Glue the whole leaf down — a slightly inset leaf as the glue indicator.
  addPath(g, petalPath(ox, oy, 0, geo.petalRIn + 1.5, geo.petalROut - 1.5,
    Math.max(2, geo.petalHalfW - 1.5)), GLUE);
  if (label) addText(g, ox, round(oy - geo.petalROut - 2), label, 2.1, 'middle');
}

/**
 * Draw the spin-flap flat pattern into a passed-in SVG/group.
 *
 * Upper half = the DISPLAY face / background disc: outer cut, real centre pivot
 * hole (cut), the hidden-text annular sector + guide note, and dashed placement
 * ghosts for the hub and all N petal positions (the rest sector shown as the
 * rotating petal's home). Lower half = the loose parts to cut and assemble.
 *
 * @param {SVGElement} svg
 * @param {Object} [options]
 * @param {'A4'|'LETTER'} [options.paperSize='A4']
 * @param {number} [options.R=38]
 * @param {number} [options.petalCount=6]
 * @param {boolean} [options.isColor=true]
 * @returns {SVGGElement}
 */
export const generateSpinFlap = (svg, options = {}) => {
  const { isColor = true } = options;
  const L = SPIN_FLAP_LIMITS;
  const geo = resolveSpinFlapGeometry(options);
  const paper = PAPER_SIZES[geo.paperSize];
  const M = PRINT.MARGIN;

  const g = addGroup(svg, 'spin-flap-group');
  const CUT = getLineStyle('CUT', isColor);
  const SCORE = getLineStyle('SCORE', isColor);
  const GLUE = getLineStyle('GLUE_TAB', isColor);

  const { cx, cy, R, sigma, petalCount, revealAngle } = geo;

  addText(g, cx, round(M + 4), '돌려 펼치는 숨은 글자 꽃 (Spin-Flap)', 3, 'middle');

  // ── UPPER HALF — background disc / display face ──────────────────────────
  addPath(g, circlePath(cx, cy, R), CUT);              // disc outline (cut out)
  addText(g, round(cx - R - 1), cy, '배경 원판', 2.2, 'end');

  // Real centre pivot hole (the rotating petal's neck passes through it).
  addPath(g, circlePath(cx, cy, L.PIVOT_HOLE / 2), CUT);

  // Hub placement ghost (where the yellow centre lands on the front).
  addPath(g, circlePath(cx, cy, geo.hubR), SCORE);

  // Hidden-text annular sector (rest sector, centred on 0°) + guide note.
  addPath(g, sectorPath(cx, cy, geo.textRIn, geo.textROut,
    -geo.textThetaDeg / 2, geo.textThetaDeg / 2), SCORE);
  const noteAt = polarToCartesian(cx, cy, (geo.textRIn + geo.textROut) / 2, 0);
  addText(g, round(noteAt.x), round(noteAt.y + 1), '숨은 메시지', 2.2, 'middle');
  addText(g, cx, round(cy - geo.textRIn - 1), '펼치면 숨은 글자가 보여요!', 2.1, 'middle');

  // Petal placement ghosts: sector 0 = rotating petal's home, others = fixed.
  for (let k = 0; k < petalCount; k++) {
    const phi = k * sigma;
    addPath(g, petalPath(cx, cy, phi, geo.petalRIn, geo.petalROut, geo.petalHalfW), SCORE);
  }
  // Rotating petal's swung (reveal) ghost, overlapping the +σ neighbour.
  addPath(g, petalPath(cx, cy, revealAngle, geo.petalRIn, geo.petalROut, geo.petalHalfW), SCORE);
  const revTip = petalTipPosition(revealAngle, cx, cy, geo.petalROut + 3, geo.restAngle);
  addText(g, round(revTip.x), round(revTip.y), `여기로 돌리기(약 ${Math.round(revealAngle)}°)`, 2, 'middle');

  // ── LOWER HALF — loose parts to cut ─────────────────────────────────────
  addText(g, cx, round(geo.spineY + 4), '↓ 아래: 오려서 조립하는 부품들', 2.6, 'middle');
  const rowTop = round(geo.spineY + 12);
  const gap = 8;
  let xc = round(M + geo.petalHalfW + 4);   // running x-cursor (leaf centre)

  // Rotating petal (leaf + neck), placed first.
  const rotPivotY = round(rowTop + geo.petalROut + 2);
  drawRotatingPetal(g, xc, rotPivotY, geo, isColor);
  xc = round(xc + geo.petalHalfW + gap + geo.petalHalfW);

  // Fixed petals in a row (leaf origin's inner tip sits at oy − rIn).
  const fixPivotY = round(rowTop + geo.petalROut + 2);
  for (let k = 0; k < geo.fixedPetals; k++) {
    const nx = round(Math.min(xc + geo.petalHalfW + 2, paper.width - M - geo.petalHalfW - 2));
    drawFixedPetal(g, nx, fixPivotY, geo,
      k === 0 ? `고정 꽃잎 ×${geo.fixedPetals} — 배경에 붙이기` : null, isColor);
    xc = round(nx + geo.petalHalfW + gap);
  }

  // Hub + cap discs on a second row, kept on-page.
  const discY = round(fixPivotY + L.PIVOT_TAB_LEN + geo.hubR + gap + 4);
  const hubX = round(Math.min(M + geo.hubR + 2, paper.width - M - geo.hubR - 2));
  addPath(g, circlePath(hubX, discY, geo.hubR), CUT);
  addPath(g, circlePath(hubX, discY, round(geo.hubR - 1.5)), GLUE);
  addText(g, hubX, round(discY + geo.hubR + 3), '노란 꽃술 — 회전 꽃잎 위에 붙이기', 2, 'middle');

  const capX = round(Math.min(hubX + geo.hubR + gap + L.PIVOT_CAP_R,
    paper.width - M - L.PIVOT_CAP_R - 2));
  addPath(g, circlePath(capX, discY, L.PIVOT_CAP_R), CUT);
  addPath(g, circlePath(capX, discY, round(L.PIVOT_CAP_R - 1.5)), GLUE);
  addText(g, capX, round(discY + L.PIVOT_CAP_R + 3), '축 캡 — 뒤에서 목에 붙이기', 2, 'middle');
  addText(g, capX, round(discY + L.PIVOT_CAP_R + 6), '(꽉 눌러 붙이되 원판엔 안 붙게!)', 1.9, 'middle');

  return g;
};

/**
 * Render the spin-flap onto a complete printable SVG template (page + spine).
 * @param {Object} [params={}]
 * @param {'A4'|'LETTER'} [params.paperSize='A4']
 * @param {'color'|'bw'} [params.colorMode='color']
 * @param {number} [params.R=38]
 * @param {number} [params.petalCount=6]
 * @returns {{ svg: SVGSVGElement, geometry: SpinFlapGeometry }}
 */
export function renderSpinFlap(params = {}) {
  const { paperSize = 'A4', colorMode = 'color', ...opts } = params;
  const { svg, contentGroup } = createTemplate(paperSize, colorMode);
  const geometry = resolveSpinFlapGeometry({ paperSize, ...opts });
  generateSpinFlap(contentGroup, {
    paperSize,
    ...opts,
    isColor: colorMode !== 'bw',
  });
  return { svg, geometry };
}
