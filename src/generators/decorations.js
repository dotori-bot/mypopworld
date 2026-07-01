/**
 * @fileoverview Decoration SVG element generators for popup cards.
 * Provides simple, kid-friendly decorative shapes as SVG path data.
 * Each function returns an SVG path "d" string that can be added to templates.
 * All coordinates are in mm. Minimum line weight: 0.7mm.
 *
 * @module generators/decorations
 */

import { round, degToRad, polarToCartesian } from '../utils/math.js';

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

// ─── Flower ─────────────────────────────────────────────────────────

/**
 * Generate a simple flower with circular petals.
 * @param {number} cx        - Centre X (mm)
 * @param {number} cy        - Centre Y (mm)
 * @param {number} petalR    - Petal radius (mm)
 * @param {number} [petalCount=6]
 * @param {ColorMode} [colorMode='color']
 * @returns {{ petals: Array<{ cx: number, cy: number, r: number, fill: string, stroke: string }>, center: { cx: number, cy: number, r: number, fill: string, stroke: string }, strokeWidth: number }}
 */
export function generateFlower(cx, cy, petalR, petalCount = 6, colorMode = 'color') {
  const petals = [];
  const centerDist = petalR * 0.8;

  for (let i = 0; i < petalCount; i++) {
    const angle = (360 / petalCount) * i;
    const p = polarToCartesian(cx, cy, centerDist, angle);
    petals.push({
      cx: round(p.x),
      cy: round(p.y),
      r: round(petalR),
      fill: getFill('#FF99CC', colorMode),
      stroke: getStroke('#E878A8', colorMode),
    });
  }

  return {
    petals,
    center: {
      cx: round(cx),
      cy: round(cy),
      r: round(petalR * 0.4),
      fill: getFill('#FFDD44', colorMode),
      stroke: getStroke('#DAA520', colorMode),
    },
    strokeWidth: 0.7,
  };
}

// ─── Cloud ──────────────────────────────────────────────────────────

/**
 * Generate a cloud shape using circular arcs.
 * @param {number} cx     - Centre X (mm)
 * @param {number} cy     - Centre Y (mm)
 * @param {number} width  - Overall width (mm)
 * @param {number} height - Overall height (mm)
 * @param {ColorMode} [colorMode='color']
 * @returns {{ d: string, fill: string, stroke: string, strokeWidth: number }}
 */
export function generateCloud(cx, cy, width, height, colorMode = 'color') {
  const w = width / 2;
  const h = height / 2;
  // Cloud composed of overlapping bumps
  const d = [
    `M ${round(cx - w * 0.7)} ${round(cy + h * 0.3)}`,
    `Q ${round(cx - w)} ${round(cy - h * 0.2)} ${round(cx - w * 0.5)} ${round(cy - h * 0.5)}`,
    `Q ${round(cx - w * 0.3)} ${round(cy - h)} ${round(cx)} ${round(cy - h * 0.6)}`,
    `Q ${round(cx + w * 0.3)} ${round(cy - h)} ${round(cx + w * 0.5)} ${round(cy - h * 0.5)}`,
    `Q ${round(cx + w)} ${round(cy - h * 0.2)} ${round(cx + w * 0.7)} ${round(cy + h * 0.3)}`,
    `Q ${round(cx + w * 0.8)} ${round(cy + h * 0.6)} ${round(cx + w * 0.3)} ${round(cy + h * 0.5)}`,
    `L ${round(cx - w * 0.3)} ${round(cy + h * 0.5)}`,
    `Q ${round(cx - w * 0.8)} ${round(cy + h * 0.6)} ${round(cx - w * 0.7)} ${round(cy + h * 0.3)}`,
    'Z',
  ].join(' ');

  return {
    d,
    fill: getFill('#E8F0FE', colorMode),
    stroke: getStroke('#90B4E0', colorMode),
    strokeWidth: 0.7,
  };
}

// ─── Tree ───────────────────────────────────────────────────────────

