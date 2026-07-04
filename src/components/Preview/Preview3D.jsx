import React, { useRef, useState } from 'react';
import useCardStore from '../../store/useCardStore';
import { getMechanism, buildMechanismParams } from '../../generators/registry';
import { CARD_SIZES } from '../../generators/constants';
import { resolveVolvelleGeometry } from '../../generators/volvelle';
import { resolveFlipDiscGeometry, FLIPDISC_CONST } from '../../generators/flipDisc';
import { resolveSpiralGeometry } from '../../generators/spiralSpring';
import {
  calculateVFoldAngle,
  calculatePopupHeight,
  calculateParallelFoldHeight,
  calculateSpiralExtension,
  framedVolvelleSectors,
  flipDiscLeafStates,
  polarToCartesian,
  radToDeg,
  degToRad,
  clamp,
} from '../../utils/math';
import '../../styles/preview.css';

// Mechanisms with a working 3D assembled-pose preview. Anything else falls
// back to the "not ready yet" placeholder. Note: 'volvelle' is a flat top-down
// SPINNER, not a hinged pop-up, so it opts out of the shared book/α scaffold
// below and renders its own view (see the volvelle branch in the component).
const SUPPORTED_3D = new Set(['v-fold', 'box-popup', 'parallel-fold', 'volvelle', 'flip-disc', 'spiral-spring']);

/**
 * Recursively build the nested DOM for a parallel-fold staircase on one side of
 * the spine. See the "Parallel-fold pose" comment block below for the physics.
 *
 * Each level is a plain rectangle (like a box-popup flap) that is a DOM CHILD of
 * the previous level, so via preserve-3d it inherits the parent's full transform
 * and then applies its OWN local flex `transform` on top — this is the CSS
 * embodiment of "level i attaches to level i-1's moving surface".
 *
 * @param {Array<{width:number,depth:number}>} levels  outermost = last entry
 * @param {number} i           current level index
 * @param {'left'|'right'} side
 * @param {number} sinA        sin(γ), γ = α/2
 * @param {number} cosA        cos(γ)
 * @param {number} gamma       per-level local flex magnitude in degrees (α/2)
 * @param {number} PX          mm→px scale
 * @param {number} parentDimPx the parent's along-spine size in px (page height
 *                             for level 0, previous level's widthPx otherwise)
 *
 * Fold DIRECTION alternates per level: even levels (0,2,4…) flex +γ ("risers",
 * lifting away from the parent surface), odd levels flex −γ ("treads", flattening
 * back parallel to the base). This is (a) the mountain/valley alternation a real
 * flat-foldable staircase requires and (b) what keeps the running frame from
 * compounding into a spiral — so the steps ascend monotonically instead of
 * rotating past vertical and retracting inside earlier levels.
 */
function renderStairLevel(levels, i, side, sinA, cosA, gamma, PX, parentDimPx) {
  if (i >= levels.length) return null;
  const depthPx = levels[i].depth * PX;  // extent away from the spine
  const widthPx = levels[i].width * PX;  // extent along the spine
  // Centre this level on its parent's along-spine span.
  const top = (parentDimPx - widthPx) / 2;
  // Spine-side (hinge) edge sits on the parent's outer edge. For level 0 the
  // parent is the page and the hinge is AT the spine (right:0 / left:0); for
  // deeper levels the hinge is the parent's far edge (right:100% / left:100%).
  const pos =
    side === 'left'
      ? { right: i === 0 ? 0 : '100%' }
      : { left: i === 0 ? 0 : '100%' };
  // Same rotate3d axis convention as box-popup / V-fold; sign alternates.
  const angle = i % 2 === 0 ? gamma : -gamma;
  const zc = side === 'left' ? -cosA : cosA;
  const transform = `rotate3d(${(-sinA).toFixed(5)}, 0, ${zc.toFixed(5)}, ${angle}deg)`;
  return (
    <div
      className={`preview3d-step preview3d-step-${side}`}
      style={{
        width: `${depthPx}px`,
        height: `${widthPx}px`,
        top: `${top}px`,
        transform,
        ...pos,
      }}
    >
      {renderStairLevel(levels, i + 1, side, sinA, cosA, gamma, PX, widthPx)}
    </div>
  );
}

/**
 * Annular-sector ("pie", or ring slice if rIn>0) SVG path around origin (0,0),
 * angles in degrees with the volvelle convention (0° = up, clockwise). This is a
 * RENDER helper (drawing wedges/window for the flat spinner), not a geometry
 * derivation — the radii/angles all come from resolveVolvelleGeometry. Kept local
 * to Preview3D because it draws the interactive pose, exactly like the printable
 * generator keeps its own sectorPath; they share polarToCartesian's convention so
 * the preview and the printed disc stay geometrically consistent.
 *
 * @param {number} rIn  inner radius (0 → solid pie from centre)
 * @param {number} rOut outer radius
 * @param {number} startDeg @param {number} endDeg
 * @returns {string} SVG path "d"
 */
