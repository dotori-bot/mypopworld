/**
 * @fileoverview Flap-clap ("통통 플랩") mechanism generator.
 *
 * Reference craft: @sokobang's seal card — two independent triangular flaps
 * (one per page), each raised off its own page at a fixed assembled angle,
 * whose tips swing toward/apart as the book's own two pages rotate. Unlike
 * every other mechanism in this module (v-fold, box-popup, layered-stage,
 * parallel-fold, accordion), the flap's OWN fold angle is NOT re-derived from
 * the card's opening angle α — it is fixed once at assembly (glued rigid via
 * a prop strut). What DOES change with α is the flap's position in space,
 * because it rides on a page that is itself rotating about the spine. Two
 * independent rigid points, one per rotating page, sharing a hinge axis: this
 * alone makes their separation a well-defined function of α — no linkage
 * between the two pages is needed for that part (unlike autoSlideWindow's
 * slider-crank, which DOES need a cross-page strut because it must slide a
 * strip relative to the opposite page).
 *
 * ────────────────────────────────────────────────────────────────────────────
 *  KINEMATICS — why the tips meet ("clap") at one specific α
 * ────────────────────────────────────────────────────────────────────────────
 *  Put the spine on the x-axis. A page tilts by half-angle γ = α/2 off the
 *  table plane (γ=90° at α=180°, flat open; γ=0° at α=0°, closed). On that
 *  page, in its own (s = distance from spine, n = height off the page
 *  surface) frame, the flap's hinge sits at s=a (MOUNTAIN fold — flap stands
 *  toward the viewer) and is glued rigid at assembled angle δ off the page
 *  (δ=180° = flat/unfolded, δ=90° = standing straight up). Its apex is then
 *  fixed, in the page's own frame, at:
 *
 *      A = a − h·cos δ            (in-plane offset from spine)
 *      B = h·sin δ                (height off the page)
 *
 *  (δ is clamped to (90°,180°) so cos δ<0 and A>a>0 always — the apex never
 *  crosses back over the spine.) Embedding the page's frame in 3D at tilt γ,
 *  the apex's world distance from the spine-perpendicular symmetry plane is
 *  A·sin γ − B·cos γ. The two flaps mirror across the spine, so their tip
 *  separation is twice that:
 *
 *      D(α) = 2·(A·sin(α/2) − B·cos(α/2)) = 2R·sin(α/2 − ψ)
 *      R = √(A²+B²),  ψ = atan2(B, A)                          (degrees below)
 *
 *  D is a single sinusoid crossing zero at exactly one α in (0°,180°):
 *
 *      α* = 2ψ                                    ("clap" angle)
 *
 *  D(180°) = 2A (fully open gap), D(0°) = 2B (residual gap when the book is
 *  pressed shut — see the flat-foldability note below). Rocking the book
 *  through α* makes the tips meet and part again — the "통통" tap.
 *
 * ────────────────────────────────────────────────────────────────────────────
 *  FLAT-FOLDABILITY — the one deliberate departure from this file's siblings
 * ────────────────────────────────────────────────────────────────────────────
 *  Every other generator here (box-popup, v-fold, layered-stage, parallel-fold)
 *  proves its popup collapses to zero standing height when the card shuts,
 *  because their crease is exactly AT the spine (or chained back to it), so
 *  closing the book directly re-flattens the fold. This flap's hinge is
 *  offset from the spine and lives entirely on ONE page — nothing forces its
 *  OWN fold angle to track α, by design (that's what makes it "clap" instead
 *  of just tracking the spine like a v-fold arm). So it does NOT reach zero
 *  thickness at α=0: it keeps a residual standing height B = h·sin δ off its
 *  own page even with the book fully shut. We keep B small (clamped, see
 *  FLAP_CLAP_LIMITS) so this is a soft few-millimetre compression a closed
 *  card can absorb — the same tolerance real hand-folded paper crafts rely
 *  on (the reference card is squeezed shut by hand, not pressed book-flat).
 *
 * ────────────────────────────────────────────────────────────────────────────
 *  THE PROP — holding the flap rigid at δ without needing a cross-page strut
 * ────────────────────────────────────────────────────────────────────────────
 *  A lone hinged flap will not stay standing under its own paper stiffness.
 *  We brace it with a loose prop strip (same idea as autoSlideWindow's
 *  strut, but simpler: both ends anchor to the SAME page, so there is no
 *  linkage to solve — just one fixed length). One end glues to the flap at
 *  fraction t=0.6 up its own material from the hinge (attach point in the
 *  page's (s,n) frame: s = a − t·h·cos δ, n = t·h·sin δ); the other glues to
 *  a marked anchor on the page itself, spine-ward of the hinge by
 *  PROP_ANCHOR_GAP. Because paper doesn't stretch, the prop's fixed cut
 *  length forces the flap to exactly angle δ every time it's assembled:
 *
 *      propLen = √( (PROP_ANCHOR_GAP + t·h·|cos δ|)² + (t·h·sin δ)² )
 *
 * ────────────────────────────────────────────────────────────────────────────
 *  SIZING (fits A4 AND Letter; Letter governs)
 * ────────────────────────────────────────────────────────────────────────────
 *  One page's usable depth from the spine to the print-safe edge:
 *  sMax = CARD_SIZES.height − PRINT.MARGIN (Letter 134.7, A4 143.5 — Letter
 *  is tighter). We spend at most SAFETY·sMax on the flap's flat-pattern reach
 *  (a+h), clamping h against the remaining budget so the apex never runs off
 *  the sheet. Half-width b is clamped against the printable half-width.
 *
 * @module generators/flapClap
 */

