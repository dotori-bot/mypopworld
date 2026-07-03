import React, { useState } from 'react';
import useCardStore from '../../store/useCardStore';
import { getMechanism, buildMechanismParams } from '../../generators/registry';
import { CARD_SIZES } from '../../generators/constants';
import {
  calculateVFoldAngle,
  calculatePopupHeight,
  radToDeg,
  degToRad,
  clamp,
} from '../../utils/math';
import '../../styles/preview.css';

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
 */
export default function Preview3D() {
  const { cardParams, paperSize, colorMode } = useCardStore();
  const [alpha, setAlpha] = useState(90);

  const isVFold = cardParams?.mechanism === 'v-fold';

  if (!cardParams || !isVFold) {
    return (
      <div className="preview3d-root">
        <div className="preview3d-placeholder">
          이 메커니즘은 아직 3D 미리보기를 준비 중이에요! (현재는 브이폴드만 지원)
        </div>
      </div>
    );
  }

  // --- Resolve the user's actual v-fold params (armLength) ---
  const params = buildMechanismParams(cardParams, paperSize, colorMode) || {};
  const defaults = getMechanism('v-fold').defaultParams;
  const armLength = params.armLength ?? defaults.armLength; // mm

  // --- Kinematics (authoritative math.js formulas) ---
  const thetaPage = (180 - alpha) / 2;                       // deg
  const beta = calculateVFoldAngle(alpha);                   // deg (= α)
  const h = calculatePopupHeight(armLength, beta);           // mm
  const gamma = radToDeg(Math.asin(clamp(h / armLength, 0, 1))); // deg (= α/2)

  // --- mm → px scale for an honest-proportioned book ---
  const card = CARD_SIZES[paperSize] || CARD_SIZES.A4;
  const PX = 1.6;
  const pageW = (card.width / 2) * PX;
  const pageH = card.height * PX;
  const armPx = armLength * PX;

  // Each arm is a real child of its page, so it inherits the page's own
  // rotateY(±θ_page) via preserve-3d and then applies its OWN fold on top. The
  // fold is a rotation of angle γ (= a = α/2) about a per-frame axis derived so
  // that the ridge-tip lands on the shared world apex A = (0, −L·cos a, L·sin a):
  //   left  arm:  rotate3d(−sin a, 0, −cos a, a°)
  //   right arm:  rotate3d(−sin a, 0, +cos a, a°)
  const aRad = degToRad(gamma);          // a = γ = α/2
  const sinA = Math.sin(aRad);
  const cosA = Math.cos(aRad);
  const armLiftLeft = `rotate3d(${(-sinA).toFixed(5)}, 0, ${(-cosA).toFixed(5)}, ${gamma}deg)`;
  const armLiftRight = `rotate3d(${(-sinA).toFixed(5)}, 0, ${cosA.toFixed(5)}, ${gamma}deg)`;

  // Arm panel box: a triangle whose pivot corner O sits at the page's spine
  // centre. Height 2·armPx so its box straddles the spine centre; top offset
  // places that centre at the page's vertical middle.
  const armH = armPx * 2;
  const armTop = pageH / 2 - armPx;

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
            {/* Left V-fold arm — child of the page so it inherits rotateY(θ);
                its pivot O is the page's spine centre, shared with the right arm
                so the two ridge-tips meet at the apex. */}
            <div
              className="preview3d-arm preview3d-arm-left"
              style={{
                width: `${armPx}px`,
                height: `${armH}px`,
                top: `${armTop}px`,
                transform: armLiftLeft,
              }}
            />
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
            <div
              className="preview3d-arm preview3d-arm-right"
              style={{
                width: `${armPx}px`,
                height: `${armH}px`,
                top: `${armTop}px`,
                transform: armLiftRight,
              }}
            />
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
        <div className="preview3d-readout">
          팝업 높이 h = {h.toFixed(1)}mm · 팔 길이 L = {armLength}mm · 팔 각도 γ = {gamma.toFixed(0)}°
        </div>
      </div>
    </div>
  );
}
