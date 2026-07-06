import React from 'react';
import { PAPER_SIZES, CARD_SIZES, PRINT } from '../../generators/constants';
import { resolveRisingSlide, RISING_LIMITS } from '../../generators/risingSlide';
import { resolveSlideToSwing, SLIDE_SWING_LIMITS } from '../../generators/slideToSwing';
import { resolveVolvelleGeometry } from '../../generators/volvelle';
import { resolveFlipDiscGeometry, FLIPDISC_CONST } from '../../generators/flipDisc';
import { resolveCameraPull, CAMERA_PULL_LIMITS } from '../../generators/cameraPrintPull';
import { clamp, degToRad, radToDeg } from '../../utils/math';

/**
 * flatScenes — structure-faithful 3D poses for the FLAT (non-book) mechanisms.
 *
 * The book mechanisms in Preview3D.jsx pop OUT of an opening card, so their
 * simulation is driven by the card-opening angle α. The six mechanisms here
 * never leave the card plane (sliders, spinners, flip leaves, a rocket on a
 * straw) — their "action" is a pull / push / turn / flip / blow, so each scene
 * exposes its own drive slider instead of α.
 *
 * Design contract (this is what the user asked for): every scene must show the
 * REAL physical parts from the flat pattern — front AND back — so someone
 * assembling the craft can see how the pieces stack and why the motion works.
 * Concretely that means:
 *   - parts are laid out from the SAME authoritative resolvers the printable
 *     pattern uses (resolveRisingSlide, resolveSlideToSwing, …), never eyeballed;
 *   - each physical layer gets its own translateZ plane (Z_STEP px per sheet of
 *     paper — exaggerated versus the real ~0.3 mm so orbiting visibly separates
 *     the stack), with front parts at +z and behind-the-card parts at −z;
 *   - hidden-side parts (handles, retainer bridges, guide strips, glue caps)
 *     are really there at −z, so orbiting the camera around to the back reveals
 *     the working structure instead of a mirror image of the front;
 *   - key parts carry small floating labels (front-facing tags for front parts,
 *     back-facing tags for back parts) naming them like the printed pattern does.
 *
 * Each builder returns:
 *   {
 *     node,     // JSX, absolutely positioned around the .preview3d-book origin
 *     readout,  // one-line live numbers string (same spirit as the book poses)
 *     slider,   // { label, min, max, step, defaultValue, format }
 *     value,    // the resolved drive value actually rendered
 *   }
 */

export const FLAT_3D = new Set([
  'rising-slide',
  'pull-tab',
  'slide-to-swing',
  'volvelle',
  'flip-disc',
  'straw-rocket',
  'camera-print-pull',
]);

/** Z separation per physical paper layer, in px (exaggerated for legibility). */
const Z_STEP = 7;

