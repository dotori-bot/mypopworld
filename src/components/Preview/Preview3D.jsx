import React, { useState, useRef, useCallback, useEffect } from 'react';
import useCardStore from '../../store/useCardStore';
import { getMechanism, buildMechanismParams } from '../../generators/registry';
import { CARD_SIZES } from '../../generators/constants';
import { FLAT_3D, buildFlatScene } from './flatScenes';
import { BOOK_3D, buildBookScene } from './bookScenes';
import { clamp } from '../../utils/math';
import '../../styles/preview.css';

// Default camera orbit — same 3/4 view the stage always used to be locked to.
const DEFAULT_ORBIT = { rx: -52, ry: -20, zoom: 1 };
// Flat mechanisms read best nearly face-on, with enough rx freedom to tip the
// card right over and inspect the back-side parts (handles, retainers, caps).
const FLAT_ORBIT = { rx: -14, ry: -28, zoom: 1 };
const ORBIT_RX_RANGE = [-85, -10]; // deg, keeps the "look down onto the card" framing
// ry is clamped to the front hemisphere for the same reason rx is: every
// mechanism's popup panels (arms/flaps/steps) live in their pages' preserve-3d
// subtrees and physically cross the page planes at the spine. CSS 3D cannot
// intersect two planes per-pixel — it depth-sorts whole planes — so once the
// camera swings far enough that a page turns edge-on/backwards, a popup panel
// that should be occluded by (or fold behind) its page instead paints straight
// over/past it, reading as a detached sliver escaping the card silhouette. The
// panels' ridge tips stay mathematically coincident at every angle (the fold
// math is correct); this range only keeps the camera where that coincidence
// also composites cleanly — i.e. looking into the open card, never around its back.
const ORBIT_RY_RANGE = [-25, 25];
// Flat scenes are exempt from that clamp: their parts are parallel sibling
// planes (one translateZ layer per sheet of paper, no cross-page preserve-3d
// subtrees), which CSS depth-sorts cleanly from ANY angle — and orbiting fully
// around to the back-side structure (handles, retainers, caps) is their whole
// point. ±180° lets the camera reach the direct back view from either side.
const FLAT_RX_RANGE = [-80, 80];
const FLAT_RY_RANGE = [-180, 180];
const ORBIT_ZOOM_RANGE = [0.6, 1.8];

/**
 * Preview3D — pure-CSS-3D assembled preview.
 *
 * BOOK mechanisms (BOOK_3D) pop out of an opening card and are driven by the
 * card-opening angle α slider below; their pose construction (kinematics,
 * per-mechanism branches, physics comments) lives in bookScenes.jsx
 * (buildBookScene). FLAT mechanisms (FLAT_3D) never leave the card plane and
 * bring their own drive slider — see flatScenes.jsx (buildFlatScene).
 */
