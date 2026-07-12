import { SVG_NS, LINE_STYLES, LINE_STYLES_BW, PAPER_SIZES, PRINT, getLineStyles } from './constants';

export const getLineStyle = (type, isColor) => {
  const styles = isColor ? LINE_STYLES : LINE_STYLES_BW;
  return styles[type] || styles.CUT;
};

export const createSVG = (width, height) => {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('width', `${width}mm`);
  svg.setAttribute('height', `${height}mm`);
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  svg.setAttribute('xmlns', SVG_NS);
  return svg;
};

export const applyStyle = (el, style) => {
  if (style.stroke) el.setAttribute('stroke', style.stroke);
  if (style.strokeWidth) el.setAttribute('stroke-width', style.strokeWidth);
  if (style.dasharray && style.dasharray !== 'none') el.setAttribute('stroke-dasharray', style.dasharray);
  if (style.fill) el.setAttribute('fill', style.fill);
  else el.setAttribute('fill', 'none');
};

export const addLine = (svg, x1, y1, x2, y2, style) => {
  const line = document.createElementNS(SVG_NS, 'line');
  line.setAttribute('x1', x1);
  line.setAttribute('y1', y1);
  line.setAttribute('x2', x2);
  line.setAttribute('y2', y2);
  applyStyle(line, style);
  svg.appendChild(line);
  return line;
};

export const addPath = (svg, d, style) => {
  const path = document.createElementNS(SVG_NS, 'path');
  path.setAttribute('d', d);
  applyStyle(path, style);
  svg.appendChild(path);
  return path;
};

export const addPolygon = (svg, points, style) => {
  const poly = document.createElementNS(SVG_NS, 'polygon');
  poly.setAttribute('points', points.map(p => p.join(',')).join(' '));
  applyStyle(poly, style);
  svg.appendChild(poly);
  return poly;
};

export const addRect = (svg, x, y, w, h, style) => {
  const rect = document.createElementNS(SVG_NS, 'rect');
  rect.setAttribute('x', x);
  rect.setAttribute('y', y);
  rect.setAttribute('width', w);
  rect.setAttribute('height', h);
  applyStyle(rect, style);
  svg.appendChild(rect);
  return rect;
};

export const addText = (svg, x, y, textStr, fontSize = 3, align = 'start') => {
  const text = document.createElementNS(SVG_NS, 'text');
  text.setAttribute('x', x);
  text.setAttribute('y', y);
  text.setAttribute('font-family', 'sans-serif');
  text.setAttribute('font-size', fontSize);
  text.setAttribute('text-anchor', align);
  text.setAttribute('fill', '#000000');
  text.textContent = textStr;
  svg.appendChild(text);
  return text;
};

export const addGroup = (svg, id) => {
  const g = document.createElementNS(SVG_NS, 'g');
  if (id) g.setAttribute('id', id);
  svg.appendChild(g);
  return g;
};

/**
 * Paint the user's card-skin (solid colour or uploaded image) UNDER a finished
 * pattern page: a background covering the sheet's trim area (inside
 * PRINT.MARGIN — the material that actually becomes the card), inserted as the
 * page's first child so every cut/fold/glue mark stays printed on top of it.
 *
 * @param {SVGSVGElement} svg - A finished page (createTemplate-based or the
 *   gate-curtain's own page — anything whose root children are page marks).
 * @param {{width:number,height:number}} paper - Page size in mm.
 * @param {{type:'none'|'color'|'image', color?:string, image?:string}} skin
 */
export const paintCardSkin = (svg, paper, skin) => {
  if (!skin || skin.type === 'none') return;
  const x = PRINT.MARGIN;
  const y = PRINT.MARGIN;
  const w = paper.width - 2 * PRINT.MARGIN;
  const h = paper.height - 2 * PRINT.MARGIN;

  const g = document.createElementNS(SVG_NS, 'g');
  g.setAttribute('id', 'card-skin');

  if (skin.type === 'color' && skin.color) {
    const rect = document.createElementNS(SVG_NS, 'rect');
    rect.setAttribute('x', x);
    rect.setAttribute('y', y);
    rect.setAttribute('width', w);
    rect.setAttribute('height', h);
    rect.setAttribute('fill', skin.color);
    g.appendChild(rect);
  } else if (skin.type === 'image' && skin.image) {
    const img = document.createElementNS(SVG_NS, 'image');
    img.setAttribute('href', skin.image);
    img.setAttribute('x', x);
    img.setAttribute('y', y);
    img.setAttribute('width', w);
    img.setAttribute('height', h);
    img.setAttribute('preserveAspectRatio', 'xMidYMid slice'); // cover-crop
    g.appendChild(img);
    // Thin white veil so black cut lines stay readable over busy photos.
    const veil = document.createElementNS(SVG_NS, 'rect');
    veil.setAttribute('x', x);
    veil.setAttribute('y', y);
    veil.setAttribute('width', w);
    veil.setAttribute('height', h);
    veil.setAttribute('fill', 'rgba(255,255,255,0.18)');
    g.appendChild(veil);
  } else {
    return;
  }
  svg.insertBefore(g, svg.firstChild);
};

export const svgToString = (svg) => {
  const serializer = new XMLSerializer();
  return serializer.serializeToString(svg);
};

/**
 * Build the shared base card page every mechanism renders into:
 * a printable page at the given paper size, with a print-safe-margin cut
 * guide (the sheet's outer trim line) and a center spine valley-fold line
 * (the line the paper folds along to become the card, per CARD_SIZES).
 *
 * @param {'A4'|'LETTER'} [paperSizeKey='A4']
 * @param {'color'|'bw'} [colorMode='color']
 * @returns {{ svg: SVGSVGElement, contentGroup: SVGGElement, paper: {width:number,height:number,name:string}, spineY: number, styles: object }}
 */
export const createTemplate = (paperSizeKey = 'A4', colorMode = 'color') => {
  const paper = PAPER_SIZES[paperSizeKey] || PAPER_SIZES.A4;
  const svg = createSVG(paper.width, paper.height);
  const styles = getLineStyles(colorMode);
  const spineY = paper.height / 2;

  // Trim/cut guide at the print-safe margin — this is the sheet's outer cut line
  addRect(svg, PRINT.MARGIN, PRINT.MARGIN, paper.width - 2 * PRINT.MARGIN, paper.height - 2 * PRINT.MARGIN, styles.CUT);
  // Center spine — the paper folds in half along this line to become the card (see CARD_SIZES)
  addPath(svg, `M ${PRINT.MARGIN} ${spineY} L ${paper.width - PRINT.MARGIN} ${spineY}`, styles.VALLEY_FOLD);

  const contentGroup = addGroup(svg, 'content');
  return { svg, contentGroup, paper, spineY, styles };
};
