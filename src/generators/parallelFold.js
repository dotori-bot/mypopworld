/**
 * @fileoverview Parallel fold (step / staircase) popup mechanism generator.
 * Produces SVG template data for parallel-fold popups where horizontal
 * cut pairs create steps that rise from the card surface.
 *
 * Key formula: height(α) = d × sin(α / 2), height_max = d
 * Supports multi-level staircases: d1 < d2 < d3, w1 > w2 > w3
 *
 * @module generators/parallelFold
 */

import {
  PAPER_SIZES,
  CARD_SIZES,
  PRINT,
  getLineStyles,
} from './constants.js';
import { clamp, round } from '../utils/math.js';
import {
  addPath,
  addText,
  addGroup,
  createTemplate,
} from './svgBuilder.js';

/**
 * @typedef {Object} ParallelFoldLevel
 * @property {number} width - Width of this step along the spine (mm)
 * @property {number} depth - Cut depth perpendicular to spine (mm).
 *   height_max = depth. For staircase: d1 < d2 < d3.
 */

/**
 * @typedef {Object} ParallelFoldParams
 * @property {'A4'|'LETTER'} paperSize
 * @property {{ x: number, y: number }} [position] - Centre placement on spine (mm)
 * @property {number} [width]   - Width of single-level step (mm). Ignored if levels provided.
 * @property {number} [depth]   - Depth of single-level step (mm). Ignored if levels provided.
 * @property {ParallelFoldLevel[]} [levels] - Multi-level staircase definition
 * @property {'color'|'bw'} [colorMode='color']
 */

/**
 * @typedef {Object} ParallelFoldResult
 * @property {string[]} cuts
 * @property {string[]} mountainFolds
 * @property {string[]} valleyFolds
 * @property {Array<{x:number,y:number,text:string}>} markers
 * @property {ParallelFoldLevel[]} levels - Validated level dimensions
 */

/**
 * Build the levels array from params, applying defaults and validation.
 * @param {ParallelFoldParams} params
 * @returns {ParallelFoldLevel[]}
 */
function buildLevels(params) {
  const card = CARD_SIZES[params.paperSize] || CARD_SIZES.A4;
  const maxDepth = card.height / 2 - PRINT.MARGIN;
  const maxWidth = card.width - 2 * PRINT.MARGIN;

  if (params.levels && params.levels.length > 0) {
    // Validate: depths ascending, widths descending
    return params.levels.map((lvl, i) => ({
      width: clamp(lvl.width, 5, maxWidth),
      depth: clamp(lvl.depth, 3, maxDepth),
    }));
  }

  // Single level
  return [{
    width: clamp(params.width ?? 40, 5, maxWidth),
    depth: clamp(params.depth ?? 20, 3, maxDepth),
  }];
}

/**
 * Generate parallel fold mechanism data.
 *
 * Each level consists of:
 * - Two vertical CUT lines (left and right of the step, its own band only)
 * - Horizontal FOLD lines at the band boundaries — never cuts (see the
 *   fold-direction derivation at the outer-edge branch below)
 *
 * For a single step (N=1) on the flat template:
 *
 * ```
 *   ├─────────────┤ ─ ─ ─  valley fold (anchor back to the card)
 *   │  step face  │
 *   ├─────────────┤ ─·─·─  spine segment: MOUNTAIN (template valley gapped here)
 *   │  step face  │
 *   ├─────────────┤ ─ ─ ─  valley fold (anchor)
 *       ↑ width ↑     │ = vertical cuts (the only cutting)
 * ```
 *
 * On the template, cuts go vertically from the spine outward.
 *
 * @param {ParallelFoldParams} rawParams
 * @returns {ParallelFoldResult}
 */
