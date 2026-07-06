/**
 * @fileoverview Card data-model helpers — the single place that understands
 * both cardParams shapes:
 *
 *   v1 (AI chat + original expert mode): { mechanism, theme, params, ... }
 *   v2 (multi-mechanism expert mode):    { version: 2, theme, elements: [
 *        { id, mechanism, params, placement: { spineOffset } } ] }
 *
 * Every consumer (SVGPreview, Preview3D, Instructions, PDF export) goes
 * through getElements() so the rest of the app never branches on the
 * version. The AI flow keeps emitting v1 untouched; getElements wraps it
 * into a single-element list on the fly.
 *
 * `placement.spineOffset` is the element's centre offset along the spine
 * (the horizontal fold line at paper.height/2), in mm; 0 = card centre.
 *
 * @module store/cardModel
 */

let nextId = 1;

/** Fresh unique element id (session-local — the model is not persisted yet). */
export function makeElementId() {
  return `el-${nextId++}`;
}

/**
 * Normalize any cardParams shape to an element list.
 * @param {object|null} cardParams
 * @returns {Array<{ id: string, mechanism: string, params: object|undefined, placement: { spineOffset: number } }>}
 */
export function getElements(cardParams) {
  if (!cardParams) return [];
  if (Array.isArray(cardParams.elements)) {
    return cardParams.elements.map((el) => ({
      placement: { spineOffset: 0 },
      ...el,
      placement: { spineOffset: 0, ...el.placement },
    }));
  }
  if (!cardParams.mechanism) return [];
  return [
    {
      id: 'main',
      mechanism: cardParams.mechanism,
      params: cardParams.params,
      placement: { spineOffset: 0 },
    },
  ];
}

/** True when cardParams is the v2 multi-element shape. */
export function isMultiElement(cardParams) {
  return Array.isArray(cardParams?.elements);
}

/**
 * Produce a v2 cardParams from an element list, preserving theme/prompt
 * metadata from the previous cardParams (v1 or v2).
 */
export function withElements(cardParams, elements) {
  const { mechanism, params, ...rest } = cardParams || {};
  return { ...rest, version: 2, elements };
}
