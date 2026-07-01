import { SVG_NS, LINE_STYLES, LINE_STYLES_BW, PAPER_SIZES } from './constants';

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
