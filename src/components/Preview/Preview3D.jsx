import React, { useState, useRef, useCallback, useEffect } from 'react';
import useCardStore from '../../store/useCardStore';
import { getMechanism, buildMechanismParams } from '../../generators/registry';
import { resolveFlapClapGeometry } from '../../generators/flapClap';
import { resolveAccordionGeometry } from '../../generators/accordionPopup';
import { resolveLayeredStageGeometry } from '../../generators/layeredStage';
import { resolveAutoSlideWindow, sliderDistance } from '../../generators/autoSlideWindow';
import { resolveSpiralGeometry } from '../../generators/spiralSpring';
import { generatePullTab } from '../../generators/pullTab';
import { resolveRisingSlide } from '../../generators/risingSlide';
import { resolveSlideToSwing, SLIDE_SWING_LIMITS } from '../../generators/slideToSwing';
import { resolveVolvelleGeometry } from '../../generators/volvelle';
import { resolveFlipDiscGeometry } from '../../generators/flipDisc';
import { CARD_SIZES } from '../../generators/constants';
import {
  calculateVFoldAngle,
  calculatePopupHeight,
  calculateParallelFoldHeight,
  radToDeg,
  degToRad,
  clamp,
  polarToCartesian,
} from '../../utils/math';
import '../../styles/preview.css';

// Mechanisms with a working 3D assembled-pose preview. Anything else falls
// back to the "not ready yet" placeholder.
const SUPPORTED_3D = new Set([
  'v-fold',
  'box-popup',
  'parallel-fold',
  'flap-clap',
  'accordion',
  'layered-stage',
  'auto-slide-window',
  'spiral-spring',
  'pull-tab',
  'rising-slide',
  'slide-to-swing',
  'volvelle',
  'flip-disc',
  'straw-rocket',
]);

// Mechanisms that don't fit the two-page book model at all (no spine, no
// card-opening angle) — they get their own top-level 3D container instead
// of .preview3d-book. See the `customStage` branches below.
const NO_BOOK = new Set(['volvelle', 'flip-disc', 'straw-rocket']);

// Default camera orbit — same 3/4 view the stage always used to be locked to.
const DEFAULT_ORBIT = { rx: -52, ry: -20, zoom: 1 };
const ORBIT_RX_RANGE = [-85, -10]; // deg, keeps the "look down onto the card" framing
const ORBIT_ZOOM_RANGE = [0.6, 1.8];

// Mechanisms whose own motion is an independently pulled/pushed handle, not
// the card's opening angle — these get the handlePos slider instead of (or
// alongside) the fold-angle one. Label shown above that slider per mechanism.
const HAND_DRIVEN_LABEL = {
  'pull-tab': '손잡이 위치',
  'rising-slide': '손잡이 위치',
  'slide-to-swing': '손잡이 좌우 위치',
};

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
 * @param {number} [insetPx=0] level-0 only: hinge offset from the spine, in px
 *                             (0 = flush at the spine, like box-popup/parallel-fold;
 *                             > 0 = inset, like accordion's off-spine anchor —
 *                             same inset technique flap-clap uses inline)
 *
 * Fold DIRECTION alternates per level: even levels (0,2,4…) flex +γ ("risers",
 * lifting away from the parent surface), odd levels flex −γ ("treads", flattening
 * back parallel to the base). This is (a) the mountain/valley alternation a real
 * flat-foldable staircase requires and (b) what keeps the running frame from
 * compounding into a spiral — so the steps ascend monotonically instead of
 * rotating past vertical and retracting inside earlier levels. (Accordion reuses
 * this same alternation for its zigzag pleats — see the mechanism branch below.)
 */
