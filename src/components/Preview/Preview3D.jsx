import React, { useState } from 'react';
import useCardStore from '../../store/useCardStore';
import { getMechanism, buildMechanismParams } from '../../generators/registry';
import { CARD_SIZES } from '../../generators/constants';
import {
  calculateVFoldAngle,
  calculatePopupHeight,
  radToDeg,
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
 * Kinematics (all angles in degrees):
 *   α        = card-opening angle, 0 (closed) … 180 (flat open). Slider-driven.
 *   θ_page   = (180 − α) / 2
 *              Each page is rotated ±θ_page about the vertical spine, away from
 *              the fully-open (coplanar) plane. α=180 → 0° (flat); α=0 → 90°
 *              (pages folded face-to-face). rotateY(±θ_page).
 *   β        = calculateVFoldAngle(α)                     (= α for symmetric k=1)
 *   h        = calculatePopupHeight(armLength, β) = L·sin(α/2)   [mm]
 *              popup apex height above the spine baseline; 0 at α=0, L at α=180.
 *   γ_arm    = arcsin(h / L) = α/2
 *              relative rise of each arm about its spine base crease so its tip
 *              reaches height h. The two arms mirror across the spine, so their
 *              tips coincide at the shared apex (the V's mountain ridge).
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

  // Arm panels form a dihedral "tent". Each arm is hinged on the vertical spine
  // (its inner edge) and swings up about it toward the viewer by γ:
  //   γ=0   (α=0)   → arm lies flat on its page (h=0, card closed)
  //   γ=90  (α=180) → arm stands fully upright, coincident with its mirror at
  //                    the spine ridge (h=L, card flat-open)
  // The free (outer) edge pokes toward the viewer by armPx·sin(γ) = h·PX, and
  // because the two arms mirror across the spine they meet along the ridge.
  const armLiftLeft = `rotateY(${gamma}deg)`;
  const armLiftRight = `rotateY(${-gamma}deg)`;

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
          />
          {/* Right page — hinged on the spine (its left edge) */}
          <div
            className="preview3d-page preview3d-page-right"
            style={{
              width: `${pageW}px`,
              height: `${pageH}px`,
              transform: `rotateY(${-thetaPage}deg)`,
            }}
          />

          {/* V-fold popup — attached at the spine (symmetry plane), so its ridge
              rises straight up the symmetry plane and the two arms provably meet.
              Deliberately NOT a child of a single page: the ridge lives in the
              symmetry plane which belongs to neither page. */}
          <div className="preview3d-vfold">
            <div
              className="preview3d-arm preview3d-arm-left"
              style={{
                width: `${armPx}px`,
                height: `${armPx * 1.3}px`,
                top: `${-armPx * 0.65}px`,
                transform: armLiftLeft,
              }}
            />
            <div
              className="preview3d-arm preview3d-arm-right"
              style={{
                width: `${armPx}px`,
                height: `${armPx * 1.3}px`,
                top: `${-armPx * 0.65}px`,
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
