import React, { useState } from 'react';
import useCardStore from '../../store/useCardStore';
import { getMechanism, buildMechanismParams } from '../../generators/registry';
import { resolveLayeredStageGeometry } from '../../generators/layeredStage';
import { resolveAccordionGeometry } from '../../generators/accordionPopup';
import { CARD_SIZES } from '../../generators/constants';
import {
  calculateVFoldAngle,
  calculatePopupHeight,
  calculateParallelFoldHeight,
  radToDeg,
  degToRad,
  clamp,
} from '../../utils/math';
import '../../styles/preview.css';

// Mechanisms with a working 3D assembled-pose preview. Anything else falls
// back to the "not ready yet" placeholder.
const SUPPORTED_3D = new Set(['v-fold', 'box-popup', 'parallel-fold', 'layered-stage', 'accordion']);

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
 * Recursively build the zigzag pleat chain of an accordion ("병풍") strip.
 *
 * Unlike the parallel-fold staircase (whose steps all rise on the SAME side of
 * the spine, so their local flex is a constant-sign compound), an accordion is a
 * concertina: consecutive panels tilt to OPPOSITE sides of the anchor-to-anchor
 * axis. Panel 0 is laid down by the branch below at the left anchor with a fixed
 * world tilt of −ρ; every deeper panel is a DOM child of the previous one and
 * applies a RELATIVE rotateY that flips the running tilt across the axis:
 *   panel 1: +2ρ  (−ρ → +ρ),  panel 2: −2ρ  (+ρ → −ρ),  panel 3: +2ρ, …
 * so the cumulative world tilt alternates −ρ, +ρ, −ρ, +ρ … — a true zigzag.
 * (If we used a constant +sign like a naive staircase, the frame would spiral
 * and curl back on itself instead of marching across to the right anchor; this
 * is the same alternation lesson called out in the parallel-fold notes.)
 *
 * All creases are VERTICAL (parallel to the spine), so each fold is a plain
 * rotateY and the whole strip bulges in ±z (toward/away from the viewer) — the
 * physical picture of a folding screen standing on the open card, seen in plan.
 *
 * @param {number} i     panel index (>=1 here; panel 0 handled inline)
 * @param {number} M     total pleat-panel count
 * @param {number} wPx   panel length (along the chord) in px
 * @param {number} hPx   panel height (along the spine) in px
 * @param {number} rho   standing half-angle ρ in degrees
 */