function renderStairLevel(levels, i, side, sinA, cosA, gamma, PX, parentDimPx, insetPx = 0) {
  if (i >= levels.length) return null;
  const depthPx = levels[i].depth * PX;  // extent away from the spine
  const widthPx = levels[i].width * PX;  // extent along the spine
  // Centre this level on its parent's along-spine span.
  const top = (parentDimPx - widthPx) / 2;
  // Spine-side (hinge) edge sits on the parent's outer edge. For level 0 the
  // parent is the page and the hinge is AT the spine (right:0 / left:0) unless
  // insetPx pushes it further out; for deeper levels the hinge is the parent's
  // far edge (right:100% / left:100%).
  const pos =
    side === 'left'
      ? { right: i === 0 ? insetPx : '100%' }
      : { left: i === 0 ? insetPx : '100%' };
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
  // Normalized 0..1 hand-driven control for mechanisms whose motion is an
  // independently-pulled/pushed handle rather than the card's own opening
  // angle (pull-tab, rising-slide, slide-to-swing) — see HAND_DRIVEN below.
  const [handlePos, setHandlePos] = useState(0.5);
  // volvelle: rotor spin angle (deg, 0..360). flip-disc: how many pages have
  // been turned (int, 0..pages). Neither mechanism uses the book/alpha model
  // at all — see the `customStage` branches below.
  const [spin, setSpin] = useState(0);
  const [flipped, setFlipped] = useState(0);
  const [orbit, setOrbit] = useState(DEFAULT_ORBIT);
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef(null); // { pointerX, pointerY, rx, ry }
  const stageRef = useRef(null);

  const handlePointerDown = useCallback(
    (e) => {
      e.currentTarget.setPointerCapture(e.pointerId);
      dragStart.current = { x: e.clientX, y: e.clientY, rx: orbit.rx, ry: orbit.ry };
      setIsDragging(true);
    },
    [orbit.rx, orbit.ry],
  );

  const handlePointerMove = useCallback((e) => {
    if (!dragStart.current) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    setOrbit((prev) => ({
      ...prev,
      ry: dragStart.current.ry + dx * 0.4,
      rx: clamp(dragStart.current.rx - dy * 0.4, ORBIT_RX_RANGE[0], ORBIT_RX_RANGE[1]),
    }));
  }, []);

  const handlePointerUp = useCallback((e) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    dragStart.current = null;
    setIsDragging(false);
  }, []);

  const resetOrbit = useCallback(() => setOrbit(DEFAULT_ORBIT), []);

  // Non-passive native listener: React's synthetic onWheel is registered
  // passive, so preventDefault() there would warn and not stop page scroll.
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return undefined;
    const onWheel = (e) => {
      e.preventDefault();
      setOrbit((prev) => ({
        ...prev,
        zoom: clamp(prev.zoom - e.deltaY * 0.001, ORBIT_ZOOM_RANGE[0], ORBIT_ZOOM_RANGE[1]),
      }));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  const mechanism = cardParams?.mechanism;

  if (!cardParams || !SUPPORTED_3D.has(mechanism)) {
    return (
      <div className="preview3d-root">
        <div className="preview3d-placeholder">
          이 메커니즘은 아직 3D 미리보기를 준비 중이에요!
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
  // Extra content parented directly to .preview3d-book (not to either page) —
  // only spiral-spring needs this, since its coil spans BETWEEN two anchors
  // that live on two independently-rotating pages, so it can't be a child of
  // either one.
  let attachmentBook = null;
  // Fully custom top-level content for NO_BOOK mechanisms — replaces
  // .preview3d-book entirely (see the render section below).
  let customStage = null;
  let readout;

  if (mechanism === 'volvelle') {
    // Volvelle (돌림판) — see generators/volvelle.js. No spine, no card-
    // opening angle: four discs (back/spacer/rotor/cover) sandwiched, the
    // rotor spinning freely behind the cover's window. Rendered as its own
    // disc stack (not .preview3d-book) with a dedicated rotation control
    // (`spin`, deg) instead of `alpha`.
    const geo = resolveVolvelleGeometry({ R: params.R ?? defaults.R, sectors: params.sectors ?? defaults.sectors });
    const { R, sectors, outerR, sigma, thetaW } = geo;
    const winInner = clamp(Math.round(R * 0.18), 5, R - 8);
    const rOut = geo.rOut;

    const discPx = outerR * 2 * PX;
    const rotorPx = R * 2 * PX;

    // Trace the cover's outer rim as a many-sided polygon (clip-path can't
    // combine a CSS circle with a cut hole any other way), evenodd-combined
    // with the window's annular-sector hole so the rotor shows through.
    const pt = (r, deg) => {
      const rad = degToRad(deg - 90); // shift so 0deg = up, matching the SVG generator
      const x = 50 + (r / outerR) * 50 * Math.cos(rad);
      const y = 50 + (r / outerR) * 50 * Math.sin(rad);
      return `${x.toFixed(2)}% ${y.toFixed(2)}%`;
    };
    const segs = 32;
    const rim = Array.from({ length: segs + 1 }, (_, i) => pt(outerR, (i / segs) * 360));
    const winStart = -thetaW / 2;
    const winEnd = thetaW / 2;
    const holeOuter = Array.from({ length: 13 }, (_, i) => pt(rOut, winStart + ((winEnd - winStart) * i) / 12));
    const holeInner = Array.from({ length: 13 }, (_, i) => pt(winInner, winEnd - ((winEnd - winStart) * i) / 12));
    const bridge = pt(outerR, 0);
    const coverClip = `polygon(evenodd, ${rim.join(', ')}, ${bridge}, ${holeOuter.join(', ')}, ${holeInner.join(', ')}, ${bridge})`;

    const sectorNums = Array.from({ length: sectors }, (_, k) => {
      const mid = polarToCartesian(50, 50, 38, k * sigma + sigma / 2);
      return (
        <span key={k} className="preview3d-rotor-num" style={{ left: `${mid.x}%`, top: `${mid.y}%` }}>
          {k + 1}
        </span>
      );
    });
    const sectorGradient = `conic-gradient(from 0deg, ${Array.from({ length: sectors }, (_, k) =>
      `${k % 2 === 0 ? 'rgba(236,72,153,0.35)' : 'rgba(99,102,241,0.35)'} ${k * sigma}deg ${(k + 1) * sigma}deg`,
    ).join(', ')})`;

    customStage = (
      <div className="preview3d-disc-stack">
        <div className="preview3d-disc preview3d-disc-back" style={{ width: `${discPx}px`, height: `${discPx}px`, transform: 'translate(-50%,-50%) translateZ(0px)' }} />
        <div className="preview3d-disc preview3d-disc-spacer" style={{ width: `${discPx * 0.94}px`, height: `${discPx * 0.94}px`, transform: 'translate(-50%,-50%) translateZ(3px)' }} />
        <div
          className="preview3d-disc preview3d-disc-rotor"
          style={{ width: `${rotorPx}px`, height: `${rotorPx}px`, background: sectorGradient, transform: `translate(-50%,-50%) translateZ(6px) rotateZ(${spin}deg)` }}
        >
          {sectorNums}
        </div>
        <div className="preview3d-disc preview3d-disc-cover" style={{ width: `${discPx}px`, height: `${discPx}px`, clipPath: coverClip, transform: 'translate(-50%,-50%) translateZ(9px)' }} />
      </div>
    );

    const shown = (((sectors - Math.round(spin / sigma)) % sectors) + sectors) % sectors;
    readout = `창문 속 섹터 ${shown + 1}/${sectors} · 회전각 ${Math.round(spin)}° · 창 폭 ${thetaW.toFixed(0)}°`;
  } else if (mechanism === 'flip-disc') {
    // Flip-disc (반쪽 넘김판) — see generators/flipDisc.js. A fixed left
    // half-disc + N right half-page leaves hinged on the same diameter,
    // flipped one at a time like book pages. No spine/card-angle either —
    // its own disc stack + an integer page-turn control (`flipped`).
    const geo = resolveFlipDiscGeometry({ R: params.R ?? defaults.R, pages: params.pages ?? defaults.pages, paperSize });
    const { R, pages, tab } = geo;
    const discPx = R * 2 * PX;
    const flippedClamped = clamp(flipped, 0, pages);
    const GAP = 3; // px depth stagger between leaves
    // Every leaf's box is CENTRED on the hinge (margin = -half its own size),
    // not edge-aligned — the hinge is the circle's diameter, which passes
    // through the box's centre, not its edge. clip-path then keeps only the
    // right half (flip pages) or left half (fixed background); rotateY's
    // default centre transform-origin is therefore already the hinge line.
    const discCenterStyle = { width: `${discPx}px`, height: `${discPx}px`, marginLeft: `${-discPx / 2}px`, marginTop: `${-discPx / 2}px` };

    const leaves = Array.from({ length: pages }, (_, i) => {
      const isDown = i < flippedClamped;
      const z = isDown ? (i + 1) * GAP : (pages - i) * GAP;
      return (
        <div
          key={i}
          className="preview3d-disc-leaf"
          style={{
            ...discCenterStyle,
            transform: `rotateY(${isDown ? 180 : 0}deg) translateZ(${z}px)`,
          }}
        >
          <span className="preview3d-disc-leaf-label">{i + 1}</span>
        </div>
      );
    });

    customStage = (
      <div className="preview3d-disc-stack">
        <div
          className="preview3d-disc-leaf preview3d-disc-leaf-fixed"
          style={{ ...discCenterStyle, transform: `translateZ(${(pages + 1) * GAP}px)` }}
        />
        {leaves}
      </div>
    );

    readout = `넘긴 페이지 ${flippedClamped}/${pages} · 지금 보이는 접시: ${flippedClamped === pages ? '마지막' : `${flippedClamped + 1}번`} · 반지름 ${R}mm · 경첩 폭 ${tab}mm`;
  } else if (mechanism === 'straw-rocket') {
    // Straw rocket (빨대 로켓) — see generators/strawRocket.js. A rolled paper
    // tube (fits over a straw) with flat front/back decoration silhouettes
    // glued to it. No fold state at all (nothing to slide/spin/open) — a
    // purely static assembled object, viewable only via camera orbit.
    const tubeRadiusPx = (22 / (2 * Math.PI)) * PX; // tubeWidth wraps into the circumference
    const tubeHeightPx = 20 * PX;
    const sides = 10;
    const tubeStrips = Array.from({ length: sides }, (_, i) => {
      const angle = (i / sides) * 360;
      return (
        <div
          key={i}
          className="preview3d-rocket-strip"
          style={{
            width: `${((2 * Math.PI * tubeRadiusPx) / sides) * 1.05}px`,
            height: `${tubeHeightPx}px`,
            transform: `translate(-50%,-50%) rotateY(${angle}deg) translateZ(${tubeRadiusPx}px)`,
          }}
        />
      );
    });

    customStage = (
      <div className="preview3d-disc-stack preview3d-rocket">
        {tubeStrips}
        <div
          className="preview3d-rocket-deco preview3d-rocket-deco-front"
          style={{ transform: `translate(-50%,-100%) translateZ(${tubeRadiusPx + 1}px)` }}
        />
        <div
          className="preview3d-rocket-deco preview3d-rocket-deco-back"
          style={{ transform: `translate(-50%,-100%) rotateY(180deg) translateZ(${tubeRadiusPx + 1}px)` }}
        />
      </div>
    );

    readout = '빨대를 꽂아서 불어보세요 — 카메라를 드래그해서 조립된 모양을 살펴보세요';
  } else if (mechanism === 'v-fold') {
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
  } else if (mechanism === 'accordion') {
    // Accordion (병풍 팝업) — see generators/accordionPopup.js for the closed-form
    // physics. SAME topology as V-fold/box-popup (two attachment points at
    // distance `a` from the spine, one per page), except instead of a single
    // arm/flap meeting at the spine, a uniform M-panel zigzag chain spans
    // between them. renderStairLevel's alternating ±γ recursion (built for
    // parallel-fold's staircase) IS that zigzag verbatim once every level is
    // the SAME size and folds by the SAME constant angle ρ(α) instead of
    // varying per level — so we reuse it directly, nested inside a level-0
    // hinge inset by `a` from the spine (the `insetPx` param added above).
    //   D(α) = 2·a·sin(α/2)            anchor-to-anchor chord (authoritative)
    //   cos ρ(α) = D(α) / L,  L = SAFETY·a = M·w   ⇒  ρ = arccos(D/L)
    const geo = resolveAccordionGeometry({
      a: params.a ?? defaults.a,
      panels: params.panels ?? defaults.panels,
      wallHeight: params.wallHeight ?? defaults.wallHeight,
      paperSize,
    });

    const D = 2 * geo.a * Math.sin(degToRad(alpha / 2));
    const rho = radToDeg(Math.acos(clamp(D / geo.L, -1, 1)));

    const rRad = degToRad(rho);
    const sinR = Math.sin(rRad);
    const cosR = Math.cos(rRad);
    const aPx = geo.a * PX;

    const levels = Array.from({ length: geo.panels }, () => ({ width: geo.wallHeight, depth: geo.w }));

    attachmentLeft = renderStairLevel(levels, 0, 'left', sinR, cosR, rho, PX, pageH, aPx);
    attachmentRight = renderStairLevel(levels, 0, 'right', sinR, cosR, rho, PX, pageH, aPx);

    readout = `병풍 ${geo.panels}단 · 앵커 간격 D = ${D.toFixed(1)}mm · 접힘각 ρ = ${rho.toFixed(0)}°`;
  } else if (mechanism === 'layered-stage') {
    // Layered stage (층층이 무대) — see generators/layeredStage.js. Each layer i
    // is its OWN independent box-popup-style flap: h_i = d_i·sin(α/2), the
    // SAME gamma = α/2 and rotate3d formula as the box-popup branch above.
    // The only difference from box-popup is the hinge sits inset by the
    // layer's accumulated depth `near_i` from the spine instead of flush
    // against it — the same off-spine inset technique flap-clap uses inline
    // (transform-origin stays the flap's own edge; only its screen position
    // moves). Layers never overlap in depth (near_i are disjoint bands), so
    // there's no z-order ambiguity between them.
    const geo = resolveLayeredStageGeometry({ layers: params.layers ?? defaults.layers, paperSize });

    const gamma = alpha / 2; // deg, identical to box-popup
    const aRad = degToRad(gamma);
    const sinA = Math.sin(aRad);
    const cosA = Math.cos(aRad);
    const flapLiftLeft = `rotate3d(${(-sinA).toFixed(5)}, 0, ${(-cosA).toFixed(5)}, ${gamma}deg)`;
    const flapLiftRight = `rotate3d(${(-sinA).toFixed(5)}, 0, ${cosA.toFixed(5)}, ${gamma}deg)`;

    attachmentLeft = geo.layers.map((layer) => {
      const depthPx = layer.depth * PX;
      const widthPx = layer.width * PX;
      const top = pageH / 2 - widthPx / 2;
      return (
        <div
          key={`stage-left-${layer.index}`}
          className="preview3d-boxflap preview3d-boxflap-left"
          style={{
            width: `${depthPx}px`,
            height: `${widthPx}px`,
            top: `${top}px`,
            right: `${layer.near * PX}px`,
            transform: flapLiftLeft,
          }}
        />
      );
    });
    attachmentRight = geo.layers.map((layer) => {
      const depthPx = layer.depth * PX;
      const widthPx = layer.width * PX;
      const top = pageH / 2 - widthPx / 2;
      return (
        <div
          key={`stage-right-${layer.index}`}
          className="preview3d-boxflap preview3d-boxflap-right"
          style={{
            width: `${depthPx}px`,
            height: `${widthPx}px`,
            top: `${top}px`,
            left: `${layer.near * PX}px`,
            transform: flapLiftRight,
          }}
        />
      );
    });

    const deepest = geo.layers[geo.layers.length - 1];
    const deepestHeight = deepest ? calculateParallelFoldHeight(deepest.depth, alpha) : 0;
    readout = `무대 ${geo.count}겹 · 가장 안쪽 벽 높이 ≈ ${deepestHeight.toFixed(1)}mm · 접힘각 γ = ${gamma.toFixed(0)}°`;
  } else if (mechanism === 'flap-clap') {
    // Flap-clap — see generators/flapClap.js for the full derivation. Unlike
    // every other mechanism here, this flap's OWN fold angle does NOT track
    // α: it is glued rigid at a fixed angle δ (its rotate3d angle below is a
    // CONSTANT, computed once from δ, not from `alpha`). Only the page's own
    // rotateY(±θ_page) moves it through space — two independent rigid points
    // on two independently-rotating pages, so their separation still varies
    // with α even though neither flap "flexes" on its own.
    //
    // Reuses box-popup's exact rotate3d composition (a flap hinged at some
    // inset distance from the spine, rotating by a flex angle γ relative to
    // its own page): γ_fixed = 180° − δ makes that formula's standing height
    // d·sin(γ) equal h·sin(δ) = B, and its horizontal reach d·cos(γ) equal
    // h·cos(180−δ) = −h·cos(δ), matching flapClap.js's A = a − h·cos(δ)
    // exactly — so this pose is the same physical model as the flat-pattern
    // math, just read off via CSS 3D instead of trig-by-hand.
    const a = params.offset ?? defaults.offset;
    const h = params.flapLength ?? defaults.flapLength;
    const b = params.halfWidth ?? defaults.halfWidth;
    const delta = params.delta ?? defaults.delta;

    const gammaFixed = 180 - delta; // deg, CONSTANT — not driven by alpha
    const gRad = degToRad(gammaFixed);
    const sinG = Math.sin(gRad);
    const cosG = Math.cos(gRad);
    const flapLiftLeft = `rotate3d(${(-sinG).toFixed(5)}, 0, ${(-cosG).toFixed(5)}, ${gammaFixed}deg)`;
    const flapLiftRight = `rotate3d(${(-sinG).toFixed(5)}, 0, ${cosG.toFixed(5)}, ${gammaFixed}deg)`;

    const aPx = a * PX;
    const hPx = h * PX;
    const bPx = b * PX;
    const flapTop = pageH / 2 - bPx;

    attachmentLeft = (
      <div
        className="preview3d-flap preview3d-flap-left"
        style={{ width: `${hPx}px`, height: `${bPx * 2}px`, top: `${flapTop}px`, right: `${aPx}px`, transform: flapLiftLeft }}
      />
    );
    attachmentRight = (
      <div
        className="preview3d-flap preview3d-flap-right"
        style={{ width: `${hPx}px`, height: `${bPx * 2}px`, top: `${flapTop}px`, left: `${aPx}px`, transform: flapLiftRight }}
      />
    );

    // Readout: authoritative A/B/clap angle straight from the same resolver
    // the flat-pattern generator uses, so the pose and the printed template
    // can never silently disagree.
    const geo = resolveFlapClapGeometry({ offset: a, flapLength: h, halfWidth: b, delta, paperSize });
    const gapNow = Math.abs(2 * (geo.A * Math.sin(degToRad(alpha / 2)) - geo.B * Math.cos(degToRad(alpha / 2))));
    readout = `탁! 각도 α* ≈ ${geo.clapAngle}° · 지금 간격 ${gapNow.toFixed(1)}mm · 열림 간격 ${geo.openGap}mm · 닫힘 잔여간격 ${geo.closedGap}mm`;
  } else if (mechanism === 'auto-slide-window') {
    // Auto-slide window (열면 바뀌는 액자 카드) — see generators/autoSlideWindow.js
    // for the closed-form slider-crank derivation. Reuses its own exported
    // `sliderDistance(α, p, L)` verbatim (no re-derivation): pivot P rides
    // the LEFT ("front") page at fixed distance p from the spine — same as
    // every other arm/flap attachment, no extra rotation needed beyond the
    // page's own rotateY. The window frame + sliding message strip live on
    // the RIGHT ("back") page at s(α) from the spine.
    //
    // P and S sit on two INDEPENDENTLY-rotating pages under this file's
    // shared symmetric book convention, whereas autoSlideWindow.js's own
    // diagram assumes a single rigid cross-section with one face flat on a
    // table — the two are equivalent only up to the relative dihedral angle
    // (α either way), not a literal shared plane. So — matching this file's
    // existing "stylised pose, invisible deviation" precedent (see the
    // V-fold arm comment above) — we render the two functionally
    // load-bearing parts (the pivot, and the sliding strip behind the
    // window: the actual visual payoff of "open the card and the picture
    // changes by itself") and skip drawing a literal connecting strut bar,
    // rather than fake a cross-page 3D projection.
    const geo = resolveAutoSlideWindow({
      pivotArm: params.pivotArm ?? defaults.pivotArm,
      strut: params.strut ?? defaults.strut,
      windowHeight: params.windowHeight ?? defaults.windowHeight,
      paperSize,
    });

    const s = sliderDistance(alpha, geo.p, geo.L);
    const pPx = geo.p * PX;
    const winHPx = geo.winH * PX; // window opening size along the travel axis
    const winWPx = geo.winW * PX; // window opening size along the spine
    const stripLenPx = geo.stripLen * PX;
    const sliderWxPx = geo.sliderWx * PX;
    // Strip's near edge sits at s(α) + uMin from the spine (uMin ≤ 0, so this
    // is s(α) minus the strip's inward overhang past the window).
    const stripInsetPx = (s + geo.uMin) * PX;
    const u1Px = (geo.u1 - geo.uMin) * PX; // message-1 marker offset within the strip
    const u2Px = (geo.u2 - geo.uMin) * PX; // message-2 marker offset within the strip

    attachmentLeft = (
      <div className="preview3d-pivot-dot" style={{ right: `${pPx}px`, top: `${pageH / 2}px` }} />
    );
    attachmentRight = (
      <>
        <div
          className="preview3d-slide-strip"
          style={{
            width: `${stripLenPx}px`,
            height: `${sliderWxPx}px`,
            left: `${stripInsetPx}px`,
            top: `${pageH / 2 - sliderWxPx / 2}px`,
          }}
        >
          <span className="preview3d-slide-msg" style={{ left: `${u1Px}px` }}>
            1
          </span>
          <span className="preview3d-slide-msg" style={{ left: `${u2Px}px` }}>
            2
          </span>
        </div>
        <div
          className="preview3d-slide-window"
          style={{
            width: `${winHPx}px`,
            height: `${winWPx}px`,
            left: `${geo.W * PX - winHPx / 2}px`,
            top: `${pageH / 2 - winWPx / 2}px`,
          }}
        />
      </>
    );

    readout = `슬라이더 위치 s = ${s.toFixed(1)}mm · 창 위치 W = ${geo.W.toFixed(1)}mm · 오프셋 u = ${(geo.W - s).toFixed(1)}mm`;
  } else if (mechanism === 'spiral-spring') {
    // Spiral spring (달팽이 스프링) — see generators/spiralSpring.js. Hub anchor
    // (disc centre) glued to the LEFT page at distance `a` from the spine,
    // rim tip glued to the RIGHT page at distance `b`. Placing both anchors
    // as page-fixed points reproduces the file's own authoritative
    //   D(α) = √(a² + b² − 2ab·cosα)
    // for free: with H = left-page-local (−a,0,0) and T = right-page-local
    // (b,0,0) rotated by the shared ±θ_page, |T−H|² collapses (via
    // cosθ=sin(α/2), sinθ=cos(α/2)) to exactly a²+b²−2ab·cosα — so the
    // coil's rendered end-to-end length IS D(α), no re-derivation needed.
    // Because H and T live on two INDEPENDENTLY-rotating pages, the coil
    // itself can't be a child of either page — it's parented to
    // .preview3d-book instead (attachmentBook), spanning world-space between
    // the two computed anchor points.
    //
    // Stylised approximation (this file already accepts these elsewhere):
    // the coil is a fixed set of beads on a circle of radius ρ(α) that
    // shrinks as the strip pays out (fat flat disc → narrow standing coil),
    // swept at a constant `turns` per full span — not a physically exact
    // Archimedean unwind, but it's flat at α=0, maximally extended at
    // α=180, and monotonic with D(α) in between, matching this mechanism's
    // real behaviour.
    const geo = resolveSpiralGeometry({
      turns: params.turns ?? defaults.turns,
      pitch: params.pitch ?? defaults.pitch,
      decorations: params.decorations ?? defaults.decorations,
      paperSize,
    });

    const D = Math.sqrt(geo.a * geo.a + geo.b * geo.b - 2 * geo.a * geo.b * Math.cos(degToRad(alpha)));
    const extMax = 2 * geo.b; // = hStand, the max useful payout
    const payout = clamp((D - geo.rOuter) / extMax, 0, 1); // 0 = flat disc, 1 = fully paid out
    const rho = geo.rOuter - (geo.rOuter - geo.r0) * payout; // coil radius shrinks as it pays out

    const thetaRad = degToRad(thetaPage);
    const cosT = Math.cos(thetaRad);
    const sinT = Math.sin(thetaRad);
    const Hx = -geo.a * PX * cosT;
    const Hz = geo.a * PX * sinT;
    const Tx = geo.b * PX * cosT;
    const Tz = geo.b * PX * sinT;
    const spanPx = Math.hypot(Tx - Hx, Tz - Hz); // ≈ D(α)·PX
    const psi = radToDeg(Math.atan2(-(Tz - Hz), Tx - Hx));

    const beadCount = Math.max(8, Math.ceil(geo.turns * 8));
    const rhoPx = rho * PX;
    const beadSizePx = Math.max(3, geo.w * PX * 0.5);

    const beads = [];
    for (let i = 0; i <= beadCount; i++) {
      const u = i / beadCount;
      const isEnd = i === 0 || i === beadCount;
      const phi = degToRad(u * geo.turns * 360);
      const lx = u * spanPx;
      const ly = isEnd ? 0 : rhoPx * Math.cos(phi);
      const lz = isEnd ? 0 : rhoPx * Math.sin(phi);
      beads.push(
        <div
          key={`bead-${i}`}
          className="preview3d-spring-bead"
          style={{
            width: `${beadSizePx}px`,
            height: `${beadSizePx}px`,
            transform: `translate3d(${lx}px, ${ly}px, ${lz}px) translate(-50%, -50%)`,
          }}
        />,
      );
    }

    const decoNodes = geo.decos.map((d) => {
      const phi = degToRad(d.f * geo.turns * 360);
      const lx = d.f * spanPx;
      const ly = rhoPx * Math.cos(phi);
      const lz = rhoPx * Math.sin(phi);
      const sizePx = d.drawR * 2 * PX;
      return (
        <div
          key={`deco-${d.n}`}
          className="preview3d-spring-deco"
          style={{
            width: `${sizePx}px`,
            height: `${sizePx}px`,
            transform: `translate3d(${lx}px, ${ly}px, ${lz}px) translate(-50%, -50%)`,
          }}
        />
      );
    });

    attachmentLeft = (
      <div
        className="preview3d-spring-hub"
        style={{
          width: `${geo.rOuter * 2 * PX}px`,
          height: `${geo.rOuter * 2 * PX}px`,
          right: `${(geo.a - geo.rOuter) * PX}px`,
          top: `${pageH / 2 - geo.rOuter * PX}px`,
        }}
      />
    );
    attachmentRight = (
      <div
        className="preview3d-spring-hub"
        style={{
          width: `${geo.tab * 2 * PX}px`,
          height: `${geo.tab * 2 * PX}px`,
          left: `${(geo.b - geo.tab) * PX}px`,
          top: `${pageH / 2 - geo.tab * PX}px`,
        }}
      />
    );
    attachmentBook = (
      <div
        className="preview3d-spring"
        style={{
          left: 0,
          top: `${pageH / 2}px`,
          transform: `translate3d(${Hx}px, 0px, ${Hz}px) rotateY(${psi}deg)`,
        }}
      >
        {beads}
        {decoNodes}
      </div>
    );

    readout = `신장 E = ${(D - geo.rOuter).toFixed(1)}/${extMax.toFixed(1)}mm (${Math.round(payout * 100)}%) · 반지름 ρ = ${rho.toFixed(1)}mm`;
  } else if (mechanism === 'pull-tab') {
    // Pull tab — see generators/pullTab.js. A loose slider slides sideways
    // through a track slot cut into one card face; travel = trackLength −
    // sliderWidth − 2·buffer (generatePullTab.computed.travel, reused
    // verbatim). This never folds with the card — it's a flat decal riding
    // one page, translated along the away-from-spine axis by the
    // independent handlePos control (0..1), not by α.
    const sliderWidth = params.sliderWidth ?? defaults.sliderWidth;
    const sliderHeight = params.sliderHeight ?? defaults.sliderHeight;
    const trackLength = params.trackLength ?? defaults.trackLength;
    const { computed } = generatePullTab({ sliderWidth, sliderHeight, trackLength, paperSize });
    const travel = computed.travel;

    const baseInset = 20; // mm, track starts a bit away from the spine
    const sliderInset = baseInset + handlePos * travel;
    const trackPx = trackLength * PX;
    const railHPx = sliderHeight * 0.3 * PX;
    const sliderWPx = sliderWidth * PX;
    const sliderHPx = sliderHeight * PX;

    attachmentLeft = (
      <>
        <div
          className="preview3d-track"
          style={{
            width: `${trackPx}px`,
            height: `${railHPx}px`,
            top: `${pageH / 2 - railHPx / 2}px`,
            right: `${baseInset * PX}px`,
          }}
        />
        <div
          className="preview3d-slider"
          style={{
            width: `${sliderWPx}px`,
            height: `${sliderHPx}px`,
            top: `${pageH / 2 - sliderHPx / 2}px`,
            right: `${sliderInset * PX}px`,
          }}
        >
          <div className="preview3d-slider-handle" />
        </div>
      </>
    );
    readout = `이동 거리 ${travel.toFixed(1)}mm · 현재 위치 ${(handlePos * travel).toFixed(1)}mm`;
  } else if (mechanism === 'rising-slide') {
    // Rising slide — see generators/risingSlide.js. A figure rides straight
    // up a fixed slot when the handle is pulled; travel = riseFraction ·
    // faceH (resolveRisingSlide.travel, reused verbatim). Same "flat decal
    // riding one page, driven by handlePos, not α" treatment as pull-tab —
    // this mechanism never leaves the plane either.
    const riseFraction = params.riseFraction ?? defaults.riseFraction;
    const sliderWidth = params.sliderWidth ?? defaults.sliderWidth;
    const grip = params.grip ?? defaults.grip;
    const geo = resolveRisingSlide({ riseFraction, sliderWidth, grip, paperSize });

    const baseInset = 15; // mm, slot starts a bit away from the spine
    const figureInset = baseInset + handlePos * geo.travel;
    const railHPx = geo.sliderW * 0.25 * PX;
    const figSizePx = geo.sliderW * 1.4 * PX;

    attachmentRight = (
      <>
        <div
          className="preview3d-track"
          style={{
            width: `${(geo.travel + geo.sliderW) * PX}px`,
            height: `${railHPx}px`,
            top: `${pageH / 2 - railHPx / 2}px`,
            left: `${baseInset * PX}px`,
          }}
        />
        <div
          className="preview3d-rising-figure"
          style={{
            width: `${figSizePx}px`,
            height: `${figSizePx}px`,
            top: `${pageH / 2 - figSizePx / 2}px`,
            left: `${figureInset * PX}px`,
          }}
        />
      </>
    );
    readout = `상승 거리 ${geo.travel.toFixed(1)}mm · 현재 높이 ${(handlePos * geo.travel).toFixed(1)}mm`;
  } else if (mechanism === 'slide-to-swing') {
    // Slide-to-swing (Scotch yoke) — see generators/slideToSwing.js. The post
    // pivots at a fixed point and the pin traces pin(θ)=(px+r·sinθ, py−r·cosθ)
    // (reused verbatim, exported as pinPosition there); the slider is
    // constrained to move ONLY along-spine at a FIXED distance from the
    // spine (the vertical slot absorbs the pin's r·(1−cosθ) drop). Because
    // it's a flat, in-plane linkage (docstring: "never leaves the card
    // plane"), the post's own swing is a plain rotateZ — no rotate3d axis
    // composition needed, unlike the fold-driven mechanisms above.
    const armLength = params.armLength ?? defaults.armLength;
    const swingAngle = params.swingAngle ?? defaults.swingAngle;
    const geo = resolveSlideToSwing({ armLength, swingAngle, paperSize });

    const theta = (handlePos - 0.5) * 2 * geo.thetaMax; // deg, -thetaMax..+thetaMax
    const alongSpineOffsetPx = geo.r * Math.sin(degToRad(theta)) * PX;

    const pivotInsetPx = SLIDE_SWING_LIMITS.PIVOT_SPINE_PAD * PX;
    const armLenPx = geo.r * PX;
    const armWPx = SLIDE_SWING_LIMITS.POST_W * PX;
    const decoDiaPx = SLIDE_SWING_LIMITS.DECO_R * 2 * PX;
    const decoOffPx = SLIDE_SWING_LIMITS.DECO_OFF * PX;

    attachmentLeft = (
      <div
        className="preview3d-swing-arm"
        style={{
          width: `${armLenPx}px`,
          height: `${armWPx}px`,
          top: `${pageH / 2 - armWPx / 2}px`,
          right: `${pivotInsetPx}px`,
          transform: `rotateZ(${theta}deg)`,
        }}
      >
        <div
          className="preview3d-swing-deco"
          style={{
            width: `${decoDiaPx}px`,
            height: `${decoDiaPx}px`,
            left: `${-decoOffPx}px`,
            top: '50%',
            transform: 'translate(-100%, -50%)',
          }}
        />
      </div>
    );

    const sliderInsetPx = (SLIDE_SWING_LIMITS.PIVOT_SPINE_PAD + geo.r) * PX;
    const sliderWPx = SLIDE_SWING_LIMITS.SLIDER_BODY_W * PX;
    const sliderHPx = geo.sliderH * PX;

    attachmentRight = (
      <div
        className="preview3d-slider"
        style={{
          width: `${sliderHPx}px`,
          height: `${sliderWPx}px`,
          left: `${sliderInsetPx}px`,
          top: `${pageH / 2 - alongSpineOffsetPx - sliderWPx / 2}px`,
        }}
      />
    );

    readout = `흔들 각도 θ = ${theta.toFixed(0)}° · 손잡이 이동 ${alongSpineOffsetPx / PX < 0 ? '−' : ''}${Math.abs(alongSpineOffsetPx / PX).toFixed(1)}mm (±${(geo.travel / 2).toFixed(1)}mm)`;
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
      <div
        ref={stageRef}
        className={`preview3d-stage${isDragging ? ' is-dragging' : ''}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {NO_BOOK.has(mechanism) ? (
          <div
            className="preview3d-orbit-frame"
            style={{ transform: `rotateX(${orbit.rx}deg) rotateY(${orbit.ry}deg) scale(${orbit.zoom})` }}
          >
            {customStage}
          </div>
        ) : (
          <div
            className="preview3d-book"
            style={{ transform: `rotateX(${orbit.rx}deg) rotateY(${orbit.ry}deg) scale(${orbit.zoom})` }}
          >
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
            {attachmentBook}
          </div>
        )}
        <div className="preview3d-orbit-hint">드래그해서 회전 · 휠로 확대/축소</div>
        <button type="button" className="preview3d-orbit-reset" onClick={resetOrbit}>
          시점 초기화
        </button>
      </div>

      <div className="fold-slider-container">
        {mechanism === 'volvelle' ? (
          <>
            <div className="fold-slider-labels">
              <span>돌림판 회전각</span>
              <span>{Math.round(spin)}°</span>
            </div>
            <input
              className="custom-range"
              type="range"
              min="0"
              max="360"
              step="1"
              value={spin}
              onChange={(e) => setSpin(Number(e.target.value))}
              aria-label="돌림판 회전각"
            />
          </>
        ) : mechanism === 'flip-disc' ? (
          <>
            <div className="fold-slider-labels">
              <span>넘긴 페이지 수</span>
              <span>
                {Math.min(flipped, params.pages ?? defaults.pages)}/{params.pages ?? defaults.pages}
              </span>
            </div>
            <input
              className="custom-range"
              type="range"
              min="0"
              max={params.pages ?? defaults.pages}
              step="1"
              value={Math.min(flipped, params.pages ?? defaults.pages)}
              onChange={(e) => setFlipped(Number(e.target.value))}
              aria-label="넘긴 페이지 수"
            />
          </>
        ) : mechanism === 'straw-rocket' ? null : (
          <>
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
            {HAND_DRIVEN_LABEL[mechanism] && (
              <>
                <div className="fold-slider-labels">
                  <span>{HAND_DRIVEN_LABEL[mechanism]}</span>
                  <span>{Math.round(handlePos * 100)}%</span>
                </div>
                <input
                  className="custom-range"
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={Math.round(handlePos * 100)}
                  onChange={(e) => setHandlePos(Number(e.target.value) / 100)}
                  aria-label={HAND_DRIVEN_LABEL[mechanism]}
                />
              </>
            )}
          </>
        )}
        <div className="preview3d-readout">{readout}</div>
      </div>
    </div>
  );
}
