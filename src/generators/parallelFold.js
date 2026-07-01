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
 * - Two horizontal cut lines (left and right of the step)
 * - A fold line parallel to the spine at cut depth
 * - The spine itself acts as a valley fold
 *
 * For a single step on the flat template:
 *
 * ```
 *   ─────────────────────  spine (valley fold)
 *   │←── depth ──→│
 *   ├─────────────┤ ─ ─ ─  mountain fold (parallel to spine)
 *   │  step face  │
 *   ├─────────────┤ ─ ─ ─  mountain fold
 *   │←── depth ──→│
 *   ─────────────────────  spine continued
 *       ↑ width ↑
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

    // Left vertical cut
    cuts.push(`M ${left} ${upperStart} L ${left} ${upperEnd}`);
    // Right vertical cut
    cuts.push(`M ${right} ${upperStart} L ${right} ${upperEnd}`);
    // Horizontal cut connecting the two verticals at the top
    cuts.push(`M ${left} ${upperEnd} L ${right} ${upperEnd}`);

    // ── Lower half (below spine) ─────────────────────────────────
    const lowerStart = round(spineY + accumulatedDepth);
    const lowerEnd   = round(spineY + cutDepthFromSpine);

    cuts.push(`M ${left} ${lowerStart} L ${left} ${lowerEnd}`);
    cuts.push(`M ${right} ${lowerStart} L ${right} ${lowerEnd}`);
    cuts.push(`M ${left} ${lowerEnd} L ${right} ${lowerEnd}`);

    // ── Mountain folds (horizontal, parallel to spine) ───────────
    // These are at the edges where cuts meet the card – the step lip
    if (accumulatedDepth === 0) {
      // First level: mountain folds at spine level across the step width
      // (The paper between the cuts and the spine will fold up)
      mountainFolds.push(`M ${left} ${round(spineY)} L ${right} ${round(spineY)}`);
    } else {
      // Subsequent levels: fold at the accumulated depth line
      mountainFolds.push(`M ${left} ${upperStart} L ${right} ${upperStart}`);
      mountainFolds.push(`M ${left} ${lowerStart} L ${right} ${lowerStart}`);
    }

    // Mountain fold at the top/bottom edges of each step
    mountainFolds.push(`M ${left} ${upperEnd} L ${right} ${upperEnd}`);
    mountainFolds.push(`M ${left} ${lowerEnd} L ${right} ${lowerEnd}`);

    // ── Labels ────────────────────────────────────────────────────
    markers.push({
      x: posX,
      y: round((upperStart + upperEnd) / 2),
      text: `단계 ${i + 1}: ${round(depth)}mm`,
    });

    accumulatedDepth = cutDepthFromSpine;
  }

  // Valley fold note at spine
  valleyFolds.push(
    `M ${round(posX - levels[0].width / 2 - 5)} ${round(spineY)} ` +
    `L ${round(posX + levels[0].width / 2 + 5)} ${round(spineY)}`
  );

  markers.push({ x: posX, y: spineY + 3, text: '골접기 (Valley fold / Spine)' });

  return { cuts, mountainFolds, valleyFolds, markers, levels };
}

/**
 * Render parallel fold onto a complete SVG template.
 * @param {ParallelFoldParams} params
 * @returns {{ svg: SVGSVGElement, result: ParallelFoldResult }}
 */
export function renderParallelFold(params) {
  const colorMode = params.colorMode ?? 'color';
  const styles = getLineStyles(colorMode);
  const { svg, contentGroup } = createTemplate(params.paperSize, colorMode);
  const result = generateParallelFold(params);

  const g = addGroup(contentGroup, 'parallel-fold', 'parallel-fold');

  for (const d of result.cuts)           addPath(g, d, styles.CUT);
  for (const d of result.mountainFolds)  addPath(g, d, styles.MOUNTAIN_FOLD);
  for (const d of result.valleyFolds)    addPath(g, d, styles.VALLEY_FOLD);
  for (const m of result.markers)        addText(g, m.x, m.y, m.text, 2);

  return { svg, result };
}