/**
 * Generate a simple tree (triangle canopy + rectangle trunk).
 * @param {number} cx     - Centre X (mm)
 * @param {number} cy     - Centre Y (base centre, mm)
 * @param {number} height - Total height (mm)
 * @param {ColorMode} [colorMode='color']
 * @returns {{ canopy: { d: string, fill: string, stroke: string }, trunk: { d: string, fill: string, stroke: string }, strokeWidth: number }}
 */
export function generateTree(cx, cy, height, colorMode = 'color') {
  const trunkH = height * 0.3;
  const trunkW = height * 0.1;
  const canopyH = height * 0.75;
  const canopyW = height * 0.5;

  const trunkD = [
    `M ${round(cx - trunkW / 2)} ${round(cy)}`,
    `L ${round(cx + trunkW / 2)} ${round(cy)}`,
    `L ${round(cx + trunkW / 2)} ${round(cy - trunkH)}`,
    `L ${round(cx - trunkW / 2)} ${round(cy - trunkH)}`,
    'Z',
  ].join(' ');

  const canopyD = [
    `M ${round(cx)} ${round(cy - height)}`,           // top point
    `L ${round(cx + canopyW / 2)} ${round(cy - trunkH * 0.8)}`, // bottom right
    `L ${round(cx - canopyW / 2)} ${round(cy - trunkH * 0.8)}`, // bottom left
    'Z',
  ].join(' ');

  return {
    canopy: {
      d: canopyD,
      fill: getFill('#4CAF50', colorMode),
      stroke: getStroke('#2E7D32', colorMode),
    },
    trunk: {
      d: trunkD,
      fill: getFill('#8D6E63', colorMode),
      stroke: getStroke('#5D4037', colorMode),
    },
    strokeWidth: 0.7,
  };
}

// ─── Balloon ────────────────────────────────────────────────────────

/**
 * Generate a balloon shape (oval + string).
 * @param {number} cx   - Centre X (mm)
 * @param {number} cy   - Centre Y (balloon centre, mm)
 * @param {number} size - Overall size (mm)
 * @param {ColorMode} [colorMode='color']
 * @returns {{ balloon: { d: string, fill: string, stroke: string }, string: { d: string, stroke: string }, strokeWidth: number }}
 */
export function generateBalloon(cx, cy, size, colorMode = 'color') {
  const rx = size * 0.35;
  const ry = size * 0.45;
  const knotY = cy + ry;
  const stringEndY = knotY + size * 0.4;

  // Balloon body as ellipse path
  const balloonD = [
    `M ${round(cx)} ${round(cy - ry)}`,
    `C ${round(cx + rx * 1.3)} ${round(cy - ry)},`,
    `  ${round(cx + rx * 1.3)} ${round(cy + ry * 0.9)},`,
    `  ${round(cx)} ${round(knotY)}`,
    `C ${round(cx - rx * 1.3)} ${round(cy + ry * 0.9)},`,
    `  ${round(cx - rx * 1.3)} ${round(cy - ry)},`,
    `  ${round(cx)} ${round(cy - ry)}`,
    'Z',
  ].join(' ');

  // Small triangle knot
  const knotD = [
    `M ${round(cx)} ${round(knotY)}`,
    `L ${round(cx - 1)} ${round(knotY + 1.5)}`,
    `L ${round(cx + 1)} ${round(knotY + 1.5)}`,
    'Z',
  ].join(' ');

  // Wavy string
  const stringD = [
    `M ${round(cx)} ${round(knotY + 1.5)}`,
    `Q ${round(cx + 2)} ${round(knotY + size * 0.2)},`,
    `  ${round(cx)} ${round(knotY + size * 0.3)}`,
    `Q ${round(cx - 1.5)} ${round(knotY + size * 0.35)},`,
    `  ${round(cx)} ${round(stringEndY)}`,
  ].join(' ');

  return {
    balloon: {
      d: balloonD + ' ' + knotD,
      fill: getFill('#FF6B6B', colorMode),
      stroke: getStroke('#E74C3C', colorMode),
    },
    string: {
      d: stringD,
      stroke: getStroke('#999999', colorMode),
    },
    strokeWidth: 0.7,
  };
}

// ─── Cake ───────────────────────────────────────────────────────────