import { CARD_SIZES, PRINT } from './constants.js';
import { clamp, round, degToRad, radToDeg } from '../utils/math.js';
import {
  addPath,
  addRect,
  addText,
  addGroup,
  getLineStyle,
  createTemplate,
} from './svgBuilder.js';

/** Fixed design limits (see file header for the derivations). */
export const FLAP_CLAP_LIMITS = {
  OFFSET_MIN: 8,
  OFFSET_MAX: 40,        // a: hinge distance from spine (mm)
  LEN_MIN: 12,
  LEN_MAX: 45,           // h: flap flat-pattern length, hinge → apex (mm)
  HALFW_MIN: 8,
  HALFW_MAX: 40,         // b: flap half-width at the hinge (mm)
  DELTA_MIN: 95,
  DELTA_MAX: 150,        // δ: assembled stand-up angle off the page (deg)
  SAFETY: 0.9,           // fraction of sMax spendable on (a+h)
  PROP_ATTACH_FRAC: 0.6, // fraction up the flap where the prop attaches
  PROP_ANCHOR_GAP_MAX: 10, // page-side prop anchor, spine-ward of the hinge (mm)
  PROP_W: 8,             // prop strip width (mm)
  GLUE_R: 3,             // radius of the small glue-dot marks (mm)
};

/** NaN/garbage-safe numeric intake (?? only guards null/undefined). */
const numOr = (v, d) => (Number.isFinite(Number(v)) ? Number(v) : d);

/**
 * @typedef {Object} FlapClapGeometry
 * @property {number} a        - Hinge distance from spine (mm)
 * @property {number} h        - Flap flat-pattern length, hinge→apex (mm)
 * @property {number} b        - Flap half-width at the hinge (mm)
 * @property {number} delta    - Assembled stand-up angle δ (deg)
 * @property {number} A        - In-plane apex offset from spine (mm)
 * @property {number} B        - Out-of-plane apex height off the page (mm)
 * @property {number} R        - √(A²+B²) (mm)
 * @property {number} clapAngle - α* where the two tips meet (deg)
 * @property {number} openGap   - Tip separation at α=180° (mm) = 2A
 * @property {number} closedGap - Residual tip-to-own-page gap at α=0° (mm) = 2B
 * @property {number} propLen   - Cut length of the loose brace prop (mm)
 * @property {number} propAnchorGap - Prop's page-side anchor, spine-ward of hinge (mm)
 * @property {number} sMax      - Usable one-page depth from spine (mm)
 * @property {number} wHalf     - Usable half-width from centre (mm)
 * @property {'A4'|'LETTER'} paperSize
 */

/**
 * Resolve + clamp flap-clap parameters against the printable card face.
 * Pure numbers — testable headlessly.
 *
 * @param {{ offset?:number, flapLength?:number, halfWidth?:number, delta?:number,
 *           paperSize?:'A4'|'LETTER' }} [opts]
 * @returns {FlapClapGeometry}
 */
