import { addPath, addPolygon, getLineStyle, addText, addGroup, createTemplate } from './svgBuilder';
import { PRINT } from './constants';

/**
 * Generates an SVG group for a V-Fold popup mechanism.
 *
 * The piece straddles the card spine (the horizontal line y = cy, per
 * CARD_SIZES / createTemplate): the MOUNTAIN ridge lies ON the spine and the
 * two VALLEY base-folds sit one on each page, mirrored about y = cy — exactly
 * box-popup's topology, but the panel tapers to a point instead of staying a
 * full-width rectangle, giving the V silhouette.
 *
 * Shape (α = angle, the half-angle of the V measured from the spine; L = armLength):
 *   ridge half-width   rw = L·cos α   (mountain, on the spine y = cy)
 *   base-fold offset   d  = L·sin α   (valley, into each page at y = cy ∓ d)
 * so each slanted "arm" edge has length L. Flat-foldable because the mountain
 * (y = cy) and the two valleys (y = cy ± d) are parallel and symmetric, so the
 * panel collapses flat like an accordion when the card closes.
 *
 * Popup kinematics (card-opening angle drives it, see utils/math.js):
 *   β = 2·arcsin(k·sin(α/2)), k = 1 → β = α;  h = L·sin(β/2).
 */
export const generateVFold = (svg, options = {}) => {
  const {
    cx = 105,       // Spine X (Center)
    cy = 148,       // Spine Y (Center)
    armLength = 40, // Length of the V-arms (L)
    angle = 45,     // Half-angle of the V-fold from the spine (α)
    isColor = true
  } = options;

  const g = addGroup(svg, 'vfold-group');

  const cutStyle = getLineStyle('CUT', isColor);
  const mountainStyle = getLineStyle('MOUNTAIN_FOLD', isColor);
  const valleyStyle = getLineStyle('VALLEY_FOLD', isColor);
  const glueStyle = getLineStyle('GLUE_TAB', isColor);

  const aRad = (angle * Math.PI) / 180;
  const rw = armLength * Math.cos(aRad); // ridge half-width, on the spine
  const d = armLength * Math.sin(aRad);  // base-fold offset, one into each page

  const tabH = 8;
  // Truncate the two tips so the base folds are real segments the glue tabs can
  // hinge on and a child can grip (kept below the ridge half-width so the panel
  // still tapers inward toward each page).
  const bw = Math.min(8, rw * 0.5);

  // 1. Cut lines — the four slanted arms. Two run up into the upper page, two
  // down into the lower page, so the outline straddles the spine.
  addPath(g, `M ${cx - rw} ${cy} L ${cx - bw} ${cy - d}`, cutStyle);
  addPath(g, `M ${cx + rw} ${cy} L ${cx + bw} ${cy - d}`, cutStyle);
  addPath(g, `M ${cx - rw} ${cy} L ${cx - bw} ${cy + d}`, cutStyle);
  addPath(g, `M ${cx + rw} ${cy} L ${cx + bw} ${cy + d}`, cutStyle);

  // 2. Mountain ridge — ON the spine, pops toward the viewer.
  addPath(g, `M ${cx - rw} ${cy} L ${cx + rw} ${cy}`, mountainStyle);

  // 3. Base folds (Valley) — one per page, mirrored about the spine. These stay
  // UNCUT: each hinges its arm onto its page (the tab beyond glues it down).
  addPath(g, `M ${cx - bw} ${cy - d} L ${cx + bw} ${cy - d}`, valleyStyle);
  addPath(g, `M ${cx - bw} ${cy + d} L ${cx + bw} ${cy + d}`, valleyStyle);

  // 4. Glue Tabs — beyond each base fold, folded away from the spine and glued
  // flat onto that page.
  addPolygon(g, [
    [cx - bw, cy - d],
    [cx - bw + tabH * 0.4, cy - d - tabH],
    [cx + bw - tabH * 0.4, cy - d - tabH],
    [cx + bw, cy - d]
  ], glueStyle);

  addPolygon(g, [
    [cx - bw, cy + d],
    [cx - bw + tabH * 0.4, cy + d + tabH],
    [cx + bw - tabH * 0.4, cy + d + tabH],
    [cx + bw, cy + d]
  ], glueStyle);

  addText(g, cx, cy - 2, '브이폴드 (V-Fold)', 3, 'middle');
  addText(g, cx, cy - d - 3, '풀칠', 2.5, 'middle');
  addText(g, cx, cy + d + tabH - 1, '풀칠', 2.5, 'middle');

  return g;
};

/**
 * Render V-Fold onto a complete printable SVG template (page outline + spine).
 * @param {Object} [params={}]
 * @param {'A4'|'LETTER'} [params.paperSize='A4']
 * @param {'color'|'bw'} [params.colorMode='color']
 * @returns {{ svg: SVGSVGElement }}
 */
export function renderVFold(params = {}) {
  const { paperSize = 'A4', colorMode = 'color', ...opts } = params;
  const { svg, contentGroup, paper, spineY } = createTemplate(paperSize, colorMode);

  const cx = paper.width / 2;
  const cy = spineY;
  const TAB_H = 8;

  // Clamp params so the piece never runs off the page or past a page edge.
  const angle = Math.max(20, Math.min(opts.angle ?? 45, 70));
  const aRad = (angle * Math.PI) / 180;
  const maxHalfSpan = Math.min(cy, paper.height - cy) - PRINT.MARGIN - TAB_H;
  const maxHalfWidth = paper.width / 2 - PRINT.MARGIN;
  const armMaxByHeight = maxHalfSpan / Math.sin(aRad);
  const armMaxByWidth = maxHalfWidth / Math.cos(aRad);
  const armLength = Math.max(10, Math.min(opts.armLength ?? 40, armMaxByHeight, armMaxByWidth));

  generateVFold(contentGroup, {
    cx,
    cy,
    ...opts,
    armLength,
    angle,
    isColor: colorMode !== 'bw',
  });
  return { svg };
}