function arcSectorPath(rIn, rOut, startDeg, endDeg) {
  const oL = polarToCartesian(0, 0, rOut, startDeg);
  const oR = polarToCartesian(0, 0, rOut, endDeg);
  const large = endDeg - startDeg > 180 ? 1 : 0;
  if (rIn <= 0) {
    return `M 0 0 L ${oL.x.toFixed(2)} ${oL.y.toFixed(2)} ` +
      `A ${rOut} ${rOut} 0 ${large} 1 ${oR.x.toFixed(2)} ${oR.y.toFixed(2)} Z`;
  }
  const iL = polarToCartesian(0, 0, rIn, startDeg);
  const iR = polarToCartesian(0, 0, rIn, endDeg);
  return `M ${iL.x.toFixed(2)} ${iL.y.toFixed(2)} L ${oL.x.toFixed(2)} ${oL.y.toFixed(2)} ` +
    `A ${rOut} ${rOut} 0 ${large} 1 ${oR.x.toFixed(2)} ${oR.y.toFixed(2)} ` +
    `L ${iR.x.toFixed(2)} ${iR.y.toFixed(2)} ` +
    `A ${rIn} ${rIn} 0 ${large} 0 ${iL.x.toFixed(2)} ${iL.y.toFixed(2)} Z`;
}

/** Full-circle SVG path centred on the origin. */
function circleAtOrigin(r) {
  return `M ${-r} 0 A ${r} ${r} 0 1 0 ${r} 0 A ${r} ${r} 0 1 0 ${-r} 0 Z`;
}

/**
 * Preview3D — pure-CSS-3D assembled preview of the V-fold mechanism.
 *
 * This is a *pose* renderer, not a cutting-pattern renderer. It calls the
 * authoritative fold-physics helpers in utils/math.js (calculateVFoldAngle,
 * calculatePopupHeight) as the single source of truth for "how far has the
 * V-fold risen at card-opening angle α" — it does NOT re-derive the trig, and
 * it does NOT use vfold.js's flat 2D coordinates (a different thing entirely).
 *
 * Kinematics (all angles in degrees). CSS-3D frame: x = right, y = DOWN,
 * z = toward the viewer. Spine = the vertical line x=0; card plane = z=0.
 *
 *   α        = card-opening angle, 0 (closed) … 180 (flat open). Slider-driven.
 *   a = α/2  = the "half-open" angle. Note a === γ (see below).
 *   θ_page   = (180 − α) / 2 = 90 − a
 *              Each page is rotated ±θ_page about the vertical spine.
 *              α=180 → 0° (flat); α=0 → 90° (pages fold into the plane x=0,
 *              face-to-face). rotateY(±θ_page), pivoting on the spine.
 *   β        = calculateVFoldAngle(α)                     (= α for symmetric k=1)
 *   h        = calculatePopupHeight(armLength, β) = L·sin(a)     [mm]
 *   γ        = arcsin(h / L) = a
 *
 * Correct 3D composition (why the arms are DOM children of their page):
 *   The popup apex must sit on the symmetry plane at world position
 *       A = (0, −L·cos a, L·sin a)
 *   i.e. the spine-up vector tilted about the horizontal x-axis by a; its +z
 *   component is exactly h. a=0 → A lies flat along the spine inside the closed
 *   pages (hidden); a=90 → A points straight at the viewer, height L; a=45 →
 *   height 0.707·L. BOTH arms target this same A, so their tips always coincide.
 *
 *   The page's rotateY(±θ) and the arm's own fold are rotations about DIFFERENT
 *   world axes, so you CANNOT scalar-add their angles. Instead each arm is a real
 *   child of its page (inheriting rotateY(±θ) via preserve-3d) and carries its
 *   OWN relative rotation. Pulling A back through the page rotation and solving
 *   for the rotation that carries the local ridge-tip (0,−L,0) onto it gives a
 *   fold of angle a about axis:
 *       left  arm:  rotate3d(−sin a, 0, −cos a, a°)
 *       right arm:  rotate3d(−sin a, 0, +cos a, a°)
 *   Both the page's rotateY pivot and the arm's rotate3d pivot are the SAME
 *   spine-center point O, so O stays welded to world spine-center for both arms
 *   and the two ridge-tips land on the identical A — no apex gap at any α. At
 *   α=0 the arm rides its page into the plane x=0 and is hidden, edge-on,
 *   sandwiched between the closed pages.
 *
 *   (Deliberate deviation: an ideal rigid gusset on a single fixed page crease
 *   cannot hit h = L·sin a exactly while keeping the apex on the symmetry plane;
 *   we honour the authoritative h and tip-meeting by recomputing the arm's fold
 *   axis per frame. The arm's free outer corner slides imperceptibly — invisible
 *   in this stylised pose preview.)
 *
 * ---------------------------------------------------------------------------
 * Box-popup pose (same file, second mechanism)
 * ---------------------------------------------------------------------------
 * Box-popup (see generators/boxPopup.js, after its cut/fold bugfix) has the
 * SAME topology as V-fold -- two attachment points offset from the spine (one
 * per page, at distance d = box `height` param) plus one shared fold AT the
 * spine -- just with a full-width rectangle instead of a triangle narrowing to
 * a point. That means it needs the SAME symmetric flex angle a = α/2, computed
 * from the SAME kind of authoritative formula (calculateParallelFoldHeight is
 * the single-level version of calculateParallelFoldHeight/VFold's h = d·sin a),
 * but a much simpler rotation: no compound rotate3d is needed because a
 * rectangle's attached edge is already parallel to the spine (the page's own
 * rotateY axis), so folding it is a plain second rotateY about that edge:
 *   left  flap: pivot = its OUTER (attached) edge; rotateY(+a) relative to page
 *   right flap: pivot = its OUTER (attached) edge; rotateY(−a) relative to page
 * At a=0 the flap is coplanar with its own (already edge-on-when-closed) page
 * → hidden at α=0. At a=90 (α=180) the flap has rotated a full quarter turn
 * relative to its page, so its free (spine-side) edge swings from lying along
 * the spine (in-page) to pointing straight at the viewer, height = d = box's
 * `height` param -- and since both flaps share the same width (box `width`
 * param) centred on the same page mid-line, their free edges coincide at every
 * α, forming one continuous flat box face.
 */