/**
 * Generate a birthday cake with layers and candles.
 * @param {number} cx      - Centre X (mm)
 * @param {number} cy      - Centre Y (base centre, mm)
 * @param {number} width   - Cake width (mm)
 * @param {number} height  - Cake height (mm, excluding candles)
 * @param {number} [layers=2]   - Number of layers
 * @param {number} [candles=3]  - Number of candles
 * @param {ColorMode} [colorMode='color']
 * @returns {{ layers: Array<{ d: string, fill: string, stroke: string }>, candles: Array<{ stick: string, flame: string, flameStroke: string, stickStroke: string }>, strokeWidth: number }}
 */
export function generateCake(cx, cy, width, height, layers = 2, candles = 3, colorMode = 'color') {
  const layerH = height / layers;
  const layerColors = ['#FFCCBC', '#FFE0B2', '#FFF9C4', '#C8E6C9'];
  const layerResults = [];

  for (let i = 0; i < layers; i++) {
    const w = width - (i * width * 0.15); // each layer slightly narrower
    const yBase = cy - i * layerH;
    const d = [
      `M ${round(cx - w / 2)} ${round(yBase)}`,
      `L ${round(cx + w / 2)} ${round(yBase)}`,
      `L ${round(cx + w / 2)} ${round(yBase - layerH)}`,
      `L ${round(cx - w / 2)} ${round(yBase - layerH)}`,
      'Z',
    ].join(' ');

    layerResults.push({
      d,
      fill: getFill(layerColors[i % layerColors.length], colorMode),
      stroke: getStroke('#8D6E63', colorMode),
    });
  }

  // Candles on top layer
  const topY = cy - height;
  const topW = width - ((layers - 1) * width * 0.15);
  const candleH = height * 0.25;
  const candleW = 1.2;
  const candleSpacing = topW / (candles + 1);
  const candleResults = [];

  for (let i = 0; i < candles; i++) {
    const candleX = cx - topW / 2 + candleSpacing * (i + 1);

    const stick = [
      `M ${round(candleX - candleW / 2)} ${round(topY)}`,
      `L ${round(candleX + candleW / 2)} ${round(topY)}`,
      `L ${round(candleX + candleW / 2)} ${round(topY - candleH)}`,
      `L ${round(candleX - candleW / 2)} ${round(topY - candleH)}`,
      'Z',
    ].join(' ');

    // Flame (teardrop)
    const flameY = topY - candleH;
    const flame = [
      `M ${round(candleX)} ${round(flameY - 2.5)}`,
      `C ${round(candleX + 1.2)} ${round(flameY - 1.5)},`,
      `  ${round(candleX + 1)} ${round(flameY)},`,
      `  ${round(candleX)} ${round(flameY)}`,
      `C ${round(candleX - 1)} ${round(flameY)},`,
      `  ${round(candleX - 1.2)} ${round(flameY - 1.5)},`,
      `  ${round(candleX)} ${round(flameY - 2.5)}`,
      'Z',
    ].join(' ');

    candleResults.push({
      stick,
      flame,
      flameStroke: getStroke('#FF9800', colorMode),
      stickStroke: getStroke('#E91E63', colorMode),
    });
  }

  return {
    layers: layerResults,
    candles: candleResults,
    strokeWidth: 0.7,
  };
}

// ─── Gift box ───────────────────────────────────────────────────────

/**
 * Generate a gift box with ribbon.
 * @param {number} cx     - Centre X (mm)
 * @param {number} cy     - Centre Y (base centre, mm)
 * @param {number} width  - Box width (mm)
 * @param {number} height - Box height (mm)
 * @param {ColorMode} [colorMode='color']
 * @returns {{ box: { d: string, fill: string, stroke: string }, ribbon: { d: string, stroke: string }, bow: { d: string, fill: string, stroke: string }, strokeWidth: number }}
 */
