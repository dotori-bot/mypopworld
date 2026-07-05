/**
 * @fileoverview Math utilities for popup card geometry calculations.
 * Provides trigonometric helpers, coordinate transforms, collision detection,
 * and popup-specific formulas used across all mechanism generators.
 * @module utils/math
 */

/**
 * Convert degrees to radians.
 * @param {number} deg - Angle in degrees
 * @returns {number} Angle in radians
 */
export function degToRad(deg) {
  return (deg * Math.PI) / 180;
}

/**
 * Convert radians to degrees.
 * @param {number} rad - Angle in radians
 * @returns {number} Angle in degrees
 */
export function radToDeg(rad) {
  return (rad * 180) / Math.PI;
}

/**
 * Convert polar coordinates to Cartesian.
 * @param {number} cx - Center X
 * @param {number} cy - Center Y
 * @param {number} r  - Radius
 * @param {number} angleDeg - Angle in degrees (0 = right, clockwise)
 * @returns {{ x: number, y: number }}
 */
export function polarToCartesian(cx, cy, r, angleDeg) {
  const rad = degToRad(angleDeg - 90); // -90 so 0° points up
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

/**
 * Calculate the V-fold popup angle β from the card opening angle α.
 *
 * Formula: β = 2 × arcsin(k × sin(α / 2))
 *
 * @param {number} cardAngle - Card opening angle α in degrees (0 = closed, 180 = flat)
 * @param {number} [k=1]    - Asymmetry factor (1 = symmetric V-fold)
 * @returns {number} V-fold angle β in degrees
 */
export function calculateVFoldAngle(cardAngle, k = 1) {
  const halfAlpha = degToRad(cardAngle) / 2;
  const sinVal = k * Math.sin(halfAlpha);
  // Clamp to valid arcsin domain [-1, 1]
  const clamped = clamp(sinVal, -1, 1);
  return radToDeg(2 * Math.asin(clamped));
}

/**
 * Calculate popup height from arm length and V-fold angle.
 *
 * Formula: h = L × sin(β / 2)
 *
 * @param {number} armLength - Arm length L in mm
 * @param {number} angle     - V-fold angle β in degrees
 * @returns {number} Popup height h in mm
 */
export function calculatePopupHeight(armLength, angle) {
  const halfBeta = degToRad(angle) / 2;
  return armLength * Math.sin(halfBeta);
}

/**
 * Calculate parallel-fold popup height at a given card opening angle.
 *
 * Formula: height(α) = d × sin(α / 2)
 *
 * @param {number} depth     - Cut depth d in mm
 * @param {number} cardAngle - Card opening angle α in degrees
 * @returns {number} Popup height in mm
 */
export function calculateParallelFoldHeight(depth, cardAngle) {
  const halfAlpha = degToRad(cardAngle) / 2;
  return depth * Math.sin(halfAlpha);
}

/**
 * Clamp a value between min and max.
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

/**
 * Round a number to a fixed number of decimal places.
 * Useful for keeping SVG coordinates clean.
 * @param {number} value
 * @param {number} [decimals=2]
 * @returns {number}
 */
export function round(value, decimals = 2) {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}