function renderAccordionPanel(i, M, wPx, hPx, rho) {
  if (i >= M) return null;
  const relAngle = i % 2 === 1 ? 2 * rho : -2 * rho;
  return (
    <div
      className="preview3d-pleat"
      style={{
        width: `${wPx}px`,
        height: `${hPx}px`,
        left: '100%',
        top: 0,
        transformOrigin: 'left center',
        transform: `rotateY(${relAngle.toFixed(4)}deg)`,
      }}
    >
      {renderAccordionPanel(i + 1, M, wPx, hPx, rho)}
    </div>
  );
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

  const mechanism = cardParams?.mechanism;

  if (!cardParams || !SUPPORTED_3D.has(mechanism)) {
    return (
      <div className="preview3d-root">
        <div className="preview3d-placeholder">
          이 메커니즘은 아직 3D 미리보기를 준비 중이에요! (현재는 브이폴드 · 상자 팝업만 지원)
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
  let accordionStrip = null; // book-level (spans BOTH pages); set by the accordion branch
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
  } else if (mechanism === 'layered-stage') {
    // Layered-stage — after its cut/fold bugfix (see layeredStage.js header),
    // this is now structurally the SAME "one spine-crossing pleated strip,
    // alternating mountain/valley, each band flexing γ = α/2" pattern as
    // parallel-fold, just with depth == height per band (flat-foldability) and
    // wider tiers for facade art. Reuses renderStairLevel verbatim.
    // resolveLayeredStageGeometry is the SAME geometry source of truth the
    // flat-2D generator and its decoration slots use — no duplicated logic.
    const geo = resolveLayeredStageGeometry({
      layers: params.layers,
      layerSpec: params.layerSpec,
      paperSize,
    });
    const levels = geo.layers.map((l) => ({ width: l.width, depth: l.depth }));

    const gamma = alpha / 2; // deg, identical per-band flex to parallel-fold
    const aRad = degToRad(gamma);
    const sinA = Math.sin(aRad);
    const cosA = Math.cos(aRad);

    attachmentLeft = renderStairLevel(levels, 0, 'left', sinA, cosA, gamma, PX, pageH);
    attachmentRight = renderStairLevel(levels, 0, 'right', sinA, cosA, gamma, PX, pageH);

    const hTop = calculateParallelFoldHeight(geo.cumulativeDepth, alpha);
    readout = `무대 ${geo.count}층 · 총 높이 h ≈ ${hTop.toFixed(1)}mm · 접힘 각도 γ = ${gamma.toFixed(0)}°`;
  } else if (mechanism === 'accordion') {
    // Accordion ("병풍") — a concertina strip spanning BOTH pages, NOT a
    // per-page attachment, so it is rendered at book level (accordionStrip)
    // rather than as attachmentLeft/Right. resolveAccordionGeometry is the SAME
    // clamp/geometry source of truth the flat-2D generator uses — no dup logic.
    //
    // Kinematics (derived; verified against resolveAccordionGeometry + the D=2a
    // chord math). Anchors are glued at distance `a` from the spine, one per
    // page; the page rotateY(±θ), θ=90−α/2, carries each anchor to world
    //   A_L = (−a·sin(α/2), 0, a·cos(α/2)),  A_R = (+a·sin(α/2), 0, a·cos(α/2))
    // relative to the spine-centre O. Their separation is the chord
    //   D(α) = 2a·sin(α/2)                          ✓ matches the header
    // and they sit at height z_base = a·cos(α/2) (α=0 → z=a, fully lifted &
    // compressed; α=180 → z=0, lying on the card). The flat strip length
    // L = 2.2a is fixed, so the standing half-angle is cos ρ = D/L and each of
    // the M panels (width w = L/M) zigzags at ±ρ about the chord, projecting
    // w·cosρ onto it (Σ = M·w·cosρ = L·(D/L) = D, so the far end lands on A_R)
    // and w·sinρ = H sideways in z. α=180 → cosρ = 2a/2.2a = 0.909, ρ≈24.6°:
    // a gently zigzagging (never taut) screen, exactly the design intent.
    const geo = resolveAccordionGeometry({
      a: params.a,
      panels: params.panels,
      wallHeight: params.wallHeight,
      paperSize,
    });
    const { a, panels: M, w, wallHeight: hWall, L } = geo;

    const halfA = degToRad(alpha / 2);
    const cosRho = clamp((2 * a * Math.sin(halfA)) / L, 0, 1); // = D/L
    const rho = radToDeg(Math.acos(cosRho));                   // standing half-angle
    const H = w * Math.sqrt(1 - cosRho * cosRho);              // bulge per pleat (mm)

    const wPx = w * PX;
    const hPx = hWall * PX;
    const dHalfPx = a * Math.sin(halfA) * PX; // D/2 : left anchor x = −this
    const zBasePx = a * Math.cos(halfA) * PX; // anchor height above the card plane

    accordionStrip = (
      <div
        className="preview3d-accordion"
        style={{ transform: `translate3d(0px, ${pageH / 2}px, 0px)` }}
      >
        {/* Panel 0: translated to the LEFT anchor and tilted −ρ (bulge → +z). */}
        <div
          className="preview3d-pleat"
          style={{
            width: `${wPx}px`,
            height: `${hPx}px`,
            left: 0,
            top: `${-hPx / 2}px`,
            transformOrigin: 'left center',
            transform: `translate3d(${(-dHalfPx).toFixed(3)}px, 0px, ${zBasePx.toFixed(3)}px) rotateY(${(-rho).toFixed(4)}deg)`,
          }}
        >
          {renderAccordionPanel(1, M, wPx, hPx, rho)}
        </div>
      </div>
    );
    readout = `병풍 ${M}폭 · 서있는 각 ρ = ${rho.toFixed(0)}° · 주름 높이 ≈ ${H.toFixed(1)}mm`;
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
          {/* Book-level attachment: the accordion strip spans BOTH pages, so it
              is a sibling of the pages (world/book frame), not a page child. */}
          {accordionStrip}
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
