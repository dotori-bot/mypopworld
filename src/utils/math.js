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
 * Spiral-spring ("달팽이 스프링") anchor extension distance D(α), law of cosines.
 *
 * The coil's hub is glued to face A at distance `a` below the spine; its rim tip
 * to face B at distance `b` above the spine. As the card opens to angle α the two
 * anchors swing apart on arms a and b about the shared spine hinge, so the
 * straight-line distance the coil must span end-to-end is
 *
 *     D(α) = √(a² + b² − 2·a·b·cos α)
 *
 * D(0) = |a − b| = R_outer (coil relaxed flat, zero standing height) and
 * D(180) = a + b (max extension). The VISIBLE standing height of the coil in the
 * assembled pose is the pay-out beyond the relaxed disc, D(α) − R_outer, which
 * rises monotonically 0 → 2·min(a,b) = hStand. This is the authoritative single-
 * source formula for the spiral-spring preview, mirroring calculateVFoldAngle's
 * role for the V-fold — the renderer calls it instead of re-deriving the trig.
 *
 * @param {number} cardAngle - Card opening angle α in degrees (0 = closed, 180 = flat)
 * @param {number} a - Hub distance below the spine (mm)
 * @param {number} b - Rim-tip distance above the spine (mm)
 * @returns {number} Anchor-to-anchor distance D(α) in mm
 */