export function resolveFlapClapGeometry(opts = {}) {
  const L = FLAP_CLAP_LIMITS;
  const card = CARD_SIZES[opts.paperSize] || CARD_SIZES.A4;
  const paperSize = CARD_SIZES[opts.paperSize] ? opts.paperSize : 'A4';

  const sMax = card.height - PRINT.MARGIN;          // one page's usable depth from spine
  const wHalf = card.width / 2 - PRINT.MARGIN;      // usable half-width from centre

  const delta = clamp(numOr(opts.delta, 110), L.DELTA_MIN, L.DELTA_MAX);
  const deltaRad = degToRad(delta);
  const cosD = Math.cos(deltaRad); // < 0 since delta > 90
  const sinD = Math.sin(deltaRad); // > 0

  const a = clamp(numOr(opts.offset, 18), L.OFFSET_MIN, L.OFFSET_MAX);

  // Footprint-fit clamp on h: a + h ≤ SAFETY·sMax.
  const hFit = L.SAFETY * sMax - a;
  const h = clamp(numOr(opts.flapLength, 22), L.LEN_MIN, Math.max(L.LEN_MIN, hFit));

  const b = clamp(numOr(opts.halfWidth, 18), L.HALFW_MIN, Math.max(L.HALFW_MIN, wHalf));

  const A = a - h * cosD; // > a > 0 always, since cosD < 0
  const B = h * sinD;
  const R = Math.sqrt(A * A + B * B);
  const psiDeg = radToDeg(Math.atan2(B, A));
  const clapAngle = clamp(2 * psiDeg, 0, 180);

  // Prop: attach at PROP_ATTACH_FRAC up the flap's own material from the
  // hinge; anchor on the page, spine-ward of the hinge by propAnchorGap.
  const t = L.PROP_ATTACH_FRAC;
  const propAnchorGap = Math.min(L.PROP_ANCHOR_GAP_MAX, a * 0.6);
  const attachGap = propAnchorGap + t * h * Math.abs(cosD); // in-plane separation
  const attachHeight = t * h * sinD;                        // out-of-plane separation
  const propLen = Math.sqrt(attachGap * attachGap + attachHeight * attachHeight);

  return {
    a: round(a), h: round(h), b: round(b), delta: round(delta, 1),
    A: round(A, 2), B: round(B, 2), R: round(R, 2),
    clapAngle: round(clapAngle, 1),
    openGap: round(2 * A, 1), closedGap: round(2 * B, 1),
    propLen: round(propLen, 1), propAnchorGap: round(propAnchorGap, 1),
    sMax: round(sMax), wHalf: round(wHalf),
    paperSize,
  };
}

/**
 * Draw one flap (+ its brace prop) on one side of the spine.
 * @param {SVGElement} g
 * @param {number} cx
 * @param {number} cy
 * @param {-1|1} sign - -1 = upper page (above spine), +1 = lower page (below)
 * @param {FlapClapGeometry} geo
 * @param {Object} styles - { cut, mountain, glue, score }
 * @param {number} propX - left x to lay out this flap's loose prop piece
 * @param {number} propY - top y to lay out this flap's loose prop piece
 */