export function generateGift(cx, cy, width, height, colorMode = 'color') {
  const w = width / 2;
  const h = height;

  // Box body
  const boxD = [
    `M ${round(cx - w)} ${round(cy)}`,
    `L ${round(cx + w)} ${round(cy)}`,
    `L ${round(cx + w)} ${round(cy - h)}`,
    `L ${round(cx - w)} ${round(cy - h)}`,
    'Z',
  ].join(' ');

  // Lid (slightly wider)
  const lidH = h * 0.15;
  const lidD = [
    `M ${round(cx - w * 1.05)} ${round(cy - h)}`,
    `L ${round(cx + w * 1.05)} ${round(cy - h)}`,
    `L ${round(cx + w * 1.05)} ${round(cy - h - lidH)}`,
    `L ${round(cx - w * 1.05)} ${round(cy - h - lidH)}`,
    'Z',
  ].join(' ');

  // Vertical and horizontal ribbon
  const ribbonD = [
    `M ${round(cx)} ${round(cy)} L ${round(cx)} ${round(cy - h - lidH)}`,
    `M ${round(cx - w)} ${round(cy - h / 2)} L ${round(cx + w)} ${round(cy - h / 2)}`,
  ].join(' ');

  // Bow on top
  const bowY = cy - h - lidH;
  const bowW = w * 0.4;
  const bowH = h * 0.2;
  const bowD = [
    // Left loop
    `M ${round(cx)} ${round(bowY)}`,
    `C ${round(cx - bowW)} ${round(bowY - bowH)},`,
    `  ${round(cx - bowW * 1.3)} ${round(bowY + bowH * 0.3)},`,
    `  ${round(cx)} ${round(bowY)}`,
    // Right loop
    `M ${round(cx)} ${round(bowY)}`,
    `C ${round(cx + bowW)} ${round(bowY - bowH)},`,
    `  ${round(cx + bowW * 1.3)} ${round(bowY + bowH * 0.3)},`,
    `  ${round(cx)} ${round(bowY)}`,
  ].join(' ');

  return {
    box: {
      d: boxD + ' ' + lidD,
      fill: getFill('#E3F2FD', colorMode),
      stroke: getStroke('#1976D2', colorMode),
    },
    ribbon: {
      d: ribbonD,
      stroke: getStroke('#E91E63', colorMode),
    },
    bow: {
      d: bowD,
      fill: getFill('#F8BBD0', colorMode),
      stroke: getStroke('#E91E63', colorMode),
    },
    strokeWidth: 0.7,
  };
}

// ─── Simple animal outlines ─────────────────────────────────────────

/**
 * Generate a simple animal outline.
 * @param {number} cx   - Centre X (mm)
 * @param {number} cy   - Centre Y (mm)
 * @param {number} size - Overall size (mm)
 * @param {'cat'|'dog'|'bunny'} type - Animal type
 * @param {ColorMode} [colorMode='color']
 * @returns {{ d: string, fill: string, stroke: string, strokeWidth: number, details: string }}
 */