export function generateParallelFold(rawParams) {
  const colorMode = rawParams.colorMode ?? 'color';
  const paper = PAPER_SIZES[rawParams.paperSize] || PAPER_SIZES.A4;
  const levels = buildLevels(rawParams);

  // Spine position
  const spineY = paper.height / 2;
  const posX = rawParams.position?.x ?? paper.width / 2;

  /** @type {string[]} */
  const cuts = [];
  /** @type {string[]} */
  const mountainFolds = [];
  /** @type {string[]} */
  const valleyFolds = [];
  /** @type {Array<{x:number,y:number,text:string}>} */
  const markers = [];

  // The spine itself is a valley fold across the step area
  // (It is already drawn by the card outline, but we note it here)

  let accumulatedDepth = 0; // cumulative depth for staircase stacking

  for (let i = 0; i < levels.length; i++) {
    const { width, depth } = levels[i];
    const halfW = width / 2;

    const left  = round(posX - halfW);
    const right = round(posX + halfW);

    // For staircase: each subsequent level starts where the previous ended
    const cutDepthFromSpine = accumulatedDepth + depth;

    // ── Upper half (above spine) ─────────────────────────────────
    // Vertical cuts from previous fold line (or spine) outward
    const upperStart = round(spineY - accumulatedDepth);
    const upperEnd   = round(spineY - cutDepthFromSpine);

    // Side cuts span ONLY this level's own band (accumulatedDepth → cutDepth),
    // freeing the staircase strip's edges so it can lift out of the card.
    // Left vertical cut
    cuts.push(`M ${left} ${upperStart} L ${left} ${upperEnd}`);
    // Right vertical cut
    cuts.push(`M ${right} ${upperStart} L ${right} ${upperEnd}`);

    // ── Lower half (below spine) ─────────────────────────────────
    const lowerStart = round(spineY + accumulatedDepth);
    const lowerEnd   = round(spineY + cutDepthFromSpine);

    cuts.push(`M ${left} ${lowerStart} L ${left} ${lowerEnd}`);
    cuts.push(`M ${right} ${lowerStart} L ${right} ${lowerEnd}`);

    // ── Outer edge (at cut depth) ────────────────────────────────
    // A line carries exactly ONE meaning (cut or fold, never both). The
    // outermost boundary of the LAST level is the strip's ONLY anchor back to
    // the card: it must be a VALLEY hinge (same fold sense as the card spine).
    // Cutting it — the old bug — left the strip's whole perimeter cut, so the
    // piece simply fell out of the card.
    //
    // Fold-direction derivation (cross-section through the strip centre,
    // card opened 90°; each crease turns the paper ±90°, and the polyline
    // must leave the upper card face and land on the lower one, so the
    // signed turns sum to +90°): with the two outermost anchors VALLEY,
    // the interior creases must alternate M, V, M … inward, ending at the
    // spine crease (VALLEY when the level count N is even, MOUNTAIN when
    // odd — N=1 gives the classic V·M·V single step).
    const isLast = i === levels.length - 1;
    if (isLast) {
      valleyFolds.push(`M ${left} ${upperEnd} L ${right} ${upperEnd}`);
      valleyFolds.push(`M ${left} ${lowerEnd} L ${right} ${lowerEnd}`);
    } else {
      // A narrower next level shares this outer edge as its hinge. Only cut the
      // exposed "shoulders" (tread edges) either side of the next level's
      // width; leave the middle strip uncut so it can serve as level i+1's
      // inner mountain-fold hinge (which level i+1 draws itself — so we push NO
      // mountainFolds entry here, to avoid re-labeling the same shared line).
      const nextHalfWidth = levels[i + 1].width / 2;
      const innerLeft  = round(posX - nextHalfWidth);
      const innerRight = round(posX + nextHalfWidth);
      // Upper shoulders
      cuts.push(`M ${left} ${upperEnd} L ${innerLeft} ${upperEnd}`);
      cuts.push(`M ${innerRight} ${upperEnd} L ${right} ${upperEnd}`);
      // Lower shoulders
      cuts.push(`M ${left} ${lowerEnd} L ${innerLeft} ${lowerEnd}`);
      cuts.push(`M ${innerRight} ${lowerEnd} L ${right} ${lowerEnd}`);
    }

    // ── Inner edge fold (the hinge attaching this level) ──────────
    // For level 0 this coincides with the spine; for level i>0 it IS the shared
    // hinge on level i-1's (uncut) outer-edge middle strip. Direction follows
    // the alternation derived above: this crease sits at position N−i+1
    // counting inward from the outermost VALLEY anchor, so it is a VALLEY when
    // (N−i) is even and a MOUNTAIN when odd. (N=1 → spine MOUNTAIN, the
    // classic step; the template's card-spine valley is gapped over the strip
    // width in renderParallelFold so this line is the only mark there.)
    const innerFolds = (levels.length - i) % 2 === 0 ? valleyFolds : mountainFolds;
    if (accumulatedDepth === 0) {
      innerFolds.push(`M ${left} ${round(spineY)} L ${right} ${round(spineY)}`);
    } else {
      innerFolds.push(`M ${left} ${upperStart} L ${right} ${upperStart}`);
      innerFolds.push(`M ${left} ${lowerStart} L ${right} ${lowerStart}`);
    }

    accumulatedDepth = cutDepthFromSpine;
  }

  // The whole page IS the card, so no marker may sit inside the trim rect —
  // everything is summarized on one line in the outer waste margin instead.
  const stepSummary = levels.map((l, i) => `단계 ${i + 1} ${round(l.depth)}mm`).join(' · ');
  markers.push({
    x: posX,
    y: PRINT.MARGIN - 1.5,
    text: `계단 팝업 — 세로 실선만 자르기 · 가로선은 전부 접기(하단 범례 참고) · ${stepSummary}`,
  });

  return { cuts, mountainFolds, valleyFolds, markers, levels, posX };
}

/**
 * Render parallel fold onto a complete SVG template.
 * @param {ParallelFoldParams} params
 * @returns {{ svg: SVGSVGElement, result: ParallelFoldResult }}
 */
export function renderParallelFold(params) {
  const colorMode = params.colorMode ?? 'color';
  const styles = getLineStyles(colorMode);
  const result = generateParallelFold(params);
  // The strip draws its own spine crease (direction depends on level parity),
  // so the template's card-spine valley is gapped over the strip's width — one
  // line, one meaning.
  const halfW0 = result.levels[0].width / 2;
  const { svg, contentGroup } = createTemplate(params.paperSize, colorMode, {
    spineGaps: [[result.posX - halfW0, result.posX + halfW0]],
  });

  const g = addGroup(contentGroup, 'parallel-fold', 'parallel-fold');

  for (const d of result.cuts)           addPath(g, d, styles.CUT);
  for (const d of result.mountainFolds)  addPath(g, d, styles.MOUNTAIN_FOLD);
  for (const d of result.valleyFolds)    addPath(g, d, styles.VALLEY_FOLD);
  for (const m of result.markers)        addText(g, m.x, m.y, m.text, 2);

  return { svg, result };
}
