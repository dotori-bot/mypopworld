import { addPath, addPolygon, getLineStyle, addText, addGroup, createTemplate } from './svgBuilder';
import { CARD_SIZES, PRINT } from './constants';
import { clamp, degToRad } from '../utils/math';

const TAB_SIZE = 8;
const BASE_OFFSET = 15;

/**
 * Clamp armLength/angle for a V-fold wedge rooted at height `originY` (distance
 * from the page's top edge to the wedge's root point) so its cut arms, ridge,
 * and glue tabs stay inside the printable page.
 *
 * `originY` lets a wedge glued onto another wedge's tip (e.g. an armExtension
 * anchored at the mouth's ridge apex) inherit however much vertical room the
 * first wedge left behind, instead of re-measuring from the spine.
 *
 * @param {number} angleDeg
 * @param {number} originY - mm from the page's top edge to the wedge root
 * @param {'A4'|'LETTER'} [paperSize='A4']
 * @param {{angleMin?:number, angleMax?:number, armMin?:number, tabSize?:number, baseOffset?:number}} [opts]
 */
export function vFoldLimits(angleDeg, originY, paperSize = 'A4', opts = {}) {
  const { angleMin = 15, angleMax = 75, armMin = 10, tabSize = TAB_SIZE, baseOffset = BASE_OFFSET } = opts;
  const card = CARD_SIZES[paperSize] || CARD_SIZES.A4;
  const angle = clamp(angleDeg, angleMin, angleMax);
  const angleRad = degToRad(angle);
  const armMaxByWidth = (card.width / 2 - PRINT.MARGIN - tabSize) / Math.cos(angleRad);
  const armMaxByHeight = (originY - PRINT.MARGIN - baseOffset - tabSize / 2) / Math.sin(angleRad);
  const armMax = Math.max(armMin, Math.min(armMaxByWidth, armMaxByHeight));
  return { angle, angleMin, angleMax, armMin, armMax };
}

/**
 * Draw one V-fold wedge: two cut arms fanning out from (originX, originY),
 * a mountain-fold ridge down the middle (the crease that pops toward the
 * viewer), valley folds hinging each arm tip back toward the root, and glue
 * tabs at the base. This is the one reusable shape behind both the main
 * V-fold mouth and any `armExtension` glued to its tip — same math, just a
 * different root point / armLength / angle, so new variants (longer/narrower
 * "tongue", shorter/wider "mouth", a horn, a tail, ...) need no new code.
 */
function drawVFoldWedge(g, { originX, originY, armLength, angle, isColor, dir = -1, tabSize = TAB_SIZE, baseOffset = BASE_OFFSET }) {
  const cutStyle = getLineStyle('CUT', isColor);
  const mountainStyle = getLineStyle('MOUNTAIN_FOLD', isColor);
  const valleyStyle = getLineStyle('VALLEY_FOLD', isColor);
  const glueStyle = getLineStyle('GLUE_TAB', isColor);

  const angleRad = degToRad(angle);
  const dx = armLength * Math.cos(angleRad);
  // `dir` is which side of the spine this half of the wedge fans toward:
  // -1 = up (toward the page top), +1 = down (toward the page bottom). A V-fold
  // straddles the card fold, so generateVFold draws one wedge per side.
  const dy = dir * armLength * Math.sin(angleRad);

  // Left and Right endpoints of the V
  const leftX = originX - dx;
  const rightX = originX + dx;
  const topY = originY + dy;

  // 1. Cut lines (V arms)
  addPath(g, `M ${originX} ${originY} L ${leftX} ${topY}`, cutStyle);
  addPath(g, `M ${originX} ${originY} L ${rightX} ${topY}`, cutStyle);

  // 2. V ridge (Mountain) - the central crease peaks toward the viewer. Each
  // side draws its half from the tip line to the spine root, so the two mirrored
  // wedges together form one continuous ridge crossing the card fold.
  addPath(g, `M ${originX} ${topY} L ${originX} ${originY}`, mountainStyle);

  // 3. Base folds (Valley) - where each V arm hinges back to glue flat onto its
  // page. Paired with the mountain ridge so the piece collapses flat.
  const baseFoldY = topY + dir * baseOffset;
  addPath(g, `M ${leftX} ${topY} L ${originX} ${baseFoldY}`, valleyStyle);
  addPath(g, `M ${rightX} ${topY} L ${originX} ${baseFoldY}`, valleyStyle);

  // 4. Glue Tabs (Trapezoids at the base)
  const tabLeftX = leftX - tabSize;
  const tabRightX = rightX + tabSize;

  addPolygon(g, [
    [leftX, topY],
    [tabLeftX, topY + dir * tabSize / 2],
    [originX - 5, baseFoldY + dir * tabSize / 2], // approximate tab angle
    [originX, baseFoldY]
  ], glueStyle);

  addPolygon(g, [
    [rightX, topY],
    [tabRightX, topY + dir * tabSize / 2],
    [originX + 5, baseFoldY + dir * tabSize / 2],
    [originX, baseFoldY]
  ], glueStyle);

  // Labels sit INSIDE the glue-tab quads (the only spot where text may print
  // inside the pattern — everything else must stay off the finished card).
  const tabMidY = (topY + baseFoldY) / 2 + dir * tabSize / 4;
  addText(g, (leftX + originX) / 2 - tabSize / 2, tabMidY, '풀칠', 2.2, 'middle');
  addText(g, (rightX + originX) / 2 + tabSize / 2, tabMidY, '풀칠', 2.2, 'middle');

  return { leftX, rightX, topY };
}

