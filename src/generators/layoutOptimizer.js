import { addPath, getLineStyle, addText, addGroup, addRect } from './svgBuilder';

/**
 * Generates layout optimized SVG pages with borders and legends
 */
export const buildFinalTemplate = (paperSizeKey = 'A4', isColor = true, mechanisms = []) => {
  // Simple mock implementation of final layout builder
  // In reality, this would use bin packing to place multiple mechanisms onto pages.
  
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(SVG_NS, 'svg');
  
  const w = paperSizeKey === 'A4' ? 210 : 215.9;
  const h = paperSizeKey === 'A4' ? 297 : 279.4;
  
  svg.setAttribute('width', `${w}mm`);
  svg.setAttribute('height', `${h}mm`);
  svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
  
  // Card outline
  const cutStyle = getLineStyle('CUT', isColor);
  const valleyStyle = getLineStyle('VALLEY_FOLD', isColor);
  
  // Outer frame
  addRect(svg, 5, 5, w - 10, h - 10, cutStyle);
  
  // Center fold
  addPath(svg, `M 5 ${h/2} L ${w-5} ${h/2}`, valleyStyle);
  
  addText(svg, w/2, 10, "MyPopWorld - 팝업 카드 도안", 5, 'middle');
  
  return svg;
};
