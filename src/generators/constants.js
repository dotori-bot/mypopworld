// Paper sizes in mm
export const PAPER_SIZES = {
  A4: { width: 210, height: 297, name: 'A4' },
  LETTER: { width: 215.9, height: 279.4, name: 'US Letter' },
};

// Card dimensions (paper folded in half - fold along the HEIGHT)
export const CARD_SIZES = {
  A4: { width: 210, height: 148.5 },
  LETTER: { width: 215.9, height: 139.7 },
};

// Print settings
export const PRINT = {
  MARGIN: 5,           // mm safe margin
  MIN_LINE_WEIGHT: 0.7, // mm (≈ 2pt)
  BLEED: 3,            // mm
};

// Line styles for color mode
export const LINE_STYLES = {
  CUT: { stroke: '#000000', strokeWidth: 0.7, dasharray: 'none', label: 'Cut', labelKo: '자르기' },
  MOUNTAIN_FOLD: { stroke: '#FF0000', strokeWidth: 0.7, dasharray: '4 2', label: 'Mountain Fold', labelKo: '산접기' },
  VALLEY_FOLD: { stroke: '#0000FF', strokeWidth: 0.7, dasharray: '4 1 1 1', label: 'Valley Fold', labelKo: '골접기' },
  GLUE_TAB: { stroke: '#00AA00', strokeWidth: 0.5, dasharray: '1 2', fill: 'rgba(0,170,0,0.1)', label: 'Glue Tab', labelKo: '풀칠' },
  SCORE: { stroke: '#888888', strokeWidth: 0.5, dasharray: '8 3', label: 'Score Line', labelKo: '골내기' },
};

// Line styles for black & white mode
export const LINE_STYLES_BW = {
  CUT: { stroke: '#000000', strokeWidth: 0.7, dasharray: 'none', label: 'Cut', labelKo: '자르기' },
  MOUNTAIN_FOLD: { stroke: '#000000', strokeWidth: 0.7, dasharray: '4 2', label: 'Mountain Fold', labelKo: '산접기' },
  VALLEY_FOLD: { stroke: '#000000', strokeWidth: 0.7, dasharray: '4 1 1 1', label: 'Valley Fold', labelKo: '골접기' },
  GLUE_TAB: { stroke: '#000000', strokeWidth: 0.5, dasharray: '1 2', fill: 'rgba(0,0,0,0.05)', label: 'Glue Tab', labelKo: '풀칠' },
  SCORE: { stroke: '#555555', strokeWidth: 0.5, dasharray: '8 3', label: 'Score Line', labelKo: '골내기' },
};

// Returns the full line-style dictionary for a given color mode.
// (Plural, dict-returning — distinct from the singular getLineStyle(type, isColor)
// helper in svgBuilder.js. Both coexist; other code depends on the singular one.)
export const getLineStyles = (colorMode = 'color') => (colorMode === 'bw' ? LINE_STYLES_BW : LINE_STYLES);

// SVG namespace
export const SVG_NS = 'http://www.w3.org/2000/svg';