// Bounds for an armExtension wedge — narrower and more conservative than the
// main mouth's, since it's meant to be a long, thin protrusion (tongue, horn,
// tail, ...) glued onto the mouth's own arm faces near its ridge tip.
export const EXTENSION_LIMIT_OPTS = { angleMin: 5, angleMax: 30, armMin: 15, tabSize: 5, baseOffset: 8 };

/**
 * Generates an SVG group for a V-Fold popup mechanism
 * Math:
 * β = 2 * arcsin(k * sin(α/2)) where k=1 for symmetric (β = α)
 * h = L * sin(β/2)
 */
export const generateVFold = (svg, options = {}) => {
  const {
    cx = 105,       // Spine X (Center)
    cy = 148,       // Spine Y (Center)
    armLength = 40, // Length of the V-arms (L)
    angle = 45,     // Half-angle of the V-fold from the spine
    isColor = true,
    paperSize = 'A4',
    armExtension = null, // optional { armLength, angle } wedge glued at the ridge apex
  } = options;

  const g = addGroup(svg, 'vfold-group');

  const limits = vFoldLimits(angle, cy, paperSize);
  const clampedArmLength = clamp(armLength, limits.armMin, limits.armMax);

  // A V-fold straddles the card's fold line (the spine at cy): one arm-pair
  // glues to each panel and the mechanism creases along the spine. So draw the
  // wedge mirror-symmetrically on BOTH sides of the spine (dir −1 = top panel,
  // +1 = bottom panel). This matches the 3D pose in bookScenes.jsx, where the
  // left/right arms live on the two separate pages that meet at the spine —
  // the old single upward wedge sat entirely on one panel and could not fold
  // into that shape.
  for (const dir of [-1, 1]) {
    const wedge = drawVFoldWedge(g, { originX: cx, originY: cy, armLength: clampedArmLength, angle: limits.angle, isColor, dir });

    if (armExtension) {
      // The extension inherits whatever room its parent wedge left toward the
      // nearer page edge. cy = spineY = paperHeight/2, so the far edge is 2·cy;
      // clamp against the smaller gap so the mirrored bottom extension is bound
      // by its own (bottom) margin, not the top one.
      const extRoom = Math.min(wedge.topY, 2 * cy - wedge.topY);
      const extLimits = vFoldLimits(armExtension.angle ?? 12, extRoom, paperSize, EXTENSION_LIMIT_OPTS);
      const extArmLength = clamp(armExtension.armLength ?? 80, extLimits.armMin, extLimits.armMax);
      drawVFoldWedge(g, {
        originX: cx,
        originY: wedge.topY,
        armLength: extArmLength,
        angle: extLimits.angle,
        isColor,
        dir,
        tabSize: EXTENSION_LIMIT_OPTS.tabSize,
        baseOffset: EXTENSION_LIMIT_OPTS.baseOffset,
      });
    }
  }

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
  generateVFold(contentGroup, {
    cx: paper.width / 2,
    cy: spineY,
    ...opts,
    paperSize,
    isColor: colorMode !== 'bw',
  });
  return { svg };
}