export default function Preview3D() {
  const { cardParams, paperSize, colorMode, setCardParams, appMode } = useCardStore();
  const [alpha, setAlpha] = useState(90);
  // Flat-mechanism drive value; null = "use the scene's own default". Kept as
  // null (not a number) across mechanism switches so each mechanism opens at
  // its own natural rest pose.
  const [drive, setDrive] = useState(null);
  const [orbit, setOrbit] = useState(DEFAULT_ORBIT);
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef(null); // { pointerX, pointerY, rx, ry }
  const stageRef = useRef(null);

  const mechanism = cardParams?.mechanism;
  const mode = BOOK_3D.has(mechanism) ? 'book' : FLAT_3D.has(mechanism) ? 'flat' : 'none';
  const rxRange = mode === 'flat' ? FLAT_RX_RANGE : ORBIT_RX_RANGE;
  const ryRange = mode === 'flat' ? FLAT_RY_RANGE : ORBIT_RY_RANGE;

  // New mechanism → its natural rest pose and the right default framing.
  useEffect(() => {
    setDrive(null);
    setOrbit(mode === 'flat' ? FLAT_ORBIT : DEFAULT_ORBIT);
  }, [mechanism, mode]);

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
    // Compute the new angles NOW, outside the updater: the updater runs later,
    // possibly after pointer-up has already nulled dragStart.current.
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    const ry = clamp(dragStart.current.ry + dx * 0.4, ryRange[0], ryRange[1]);
    const rx = clamp(dragStart.current.rx - dy * 0.4, rxRange[0], rxRange[1]);
    setOrbit((prev) => ({ ...prev, ry, rx }));
  }, [rxRange, ryRange]);

  const handlePointerUp = useCallback((e) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    dragStart.current = null;
    setIsDragging(false);
  }, []);

  const resetOrbit = useCallback(
    () => setOrbit(mode === 'flat' ? FLAT_ORBIT : DEFAULT_ORBIT),
    [mode],
  );

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
    // `mode` dep: the stage DOM node is rebuilt when switching between the
    // book/flat render branches, so the listener must re-attach to the new one.
  }, [mode]);

  if (!cardParams || mode === 'none') {
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

  // Flat mechanisms (sliders/spinners/…): structure-faithful scene + its own
  // drive slider, from flatScenes.jsx. Book mechanisms continue below with α.
  const flatScene = mode === 'flat'
    ? buildFlatScene(mechanism, params, defaults, paperSize, drive)
    : null;

  if (flatScene) {
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
          <div
            className="preview3d-book"
            style={{ transform: `rotateX(${orbit.rx}deg) rotateY(${orbit.ry}deg) scale(${orbit.zoom})` }}
          >
            {flatScene.node}
          </div>
          <div className="preview3d-orbit-hint">드래그해서 돌려 뒷면 구조 보기 · 휠로 확대/축소</div>
          <button type="button" className="preview3d-orbit-reset" onClick={resetOrbit}>
            시점 초기화
          </button>
        </div>

        <div className="fold-slider-container">
          <div className="fold-slider-labels">
            <span>{flatScene.slider.label}</span>
            <span>{flatScene.slider.format(flatScene.value)}</span>
          </div>
          <input
            className="custom-range"
            type="range"
            min={flatScene.slider.min}
            max={flatScene.slider.max}
            step={flatScene.slider.step}
            value={flatScene.value}
            onChange={(e) => setDrive(Number(e.target.value))}
            aria-label={flatScene.slider.label}
          />
          <div className="preview3d-readout">{flatScene.readout}</div>
        </div>
      </div>
    );
  }

  // --- mm → px scale for an honest-proportioned book ---
  const card = CARD_SIZES[paperSize] || CARD_SIZES.A4;
  const PX = 1.6;
  const pageW = (card.width / 2) * PX;
  const pageH = card.height * PX;
  const thetaPage = (180 - alpha) / 2; // deg, shared by every mechanism

  // Book-mechanism pose (attachments, readout, optional v-fold slider state)
  // built by bookScenes.jsx from the same authoritative resolvers/formulas.
  const scene = buildBookScene(mechanism, params, { alpha, PX, pageW, pageH, card, paperSize, defaults });
  const { attachmentLeft, attachmentRight, attachmentBook, readout, vFoldControls } = scene;

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
        <div className="preview3d-orbit-hint">드래그해서 회전 · 휠로 확대/축소</div>
        <button type="button" className="preview3d-orbit-reset" onClick={resetOrbit}>
          시점 초기화
        </button>
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
        {/* Expert mode edits the same values in the left ParamPanel — hide the
            inline duplicates there to avoid two competing sources of truth. */}
        {appMode !== 'expert' && vFoldControls && (
          <div className="fold-slider-vfold-controls">
          <div className="fold-slider-labels">
            <span>브이폴드 팔 길이 (armLength)</span>
            <span>{Math.round(vFoldControls.armLength)}mm</span>
          </div>
          <input
            className="custom-range"
            type="range"
            min={Math.round(vFoldControls.vLimits.armMin)}
            max={Math.round(vFoldControls.vLimits.armMax)}
            step="1"
            value={vFoldControls.armLength}
            onChange={(e) =>
              setCardParams({ ...cardParams, params: { ...cardParams.params, armLength: Number(e.target.value) } })
            }
            aria-label="브이폴드 팔 길이"
          />
          <div className="fold-slider-labels">
            <span>브이폴드 각도 (angle)</span>
            <span>{Math.round(vFoldControls.vAngle)}°</span>
          </div>
          <input
            className="custom-range"
            type="range"
            min={vFoldControls.vLimits.angleMin}
            max={vFoldControls.vLimits.angleMax}
            step="1"
            value={vFoldControls.vAngle}
            onChange={(e) =>
              setCardParams({ ...cardParams, params: { ...cardParams.params, angle: Number(e.target.value) } })
            }
            aria-label="브이폴드 각도"
          />
          <label className="fold-slider-labels" style={{ cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={!!vFoldControls.armExtension}
              onChange={(e) =>
                setCardParams({
                  ...cardParams,
                  params: {
                    ...cardParams.params,
                    armExtension: e.target.checked ? { armLength: 80, angle: 12 } : null,
                  },
                })
              }
            />
            <span>혀/뿔처럼 길게 늘이기 (armExtension)</span>
          </label>
          {vFoldControls.armExtension && (
            <>
              <div className="fold-slider-labels">
                <span>확장부 길이</span>
                <span>{Math.round(vFoldControls.extArmLength)}mm</span>
              </div>
              <input
                className="custom-range"
                type="range"
                min={Math.round(vFoldControls.extLimits.armMin)}
                max={Math.round(vFoldControls.extLimits.armMax)}
                step="1"
                value={vFoldControls.extArmLength}
                onChange={(e) =>
                  setCardParams({
                    ...cardParams,
                    params: {
                      ...cardParams.params,
                      armExtension: { ...cardParams.params?.armExtension, armLength: Number(e.target.value) },
                    },
                  })
                }
                aria-label="확장부 길이"
              />
              <div className="fold-slider-labels">
                <span>확장부 각도</span>
                <span>{Math.round(vFoldControls.extAngle)}°</span>
              </div>
              <input
                className="custom-range"
                type="range"
                min={vFoldControls.extLimits.angleMin}
                max={vFoldControls.extLimits.angleMax}
                step="1"
                value={vFoldControls.extAngle}
                onChange={(e) =>
                  setCardParams({
                    ...cardParams,
                    params: {
                      ...cardParams.params,
                      armExtension: { ...cardParams.params?.armExtension, angle: Number(e.target.value) },
                    },
                  })
                }
                aria-label="확장부 각도"
              />
            </>
          )}
          </div>
        )}
        <div className="preview3d-readout">{readout}</div>
      </div>
    </div>
  );
}
