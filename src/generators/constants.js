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

// Line styles — dash patterns follow the international papercraft/pop-up
// notation (Yoshizawa–Randlett origami system, shared by pop-up engineering
// books): cut = SOLID, valley fold (안쪽으로 접기) = DASHED, mountain fold
// (바깥으로 접기) = DASH-DOT, glue = HATCHED area. The dash pattern alone must
// carry the meaning (B/W mode prints every line black), so the patterns are
// deliberately distinct; color (red mountain / blue valley) is a bonus cue.
// SCORE is NOT a fold or cut: it marks placement/drawing guides only.
// The hatch fills reference <pattern> defs injected by svgBuilder's
// ensureGlueHatchDefs() — every page builder must call it (createTemplate does).
export const LINE_STYLES = {
  CUT: { stroke: '#000000', strokeWidth: 0.7, dasharray: 'none', label: 'Cut', labelKo: '자르기' },
  MOUNTAIN_FOLD: { stroke: '#FF0000', strokeWidth: 0.7, dasharray: '6 1.5 1.2 1.5', label: 'Mountain Fold', labelKo: '산접기(바깥으로)' },
  VALLEY_FOLD: { stroke: '#0000FF', strokeWidth: 0.7, dasharray: '4 2', label: 'Valley Fold', labelKo: '골접기(안쪽으로)' },
  GLUE_TAB: { stroke: '#00AA00', strokeWidth: 0.5, dasharray: '1 2', fill: 'url(#glue-hatch)', label: 'Glue', labelKo: '풀칠(빗금)' },
  SCORE: { stroke: '#999999', strokeWidth: 0.4, dasharray: '0.5 1.5', label: 'Guide', labelKo: '자리 표시(자르거나 접지 않음)' },
};

// Line styles for black & white mode — identical dash patterns (the pattern IS
// the meaning), black strokes, and a black hatch for glue.
export const LINE_STYLES_BW = {
  CUT: { stroke: '#000000', strokeWidth: 0.7, dasharray: 'none', label: 'Cut', labelKo: '자르기' },
  MOUNTAIN_FOLD: { stroke: '#000000', strokeWidth: 0.7, dasharray: '6 1.5 1.2 1.5', label: 'Mountain Fold', labelKo: '산접기(바깥으로)' },
  VALLEY_FOLD: { stroke: '#000000', strokeWidth: 0.7, dasharray: '4 2', label: 'Valley Fold', labelKo: '골접기(안쪽으로)' },
  GLUE_TAB: { stroke: '#000000', strokeWidth: 0.5, dasharray: '1 2', fill: 'url(#glue-hatch-bw)', label: 'Glue', labelKo: '풀칠(빗금)' },
  SCORE: { stroke: '#555555', strokeWidth: 0.4, dasharray: '0.5 1.5', label: 'Guide', labelKo: '자리 표시(자르거나 접지 않음)' },
};

// Returns the full line-style dictionary for a given color mode.
// (Plural, dict-returning — distinct from the singular getLineStyle(type, isColor)
// helper in svgBuilder.js. Both coexist; other code depends on the singular one.)
export const getLineStyles = (colorMode = 'color') => (colorMode === 'bw' ? LINE_STYLES_BW : LINE_STYLES);

// SVG namespace
export const SVG_NS = 'http://www.w3.org/2000/svg';