export function calculateSpiralExtension(cardAngle, a, b) {
  const rad = degToRad(cardAngle);
  const d2 = a * a + b * b - 2 * a * b * Math.cos(rad);
  return Math.sqrt(Math.max(0, d2));
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
 * Linear interpolation between two values.
 * @param {number} a - Start value
 * @param {number} b - End value
 * @param {number} t - Interpolation factor [0, 1]
 * @returns {number}
 */
export function lerp(a, b, t) {
  return a + (b - a) * t;
}

/**
 * Calculate Euclidean distance between two points.
 * @param {{ x: number, y: number }} p1
 * @param {{ x: number, y: number }} p2
 * @returns {number}
 */
export function pointDistance(p1, p2) {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Find intersection point of two line segments.
 * Each line is { x1, y1, x2, y2 }.
 *
 * @param {{ x1: number, y1: number, x2: number, y2: number }} l1
 * @param {{ x1: number, y1: number, x2: number, y2: number }} l2
 * @returns {{ x: number, y: number } | null} Intersection point or null if parallel / no intersection
 */
export function lineIntersection(l1, l2) {
  const dx1 = l1.x2 - l1.x1;
  const dy1 = l1.y2 - l1.y1;
  const dx2 = l2.x2 - l2.x1;
  const dy2 = l2.y2 - l2.y1;

  const denom = dx1 * dy2 - dy1 * dx2;
  if (Math.abs(denom) < 1e-10) return null; // parallel or coincident

  const t = ((l2.x1 - l1.x1) * dy2 - (l2.y1 - l1.y1) * dx2) / denom;
  const u = ((l2.x1 - l1.x1) * dy1 - (l2.y1 - l1.y1) * dx1) / denom;

  // Check if intersection lies within both segments
  if (t < 0 || t > 1 || u < 0 || u > 1) return null;

  return {
    x: l1.x1 + t * dx1,
    y: l1.y1 + t * dy1,
  };
}

/**
 * Rotate a point around a center by a given angle.
 * @param {{ x: number, y: number }} point  - Point to rotate
 * @param {{ x: number, y: number }} center - Center of rotation
 * @param {number} angleDeg - Rotation angle in degrees (positive = clockwise)
 * @returns {{ x: number, y: number }}
 */
export function rotatePoint(point, center, angleDeg) {
  const rad = degToRad(angleDeg);
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const dx = point.x - center.x;
  const dy = point.y - center.y;
  return {
    x: center.x + dx * cos - dy * sin,
    y: center.y + dx * sin + dy * cos,
  };
}

/**
 * Generate an SVG arc path descriptor for an arc segment.
 * @param {number} cx - Center X
 * @param {number} cy - Center Y
 * @param {number} r  - Radius
 * @param {number} startAngle - Start angle in degrees
 * @param {number} endAngle   - End angle in degrees
 * @returns {string} SVG path "d" fragment: "M ... A ..."
 */
export function describeArc(cx, cy, r, startAngle, endAngle) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
  return [
    'M', start.x.toFixed(2), start.y.toFixed(2),
    'A', r, r, 0, largeArcFlag, 0, end.x.toFixed(2), end.y.toFixed(2),
  ].join(' ');
}

/**
 * Calculate the midpoint between two points.
 * @param {{ x: number, y: number }} p1
 * @param {{ x: number, y: number }} p2
 * @returns {{ x: number, y: number }}
 */
export function midpoint(p1, p2) {
  return {
    x: (p1.x + p2.x) / 2,
    y: (p1.y + p2.y) / 2,
  };
}

/**
 * Determine which volvelle rotor sector(s) currently sit under the fixed window,
 * given the disc's rotation. Pure geometry helper for the interactive preview —
 * it is the single source of truth for the "what's framed" readout, mirroring the
 * frame convention baked into generators/volvelle.js so the preview never
 * disagrees with the printed part.
 *
 * Frame convention (identical to volvelle.js):
 *   - polarToCartesian uses 0° = up, positive = clockwise (screen y points down).
 *   - Rotor sector k spans LOCAL angles [k·σ, (k+1)·σ] and is LABELLED (k+1)
 *     (volvelle.js draws divider k at k·σ and prints "k+1" at k·σ + σ/2).
 *   - The window is FIXED at screen 0° (straight up), spanning [−θ_w/2, +θ_w/2]
 *     (volvelle.js: sectorPath(..., −θ_w/2, θ_w/2)).
 *   - Rotating the disc by θ (clockwise, same sign) sends a point at local angle a
 *     to screen angle a+θ, so the window centre (screen 0) maps back to LOCAL
 *     angle −θ, and the window occupies local span [−θ − θ_w/2, −θ + θ_w/2].
 *
 * Because θ_w < σ always (the window is one guard-band δ narrower than a sector on
 * each side), the window overlaps AT MOST two sectors: a single sector is fully
 * framed while its centre stays within ±δ of the window centre, and two neighbours
 * are each partially visible while a divider crosses the window (boundary = true).
 *
 * @param {number} rotationDeg - Disc rotation θ in degrees (clockwise +).
 * @param {{ sectors:number, sigma:number, thetaW:number }} geo
 * @returns {{ primary:number, labels:number[], boundary:boolean }}
 *   primary  = 1-based label of the sector under the window centre
 *   labels   = 1-based labels of every sector overlapping the window (1 or 2)
 *   boundary = true when a divider is inside the window (two sectors half-visible)
 */
export function framedVolvelleSectors(rotationDeg, geo) {
  const { sectors, sigma, thetaW } = geo;
  const norm360 = (a) => ((a % 360) + 360) % 360;
  const sectorOf = (a) => Math.floor(norm360(a) / sigma) % sectors;
  const winCenterLocal = norm360(-rotationDeg);
  const half = thetaW / 2;
  const kCenter = sectorOf(winCenterLocal);
  const kLeft = sectorOf(winCenterLocal - half);
  const kRight = sectorOf(winCenterLocal + half);
  const labels = Array.from(new Set([kLeft, kCenter, kRight]))
    .sort((a, b) => a - b)
    .map((k) => k + 1);
  return { primary: kCenter + 1, labels, boundary: kLeft !== kRight };
}

/**
 * Flip-disc ("반쪽 넘김판") leaf poses for the interactive 3D preview.
 *
 * Physical model (single source of truth mirrored from generators/flipDisc.js):
 * a circle is split on its vertical diameter. The LEFT half is a fixed, opaque
 * background half-disc that flipDisc.js glues "on top", so the left half ALWAYS
 * shows the background. The RIGHT half is a stack of N right-half-disc leaves
 * hinged on that same diameter and turned one at a time like book pages. A leaf
 * "emerges from beneath the fixed half", swings up-and-over to the LEFT, and
 * tucks BEHIND the fixed half — so a turned leaf becomes hidden and the next
 * leaf beneath it is revealed on the right. The visible circle is therefore
 * always (fixed background half) + (topmost NOT-yet-turned leaf).
 *
 * Because the leaves are a strictly ORDERED stack (leaf k sits under leaf k-1
 * and cannot be reached until k-1 is turned), the only physically valid states
 * are "the first `flippedCount` leaves are turned". This is why the caller
 * tracks a single integer rather than per-leaf angles. flippedCount is clamped
 * to [0, pages-1]: the bottom leaf has nothing beneath it to reveal, so one leaf
 * always remains completing the circle.
 *
 * @param {number} flippedCount - How many top leaves have been turned to the left.
 * @param {number} pages        - Total leaf count N.
 * @returns {{ leaves: Array<{index:number, flipped:boolean, angleDeg:number, depth:number}>, showing:number }}
 *   leaves[i].angleDeg  0 (flat on the right, front to viewer) or -180 (turned
 *                       flat to the left; -180 not +180 so the turn sweeps UP
 *                       TOWARD the viewer like a real page, not away into screen).
 *   leaves[i].depth     Unitless world-depth ordering hint (larger = nearer the
 *                       viewer); the caller pins the fixed half at depth 0 and
 *                       scales these straight into translateZ(px). Un-flipped
 *                       leaves stack with the topmost-remaining nearest; turned
 *                       leaves sit just behind the fixed half so it hides them.
 *   showing             Index of the leaf currently completing the circle
 *                       (=== clamped flippedCount).
 */
export function flipDiscLeafStates(flippedCount, pages) {
  const n = Math.max(0, Math.trunc(pages) || 0);
  const fc = clamp(Math.trunc(flippedCount) || 0, 0, Math.max(0, n - 1));
  const leaves = [];
  for (let i = 0; i < n; i++) {
    const flipped = i < fc;
    leaves.push({
      index: i,
      flipped,
      angleDeg: flipped ? -180 : 0,
      // Turned: behind the fixed half (< 0), later-turned nearer among them.
      // Un-flipped: topmost-remaining (smallest i) nearest, deeper leaves back.
      depth: flipped ? -2 + i * 0.3 : -i * 0.5,
    });
  }
  return { leaves, showing: fc };
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