function drawFlap(g, cx, cy, sign, geo, styles, propX, propY) {
  const { a, h, b, delta, clapAngle } = geo;
  const L = FLAP_CLAP_LIMITS;

  const hingeY = round(cy + sign * a);
  const apexY = round(cy + sign * (a + h));
  const xL = round(cx - b);
  const xR = round(cx + b);

  // Cut: the flap's two free slant edges.
  addPath(g, `M ${xL} ${hingeY} L ${cx} ${apexY}`, styles.cut);
  addPath(g, `M ${xR} ${hingeY} L ${cx} ${apexY}`, styles.cut);

  // Mountain fold: the hinge — page paper stays flat on the spine side,
  // the flap stands toward the viewer on the apex side.
  addPath(g, `M ${xL} ${hingeY} L ${xR} ${hingeY}`, styles.mountain);

  // Flap-side prop attach point (glue dot), at PROP_ATTACH_FRAC up the flap's
  // own material from the hinge, along its centreline.
  const attachY = round(hingeY + sign * L.PROP_ATTACH_FRAC * h);
  const r = L.GLUE_R;
  addRect(g, round(cx - r), round(attachY - r), r * 2, r * 2, styles.glue);

  // Page-side prop anchor point (glue dot), spine-ward of the hinge.
  const anchorY = round(cy + sign * (a - geo.propAnchorGap));
  addRect(g, round(cx - r), round(anchorY - r), r * 2, r * 2, styles.glue);

  // Angle-reference guide arc + label at the hinge (SCORE style — a guide,
  // not a cut/fold), so the assembler knows how far to stand the flap up.
  addText(g, round(cx + b + 2), hingeY, `${delta}°로 세워 프롭에 붙이기`, 2.3, 'start');

  // Loose brace prop piece, laid out in the page's whitespace margin: a
  // simple strip with a glue-tab crease near each end. Its FIXED cut length
  // (geo.propLen) is what locks the flap to exactly δ once both ends are
  // glued down — see file header.
  const propW = L.PROP_W;
  const ge = 5; // glue-end depth, each end
  addRect(g, propX, propY, propW, round(geo.propLen), styles.cut);
  addRect(g, round(propX + 1), round(propY + 1), round(propW - 2), round(ge - 2), styles.glue);
  addRect(g, round(propX + 1), round(propY + geo.propLen - ge + 1), round(propW - 2), round(ge - 2), styles.glue);
  addText(g, round(propX + propW / 2), round(propY - 2), '지지대(프롭) 1개', 2.2, 'middle');
  addText(g, round(propX + propW + 2), round(propY + ge / 2), '① 플랩 붙이는 곳', 2, 'start');
  addText(g, round(propX + propW + 2), round(propY + geo.propLen - ge / 2), '② 뒷면 붙이는 곳', 2, 'start');

  addText(g, cx, round(cy + sign * (a + h + 8)), `탁! 각도 ≈ ${clapAngle}°`, 2.2, 'middle');
}

/**
 * Draw the flap-clap flat pattern into a passed-in SVG/group.
 *
 * @param {SVGElement} svg - Target element (a content group from createTemplate)
 * @param {Object} [options]
 * @param {number} [options.cx=105] - Spine centre X (mm)
 * @param {number} [options.cy=148.5] - Spine centre Y (mm)
 * @param {number} [options.offset=18] - a (mm)
 * @param {number} [options.flapLength=22] - h (mm)
 * @param {number} [options.halfWidth=18] - b (mm)
 * @param {number} [options.delta=110] - δ (deg)
 * @param {'A4'|'LETTER'} [options.paperSize='A4']
 * @param {boolean} [options.isColor=true]
 * @returns {SVGGElement}
 */
export const generateFlapClap = (svg, options = {}) => {
  const { cx = 105, cy = 148.5, isColor = true, paperSize = 'A4' } = options;

  const geo = resolveFlapClapGeometry({
    offset: options.offset,
    flapLength: options.flapLength,
    halfWidth: options.halfWidth,
    delta: options.delta,
    paperSize,
  });

  const g = addGroup(svg, 'flap-clap-group');

  const styles = {
    cut: getLineStyle('CUT', isColor),
    mountain: getLineStyle('MOUNTAIN_FOLD', isColor),
    glue: getLineStyle('GLUE_TAB', isColor),
    score: getLineStyle('SCORE', isColor),
  };

  // Loose props are laid out to the right of each flap, inside the margin.
  const propX = round(cx + geo.b + 14);

  drawFlap(g, cx, cy, -1, geo, styles, propX, round(cy - geo.a - geo.h));
  drawFlap(g, cx, cy, 1, geo, styles, propX, round(cy + geo.a));

  addText(g, cx, round(cy - geo.a - geo.h - 6), '통통 플랩 (Flap Clap)', 3, 'middle');

  return g;
};

/**
 * Render flap-clap onto a complete printable SVG template (page + spine).
 * @param {Object} [params={}]
 * @param {'A4'|'LETTER'} [params.paperSize='A4']
 * @param {'color'|'bw'} [params.colorMode='color']
 * @param {number} [params.offset=18]
 * @param {number} [params.flapLength=22]
 * @param {number} [params.halfWidth=18]
 * @param {number} [params.delta=110]
 * @returns {{ svg: SVGSVGElement, geometry: FlapClapGeometry }}
 */
export function renderFlapClap(params = {}) {
  const { paperSize = 'A4', colorMode = 'color', ...opts } = params;
  const { svg, contentGroup, paper, spineY } = createTemplate(paperSize, colorMode);
  const geometry = resolveFlapClapGeometry({ paperSize, ...opts });
  generateFlapClap(contentGroup, {
    cx: paper.width / 2,
    cy: spineY,
    paperSize,
    ...opts,
    isColor: colorMode !== 'bw',
  });
  return { svg, geometry };
}
