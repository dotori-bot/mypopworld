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

export const svgToString = (svg) => {
  const serializer = new XMLSerializer();
  return serializer.serializeToString(svg);
};

/**
 * Inject the diagonal-hatch <pattern> defs that GLUE_TAB fills reference
 * (`url(#glue-hatch)` / `url(#glue-hatch-bw)`). Idempotent. Every page builder
 * must call this once per <svg> — createTemplate does; generators that build
 * their own page (e.g. gateCurtain) must call it themselves.
 * @param {SVGSVGElement} svg
 */
export const ensureGlueHatchDefs = (svg) => {
  if (svg.querySelector('#glue-hatch')) return;
  const defs = document.createElementNS(SVG_NS, 'defs');
  const mk = (id, color) => {
    const p = document.createElementNS(SVG_NS, 'pattern');
    p.setAttribute('id', id);
    p.setAttribute('patternUnits', 'userSpaceOnUse');
    p.setAttribute('width', 2);
    p.setAttribute('height', 2);
    p.setAttribute('patternTransform', 'rotate(45)');
    const l = document.createElementNS(SVG_NS, 'line');
    l.setAttribute('x1', 0); l.setAttribute('y1', 0);
    l.setAttribute('x2', 0); l.setAttribute('y2', 2);
    l.setAttribute('stroke', color);
    l.setAttribute('stroke-width', 0.4);
    p.appendChild(l);
    defs.appendChild(p);
  };
  mk('glue-hatch', 'rgba(0,170,0,0.55)');
  mk('glue-hatch-bw', 'rgba(0,0,0,0.35)');
  svg.insertBefore(defs, svg.firstChild);
};

/**
 * Draw the line-style legend in the bottom waste margin (below the trim line,
 * outside the finished card). One horizontal row: a sample of each line style
 * with its Korean meaning, so every printed sheet is self-describing — in B/W
 * mode too, where the dash pattern is the only cue.
 * @param {SVGSVGElement|SVGGElement} svg
 * @param {'A4'|'LETTER'} [paperSizeKey='A4']
 * @param {'color'|'bw'} [colorMode='color']
 */
export const addLegend = (svg, paperSizeKey = 'A4', colorMode = 'color') => {
  const paper = PAPER_SIZES[paperSizeKey] || PAPER_SIZES.A4;
  const styles = getLineStyles(colorMode);
  const y = paper.height - PRINT.MARGIN + 2.2; // inside the bottom waste band
  const fontSize = 2.4;
  const seg = 9;         // sample line length (mm)
  const g = addGroup(svg, 'line-legend');

  const items = [
    ['CUT', styles.CUT.labelKo],
    ['VALLEY_FOLD', styles.VALLEY_FOLD.labelKo],
    ['MOUNTAIN_FOLD', styles.MOUNTAIN_FOLD.labelKo],
    ['GLUE_TAB', styles.GLUE_TAB.labelKo],
    ['SCORE', styles.SCORE.labelKo],
  ];
  // Measure-free layout: fixed slot per item, centered as a row.
  const slotW = (paper.width - 2 * PRINT.MARGIN) / items.length;
  items.forEach(([key, label], i) => {
    const x0 = PRINT.MARGIN + i * slotW;
    const st = styles[key];
    if (key === 'GLUE_TAB') {
      addRect(g, x0, y - 1.6, seg, 3.2, st);
    } else {
      addLine(g, x0, y, x0 + seg, y, st);
    }
    addText(g, x0 + seg + 1.5, y + 1, label, fontSize, 'start');
  });
  return g;
};

/**
 * Build the shared base card page every mechanism renders into:
 * a printable page at the given paper size, with a print-safe-margin cut
 * guide (the sheet's outer trim line), a center spine valley-fold line
 * (the line the paper folds along to become the card, per CARD_SIZES), and
 * the line-style legend in the bottom waste margin.
 *
 * A line may carry exactly ONE meaning, so the spine valley must not be
 * printed where a mechanism claims that segment for its own fold (or where a
 * loose part crosses it on a parts-only sheet):
 *   - `spine: false` omits the spine entirely (parts-only sheets that never
 *     fold into a card, e.g. volvelle / flip-disc / straw-rocket).
 *   - `spineGaps: [[x1,x2], …]` skips those x-intervals so the mechanism can
 *     draw its own fold there (e.g. box-popup's mountain segment).
 *
 * @param {'A4'|'LETTER'} [paperSizeKey='A4']
 * @param {'color'|'bw'} [colorMode='color']
 * @param {{ spine?: boolean, spineGaps?: Array<[number, number]> }} [options]
 * @returns {{ svg: SVGSVGElement, contentGroup: SVGGElement, paper: {width:number,height:number,name:string}, spineY: number, styles: object }}
 */
export const createTemplate = (paperSizeKey = 'A4', colorMode = 'color', options = {}) => {
  const { spine = true, spineGaps = [] } = options;
  const paper = PAPER_SIZES[paperSizeKey] || PAPER_SIZES.A4;
  const svg = createSVG(paper.width, paper.height);
  const styles = getLineStyles(colorMode);
  const spineY = paper.height / 2;

  ensureGlueHatchDefs(svg);

  // Trim/cut guide at the print-safe margin — this is the sheet's outer cut line
  addRect(svg, PRINT.MARGIN, PRINT.MARGIN, paper.width - 2 * PRINT.MARGIN, paper.height - 2 * PRINT.MARGIN, styles.CUT);

  // Center spine — the paper folds in half along this line to become the card
  // (see CARD_SIZES), drawn as segments around any mechanism-claimed gaps.
  if (spine) {
    const gaps = [...spineGaps]
      .map(([a, b]) => [Math.min(a, b), Math.max(a, b)])
      .sort((a, b) => a[0] - b[0]);
    let x = PRINT.MARGIN;
    const xEnd = paper.width - PRINT.MARGIN;
    for (const [gA, gB] of gaps) {
      if (gA > x) addPath(svg, `M ${x} ${spineY} L ${Math.min(gA, xEnd)} ${spineY}`, styles.VALLEY_FOLD);
      x = Math.max(x, gB);
    }
    if (x < xEnd) addPath(svg, `M ${x} ${spineY} L ${xEnd} ${spineY}`, styles.VALLEY_FOLD);
  }

  addLegend(svg, paperSizeKey, colorMode);

  const contentGroup = addGroup(svg, 'content');
  return { svg, contentGroup, paper, spineY, styles };
};
