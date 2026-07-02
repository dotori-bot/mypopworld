import { addPath, addPolygon, getLineStyle, addText, addGroup, createTemplate } from './svgBuilder';

/**
 * Generates an SVG group for a Box Popup mechanism
 * Math: depth MUST equal height for flat-foldability (d = h)
 */
export const generateBoxPopup = (svg, options = {}) => {
  const {
    cx = 105,       // Spine X
    cy = 148,       // Spine Y
    width = 40,     // Width of the box
    height = 30,    // Height of the box (and depth!)
    isColor = true
  } = options;

  const g = addGroup(svg, 'box-popup-group');
  
  const cutStyle = getLineStyle('CUT', isColor);
  const mountainStyle = getLineStyle('MOUNTAIN_FOLD', isColor);
  const valleyStyle = getLineStyle('VALLEY_FOLD', isColor);
  const glueStyle = getLineStyle('GLUE_TAB', isColor);

  const hw = width / 2;
  const d = height; // depth = height

  // 1. Cut Lines (Vertical sides of the box)
  addPath(g, `M ${cx - hw} ${cy - d} L ${cx - hw} ${cy + d}`, cutStyle);
  addPath(g, `M ${cx + hw} ${cy - d} L ${cx + hw} ${cy + d}`, cutStyle);
  // Horizontal cuts (Top and bottom)
  addPath(g, `M ${cx - hw} ${cy - d} L ${cx + hw} ${cy - d}`, cutStyle);
  addPath(g, `M ${cx - hw} ${cy + d} L ${cx + hw} ${cy + d}`, cutStyle);

  // 2. Spine Fold (Mountain - because the box pops out toward viewer)
  addPath(g, `M ${cx - hw} ${cy} L ${cx + hw} ${cy}`, mountainStyle);

  // 3. Base Folds (Valley - where box attaches to the flat card)
  addPath(g, `M ${cx - hw} ${cy - d} L ${cx + hw} ${cy - d}`, valleyStyle);
  addPath(g, `M ${cx - hw} ${cy + d} L ${cx + hw} ${cy + d}`, valleyStyle);

  // 4. Glue Tabs (Sides)
  const tabW = 6;
  addPolygon(g, [
    [cx - hw, cy - d],
    [cx - hw - tabW, cy - d + tabW/2],
    [cx - hw - tabW, cy + d - tabW/2],
    [cx - hw, cy + d]
  ], glueStyle);

  addPolygon(g, [
    [cx + hw, cy - d],
    [cx + hw + tabW, cy - d + tabW/2],
    [cx + hw + tabW, cy + d - tabW/2],
    [cx + hw, cy + d]
  ], glueStyle);

  addText(g, cx, cy - d + 4, '상자 팝업 (Box)', 3, 'middle');

  return g;
};

/**
 * Render Box Popup onto a complete printable SVG template (page outline + spine).
 * @param {Object} [params={}]
 * @param {'A4'|'LETTER'} [params.paperSize='A4']
 * @param {'color'|'bw'} [params.colorMode='color']
 * @returns {{ svg: SVGSVGElement }}
 */
export function renderBoxPopup(params = {}) {
  const { paperSize = 'A4', colorMode = 'color', ...opts } = params;
  const { svg, contentGroup, paper, spineY } = createTemplate(paperSize, colorMode);
  generateBoxPopup(contentGroup, {
    cx: paper.width / 2,
    cy: spineY,
    ...opts,
    isColor: colorMode !== 'bw',
  });
  return { svg };
}
