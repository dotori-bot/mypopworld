import { addPath, addPolygon, getLineStyle, addText, addGroup } from './svgBuilder';

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
    isColor = true
  } = options;

  const g = addGroup(svg, 'vfold-group');
  
  const cutStyle = getLineStyle('CUT', isColor);
  const mountainStyle = getLineStyle('MOUNTAIN_FOLD', isColor);
  const valleyStyle = getLineStyle('VALLEY_FOLD', isColor);
  const glueStyle = getLineStyle('GLUE_TAB', isColor);

  const angleRad = (angle * Math.PI) / 180;
  const dx = armLength * Math.cos(angleRad);
  const dy = armLength * Math.sin(angleRad);

  // Left and Right endpoints of the V
  const leftX = cx - dx;
  const rightX = cx + dx;
  const topY = cy - dy;

  // 1. Cut lines (V arms)
  addPath(g, `M ${cx} ${cy} L ${leftX} ${topY}`, cutStyle);
  addPath(g, `M ${cx} ${cy} L ${rightX} ${topY}`, cutStyle);

  // 2. Spine Fold (Valley) - only where the V-fold spans
  addPath(g, `M ${cx} ${topY} L ${cx} ${cy}`, valleyStyle);

  // 3. Mountain Folds (at the base of the V arms where they attach to the card)
  // Normally the base card folds. The V-fold itself is a separate piece or cut from the card.
  // Assuming a pop-up piece cut OUT of the card:
  const baseFoldY = topY - 15; 
  // Wait, standard V-fold cut from center:
  // Base folds parallel to spine? No, V-fold bases are angled.
  addPath(g, `M ${leftX} ${topY} L ${cx} ${baseFoldY}`, mountainStyle);
  addPath(g, `M ${rightX} ${topY} L ${cx} ${baseFoldY}`, mountainStyle);

  // 4. Glue Tabs (Trapezoids at the base)
  const tabSize = 8;
  const tabLeftX = leftX - tabSize;
  const tabRightX = rightX + tabSize;
  
  addPolygon(g, [
    [leftX, topY],
    [tabLeftX, topY - tabSize/2],
    [cx - 5, baseFoldY - tabSize/2], // approximate tab angle
    [cx, baseFoldY]
  ], glueStyle);
  
  addPolygon(g, [
    [rightX, topY],
    [tabRightX, topY - tabSize/2],
    [cx + 5, baseFoldY - tabSize/2],
    [cx, baseFoldY]
  ], glueStyle);

  addText(g, leftX - 10, topY - 5, '풀칠', 2.5);
  addText(g, rightX + 2, topY - 5, '풀칠', 2.5);

  return g;
};
