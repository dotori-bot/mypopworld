/**
 * @fileoverview Decoration SVG element generators for popup cards.
 * Provides simple, kid-friendly decorative shapes as SVG path data.
 * Each function returns an SVG path "d" string that can be added to templates.
 * All coordinates are in mm. Minimum line weight: 0.7mm.
 *
 * @module generators/decorations
 */

import { round, polarToCartesian } from '../utils/math.js';

/**
 * @typedef {'color'|'bw'} ColorMode
 */

/**
 * Get fill colour based on colour mode.
 * @param {string} colorFill   - Fill colour for colour mode
 * @param {ColorMode} [mode='color']
 * @returns {string}
 */
function getFill(colorFill, mode = 'color') {
  return mode === 'bw' ? 'none' : colorFill;
}

/**
 * Get stroke colour based on colour mode.
 * @param {string} colorStroke
 * @param {ColorMode} [mode='color']
 * @returns {string}
 */
function getStroke(colorStroke, mode = 'color') {
  return mode === 'bw' ? '#000000' : colorStroke;
}

// ─── Stars ──────────────────────────────────────────────────────────

/**
 * Generate a star shape.
 * @param {number} cx      - Centre X (mm)
 * @param {number} cy      - Centre Y (mm)
 * @param {number} outerR  - Outer radius (mm)
 * @param {number} innerR  - Inner radius (mm)
 * @param {number} [points=5] - Number of points
 * @param {ColorMode} [colorMode='color']
 * @returns {{ d: string, fill: string, stroke: string, strokeWidth: number }}
 */
export function generateStar(cx, cy, outerR, innerR, points = 5, colorMode = 'color') {
  const step = 360 / points;
  const pathParts = [];

  for (let i = 0; i < points; i++) {
    const outerAngle = step * i - 90; // start at top
    const innerAngle = outerAngle + step / 2;
    const op = polarToCartesian(cx, cy, outerR, outerAngle + 90);
    const ip = polarToCartesian(cx, cy, innerR, innerAngle + 90);
    if (i === 0) {
      pathParts.push(`M ${round(op.x)} ${round(op.y)}`);
    } else {
      pathParts.push(`L ${round(op.x)} ${round(op.y)}`);
    }
    pathParts.push(`L ${round(ip.x)} ${round(ip.y)}`);
  }
  pathParts.push('Z');

  return {
    d: pathParts.join(' '),
    fill: getFill('#FFD700', colorMode),
    stroke: getStroke('#DAA520', colorMode),
    strokeWidth: 0.7,
  };
}

// ─── Heart ──────────────────────────────────────────────────────────

/**
 * Generate a heart shape using cubic Bézier curves.
 * @param {number} cx   - Centre X (mm)
 * @param {number} cy   - Centre Y (mm)
 * @param {number} size - Overall size (mm)
 * @param {ColorMode} [colorMode='color']
 * @returns {{ d: string, fill: string, stroke: string, strokeWidth: number }}
 */
export function generateHeart(cx, cy, size, colorMode = 'color') {
  const s = size / 2;
  // Heart path: tip at bottom, two bumps at top
  const d = [
    `M ${round(cx)} ${round(cy + s * 0.8)}`, // bottom tip
    `C ${round(cx - s * 1.5)} ${round(cy + s * 0.1)},`,
    `  ${round(cx - s * 0.8)} ${round(cy - s)},`,
    `  ${round(cx)} ${round(cy - s * 0.3)}`,
    `C ${round(cx + s * 0.8)} ${round(cy - s)},`,
    `  ${round(cx + s * 1.5)} ${round(cy + s * 0.1)},`,
    `  ${round(cx)} ${round(cy + s * 0.8)}`,
    'Z',
  ].join(' ');

  return {
    d,
    fill: getFill('#FF6B8A', colorMode),
    stroke: getStroke('#E74C6F', colorMode),
    strokeWidth: 0.7,
  };
}