export default function Preview3D() {
  const { cardParams, paperSize, colorMode } = useCardStore();
  const [alpha, setAlpha] = useState(90);
  // Volvelle spinner state: disc rotation θ (deg, clockwise +). Kept as a plain
  // hook at the top so React's hook order stays stable regardless of mechanism.
  const [rotation, setRotation] = useState(0);
  // Flip-disc state: how many top leaves have been turned to the left (0..N-1).
  // A single integer because the leaves are a strictly ordered stack — see
  // flipDiscLeafStates() in utils/math.js for why per-leaf angles would be wrong.
  const [flipped, setFlipped] = useState(0);
  const discRef = useRef(null);
  const drag = useRef({ active: false, last: 0 });

  const mechanism = cardParams?.mechanism;

  if (!cardParams || !SUPPORTED_3D.has(mechanism)) {
    // Human-readable supported list derived from the registry, so this never
    // goes stale as more mechanisms are wired up (flip-disc, spiral-spring…).
    const supported = [...SUPPORTED_3D]
      .map((id) => getMechanism(id)?.labelKo?.replace(/\s*\(.*/, '') ?? id)
      .join(' · ');
    return (
      <div className="preview3d-root">
        <div className="preview3d-placeholder">
          이 메커니즘은 아직 3D 미리보기를 준비 중이에요! (현재 지원: {supported})
        </div>
      </div>
    );
  }

  // ── Volvelle: flat top-down spinner — no card-opening angle, no fold. ──────
  // Renders its own view (a rotating disc under a fixed window) instead of the
  // hinged two-page book scaffold the fold mechanisms share below.
  if (mechanism === 'volvelle') {
    const params = buildMechanismParams(cardParams, paperSize, colorMode) || {};
    const defaults = getMechanism('volvelle').defaultParams;
    // Single source of truth for radii/angles — same call the generator makes.
    const geo = resolveVolvelleGeometry({
      R: params.R ?? defaults.R,
      sectors: params.sectors ?? defaults.sectors,
    });
    const { R, sectors, outerR, rOut, sigma, thetaW } = geo;

    // Match the printed cover's small retained hub (volvelle.js winInner).
    const winInner = clamp(Math.round(R * 0.18), 5, R - 8);
    const pad = 6;
    const box = outerR + pad;
    const theta = ((rotation % 360) + 360) % 360; // normalised for readout/slider

    const framed = framedVolvelleSectors(theta, geo);
    const readout = framed.boundary
      ? `돌림판 회전 θ = ${Math.round(theta)}° · 창문: ${framed.labels.join('·')}번 경계 (두 칸이 반씩 보여요)`
      : `돌림판 회전 θ = ${Math.round(theta)}° · 창문: ${framed.primary}번 그림`;

    // Pointer angle around the disc centre, using the SAME 0°=up / clockwise+
    // convention as the disc, so drag deltas map 1:1 onto rotation θ.
    const pointerAngle = (e) => {
      const rect = discRef.current.getBoundingClientRect();
      const dx = e.clientX - (rect.left + rect.width / 2);
      const dy = e.clientY - (rect.top + rect.height / 2);
      return radToDeg(Math.atan2(dx, -dy)); // atan2(dx,-dy): 0=up, clockwise +
    };
    const onDown = (e) => {
      drag.current = { active: true, last: pointerAngle(e) };
      e.currentTarget.setPointerCapture?.(e.pointerId);
    };
    const onMove = (e) => {
      if (!drag.current.active) return;
      const now = pointerAngle(e);
      // Normalise the step into (−180,180] so crossing the ±180 seam doesn't
      // make the disc jump a full turn.
      let d = ((now - drag.current.last + 180) % 360 + 360) % 360 - 180;
      drag.current.last = now;
      setRotation((r) => ((r + d) % 360 + 360) % 360);
    };
    const onUp = () => { drag.current.active = false; };

    // Wedge palette: evenly spaced hues so adjacent sectors are easy to tell
    // apart. The disc GROUP is rotated by θ; wedges + numbers ride along, exactly
    // like a real disc (numbers aren't upright at every angle, and shouldn't be).
    return (
      <div className="preview3d-root">
        <div className="preview3d-stage preview3d-volvelle-stage">
          <svg
            ref={discRef}
            className="preview3d-volvelle-disc"
            viewBox={`${-box} ${-box} ${2 * box} ${2 * box}`}
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerLeave={onUp}
          >
            {/* Rotating disc: N coloured, numbered wedges. */}
            <g transform={`rotate(${theta})`}>
              <path d={circleAtOrigin(R)} className="preview3d-volvelle-rotor" />
              {Array.from({ length: sectors }, (_, k) => {
                const mid = polarToCartesian(0, 0, R * 0.62, k * sigma + sigma / 2);
                return (
                  <g key={k}>
                    <path
                      d={arcSectorPath(0, R, k * sigma, (k + 1) * sigma)}
                      fill={`hsl(${Math.round((k * 360) / sectors)}, 72%, 62%)`}
                      stroke="rgba(0,0,0,0.18)"
                      strokeWidth="0.5"
                    />
                    <text
                      x={mid.x.toFixed(2)}
                      y={mid.y.toFixed(2)}
                      className="preview3d-volvelle-num"
                      transform={`rotate(${k * sigma + sigma / 2} ${mid.x.toFixed(2)} ${mid.y.toFixed(2)})`}
                    >
                      {k + 1}
                    </text>
                  </g>
                );
              })}
            </g>

            {/* Fixed cover: opaque disc with the window punched out (evenodd
                fill-rule turns the window sub-path into a see-through hole, so
                only the framed wedge shows). */}
            <path
              className="preview3d-volvelle-cover"
              fillRule="evenodd"
              d={`${circleAtOrigin(outerR)} ${arcSectorPath(winInner, rOut, -thetaW / 2, thetaW / 2)}`}
            />
            {/* Window frame + rim outlines for legibility. */}
            <path
              className="preview3d-volvelle-window"
              d={arcSectorPath(winInner, rOut, -thetaW / 2, thetaW / 2)}
            />
            <path className="preview3d-volvelle-rim" d={circleAtOrigin(outerR)} />
            {/* Thumb notch marker at the bottom (180°) — where a fingertip spins
                the exposed rotor rim, matching volvelle.js's notch. */}
            <path
              className="preview3d-volvelle-notch"
              d={arcSectorPath(R - 4, outerR, 180 - 12, 180 + 12)}
            />
            <circle r="1.4" className="preview3d-volvelle-hub" />
          </svg>
        </div>

        <div className="fold-slider-container">
          <div className="fold-slider-labels">
            <span>돌림판 회전</span>
            <span>{Math.round(theta)}°</span>
          </div>
          <input
            className="custom-range"
            type="range"
            min="0"
            max="360"
            step="1"
            value={Math.round(theta)}
            onChange={(e) => setRotation(Number(e.target.value))}
            aria-label="돌림판 회전 각도"
          />
          <div className="preview3d-readout">{readout}</div>
        </div>
      </div>
    );
  }

  // ── Flip-disc: fixed left half + a stack of right-half "leaves" turned like ──
  // book pages about the vertical diameter. NOT a card-opening-angle mechanism
  // and NOT a spinner — it renders its own genuinely-3D page-turn view (a leaf
  // lifts toward the viewer, goes edge-on past 90°, and tucks behind the opaque
  // fixed half). See flipDiscLeafStates() for the physics/state model.
  if (mechanism === 'flip-disc') {
    const fdParams = buildMechanismParams(cardParams, paperSize, colorMode) || {};
    const fdDefaults = getMechanism('flip-disc').defaultParams;
    // Single source of truth for radius/page-count — same call the generator makes.
    const geo = resolveFlipDiscGeometry({
      R: fdParams.R ?? fdDefaults.R,
      pages: fdParams.pages ?? fdDefaults.pages,
      paperSize,
    });
    const { R, pages } = geo;

    // Normalise so the assembled disc always reads ~320px regardless of the
    // clamped mm radius; `scale` converts flipDisc.js mm angles/nubs into px.
    const DISC_PX = 320;
    const Rpx = DISC_PX / 2;
    const scale = Rpx / R;
    const nubDepthPx = FLIPDISC_CONST.NUB_DEPTH * scale;

    const showing = clamp(flipped, 0, pages - 1);
    const { leaves } = flipDiscLeafStates(showing, pages);

    // translateZ alone does not reorder how the browser PAINTS these sibling
    // leaves: for coplanar quads this close in Z, Chromium keeps plain DOM
    // order (later sibling paints over earlier ones) instead of depth-sorting.
    // So the actual occlusion — turned leaves hidden behind the fixed half,
    // topmost remaining leaf on top of the rest — has to come from DOM ORDER,
    // not from `depth`. Paint bottom → top: turned-away leaves first (hidden
    // either way), then the fixed half (visually covering them), then the
    // not-yet-turned leaves from deepest-in-the-stack to topmost-remaining LAST.
    const flippedLeaves = leaves.filter((l) => l.flipped);
    const unflippedLeaves = leaves.filter((l) => !l.flipped).sort((a, b) => b.index - a.index);

    // Match flipDisc.js's ①②③… page labels so the preview and printed part agree.
    const CIRCLED = ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧'];
    const label = (i) => CIRCLED[i] || String(i + 1);
    const advance = () => setFlipped((f) => clamp(f + 1, 0, pages - 1));
    const retreat = () => setFlipped((f) => clamp(f - 1, 0, pages - 1));

    const readout =
      `${label(showing)}번 그림 (배경 + ${label(showing)}페이지) · ${pages}장 중 ${showing + 1}번째`;

    const renderLeaf = (leaf) => {
      // Staggered grip nub reusing flipDisc.js's angle convention, so the
      // fan of nubs poking past the arc hints how many leaves are stacked.
      const nubA = FLIPDISC_CONST.NUB_START_DEG + leaf.index * FLIPDISC_CONST.STAGGER_DEG;
      // Leaf-local frame: hinge (disc centre) sits at (0, Rpx) — the leaf's
      // left edge, vertical middle.
      const nub = polarToCartesian(0, Rpx, Rpx + nubDepthPx / 2, nubA);
      const hue = Math.round((leaf.index * 360) / pages);
      const isTop = leaf.index === showing && !leaf.flipped;
      const canAdvance = isTop && showing < pages - 1;
      return (
        <div
          key={leaf.index}
          className="preview3d-flipdisc-leaf"
          onClick={canAdvance ? advance : undefined}
          style={{
            width: `${Rpx}px`,
            height: `${DISC_PX}px`,
            left: `${Rpx}px`,
            transform: `translateZ(${leaf.depth}px) rotateY(${leaf.angleDeg}deg)`,
            cursor: canAdvance ? 'pointer' : 'default',
          }}
        >
          <div
            className="preview3d-flipdisc-nub"
            style={{ left: `${nub.x}px`, top: `${nub.y}px` }}
          />
          <div
            className="preview3d-flipdisc-face preview3d-flipdisc-front"
            style={{ background: `hsl(${hue}, 70%, 62%)` }}
          >
            <span className="preview3d-flipdisc-num">{label(leaf.index)}</span>
          </div>
          {/* Back face: mirrored border-radius so its in-place rotateY(180)
              lands exactly on the front's right-D silhouette. */}
          <div className="preview3d-flipdisc-face preview3d-flipdisc-back" />
        </div>
      );
    };

    return (
      <div className="preview3d-root">
        <div className="preview3d-stage preview3d-flipdisc-stage">
          <div
            className="preview3d-flipdisc-disc"
            style={{ width: `${DISC_PX}px`, height: `${DISC_PX}px` }}
          >
            {/* Turned-away leaves first — hidden behind the fixed half below. */}
            {flippedLeaves.map(renderLeaf)}

            {/* Fixed background half-disc (LEFT). Opaque and painted AFTER the
                turned leaves so it actually covers them (see DOM-order note above). */}
            <div
              className="preview3d-flipdisc-fixed"
              style={{ width: `${Rpx}px`, height: `${DISC_PX}px` }}
            />

            {/* Not-yet-turned leaves (RIGHT half-discs), farthest-in-the-stack
                first, topmost-remaining LAST so it paints on top of the rest. */}
            {unflippedLeaves.map(renderLeaf)}

            {/* Diameter/hinge line, drawn on top of everything. */}
            <div className="preview3d-flipdisc-hinge" />
          </div>
        </div>

        <div className="fold-slider-container">
          <div className="fold-slider-labels">
            <span>반쪽 넘김판</span>
            <span>{showing + 1} / {pages}</span>
          </div>
          <div className="preview3d-flipdisc-controls">
            <button
              type="button"
              className="preview3d-flipdisc-btn"
              onClick={retreat}
              disabled={showing === 0}
            >
              ← 이전 장으로
            </button>
            <button
              type="button"
              className="preview3d-flipdisc-btn"
              onClick={advance}
              disabled={showing >= pages - 1}
            >
              다음 장 넘기기 →
            </button>
          </div>
          <div className="preview3d-readout">{readout}</div>
        </div>
      </div>
    );
  }

  const params = buildMechanismParams(cardParams, paperSize, colorMode) || {};
  const defaults = getMechanism(mechanism).defaultParams;

  // --- mm → px scale for an honest-proportioned book ---
  const card = CARD_SIZES[paperSize] || CARD_SIZES.A4;
  const PX = 1.6;
  const pageW = (card.width / 2) * PX;
  const pageH = card.height * PX;
  const thetaPage = (180 - alpha) / 2; // deg, shared by every mechanism

  let attachmentLeft;
  let attachmentRight;
  let readout;

  if (mechanism === 'v-fold') {
    const armLength = params.armLength ?? defaults.armLength; // mm

    // --- Kinematics (authoritative math.js formulas) ---
    const beta = calculateVFoldAngle(alpha);                   // deg (= α)
    const h = calculatePopupHeight(armLength, beta);           // mm
    const gamma = radToDeg(Math.asin(clamp(h / armLength, 0, 1))); // deg (= α/2)

    const armPx = armLength * PX;
    const aRad = degToRad(gamma);
    const sinA = Math.sin(aRad);
    const cosA = Math.cos(aRad);
    const armLiftLeft = `rotate3d(${(-sinA).toFixed(5)}, 0, ${(-cosA).toFixed(5)}, ${gamma}deg)`;
    const armLiftRight = `rotate3d(${(-sinA).toFixed(5)}, 0, ${cosA.toFixed(5)}, ${gamma}deg)`;

    // Arm panel box: a triangle whose pivot corner O sits at the page's spine
    // centre. Height 2·armPx so its box straddles the spine centre; top offset
    // places that centre at the page's vertical middle.
    const armH = armPx * 2;
    const armTop = pageH / 2 - armPx;

    attachmentLeft = (
      <div
        className="preview3d-arm preview3d-arm-left"
        style={{ width: `${armPx}px`, height: `${armH}px`, top: `${armTop}px`, transform: armLiftLeft }}
      />
    );
    attachmentRight = (
      <div
        className="preview3d-arm preview3d-arm-right"
        style={{ width: `${armPx}px`, height: `${armH}px`, top: `${armTop}px`, transform: armLiftRight }}
      />
    );
    readout = `팝업 높이 h = ${h.toFixed(1)}mm · 팔 길이 L = ${armLength}mm · 팔 각도 γ = ${gamma.toFixed(0)}°`;
  } else if (mechanism === 'parallel-fold') {
    // Parallel-fold staircase — see the "Parallel-fold pose" comment block
    // above. N nested rectangular levels, each folding by the SAME local flex
    // γ = α/2 relative to its own parent (level i-1's outer face, or the page
    // for level 0), composed via DOM nesting + preserve-3d.
    const levels =
      Array.isArray(params.levels) && params.levels.length > 0
        ? params.levels
        : [{ width: params.width ?? defaults.width, depth: params.depth ?? defaults.depth }];

    // Local per-level flex, identical to the single-level (box) case:
    //   h_level = depth · sin(α/2)  ⇒  γ = arcsin(h/depth) = α/2.
    const gamma = alpha / 2; // deg

    const aRad = degToRad(gamma);
    const sinA = Math.sin(aRad);
    const cosA = Math.cos(aRad);

    attachmentLeft = renderStairLevel(levels, 0, 'left', sinA, cosA, gamma, PX, pageH);
    attachmentRight = renderStairLevel(levels, 0, 'right', sinA, cosA, gamma, PX, pageH);

    // Report cumulative rise + step count. Each level contributes depth·sin(α/2)
    // of rise measured along its own parent's normal.
    const totalDepth = levels.reduce((s, l) => s + l.depth, 0);
    const hTop = calculateParallelFoldHeight(totalDepth, alpha);
    readout = `계단 ${levels.length}단 · 총 높이 h ≈ ${hTop.toFixed(1)}mm · 접힘 각도 γ = ${gamma.toFixed(0)}°`;
  } else if (mechanism === 'spiral-spring') {
    // ── Spiral-spring pose ───────────────────────────────────────────────────
    // Same α family as V-fold/box/parallel: the physics ARE parameterised by the
    // card-opening angle. resolveSpiralGeometry is the single source of truth for
    // r0/rOuter/a/b/hStand/decos (same call the printable generator makes); the
    // extension trig comes from calculateSpiralExtension (utils/math.js).
    //
    // Anchors: hub glued to face A at distance `a` below the spine, rim tip to
    // face B at distance `b` above it. Opening the card swings the two anchors
    // apart on arms a, b about the spine hinge, so the coil must physically span
    //     D(α) = √(a² + b² − 2·a·b·cos α)
    // end-to-end. D(0) = |a−b| = rOuter (coil relaxed flat) and D(180) = a+b.
    //
    // VISIBLE-HEIGHT MAPPING (justified): the coil's flat printed disc already
    // occupies the D(0) = rOuter span at rest, so the standing height it pays out
    // is exactly the EXTRA distance beyond that rest span:
    //     standH(α) = D(α) − rOuter,          zero at α=0, hStand (=2b) at α=180.
    // That zero-point is the physically correct one — at α=0 the anchors are only
    // rOuter apart, the coil lies flat in its disc, nothing stands up. The per-
    // decoration heights (geo.decos[i].height, defined at FULL extension) are
    // scaled by the extension fraction ext = standH/hStand ∈ [0,1] so a marker
    // rises from the card plane and reaches its documented height only at α=180
    // (using standH/hStand — the true extension fraction — rather than the naive
    // D(α)/D(180), which would leave markers floating at ~58% height while the
    // coil is still visibly flat at α=0, contradicting the flat rest state).
    const geo = resolveSpiralGeometry({
      turns: params.turns ?? defaults.turns,
      pitch: params.pitch ?? defaults.pitch,
      decorations: params.decorations ?? defaults.decorations,
      paperSize,
    });
    const { r0, w, turns, rOuter, a, b, hStand, decos } = geo;

    const D = calculateSpiralExtension(alpha, a, b);        // mm, end-to-end span
    const standH = Math.max(0, D - rOuter);                 // mm, visible standing height
    const ext = hStand > 0 ? clamp(standH / hStand, 0, 1) : 0; // extension fraction 0..1

    const standPx = standH * PX;
    // Coil display radius: the spiral's mean radius, held constant along the helix
    // (a stylised cylinder-limit spring). Under the book's rotateX tilt each flat
    // ring renders as an ellipse, so the stack reads as a coil that grows taller.
    const coilRpx = ((r0 + rOuter) / 2) * PX;
    // One ring per half-turn for a smooth helix; total twist = turns·360°.
    const ringCount = clamp(Math.round(turns * 2), 6, 14);
    const twistPer = (turns * 360) / Math.max(1, ringCount - 1);

    // Build every 3-D element tagged with its local z (translateZ). We then sort
    // the array by z ASCENDING and emit in that order, so DOM order == depth
    // order (farthest-from-viewer first, nearest last). This is the flip-disc
    // lesson applied: for these near-coplanar rings/dots Chromium paints in DOM
    // order, NOT by translateZ, so paint order must be guaranteed by DOM order —
    // higher-z (nearer the viewer, the top of the standing coil) is emitted LAST
    // and therefore paints on top, exactly as it should.
    const parts = [];
    for (let k = 0; k < ringCount; k++) {
      const f = ringCount === 1 ? 0 : k / (ringCount - 1);
      const z = f * standPx;
      // Base (f=0) tinted cool, top (f=1) warm, so the helix's rise is legible
      // even when squat. Slightly thicker base ring to ground the coil.
      const hue = Math.round(210 - 190 * f);
      parts.push({
        z,
        node: (
          <div
            key={`ring-${k}`}
            className="preview3d-spiral-ring"
            style={{
              width: `${coilRpx * 2}px`,
              height: `${coilRpx * 2}px`,
              borderColor: `hsl(${hue}, 70%, 60%)`,
              borderWidth: k === 0 ? '3px' : '2px',
              transform: `translate(-50%, -50%) translateZ(${z.toFixed(2)}px) rotateZ(${(k * twistPer).toFixed(2)}deg)`,
            }}
          />
        ),
      });
    }
    for (const d of decos) {
      const z = d.height * ext * PX;                        // current marker height (px)
      const ang = degToRad(d.f * turns * 360);              // where along the spiral it sits
      const dx = coilRpx * Math.cos(ang);
      const dy = coilRpx * Math.sin(ang);
      const dotR = d.drawR * PX * 0.7;                      // planet radius (mm→px, trimmed for the pose)
      const hue = Math.round((d.n * 360) / (decos.length + 1));
      parts.push({
        z,
        node: (
          <div
            key={`deco-${d.n}`}
            className="preview3d-spiral-deco"
            style={{
              width: `${dotR * 2}px`,
              height: `${dotR * 2}px`,
              background: `hsl(${hue}, 72%, 60%)`,
              transform: `translate(-50%, -50%) translate(${dx.toFixed(2)}px, ${dy.toFixed(2)}px) translateZ(${z.toFixed(2)}px)`,
            }}
          />
        ),
      });
    }
    // Stable sort by z: farthest (z=0, coil base) first → nearest (coil top) last.
    parts.sort((p, q) => p.z - q.z);

    // The coil stands vertically in the symmetry plane regardless of α. It lives
    // inside the LEFT page (its hub is anchored to face A), so it inherits the
    // page's rotateY(θ); we cancel that with rotateY(−θ) about the SAME spine
    // point (transform-origin 0 0 sits exactly on the page's right-center pivot),
    // leaving the coil axis welded to world-vertical +Z at every opening angle.
    attachmentLeft = (
      <div
        className="preview3d-spiral"
        style={{ top: `${pageH / 2}px`, transform: `rotateY(${-thetaPage}deg)` }}
      >
        {parts.map((p) => p.node)}
      </div>
    );
    attachmentRight = null;

    readout =
      `늘어난 거리 D = ${D.toFixed(1)}mm · 코일 높이 h = ${standH.toFixed(1)}mm · ` +
      `${Math.round(turns)}바퀴 · 피치 ${w}mm`;
  } else {
    // box-popup. Same topology as V-fold (two attachments offset from the
    // spine by d, one shared crease AT the spine) so it reuses V-fold's
    // PROVEN rotate3d composition and pivot-at-spine convention verbatim --
    // only the shape changes (a plain rectangle instead of a triangle
    // narrowing to a point), since box-popup's "meeting edge" is a full-width
    // line instead of a single apex point.
    const boxWidth = params.width ?? defaults.width;   // mm, along the spine direction
    const boxDepth = params.height ?? defaults.height;  // mm, distance from spine (= d)

    const h = calculateParallelFoldHeight(boxDepth, alpha);          // mm
    const gamma = radToDeg(Math.asin(clamp(h / boxDepth, 0, 1)));    // deg (= α/2)

    const depthPx = boxDepth * PX;
    const widthPx = boxWidth * PX;
    const boxTop = pageH / 2 - widthPx / 2;

    const aRad = degToRad(gamma);
    const sinA = Math.sin(aRad);
    const cosA = Math.cos(aRad);
    const flapLiftLeft = `rotate3d(${(-sinA).toFixed(5)}, 0, ${(-cosA).toFixed(5)}, ${gamma}deg)`;
    const flapLiftRight = `rotate3d(${(-sinA).toFixed(5)}, 0, ${cosA.toFixed(5)}, ${gamma}deg)`;

    attachmentLeft = (
      <div
        className="preview3d-boxflap preview3d-boxflap-left"
        style={{ width: `${depthPx}px`, height: `${widthPx}px`, top: `${boxTop}px`, transform: flapLiftLeft }}
      />
    );
    attachmentRight = (
      <div
        className="preview3d-boxflap preview3d-boxflap-right"
        style={{ width: `${depthPx}px`, height: `${widthPx}px`, top: `${boxTop}px`, transform: flapLiftRight }}
      />
    );
    readout = `팝업 높이 h = ${h.toFixed(1)}mm · 상자 폭 = ${boxWidth}mm · 접힘 각도 γ = ${gamma.toFixed(0)}°`;
  }

  return (
    <div className="preview3d-root">
      <div className="preview3d-stage">
        <div className="preview3d-book">
          {/* Left page — hinged on the spine (its right edge) */}
          <div
            className="preview3d-page preview3d-page-left"
            style={{
              width: `${pageW}px`,
              height: `${pageH}px`,
              transform: `rotateY(${thetaPage}deg)`,
            }}
          >
            {attachmentLeft}
          </div>
          {/* Right page — hinged on the spine (its left edge) */}
          <div
            className="preview3d-page preview3d-page-right"
            style={{
              width: `${pageW}px`,
              height: `${pageH}px`,
              transform: `rotateY(${-thetaPage}deg)`,
            }}
          >
            {attachmentRight}
          </div>
        </div>
      </div>

      <div className="fold-slider-container">
        <div className="fold-slider-labels">
          <span>카드 열림 각도</span>
          <span>{Math.round(alpha)}°</span>
        </div>
        <input
          className="custom-range"
          type="range"
          min="0"
          max="180"
          step="1"
          value={alpha}
          onChange={(e) => setAlpha(Number(e.target.value))}
          aria-label="카드 열림 각도"
        />
        <div className="preview3d-readout">{readout}</div>
      </div>
    </div>
  );
}