export function generateAnimal(cx, cy, size, type = 'cat', colorMode = 'color') {
  const s = size / 2;
  let d = '';
  let details = '';
  let fill = '';
  let stroke = '';

  switch (type) {
    case 'cat': {
      // Round face with pointed ears
      // Head circle approximated with arcs
      d = [
        // Left ear
        `M ${round(cx - s * 0.5)} ${round(cy - s * 0.4)}`,
        `L ${round(cx - s * 0.4)} ${round(cy - s)}`,
        `L ${round(cx - s * 0.1)} ${round(cy - s * 0.5)}`,
        // Head curve (top)
        `Q ${round(cx)} ${round(cy - s * 0.7)} ${round(cx + s * 0.1)} ${round(cy - s * 0.5)}`,
        // Right ear
        `L ${round(cx + s * 0.4)} ${round(cy - s)}`,
        `L ${round(cx + s * 0.5)} ${round(cy - s * 0.4)}`,
        // Right cheek
        `Q ${round(cx + s * 0.8)} ${round(cy - s * 0.2)} ${round(cx + s * 0.6)} ${round(cy + s * 0.3)}`,
        // Chin
        `Q ${round(cx + s * 0.3)} ${round(cy + s * 0.6)} ${round(cx)} ${round(cy + s * 0.5)}`,
        `Q ${round(cx - s * 0.3)} ${round(cy + s * 0.6)} ${round(cx - s * 0.6)} ${round(cy + s * 0.3)}`,
        // Left cheek
        `Q ${round(cx - s * 0.8)} ${round(cy - s * 0.2)} ${round(cx - s * 0.5)} ${round(cy - s * 0.4)}`,
        'Z',
      ].join(' ');

      // Eyes, nose, whiskers
      details = [
        // Left eye
        `M ${round(cx - s * 0.2)} ${round(cy - s * 0.1)}`,
        `A 0.8 1 0 1 1 ${round(cx - s * 0.2 + 0.01)} ${round(cy - s * 0.1)}`,
        // Right eye
        `M ${round(cx + s * 0.2)} ${round(cy - s * 0.1)}`,
        `A 0.8 1 0 1 1 ${round(cx + s * 0.2 + 0.01)} ${round(cy - s * 0.1)}`,
        // Nose (small triangle)
        `M ${round(cx)} ${round(cy + s * 0.05)}`,
        `L ${round(cx - s * 0.05)} ${round(cy + s * 0.12)}`,
        `L ${round(cx + s * 0.05)} ${round(cy + s * 0.12)} Z`,
        // Whiskers
        `M ${round(cx - s * 0.1)} ${round(cy + s * 0.15)} L ${round(cx - s * 0.6)} ${round(cy + s * 0.05)}`,
        `M ${round(cx - s * 0.1)} ${round(cy + s * 0.2)} L ${round(cx - s * 0.6)} ${round(cy + s * 0.2)}`,
        `M ${round(cx + s * 0.1)} ${round(cy + s * 0.15)} L ${round(cx + s * 0.6)} ${round(cy + s * 0.05)}`,
        `M ${round(cx + s * 0.1)} ${round(cy + s * 0.2)} L ${round(cx + s * 0.6)} ${round(cy + s * 0.2)}`,
      ].join(' ');

      fill = getFill('#FFE4C4', colorMode);
      stroke = getStroke('#8D6E63', colorMode);
      break;
    }

    case 'dog': {
      // Round face with floppy ears
      d = [
        // Left floppy ear
        `M ${round(cx - s * 0.45)} ${round(cy - s * 0.3)}`,
        `Q ${round(cx - s * 0.9)} ${round(cy - s * 0.1)} ${round(cx - s * 0.7)} ${round(cy + s * 0.5)}`,
        `Q ${round(cx - s * 0.5)} ${round(cy + s * 0.4)} ${round(cx - s * 0.45)} ${round(cy + s * 0.1)}`,
        // Chin
        `Q ${round(cx - s * 0.3)} ${round(cy + s * 0.55)} ${round(cx)} ${round(cy + s * 0.5)}`,
        `Q ${round(cx + s * 0.3)} ${round(cy + s * 0.55)} ${round(cx + s * 0.45)} ${round(cy + s * 0.1)}`,
        // Right floppy ear
        `Q ${round(cx + s * 0.5)} ${round(cy + s * 0.4)} ${round(cx + s * 0.7)} ${round(cy + s * 0.5)}`,
        `Q ${round(cx + s * 0.9)} ${round(cy - s * 0.1)} ${round(cx + s * 0.45)} ${round(cy - s * 0.3)}`,
        // Top of head
        `Q ${round(cx + s * 0.3)} ${round(cy - s * 0.6)} ${round(cx)} ${round(cy - s * 0.55)}`,
        `Q ${round(cx - s * 0.3)} ${round(cy - s * 0.6)} ${round(cx - s * 0.45)} ${round(cy - s * 0.3)}`,
        'Z',
      ].join(' ');

      // Eyes, nose, tongue
      details = [
        // Eyes
        `M ${round(cx - s * 0.18)} ${round(cy - s * 0.15)} A 0.9 0.9 0 1 1 ${round(cx - s * 0.18 + 0.01)} ${round(cy - s * 0.15)}`,
        `M ${round(cx + s * 0.18)} ${round(cy - s * 0.15)} A 0.9 0.9 0 1 1 ${round(cx + s * 0.18 + 0.01)} ${round(cy - s * 0.15)}`,
        // Nose (oval)
        `M ${round(cx - s * 0.08)} ${round(cy + s * 0.08)} Q ${round(cx)} ${round(cy + s * 0.02)} ${round(cx + s * 0.08)} ${round(cy + s * 0.08)} Q ${round(cx)} ${round(cy + s * 0.14)} ${round(cx - s * 0.08)} ${round(cy + s * 0.08)} Z`,
        // Mouth
        `M ${round(cx)} ${round(cy + s * 0.14)} L ${round(cx)} ${round(cy + s * 0.25)}`,
        `Q ${round(cx - s * 0.1)} ${round(cy + s * 0.3)} ${round(cx - s * 0.15)} ${round(cy + s * 0.25)}`,
      ].join(' ');

      fill = getFill('#F5DEB3', colorMode);
      stroke = getStroke('#8B7355', colorMode);
      break;
    }

    case 'bunny':
    default: {
      // Round face with long upright ears
      d = [
        // Left ear
        `M ${round(cx - s * 0.25)} ${round(cy - s * 0.4)}`,
        `Q ${round(cx - s * 0.35)} ${round(cy - s * 1.1)} ${round(cx - s * 0.15)} ${round(cy - s * 1.1)}`,
        `Q ${round(cx - s * 0.05)} ${round(cy - s * 0.9)} ${round(cx - s * 0.1)} ${round(cy - s * 0.45)}`,
        // Top of head
        `Q ${round(cx)} ${round(cy - s * 0.55)} ${round(cx + s * 0.1)} ${round(cy - s * 0.45)}`,
        // Right ear
        `Q ${round(cx + s * 0.05)} ${round(cy - s * 0.9)} ${round(cx + s * 0.15)} ${round(cy - s * 1.1)}`,
        `Q ${round(cx + s * 0.35)} ${round(cy - s * 1.1)} ${round(cx + s * 0.25)} ${round(cy - s * 0.4)}`,
        // Right cheek
        `Q ${round(cx + s * 0.55)} ${round(cy - s * 0.2)} ${round(cx + s * 0.45)} ${round(cy + s * 0.2)}`,
        // Chin
        `Q ${round(cx + s * 0.2)} ${round(cy + s * 0.5)} ${round(cx)} ${round(cy + s * 0.45)}`,
        `Q ${round(cx - s * 0.2)} ${round(cy + s * 0.5)} ${round(cx - s * 0.45)} ${round(cy + s * 0.2)}`,
        // Left cheek
        `Q ${round(cx - s * 0.55)} ${round(cy - s * 0.2)} ${round(cx - s * 0.25)} ${round(cy - s * 0.4)}`,
        'Z',
      ].join(' ');

      // Eyes, nose
      details = [
        // Eyes
        `M ${round(cx - s * 0.15)} ${round(cy - s * 0.1)} A 0.7 0.9 0 1 1 ${round(cx - s * 0.15 + 0.01)} ${round(cy - s * 0.1)}`,
        `M ${round(cx + s * 0.15)} ${round(cy - s * 0.1)} A 0.7 0.9 0 1 1 ${round(cx + s * 0.15 + 0.01)} ${round(cy - s * 0.1)}`,
        // Nose
        `M ${round(cx)} ${round(cy + s * 0.05)} L ${round(cx - s * 0.04)} ${round(cy + s * 0.1)} L ${round(cx + s * 0.04)} ${round(cy + s * 0.1)} Z`,
        // Mouth
        `M ${round(cx)} ${round(cy + s * 0.1)} Q ${round(cx - s * 0.08)} ${round(cy + s * 0.18)} ${round(cx - s * 0.12)} ${round(cy + s * 0.13)}`,
        `M ${round(cx)} ${round(cy + s * 0.1)} Q ${round(cx + s * 0.08)} ${round(cy + s * 0.18)} ${round(cx + s * 0.12)} ${round(cy + s * 0.13)}`,
      ].join(' ');

      fill = getFill('#FFEEF0', colorMode);
      stroke = getStroke('#D4A0A7', colorMode);
      break;
    }
  }

  return {
    d,
    fill,
    stroke,
    strokeWidth: 0.7,
    details,
  };
}
