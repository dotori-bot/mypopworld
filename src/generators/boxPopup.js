import { addPath, addPolygon, getLineStyle, addText, addGroup, createTemplate } from './svgBuilder';
import { PAPER_SIZES, PRINT } from './constants';

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

  // 1. Cut Lines (Vertical sides of the box only). The top/bottom edges at
  // cy-d and cy+d must stay UNCUT -- they're where the box panel attaches to
  // the surrounding card (see Base Folds below). Cutting them too would fully
  // detach the panel and the pop-up would have nothing to hold it up.
  addPath(g, `M ${cx - hw} ${cy - d} L ${cx - hw} ${cy + d}`, cutStyle);
  addPath(g, `M ${cx + hw} ${cy - d} L ${cx + hw} ${cy + d}`, cutStyle);

  // 2. Spine Fold (Mountain - because the box pops out toward viewer).
  // The template's card-spine VALLEY is gapped over this span (see
  // renderBoxPopup) — the same line can't be printed as both mountain and
  // valley.
  addPath(g, `M ${cx - hw} ${cy} L ${cx + hw} ${cy}`, mountainStyle);

  // 3. Base Folds (Valley - where box attaches to the flat card)
  addPath(g, `M ${cx - hw} ${cy - d} L ${cx + hw} ${cy - d}`, valleyStyle);
  addPath(g, `M ${cx - hw} ${cy + d} L ${cx + hw} ${cy + d}`, valleyStyle);

  // (No side glue tabs: the classic box popup needs none — panel + spine
  // mountain + base valleys form the box when the card opens. The tabs
  // previously drawn here sat OUTSIDE the vertical cut lines, i.e. on the
  // surrounding card, where gluing does nothing; they only confused users.)

  // Title lives in the outer waste margin (above the trim line): the whole
  // page is the card here, so any text inside the trim rect would show on
  // the finished card.
  addText(g, cx, PRINT.MARGIN - 1.5, '상자 팝업 (Box)', 3, 'middle');

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
  // Gap the template's spine valley over the box width: that segment is the
  // box's MOUNTAIN crease (drawn by generateBoxPopup) — one line, one meaning.
  const w = typeof opts.width === 'number' && Number.isFinite(opts.width) ? opts.width : 40;
  const cxPage = (PAPER_SIZES[paperSize] || PAPER_SIZES.A4).width / 2;
  const { svg, contentGroup, paper, spineY } = createTemplate(paperSize, colorMode, {
    spineGaps: [[cxPage - w / 2, cxPage + w / 2]],
  });
  generateBoxPopup(contentGroup, {
    cx: paper.width / 2,
    cy: spineY,
    ...opts,
    isColor: colorMode !== 'bw',
  });
  return { svg };
}