/** Floating part label. side='back' flips it to read correctly from behind. */
function Tag({ x, y, side = 'front', children }) {
  return (
    <div className={`preview3d-tag preview3d-tag-${side}`} style={{ left: x, top: y }}>
      {children}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Rising slide (빛줄기 상승 슬라이드)
 *
 * Physical stack, front → back (see generators/risingSlide.js header):
 *   figure (front) → card face with vertical slot → slider strip → retainers.
 * The handle is the TOP of the slider strip poking out over the card's top
 * edge; pulling it up drags the mount tab up the slot, carrying the figure.
 * The drive is mapped to the REAL stop: travel ends when the slider's stop
 * flange lands on the top retainer bridge (not at the nominal slot end), so
 * the sim demonstrates the same retention catch the pattern engineers.
 * ──────────────────────────────────────────────────────────────────────────── */
function buildRisingSlide(params, defaults, paperSize, driveRaw) {
  const slider = {
    label: '손잡이 당기기',
    min: 0, max: 100, step: 1, defaultValue: 35,
    format: (v) => `${Math.round(v)}%`,
  };
  const drive = driveRaw ?? slider.defaultValue;
  const L = RISING_LIMITS;
  const geo = resolveRisingSlide({
    paperSize,
    riseFraction: params.riseFraction ?? defaults.riseFraction,
    sliderWidth: params.sliderWidth ?? defaults.sliderWidth,
    grip: params.grip ?? defaults.grip,
  });
  const paper = PAPER_SIZES[paperSize] || PAPER_SIZES.A4;

  // Card face = upper half sheet; its local y ∈ [0, spineY] matches sheet mm.
  const W = paper.width;
  const H = geo.spineY;

  // Same retainer rows the flat pattern prints (drawn there as glue targets).
  const topRetY = geo.slotTopY - L.RET_W - 1;
  const lowRetY = geo.slotBotY - geo.slotLen * 0.28;

  // Effective stop: the flange's top edge meets the top retainer's bottom edge
  // (flange rides L.NECK_H + L.FLANGE_H above the mount fold).
  const tStop = clamp(
    (geo.slotBotY - L.NECK_H - L.FLANGE_H - (topRetY + L.RET_W)) / geo.travel,
    0, 1,
  );
  const t = (drive / 100) * tStop;
  const rise = t * geo.travel;
  const yFold = geo.slotBotY - rise;        // mount-tab fold line, in the slot
  const stripTop = yFold - geo.stripLen;    // handle end (negative = above card)

  const PX = 300 / (H + Math.max(0, geo.stripLen - geo.slotBotY) + geo.travel * tStop);
  const px = (mm) => mm * PX;

  const sceneHalfW = Math.min(geo.cx - PRINT.MARGIN - 6, 62);
  const slotWpx = Math.max(3, px(geo.slotWidth));
  const figSize = px(20);
  const retW = geo.channelGap + 2 * L.GLUE_END;
  const flangeLead = geo.stripLen - L.NECK_H - L.FLANGE_H; // flange top within strip

  const retainer = (y, key) => (
    <div
      key={key}
      className="preview3d-flat-retainer"
      style={{
        left: px(geo.cx - retW / 2),
        top: px(y),
        width: px(retW),
        height: px(L.RET_W),
        transform: `translateZ(${-2 * Z_STEP}px)`,
      }}
    >
      <span className="preview3d-flat-glue" style={{ left: 0, width: px(L.GLUE_END) }} />
      <span className="preview3d-flat-glue" style={{ right: 0, width: px(L.GLUE_END) }} />
    </div>
  );

  const node = (
    <div className="preview3d-flat" style={{ width: px(W), height: px(H), left: -px(W) / 2, top: -px(H) / 2 }}>
      {/* ── BACK of the card: retainer bridges + slider strip ── */}
      {retainer(topRetY, 'ret-top')}
      {retainer(lowRetY, 'ret-low')}
      <div
        className="preview3d-flat-strip"
        style={{
          left: px(geo.cx - geo.sliderW / 2),
          top: px(stripTop),
          width: px(geo.sliderW),
          height: px(geo.stripLen),
          transform: `translateZ(${-Z_STEP}px)`,
        }}
      >
        <div className="preview3d-flat-grip" style={{ left: 0, top: 0, width: '100%', height: px(geo.grip) }} />
        <div
          className="preview3d-flat-flange"
          style={{
            left: px(-(geo.flangeW - geo.sliderW) / 2),
            top: px(flangeLead),
            width: px(geo.flangeW),
            height: px(L.FLANGE_H),
          }}
        />
      </div>
      <Tag side="back" x={px(geo.cx)} y={px(stripTop + geo.grip / 2)}>손잡이 (위로 당김)</Tag>
      <Tag side="back" x={px(geo.cx)} y={px(topRetY - 5)}>① 위 멈춤 띠 (뒷면)</Tag>
      <Tag side="back" x={px(geo.cx)} y={px(lowRetY + L.RET_W + 5)}>② 안내 띠 (뒷면)</Tag>
      <Tag side="back" x={px(geo.cx + geo.flangeW + 8)} y={px(yFold - L.NECK_H - L.FLANGE_H / 2)}>멈춤 날개</Tag>

      {/* ── Card face with the vertical slot ── */}
      <div className="preview3d-flat-card" style={{ width: px(W), height: px(H) }}>
        <div
          className="preview3d-flat-scene"
          style={{
            left: px(geo.cx - sceneHalfW),
            top: px(geo.sceneTopY),
            width: px(sceneHalfW * 2),
            height: px(geo.sceneBotY - geo.sceneTopY),
          }}
        />
        <div
          className="preview3d-flat-slot"
          style={{
            left: px(geo.cx) - slotWpx / 2,
            top: px(geo.slotTopY),
            width: slotWpx,
            height: px(geo.slotLen),
          }}
        />
      </div>
      <Tag x={px(geo.cx + 24)} y={px(geo.slotBotY - 4)}>세로 슬롯 (앞면)</Tag>

      {/* ── FRONT: the figure riding the mount tab up the slot ── */}
      <div
        className="preview3d-flat-figure"
        style={{
          left: px(geo.cx) - figSize / 2,
          top: px(yFold - L.NECK_H / 2) - figSize / 2,
          width: figSize,
          height: figSize,
          transform: `translateZ(${Z_STEP}px)`,
        }}
      />
      <Tag x={px(geo.cx)} y={px(yFold - L.NECK_H / 2) - figSize / 2 - 10}>그림 (앞면)</Tag>
    </div>
  );

  return {
    node,
    readout: `그림 상승 ${rise.toFixed(0)} / ${(tStop * geo.travel).toFixed(0)}mm · 슬롯 ${geo.slotLen}×${geo.slotWidth}mm · 슬라이더 폭 ${geo.sliderW}mm`,
    slider,
    value: drive,
  };
}

/* ────────────────────────────────────────────────────────────────────────────
 * Camera-print-pull (카메라 인화 손잡이) — the paper pulley.
 *
 * Physical stack, front → back (see generators/cameraPrintPull.js header):
 *   photo (front, top of card) → card face with a photo slot (top) and a tab
 *   slot (below it) → the reversing strip, threaded behind the card as TWO
 *   vertical runs that meet at a roller near the top → the PULL tab (front
 *   again, hanging out below the tab slot). Pulling the tab DOWN feeds strip
 *   from the photo-run over the roller into the tab-run, so the photo rises
 *   UP — a genuine direction reversal (unlike rising-slide's single straight
 *   slider). The drive still maps 0→100% to "how far pulled" (rise 0→travel)
 *   with the SAME flange-vs-retainer stop-clamp logic as rising-slide, just
 *   anchored to this mechanism's own retainer above the photo slot, and with
 *   the exposed grip growing DOWNWARD as more strip is pulled through.
 * ──────────────────────────────────────────────────────────────────────────── */
function buildCameraPrintPull(params, defaults, paperSize, driveRaw) {
  const slider = {
    label: 'PULL 손잡이 당기기',
    min: 0, max: 100, step: 1, defaultValue: 35,
    format: (v) => `${Math.round(v)}%`,
  };
  const drive = driveRaw ?? slider.defaultValue;
  const L = CAMERA_PULL_LIMITS;
  const geo = resolveCameraPull({
    paperSize,
    riseFraction: params.riseFraction ?? defaults.riseFraction,
    clearance: params.clearance ?? defaults.clearance,
    stripWidth: params.stripWidth ?? defaults.stripWidth,
    grip: params.grip ?? defaults.grip,
    photoWidth: params.photoWidth ?? defaults.photoWidth,
  });
  const paper = PAPER_SIZES[paperSize] || PAPER_SIZES.A4;

  // Card face = upper half sheet; its local y ∈ [0, spineY] matches sheet mm.
  const W = paper.width;
  const H = geo.spineY;

  // Same retainer glue target the flat pattern prints, just above the photo
  // slot (see generateCameraPrintPull's `topRetY`).
  const topRetY = geo.slotTopY - L.RET_W - 1;

  // Effective stop: the stop flange (carried on the photo-run, just above the
  // mount) meets the retainer's bottom edge — identical retention-catch logic
  // to rising-slide, anchored to this mechanism's own retainer/slot instead.
  const tStop = clamp(
    (geo.slotBotY - L.NECK_H - L.FLANGE_H - (topRetY + L.RET_W)) / geo.travel,
    0, 1,
  );
  const t = (drive / 100) * tStop;
  const rise = t * geo.travel;

  // photoRun_current = photoRun_rest − rise (the photo-side run shortens as
  // the mount is drawn up); the tab-run stays the fixed roller→slot span, and
  // the freed-up strip length reappears as MORE exposed grip below the card.
  const mountY = geo.slotBotY - rise;          // photo mount fold line, in the slot
  const exposedGrip = geo.grip + rise;

  const sceneBottom = Math.max(H, geo.botSlotY + geo.grip + geo.travel * tStop) + 8;
  const PX = 300 / sceneBottom;
  const px = (mm) => mm * PX;

  const retW = geo.channelGap + 2 * L.GLUE_END;
  const flangeTopY = mountY - L.NECK_H - L.FLANGE_H;
  const botSlotLen = geo.stripW + geo.slotWidth * 2;
  const slotWpx = Math.max(3, px(geo.slotWidth));

  // The roller + the two threaded runs are, physically, ONE strip of paper —
  // draw them as a SINGLE rolled "tube" spanning the whole photo↔handle span
  // (its rounded top IS the roller) instead of a pale pill plus two thin,
  // easy-to-miss lines. A front half (nearer, warmer) + back half (further,
  // muted) shade it like a cylinder, matching the .preview3d-flat-tube trick
  // straw-rocket uses. Green dashed "mount" patches mark the two glue points:
  // the photo at the front, near the top; the handle/grip at the back, near
  // the bottom (it then pokes through the bottom slot to hang out front).
  const tubeW = geo.stripW + 8;
  const tubeTopY = geo.yRoller - geo.rollerR - 2;
  const tubeBotY = geo.botSlotY;
  const tubeH = tubeBotY - tubeTopY;

  const node = (
    <div className="preview3d-flat" style={{ width: px(W), height: px(H), left: -px(W) / 2, top: -px(H) / 2 }}>
      {/* ── BACK: the retainer bridge glued just above the photo slot ── */}
      <div
        className="preview3d-flat-retainer"
        style={{
          left: px(geo.cx - retW / 2),
          top: px(topRetY),
          width: px(retW),
          height: px(L.RET_W),
          transform: `translateZ(${-2 * Z_STEP}px)`,
        }}
      >
        <span className="preview3d-flat-glue" style={{ left: 0, width: px(L.GLUE_END) }} />
        <span className="preview3d-flat-glue" style={{ right: 0, width: px(L.GLUE_END) }} />
      </div>
      <Tag side="back" x={px(geo.cx)} y={px(topRetY) - 10}>② 멈춤/안내 띠</Tag>

      {/* ── The reversing strip as ONE visible rolled-paper tube. It sits just
           in front of the card face (but behind the photo/PULL tab, which
           are further forward still) so the connection between them always
           reads clearly without needing to orbit around — unlike the other
           purely-behind-the-card back parts, this IS the part the user needs
           to see to understand the mechanism: a single tube-shaped strip the
           photo glues to at its front-top end, and the handle at its
           back-bottom end. ── */}
      <div
        className="preview3d-flat-camtube"
        style={{
          left: px(geo.cx - tubeW / 2),
          top: px(tubeTopY),
          width: px(tubeW),
          height: px(tubeH),
          transform: `translateZ(${0.3 * Z_STEP}px)`,
        }}
      >
        <span className="preview3d-flat-cammount" style={{ top: px(4), height: px(5) }} />
        <span className="preview3d-flat-cammount" style={{ bottom: px(4), height: px(5) }} />
        <div
          className="preview3d-flat-flange"
          style={{
            left: px(-(geo.flangeW - tubeW) / 2),
            top: px(flangeTopY - tubeTopY),
            width: px(geo.flangeW),
            height: px(L.FLANGE_H),
          }}
        />
      </div>
      <Tag x={px(geo.cx - tubeW / 2) - 6} y={px(tubeTopY + tubeH / 2)}>① 롤러+되돌림 띠 = 튜브형 종이 한 장</Tag>
      <Tag x={px(geo.cx + tubeW / 2 + 6)} y={px(tubeTopY + 10)}>사진 붙는 곳 (앞쪽 위)</Tag>
      <Tag x={px(geo.cx + tubeW / 2 + 6)} y={px(tubeBotY - 10)}>손잡이 붙는 곳 (뒤쪽 아래)</Tag>

      {/* ── Card face: photo slot (top) + tab slot (below it) ── */}
      <div className="preview3d-flat-card" style={{ width: px(W), height: px(H) }}>
        <div
          className="preview3d-flat-slot"
          style={{
            left: px(geo.cx) - slotWpx / 2,
            top: px(geo.slotTopY),
            width: slotWpx,
            height: px(geo.slotBotY - geo.slotTopY),
          }}
        />
        <div
          className="preview3d-flat-slot"
          style={{
            left: px(geo.cx) - px(botSlotLen) / 2,
            top: px(geo.botSlotY) - slotWpx / 2,
            width: px(botSlotLen),
            height: slotWpx,
          }}
        />
      </div>
      <Tag x={px(geo.cx + botSlotLen / 2 + 6)} y={px(geo.botSlotY)}>손잡이 슬롯 (앞면)</Tag>

      {/* ── FRONT: the photo, riding the mount up the slot. Its BOTTOM edge
           (not centre) sits at the mount line, a hair below it, so the photo
           reads as glued there and ejecting UPWARD out of the slot — instead
           of straddling the mount and burying the tube behind it. ── */}
      <div
        style={{
          position: 'absolute',
          left: px(geo.cx) - px(geo.photoW) / 2,
          top: px(mountY + L.NECK_H) - px(geo.photoH),
          width: px(geo.photoW),
          height: px(geo.photoH),
          background: 'linear-gradient(180deg, #ffffff 0%, #ffffff 78%, #cbd5e1 78%, #cbd5e1 100%)',
          border: '1px solid rgba(100, 116, 139, 0.6)',
          borderRadius: '3px',
          boxShadow: '0 2px 6px rgba(0, 0, 0, 0.18)',
          transform: `translateZ(${Z_STEP}px)`,
        }}
      />
      <Tag x={px(geo.cx)} y={px(mountY + L.NECK_H) - px(geo.photoH) - 10}>사진 (앞면)</Tag>

      {/* ── FRONT: the PULL tab — exposed length grows as it's pulled ── */}
      <div
        className="preview3d-flat-grip"
        style={{
          left: px(geo.cx) - px(geo.stripW) / 2,
          top: px(geo.botSlotY),
          width: px(geo.stripW),
          height: px(exposedGrip),
          transform: `translateZ(${Z_STEP}px)`,
        }}
      />
      <Tag x={px(geo.cx)} y={px(geo.botSlotY + exposedGrip) + 10}>PULL 손잡이 (아래로 당김)</Tag>
    </div>
  );

  return {
    node,
    readout: `사진 상승 ${rise.toFixed(0)} / ${(tStop * geo.travel).toFixed(0)}mm · 롤러 Ø${(geo.rollerR * 2).toFixed(1)}mm`,
    slider,
    value: drive,
  };
}

/* ────────────────────────────────────────────────────────────────────────────
 * Pull tab (풀탭)
 *
 * Stack: handle tab (front, folded through the slot) → card face with the
 * horizontal track slot → slider body (back, with 4 stop nubs) → two guide
 * strips glued across the back. Numbers reproduce generatePullTab's own
 * computations (travel = trackLength − sliderWidth − 2·buffer, etc.).
 * ──────────────────────────────────────────────────────────────────────────── */
function buildPullTab(params, defaults, paperSize, driveRaw) {
  const slider = {
    label: '손잡이 당기기',
    min: 0, max: 100, step: 1, defaultValue: 25,
    format: (v) => `${Math.round(v)}%`,
  };
  const drive = driveRaw ?? slider.defaultValue;
  const paper = PAPER_SIZES[paperSize] || PAPER_SIZES.A4;
  const card = CARD_SIZES[paperSize] || CARD_SIZES.A4;

  // Same clamps/derived numbers as generatePullTab (validatePullTabParams).
  const sliderW = clamp(params.sliderWidth ?? defaults.sliderWidth, 8, 60);
  const sliderH = clamp(params.sliderHeight ?? defaults.sliderHeight, 5, 40);
  const trackLength = clamp(params.trackLength ?? defaults.trackLength, 20, card.width - 2 * PRINT.MARGIN - 20);
  const buffer = 2;
  const slotWidth = 1.1; // paperThickness 0.3 + clearance 0.8
  const travel = trackLength - sliderW - 2 * buffer;

  const spineY = paper.height / 2;
  const y0 = spineY - card.height; // card-face top edge on the sheet
  const W = card.width;
  const H = card.height;
  const trackCX = paper.width / 2;
  const trackCY = spineY - card.height / 4 - y0; // face-local
  const trackLeft = trackCX - trackLength / 2;

  const t = drive / 100;
  const xSlider = trackLeft + buffer + t * travel; // slider body's left edge

  const PX = 310 / W;
  const px = (mm) => mm * PX;
  const slotHpx = Math.max(3, px(slotWidth));
  const guideW = 4;
  const handleW = 8;

  const nub = (dx, dy, key) => (
    <span
      key={key}
      className="preview3d-flat-stopnub"
      style={{ left: px(dx), top: px(dy), width: px(3), height: px(1.5) }}
    />
  );

  const guide = (y, key) => (
    <div
      key={key}
      className="preview3d-flat-retainer"
      style={{
        left: px(trackLeft - 3),
        top: px(y),
        width: px(trackLength + 6),
        height: px(guideW),
        transform: `translateZ(${-2 * Z_STEP}px)`,
      }}
    >
      <span className="preview3d-flat-glue" style={{ left: 0, width: px(5) }} />
      <span className="preview3d-flat-glue" style={{ right: 0, width: px(5) }} />
    </div>
  );

  const node = (
    <div className="preview3d-flat" style={{ width: px(W), height: px(H), left: -px(W) / 2, top: -px(H) / 2 }}>
      {/* ── BACK: guide strips + slider body with stop nubs ── */}
      {guide(trackCY - slotWidth / 2 - guideW - 1, 'guide-top')}
      {guide(trackCY + slotWidth / 2 + 1, 'guide-bot')}
      <div
        className="preview3d-flat-strip"
        style={{
          left: px(xSlider),
          top: px(trackCY - sliderH / 2),
          width: px(sliderW),
          height: px(sliderH),
          transform: `translateZ(${-Z_STEP}px)`,
        }}
      >
        {nub(0, -1.5, 'nub-tl')}
        {nub(sliderW - 3, -1.5, 'nub-tr')}
        {nub(0, sliderH, 'nub-bl')}
        {nub(sliderW - 3, sliderH, 'nub-br')}
      </div>
      <Tag side="back" x={px(xSlider + sliderW / 2)} y={px(trackCY - sliderH / 2) - 12}>슬라이더 몸통 (뒷면)</Tag>
      <Tag side="back" x={px(trackCX)} y={px(trackCY + slotWidth / 2 + 1 + guideW + 6)}>안내 띠 ×2 (뒷면 풀칠)</Tag>

      {/* ── Card face with the horizontal track slot ── */}
      <div className="preview3d-flat-card" style={{ width: px(W), height: px(H) }}>
        <div
          className="preview3d-flat-slot"
          style={{
            left: px(trackLeft),
            top: px(trackCY) - slotHpx / 2,
            width: px(trackLength),
            height: slotHpx,
          }}
        />
      </div>
      <Tag x={px(trackCX)} y={px(trackCY) - 16}>가로 슬롯 {trackLength}×{slotWidth}mm</Tag>

      {/* ── FRONT: the handle tab folded forward through the slot ── */}
      <div
        className="preview3d-flat-handle"
        style={{
          left: px(xSlider + sliderW),
          top: px(trackCY - sliderH / 2),
          width: px(handleW),
          height: px(sliderH),
          transform: `translateZ(${Z_STEP}px)`,
        }}
      />
      <Tag x={px(xSlider + sliderW + handleW / 2)} y={px(trackCY + sliderH / 2) + 12}>손잡이 (앞면)</Tag>
    </div>
  );

  return {
    node,
    readout: `이동 ${(t * travel).toFixed(0)} / ${travel.toFixed(0)}mm · 슬라이더 ${sliderW}×${sliderH}mm`,
    slider,
    value: drive,
  };
}

/* ────────────────────────────────────────────────────────────────────────────
 * Slide-to-swing (흔들 장치) — the paper Scotch yoke.
 *
 * Stack front → back: decoration → slider (with the vertical slot the pin
 * rides in) → post/arm → card face (pivot hole) → pivot cap behind the card.
 * Drive u ∈ [−1, 1] is the handle position: sinθ = u·sinθmax (from
 * xSlider = px + r·sinθ), so the sim reproduces the real slider↔arm coupling.
 * ──────────────────────────────────────────────────────────────────────────── */
function buildSlideToSwing(params, defaults, paperSize, driveRaw) {
  const slider = {
    label: '손잡이 밀기',
    min: -100, max: 100, step: 1, defaultValue: 0,
    format: (v) => `${Math.round(v)}%`,
  };
  const drive = driveRaw ?? slider.defaultValue;
  const L = SLIDE_SWING_LIMITS;
  const geo = resolveSlideToSwing({
    paperSize,
    armLength: params.armLength ?? defaults.armLength,
    swingAngle: params.swingAngle ?? defaults.swingAngle,
  });
  const paper = PAPER_SIZES[paperSize] || PAPER_SIZES.A4;
  const card = CARD_SIZES[paperSize] || CARD_SIZES.A4;

  const y0 = geo.spineY - card.height;
  const W = card.width;
  const H = card.height;
  const pyL = geo.py - y0; // face-local pivot y

  const u = drive / 100;
  const sinT = u * Math.sin(degToRad(geo.thetaMax));
  const theta = Math.asin(clamp(sinT, -1, 1)); // rad
  const thetaDeg = radToDeg(theta);
  const cosT = Math.cos(theta);
  const sx = geo.px + geo.r * sinT;            // slider/pin centre x
  const ySlotL = geo.ySlot - y0;

  const PX = 310 / W;
  const px = (mm) => mm * PX;

  const bodyW = L.SLIDER_BODY_W;
  const rigW = L.FLANGE_W + bodyW + L.FLANGE_W + geo.grip;
  const decoCx = geo.px + (geo.r + L.DECO_OFF) * sinT;
  const decoCyL = pyL - (geo.r + L.DECO_OFF) * cosT; // py − (r+off)·cosθ, face-local
  const decoSize = px(L.DECO_R * 2);

  const guide = (top, key) => (
    <div
      key={key}
      className="preview3d-flat-retainer preview3d-flat-guide"
      style={{
        left: px(geo.px - geo.guideLen / 2),
        top: px(top),
        width: px(geo.guideLen),
        height: px(L.GUIDE_W),
        transform: `translateZ(${3 * Z_STEP}px)`,
      }}
    >
      <span className="preview3d-flat-glue" style={{ left: 0, width: px(L.GLUE_END) }} />
      <span className="preview3d-flat-glue" style={{ right: 0, width: px(L.GLUE_END) }} />
    </div>
  );

  const node = (
    <div className="preview3d-flat" style={{ width: px(W), height: px(H), left: -px(W) / 2, top: -px(H) / 2 }}>
      {/* ── BACK: the pivot cap that captures the post's neck ── */}
      <div
        className="preview3d-flat-cap"
        style={{
          left: px(geo.px - L.PIVOT_CAP_R),
          top: px(pyL - L.PIVOT_CAP_R),
          width: px(L.PIVOT_CAP_R * 2),
          height: px(L.PIVOT_CAP_R * 2),
          transform: `translateZ(${-Z_STEP}px)`,
        }}
      />
      <Tag side="back" x={px(geo.px)} y={px(pyL + L.PIVOT_CAP_R) + 10}>뒤 고정 캡 (뒷면 풀칠)</Tag>

      {/* ── Card face with the round pivot hole ── */}
      <div className="preview3d-flat-card" style={{ width: px(W), height: px(H) }}>
        <div
          className="preview3d-flat-hole"
          style={{
            left: px(geo.px - L.PIVOT_HOLE / 2),
            top: px(pyL - L.PIVOT_HOLE / 2),
            width: px(L.PIVOT_HOLE),
            height: px(L.PIVOT_HOLE),
          }}
        />
      </div>
      <Tag x={px(geo.px - 26)} y={px(pyL + 2)}>회전 구멍 Ø{L.PIVOT_HOLE}mm</Tag>

      {/* ── FRONT layer 1: the swinging post, pivoted at its base ── */}
      <div
        className="preview3d-flat-post"
        style={{
          left: px(geo.px - L.POST_W / 2),
          top: px(pyL - geo.r),
          width: px(L.POST_W),
          height: px(geo.r),
          transformOrigin: '50% 100%',
          transform: `translateZ(${Z_STEP}px) rotate(${thetaDeg}deg)`,
        }}
      >
        <span
          className="preview3d-flat-pin"
          style={{
            left: '50%',
            top: px(-L.PIN_NECK),
            width: px(L.PIN_NECK),
            height: px(L.PIN_NECK),
            marginLeft: px(-L.PIN_NECK / 2),
          }}
        />
      </div>

      {/* ── FRONT layer 2: the slider (slot + flanges + handle) ── */}
      <div
        className="preview3d-flat-strip"
        style={{
          left: px(sx - bodyW / 2 - L.FLANGE_W),
          top: px(ySlotL - geo.flangeSpan / 2),
          width: px(rigW),
          height: px(geo.flangeSpan),
          background: 'none',
          border: 'none',
          boxShadow: 'none',
          transform: `translateZ(${2 * Z_STEP}px)`,
        }}
      >
        <div className="preview3d-flat-flange" style={{ left: 0, top: 0, width: px(L.FLANGE_W), height: '100%' }} />
        <div
          className="preview3d-flat-strip"
          style={{
            left: px(L.FLANGE_W),
            top: px((geo.flangeSpan - geo.sliderH) / 2),
            width: px(bodyW),
            height: px(geo.sliderH),
          }}
        >
          <div
            className="preview3d-flat-slot"
            style={{
              left: px(bodyW / 2 - geo.slotWidthX / 2),
              top: px(geo.slotTopY - (geo.ySlot - geo.sliderH / 2)),
              width: Math.max(3, px(geo.slotWidthX)),
              height: px(geo.slotLen),
            }}
          />
        </div>
        <div className="preview3d-flat-flange" style={{ left: px(L.FLANGE_W + bodyW), top: 0, width: px(L.FLANGE_W), height: '100%' }} />
        <div
          className="preview3d-flat-grip"
          style={{
            left: px(2 * L.FLANGE_W + bodyW),
            top: px((geo.flangeSpan - L.GRIP_H) / 2),
            width: px(geo.grip),
            height: px(L.GRIP_H),
          }}
        />
      </div>
      <Tag x={px(sx)} y={px(ySlotL + geo.flangeSpan / 2) + 12}>슬라이더 · 세로 슬롯에 핀이 끼워짐</Tag>
      <Tag x={px(sx + bodyW / 2 + L.FLANGE_W + geo.grip / 2)} y={px(ySlotL - geo.flangeSpan / 2) - 10}>손잡이 (좌우로)</Tag>

      {/* ── Guide strips glued over the slider's edges ── */}
      {guide(ySlotL - geo.channelGap / 2 - (L.GUIDE_W - L.GUIDE_LIP), 'guide-top')}
      {guide(ySlotL + geo.channelGap / 2 - L.GUIDE_LIP, 'guide-bot')}

      {/* ── FRONT-most: the decoration glued on the pin ── */}
      <div
        className="preview3d-flat-deco"
        style={{
          left: px(decoCx) - decoSize / 2,
          top: px(decoCyL) - decoSize / 2,
          width: decoSize,
          height: decoSize,
          fontSize: decoSize * 0.9,
          transform: `translateZ(${4 * Z_STEP}px) rotate(${thetaDeg}deg)`,
        }}
      >
        ♥
      </div>
      <Tag x={px(decoCx - 22)} y={px(decoCyL) - decoSize / 2 - 12}>장식 (핀에 붙음)</Tag>
    </div>
  );

  return {
    node,
    readout: `흔들 각도 θ = ${thetaDeg.toFixed(0)}° (최대 ±${geo.thetaMax.toFixed(0)}°) · 손잡이 이동 ${(geo.r * sinT).toFixed(0)}mm`,
    slider,
    value: drive,
  };
}

/* ────────────────────────────────────────────────────────────────────────────
 * Volvelle (돌림판)
 *
 * Real stack, front → back: ① cover (window + bottom thumb notch) → ② rotor
 * (the only moving part, dropped in UNGLUED) → ③ spacer ring (same layer as
 * the rotor — it surrounds it) → ④ back disc. The drive spins the rotor; the
 * window and the notch are genuinely transparent, so the rotor is seen through
 * them exactly as in the assembled toy, and orbiting shows the 4-sheet sandwich.
 * ──────────────────────────────────────────────────────────────────────────── */
const VOLVELLE_COLORS = [
  '#fca5a5', '#fdba74', '#fde047', '#86efac', '#93c5fd',
  '#d8b4fe', '#f9a8d4', '#a5f3fc', '#fcd34d', '#c4b5fd',
];

function buildVolvelle(params, defaults, paperSize, driveRaw) {
  const slider = {
    label: '돌림판 돌리기',
    min: 0, max: 360, step: 1, defaultValue: 0,
    format: (v) => `${Math.round(v)}°`,
  };
  const drive = driveRaw ?? slider.defaultValue;
  const geo = resolveVolvelleGeometry({
    R: params.R ?? defaults.R,
    sectors: params.sectors ?? defaults.sectors,
  });
  const { R, sectors, outerR, innerR, rOut, sigma, thetaW } = geo;
  const winInner = clamp(Math.round(R * 0.18), 5, R - 8); // same as generateVolvelle

  const S = outerR * 2;
  const PX = 250 / S;
  const px = (mm) => mm * PX;
  const G = Z_STEP;
  const cover = 'rgba(248, 250, 252, 0.97)';

  // Which rotor sector currently faces the window (window centred at 0° = up).
  const discAngleAtWindow = ((-drive % 360) + 360) % 360;
  const visibleSector = (Math.floor(discAngleAtWindow / sigma) % sectors) + 1;

  const sectorStops = Array.from({ length: sectors }, (_, k) => {
    const c = VOLVELLE_COLORS[k % VOLVELLE_COLORS.length];
    return `${c} ${k * sigma}deg ${(k + 1) * sigma}deg`;
  }).join(', ');

  const numbers = Array.from({ length: sectors }, (_, k) => {
    const a = degToRad(k * sigma + sigma / 2);
    return (
      <span
        key={`n-${k}`}
        className="preview3d-flat-volnum"
        style={{
          left: px(R + R * 0.62 * Math.sin(a)),
          top: px(R - R * 0.62 * Math.cos(a)),
        }}
      >
        {k + 1}
      </span>
    );
  });

  const notchStart = 165 + thetaW / 2; // in the cover gradient's from-space
  const node = (
    <div className="preview3d-flat" style={{ width: px(S), height: px(S), left: -px(S) / 2, top: -px(S) / 2 }}>
      {/* ④ back disc */}
      <div
        className="preview3d-flat-volplate"
        style={{ left: 0, top: 0, width: px(S), height: px(S), transform: `translateZ(${-2 * G}px)` }}
      />
      <Tag side="back" x={px(S / 2)} y={px(S) - 8}>④ 뒷판 (테두리 풀칠)</Tag>

      {/* ③ spacer ring — surrounds the rotor on the SAME layer */}
      <div
        className="preview3d-flat-volspacer"
        style={{
          left: 0,
          top: 0,
          width: px(S),
          height: px(S),
          borderWidth: px(outerR - innerR),
          transform: `translateZ(${-G}px)`,
        }}
      />
      {/* ② rotor — the only moving part, spun by the drive */}
      <div
        className="preview3d-flat-volrotor"
        style={{
          left: px(outerR - R),
          top: px(outerR - R),
          width: px(R * 2),
          height: px(R * 2),
          background: `conic-gradient(from 0deg, ${sectorStops})`,
          transform: `translateZ(${-G}px) rotate(${drive}deg)`,
        }}
      >
        {numbers}
      </div>

      {/* ① cover: window wedge + bottom thumb notch are truly transparent */}
      <div
        className="preview3d-flat-volcover"
        style={{
          left: 0,
          top: 0,
          width: px(S),
          height: px(S),
          background:
            `conic-gradient(from ${-thetaW / 2}deg, ` +
            `rgba(0,0,0,0) 0deg ${thetaW}deg, ` +
            `${cover} ${thetaW}deg ${notchStart}deg, ` +
            `rgba(0,0,0,0) ${notchStart}deg ${notchStart + 30}deg, ` +
            `${cover} ${notchStart + 30}deg 360deg)`,
        }}
      >
        {/* hub patch: the window is annular (winInner..rOut), not a full wedge */}
        <div
          className="preview3d-flat-volhub"
          style={{
            left: px(outerR - winInner),
            top: px(outerR - winInner),
            width: px(winInner * 2),
            height: px(winInner * 2),
            background: cover,
          }}
        />
        {/* notch patch: the notch only opens the rim (R−4 .. outerR) */}
        <div
          className="preview3d-flat-volhub"
          style={{
            left: px(outerR - (R - 4)),
            top: px(outerR - (R - 4)),
            width: px((R - 4) * 2),
            height: px((R - 4) * 2),
            background: `conic-gradient(from 165deg, ${cover} 0deg 30deg, rgba(0,0,0,0) 30deg 360deg)`,
          }}
        />
        <div className="preview3d-flat-volring" />
      </div>
      <Tag x={px(S / 2)} y={px(outerR - rOut) - 12}>① 덮개의 창문 ↓</Tag>
      <Tag x={px(S / 2)} y={px(S) - 10}>노치: 여기서 ② 돌림판을 돌려요</Tag>
    </div>
  );

  return {
    node,
    readout: `창에 보이는 칸: ${visibleSector}번 / ${sectors}칸 · 칸 각도 σ = ${sigma}° · 창 폭 ${thetaW}°`,
    slider,
    value: drive,
  };
}

/* ────────────────────────────────────────────────────────────────────────────
 * Flip-disc (반쪽 넘김판)
 *
 * A fixed LEFT half-disc + N right half-disc leaves hinged on the shared
 * vertical diameter (the glued tab spine). Leaves turn like book pages
 * (rotateY about the hinge); each carries its staggered grip nub. The drive
 * counts pages turned (fractional = mid-flip). z is interpolated during the
 * flip so leaf order stays physical on both piles.
 * ──────────────────────────────────────────────────────────────────────────── */
const FLIP_COLORS = ['#93c5fd', '#fca5a5', '#fde047', '#86efac', '#d8b4fe', '#fdba74'];

function buildFlipDisc(params, defaults, paperSize, driveRaw) {
  const geo = resolveFlipDiscGeometry({
    R: params.R ?? defaults.R,
    pages: params.pages ?? defaults.pages,
    paperSize,
  });
  const C = FLIPDISC_CONST;
  const { R, pages, tab } = geo;

  const slider = {
    label: '한 장씩 넘기기',
    min: 0, max: pages, step: 0.02, defaultValue: 0.5,
    format: (v) => `${v.toFixed(1)}장`,
  };
  const drive = driveRaw ?? slider.defaultValue;

  // Backdrop panel the assembly glues onto.
  const Wb = 2 * R + 2 * (C.NUB_DEPTH + 14);
  const Hb = 2 * R + 24;
  const cx0 = Wb / 2;
  const cy0 = Hb / 2;

  const PX = 290 / Wb;
  const px = (mm) => mm * PX;

  const leaves = Array.from({ length: pages }, (_, i) => {
    const k = i + 1;
    const a = clamp((drive - i) * 180, 0, 180); // this leaf's flip angle
    // z piles: unflipped leaf k sits (pages−k+1) sheets up on the right;
    // flipped it lands k sheets up on the left. Interpolate during the flip.
    const zRight = (pages - k + 1) * 4;
    const zLeft = k * 4;
    const z = zRight + (zLeft - zRight) * (a / 180);
    const nubA = degToRad(C.NUB_START_DEG + i * C.STAGGER_DEG);
    const nubR = R + C.NUB_DEPTH / 2;
    return (
      <div
        key={`leaf-${k}`}
        className="preview3d-flat-leafbox"
        style={{
          left: px(cx0),
          top: px(cy0 - R),
          width: px(R + C.NUB_DEPTH),
          height: px(R * 2),
          transformOrigin: 'left center',
          transform: `translateZ(${z}px) rotateY(${-a}deg)`,
        }}
      >
        <div
          className="preview3d-flat-leaf"
          style={{
            width: px(R),
            height: px(R * 2),
            background: `linear-gradient(135deg, ${FLIP_COLORS[i % FLIP_COLORS.length]}, #ffffff)`,
          }}
        >
          <span className="preview3d-flat-pagenum">{k}</span>
        </div>
        <span
          className="preview3d-flat-nub"
          style={{
            left: px(nubR * Math.sin(nubA)) - px(3.5),
            top: px(R - nubR * Math.cos(nubA)) - px(3.5),
            width: px(7),
            height: px(7),
          }}
        />
      </div>
    );
  });

  const turned = Math.min(pages, Math.floor(drive + 0.001));
  const showing = turned >= pages ? '모두 넘김 (뒷면들)' : `${turned + 1}번 접시`;

  const node = (
    <div className="preview3d-flat" style={{ width: px(Wb), height: px(Hb), left: -px(Wb) / 2, top: -px(Hb) / 2 }}>
      {/* backdrop card the parts glue onto */}
      <div className="preview3d-flat-card" style={{ width: px(Wb), height: px(Hb), transform: `translateZ(${-2 * Z_STEP}px)` }} />

      {/* the glued tab spine on the diameter line */}
      <div
        className="preview3d-flat-hinge"
        style={{
          left: px(cx0 - tab),
          top: px(cy0 - R),
          width: px(tab),
          height: px(R * 2),
          transform: `translateZ(${-Z_STEP - 2}px)`,
        }}
      />
      {/* fixed LEFT half-disc, glued over the tab spine */}
      <div
        className="preview3d-flat-halfdisc"
        style={{
          left: px(cx0 - R),
          top: px(cy0 - R),
          width: px(R),
          height: px(R * 2),
          transform: `translateZ(${-Z_STEP}px)`,
        }}
      />
      <Tag x={px(cx0 - R / 2)} y={px(cy0 - R) - 10}>고정 반쪽 (배경)</Tag>
      <Tag x={px(cx0 - tab / 2)} y={px(cy0 + R) + 10}>경첩 띠 스파인 (풀칠)</Tag>

      {leaves}
      <Tag x={px(cx0 + R * 0.55)} y={px(cy0 + R) + 10}>넘김판 ①~{'①②③④⑤⑥'[pages - 1]} · 손잡이 혹이 계단식</Tag>
    </div>
  );

  return {
    node,
    readout: `지금 보이는 그림: ${showing} · 반지름 R = ${R}mm · 넘김판 ${pages}장`,
    slider,
    value: drive,
  };
}

/* ────────────────────────────────────────────────────────────────────────────
 * Straw rocket (빨대 로켓)
 *
 * A paper tube (rolled, top sealed) slips over a straw; two decoration
 * silhouettes sandwich the tube front/back. Blowing pressurises the sealed
 * tube and launches the whole assembly. The tube halves are drawn on BOTH
 * sides of the straw (it wraps it), semi-transparent so the straw tip is
 * visible inside — the "why it flies" is the sealed cap trapping the air.
 * ──────────────────────────────────────────────────────────────────────────── */
function buildStrawRocket(params, defaults, paperSize, driveRaw) {
  const slider = {
    label: '후~ 불기',
    min: 0, max: 100, step: 1, defaultValue: 0,
    format: (v) => `${Math.round(v)}%`,
  };
  const drive = driveRaw ?? slider.defaultValue;

  // Real part sizes from generateStrawRocket: tube 22mm wrap (→ Ø≈7mm) ×
  // 20mm tall, sealed top; decorations ≈ 60×50mm; a standard Ø6mm straw.
  const tubeD = 7;
  const tubeH = 20;
  const strawD = 6;
  const strawL = 130;
  const decoW = 44;
  const decoH = 50;
  const riseMax = 105;

  const W = decoW + 16;
  const H = strawL + tubeH + riseMax + 14;
  const PX = 320 / H;
  const px = (mm) => mm * PX;
  const cx = W / 2;

  const t = drive / 100;
  const rise = t * riseMax;
  const strawTopY = H - 6 - strawL;
  const tubeTop = strawTopY - 1 - rise;
  const decoTop = tubeTop - (decoH - tubeH) / 2;

  const rocketClip =
    'polygon(50% 0%, 66% 16%, 72% 44%, 68% 66%, 92% 92%, 64% 82%, 58% 100%, 42% 100%, 36% 82%, 8% 92%, 32% 66%, 28% 44%, 34% 16%)';

  const node = (
    <div className="preview3d-flat" style={{ width: px(W), height: px(H), left: -px(W) / 2, top: -px(H) / 2 }}>
      {/* ── BACK decoration (mirror silhouette) ── */}
      <div
        className="preview3d-flat-rocket preview3d-flat-rocket-back"
        style={{
          left: px(cx - decoW / 2),
          top: px(decoTop),
          width: px(decoW),
          height: px(decoH),
          clipPath: rocketClip,
          transform: `translateZ(${-Z_STEP}px)`,
        }}
      />
      <Tag side="back" x={px(cx)} y={px(decoTop) - 10}>장식 뒷면 (거울상)</Tag>

      {/* ── tube back half (wraps behind the straw) ── */}
      <div
        className="preview3d-flat-tube preview3d-flat-tube-back"
        style={{
          left: px(cx - tubeD / 2),
          top: px(tubeTop),
          width: px(tubeD),
          height: px(tubeH),
          transform: 'translateZ(-2.5px)',
        }}
      />

      {/* ── the straw (fixed — you blow through it) ── */}
      <div
        className="preview3d-flat-straw"
        style={{ left: px(cx - strawD / 2), top: px(strawTopY), width: px(strawD), height: px(strawL) }}
      />
      <Tag x={px(cx)} y={px(H) - 8}>빨대 — 여기로 후! 불기</Tag>

      {/* ── tube front half + sealed cap ── */}
      <div
        className="preview3d-flat-tube"
        style={{
          left: px(cx - tubeD / 2),
          top: px(tubeTop),
          width: px(tubeD),
          height: px(tubeH),
          transform: 'translateZ(2.5px)',
        }}
      >
        <span className="preview3d-flat-tubecap" />
      </div>
      <Tag x={px(cx + tubeD / 2 + 6)} y={px(tubeTop + tubeH / 2)}>종이 튜브 · 위 막힘</Tag>

      {/* ── FRONT decoration ── */}
      <div
        className="preview3d-flat-rocket"
        style={{
          left: px(cx - decoW / 2),
          top: px(decoTop),
          width: px(decoW),
          height: px(decoH),
          clipPath: rocketClip,
          transform: `translateZ(${Z_STEP}px)`,
        }}
      />
      <Tag x={px(cx)} y={px(decoTop) - 10}>장식 앞면 (튜브에 부착)</Tag>
    </div>
  );

  return {
    node,
    readout: `발사 높이 ${rise.toFixed(0)}mm — 막힌 튜브 속 공기가 로켓을 밀어 올려요`,
    slider,
    value: drive,
  };
}

const BUILDERS = {
  'rising-slide': buildRisingSlide,
  'pull-tab': buildPullTab,
  'slide-to-swing': buildSlideToSwing,
  'volvelle': buildVolvelle,
  'flip-disc': buildFlipDisc,
  'straw-rocket': buildStrawRocket,
  'camera-print-pull': buildCameraPrintPull,
};

/**
 * Build the flat-mechanism scene for Preview3D.
 * @param {string} mechanism - registry id (must be in FLAT_3D)
 * @param {object} params    - buildMechanismParams(...) output
 * @param {object} defaults  - the mechanism's registry defaultParams
 * @param {'A4'|'LETTER'} paperSize
 * @param {number|null} drive - current drive value, or null → slider default
 * @returns {{ node: JSX.Element, readout: string,
 *             slider: { label:string, min:number, max:number, step:number,
 *                       defaultValue:number, format:(v:number)=>string },
 *             value: number } | null}
 */
export function buildFlatScene(mechanism, params, defaults, paperSize, drive) {
  const builder = BUILDERS[mechanism];
  if (!builder) return null;
  return builder(params || {}, defaults || {}, paperSize, drive);
}
