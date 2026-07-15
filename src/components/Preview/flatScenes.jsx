import React from 'react';
import { PAPER_SIZES, CARD_SIZES, PRINT } from '../../generators/constants';
import { resolveRisingSlide, RISING_LIMITS } from '../../generators/risingSlide';
import { resolveSlideToSwing, SLIDE_SWING_LIMITS } from '../../generators/slideToSwing';
import { resolveVolvelleGeometry } from '../../generators/volvelle';
import { resolveFlipDiscGeometry, FLIPDISC_CONST } from '../../generators/flipDisc';
import { resolveCameraPull, CAMERA_PULL_LIMITS } from '../../generators/cameraPrintPull';
import { resolveGateCurtain, sGate, curtainOffset, GATE_CURTAIN_LIMITS } from '../../generators/gateCurtain';
import { resolveMagicShutter, MAGIC_SHUTTER_LIMITS } from '../../generators/magicShutter';
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
  'gate-curtain',
  'magic-shutter',
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
 *   slot (below it) → ONE reversing strip, folded 180° over a roller near the
 *   top so it lies behind the card as two overlapping plies on the same centre
 *   column → the PULL tab (front again, hanging out below the tab slot).
 *   The photo's bottom edge glues to the mount at the strip's photo end; the
 *   grip is the strip's other end on the front. Pulling the tab DOWN feeds strip
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
  const photoRunNow = Math.max(1, geo.photoRun - rise);
  const exposedGrip = geo.grip + rise;

  const sceneBottom = Math.max(H, geo.botSlotY + geo.grip + geo.travel * tStop) + 8;
  const PX = 300 / sceneBottom;
  const px = (mm) => mm * PX;

  const retW = geo.channelGap + 2 * L.GLUE_END;
  // ONE strip, folded 180° over the roller into two overlapping plies on the
  // card's centre column (the pattern's "flat two-ply U"): the photo ply lies
  // against the card back (−1·Z), the tab ply returns outside it (−3·Z), and
  // the roller sits between them (−2·Z) — separated only in z, never in x.
  const flangeTopY = mountY - L.NECK_H - L.FLANGE_H;
  const botSlotLen = geo.stripW + geo.slotWidth * 2;
  const slotWpx = Math.max(3, px(geo.slotWidth));

  const node = (
    <div className="preview3d-flat" style={{ width: px(W), height: px(H), left: -px(W) / 2, top: -px(H) / 2 }}>
      {/* ── BACK, furthest layer: the roller (a rolled tube glued by its two ends only) ── */}
      <div
        className="preview3d-flat-roller"
        style={{
          left: px(geo.cx - geo.rollerLen / 2),
          top: px(geo.yRoller - geo.rollerR),
          width: px(geo.rollerLen),
          height: px(geo.rollerR * 2),
          transform: `translateZ(${-2 * Z_STEP}px)`,
        }}
      />
      <Tag side="back" x={px(geo.cx)} y={px(geo.yRoller - geo.rollerR) - 10}>① 롤러(튜브)</Tag>

      {/* ── BACK: the retainer bridge glued just above the photo slot ── */}
      <div
        className="preview3d-flat-retainer"
        style={{
          left: px(geo.cx - retW / 2),
          top: px(topRetY),
          width: px(retW),
          height: px(L.RET_W),
          transform: `translateZ(${-4 * Z_STEP}px)`,
        }}
      >
        <span className="preview3d-flat-glue" style={{ left: 0, width: px(L.GLUE_END) }} />
        <span className="preview3d-flat-glue" style={{ right: 0, width: px(L.GLUE_END) }} />
      </div>
      <Tag side="back" x={px(geo.cx)} y={px(topRetY) - 10}>② 멈춤/안내 띠</Tag>

      {/* ── BACK: ONE reversing strip, folded 180° over the roller into two plies ── */}
      {/* inner ply (against the card): roller → photo mount; shortens as it's pulled */}
      <div
        className="preview3d-flat-strip"
        style={{
          left: px(geo.cx - geo.stripW / 2),
          top: px(geo.yRoller),
          width: px(geo.stripW),
          height: px(photoRunNow),
          transform: `translateZ(${-Z_STEP}px)`,
        }}
      >
        <div
          className="preview3d-flat-flange"
          style={{
            left: px(-(geo.flangeW - geo.stripW) / 2),
            top: px(flangeTopY - geo.yRoller),
            width: px(geo.flangeW),
            height: px(L.FLANGE_H),
          }}
        />
      </div>
      {/* the 180° fold arcing over the roller top */}
      <div
        className="preview3d-flat-strip"
        style={{
          left: px(geo.cx - geo.stripW / 2),
          top: px(geo.yRoller - geo.rollerR),
          width: px(geo.stripW),
          height: px(geo.rollerR),
          borderRadius: '50% 50% 0 0 / 100% 100% 0 0',
          transform: `translateZ(${-2 * Z_STEP - 2}px)`,
        }}
      />
      {/* outer ply: roller → bottom slot (fixed span — the strip slides through it) */}
      <div
        className="preview3d-flat-strip"
        style={{
          left: px(geo.cx - geo.stripW / 2),
          top: px(geo.yRoller),
          width: px(geo.stripW),
          height: px(geo.tabRun),
          transform: `translateZ(${-3 * Z_STEP}px)`,
        }}
      />
      <Tag side="back" x={px(geo.cx)} y={px(geo.yRoller + geo.tabRun * 0.72)}>되돌림 띠 (한 장 — 롤러 위로 접혀 두 겹)</Tag>

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

      {/* ── FRONT: the photo, its BOTTOM glued to the mount, riding up the slot ── */}
      <div
        style={{
          position: 'absolute',
          left: px(geo.cx) - px(geo.photoW) / 2,
          top: px(mountY - L.NECK_H) - px(geo.photoH),
          width: px(geo.photoW),
          height: px(geo.photoH),
          background: 'linear-gradient(180deg, #ffffff 0%, #ffffff 78%, #cbd5e1 78%, #cbd5e1 100%)',
          border: '1px solid rgba(100, 116, 139, 0.6)',
          borderRadius: '3px',
          boxShadow: '0 2px 6px rgba(0, 0, 0, 0.18)',
          transform: `translateZ(${Z_STEP}px)`,
        }}
      >
        {/* Uploaded user drawing as the developing photo (white footer strip
            below stays visible, like an instant-camera print). */}
        <span
          className="preview3d-flat-art"
          style={{ left: '4%', top: '3%', width: '92%', height: '72%' }}
        />
      </div>
      <Tag x={px(geo.cx)} y={px(mountY - L.NECK_H) - px(geo.photoH) - 10}>사진 (앞면 · 위로 올라감)</Tag>

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

      {/* ── FRONT-most: uploaded user drawing glued on the handle tab, riding
             the slider along the track (invisible until a drawing is set). ── */}
      <div
        className="preview3d-flat-art"
        style={{
          left: px(xSlider + sliderW + handleW / 2) - px(22) / 2,
          top: px(trackCY - sliderH / 2) - px(24),
          width: px(22),
          height: px(22),
          transform: `translateZ(${2 * Z_STEP}px)`,
        }}
      />
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

  // Per-sector artwork tile: when the user uploads a drawing (--user-art) it
  // shows in every sector at the same radius the cover window exposes, so
  // spinning the rotor moves the drawing through the window like the real toy.
  // Sized to the sector chord so neighbouring tiles don't overlap; invisible
  // (empty transparent div) while no drawing is uploaded.
  const artR = R * 0.62;
  const artSize = px(Math.min(R * 0.5, 2 * artR * Math.sin(degToRad(sigma / 2)) * 0.85));
  const numbers = Array.from({ length: sectors }, (_, k) => {
    const a = degToRad(k * sigma + sigma / 2);
    const cxSector = px(R + artR * Math.sin(a));
    const cySector = px(R - artR * Math.cos(a));
    return (
      <React.Fragment key={`n-${k}`}>
        <span
          className="preview3d-flat-art"
          style={{
            left: cxSector - artSize / 2,
            top: cySector - artSize / 2,
            width: artSize,
            height: artSize,
            transform: `rotate(${k * sigma + sigma / 2}deg)`,
          }}
        />
        <span
          className="preview3d-flat-volnum"
          style={{ left: cxSector, top: cySector }}
        >
          {k + 1}
        </span>
      </React.Fragment>
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
            // Uploaded user drawing (if any) becomes the leaf's plate artwork;
            // otherwise the per-leaf tint gradient as before.
            background: `var(--user-art, linear-gradient(135deg, ${FLIP_COLORS[i % FLIP_COLORS.length]}, #ffffff)) center / cover no-repeat`,
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

/* ────────────────────────────────────────────────────────────────────────────
 * Gate curtain (커튼 문 카드)
 *
 * A gate-fold card driven by its own doors (see generators/gateCurtain.js
 * header): two doors on VERTICAL hinges at the panel's left/right edges; a
 * strap (in-line slider-crank, s(α) = d·cosα + √(L² − d²·sin²α)) links each
 * door to a bowtie curtain that slides HORIZONTALLY on the panel, tucked under
 * the decorative frame's top/bottom rails. Opening the doors drags the
 * curtains apart, revealing the character through the frame's diamond window.
 *
 * The drive here is the door-opening angle α (0 = closed, 180 = flat open),
 * exactly the value the printed pattern's kinematics use. Doors rotate about
 * their hinges toward the viewer like flip-disc leaves; their translateZ is
 * interpolated with the fold angle (flip-disc's zRight→zLeft trick) so the
 * closed doors depth-sort ABOVE the curtain+frame stack while the open doors
 * lie next to the panel plane.
 * ──────────────────────────────────────────────────────────────────────────── */
function buildGateCurtain(params, defaults, paperSize, driveRaw) {
  const K = GATE_CURTAIN_LIMITS;
  const slider = {
    label: '문 열기 (여닫기)',
    min: 0, max: 180, step: 1, defaultValue: K.ALPHA_REVEAL,
    format: (v) => `${Math.round(v)}°`,
  };
  const drive = driveRaw ?? slider.defaultValue;
  const alpha = clamp(drive, 0, 180);

  const geo = resolveGateCurtain({
    paperSize,
    panelWidth: params.panelWidth ?? defaults.panelWidth,
    revealWidth: params.revealWidth ?? defaults.revealWidth,
    hingeOffset: params.hingeOffset ?? defaults.hingeOffset,
  });
  const { panelW, panelH, doorW, d, L, travel, Wc, Hc, wMin, notchDepth, frameW, frameH, revealW, revealH } = geo;

  const phi = 180 - alpha;                     // door fold angle (0 = flat open)
  const s = sGate(alpha, d, L);                // strap-attach distance from hinge
  const off = curtainOffset(alpha, d, L);      // curtain displacement from closed
  // Strap chord lift off the panel plane: the door-end pivot rides at height
  // d·sinα, the curtain end stays at 0 → tilt β about the vertical crease.
  const beta = radToDeg(Math.asin(clamp((d * Math.sin(degToRad(alpha))) / L, -1, 1)));

  const cX = panelW / 2;
  const pcY = panelH / 2;
  const PX = 290 / geo.cardW;                  // flat-open total width fills the stage
  const px = (mm) => mm * PX;

  // Doors closed must sort above panel(0) < curtains(Z_STEP) < frame(2·Z_STEP);
  // open they sit just off the panel plane. Interpolate with the fold like
  // flip-disc does (CSS depth-sorts whole planes, not intersections).
  const zDoor = 1 + (phi / 180) * (3 * Z_STEP - 1);

  const notchFrac = (notchDepth / Wc) * 100;   // chevron pinch, % of curtain width
  const curtainBg = 'linear-gradient(180deg, rgba(253, 224, 71, 0.95), rgba(245, 158, 11, 0.9))';
  const doorFace = (side) => (
    // Stone decoration on the door's OUTER face (visible when the card is
    // closed or when orbiting behind an open door).
    <div
      style={{
        position: 'absolute',
        left: '50%',
        top: '50%',
        width: px(K.STONE_W),
        height: px(K.STONE_H),
        marginLeft: -px(K.STONE_W) / 2,
        marginTop: -px(K.STONE_H) / 2,
        borderRadius: px(10),
        background: 'linear-gradient(135deg, rgba(148, 163, 184, 0.9), rgba(100, 116, 139, 0.9))',
        border: '1px solid rgba(71, 85, 105, 0.7)',
        transform: 'rotateY(180deg) translateZ(1px)',
        backfaceVisibility: 'visible',
      }}
      aria-hidden
      data-side={side}
    />
  );

  // Frame with a real diamond hole (SVG evenodd — CSS clip-path can't cut holes).
  const fw = px(frameW);
  const fh = px(frameH);
  const framePath =
    `M6 0 H${fw - 6} Q${fw} 0 ${fw} 6 V${fh - 6} Q${fw} ${fh} ${fw - 6} ${fh} H6 Q0 ${fh} 0 ${fh - 6} V6 Q0 0 6 0 Z ` +
    `M${fw / 2} ${fh / 2 - px(revealH / 2)} L${fw / 2 + px(revealW / 2)} ${fh / 2} L${fw / 2} ${fh / 2 + px(revealH / 2)} L${fw / 2 - px(revealW / 2)} ${fh / 2} Z`;

  const figSize = px(Math.min(revealW, revealH) * 0.72);

  const strap = (side) => {
    const isR = side === 'R';
    // Curtain-end attach point (global x), riding with the curtain.
    const attachX = isR ? cX + K.GAP + off : cX - K.GAP - off;
    return (
      <div
        key={`strap-${side}`}
        className="preview3d-flat-strip"
        style={{
          left: px(isR ? attachX : attachX - L),
          top: px(pcY - K.STRAP_W / 2),
          width: px(L),
          height: px(K.STRAP_W),
          transformOrigin: isR ? 'left center' : 'right center',
          transform: `translateZ(${Z_STEP + 4}px) rotateY(${isR ? -beta : beta}deg)`,
        }}
      >
        <span className="preview3d-flat-glue" style={{ left: 0, width: px(K.GLUE_END * 0.8) }} />
        <span className="preview3d-flat-glue" style={{ right: 0, width: px(K.GLUE_END * 0.8) }} />
      </div>
    );
  };

  const node = (
    <div className="preview3d-flat" style={{ width: px(panelW), height: px(panelH), left: -px(panelW) / 2, top: -px(panelH) / 2 }}>
      {/* ── Fixed BACK PANEL ── */}
      <div className="preview3d-flat-card" style={{ width: px(panelW), height: px(panelH) }} />

      {/* Character glued flat at panel centre (under the curtains). */}
      <div
        className="preview3d-flat-figure"
        style={{
          left: px(cX) - figSize / 2,
          top: px(pcY) - figSize / 2,
          width: figSize,
          height: figSize,
          transform: 'translateZ(2px)',
        }}
      />
      <Tag x={px(cX)} y={px(pcY - revealH / 2) - 10}>① 주인공 그림 (뒷판 가운데)</Tag>

      {/* ── CURTAINS — translate horizontally by curtainOffset(α) ── */}
      <div
        style={{
          position: 'absolute',
          left: px(cX - K.GAP),
          top: px(pcY - Hc / 2),
          width: px(Wc),
          height: px(Hc),
          background: curtainBg,
          border: '1px solid rgba(202, 138, 4, 0.6)',
          clipPath: `polygon(0% 0%, 100% 0%, ${100 - notchFrac}% 50%, 100% 100%, 0% 100%)`,
          transform: `translateX(${-px(off)}px) translateZ(${Z_STEP}px)`,
          backfaceVisibility: 'visible',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: px(cX + K.GAP - Wc),
          top: px(pcY - Hc / 2),
          width: px(Wc),
          height: px(Hc),
          background: curtainBg,
          border: '1px solid rgba(202, 138, 4, 0.6)',
          clipPath: `polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%, ${notchFrac}% 50%)`,
          transform: `translateX(${px(off)}px) translateZ(${Z_STEP + 2}px)`,
          backfaceVisibility: 'visible',
        }}
      />
      <Tag x={px(cX)} y={px(pcY + Hc / 2) + 10}>④ 노란 커튼 ×2 — 좌우로 미끄러짐 (뒷판에 붙이지 않음)</Tag>

      {/* ── STRAPS — door pivot ↔ curtain outer edge (tilt β = asin(d·sinα/L)) ── */}
      {strap('R')}
      {strap('L')}
      <Tag x={px(cX + K.GAP + off + L / 2)} y={px(pcY - K.STRAP_W / 2) - 10}>② 지지대 (문↔커튼)</Tag>

      {/* ── FRAME (retainer) — glued top/bottom rails only ── */}
      <div
        style={{
          position: 'absolute',
          left: px(cX - frameW / 2),
          top: px(pcY - frameH / 2),
          width: fw,
          height: fh,
          transform: `translateZ(${2 * Z_STEP + 2}px)`,
          backfaceVisibility: 'visible',
        }}
      >
        <svg width={fw} height={fh} viewBox={`0 0 ${fw} ${fh}`} style={{ display: 'block' }}>
          <path d={framePath} fillRule="evenodd" fill="rgba(203, 213, 225, 0.92)" stroke="rgba(100, 116, 139, 0.6)" strokeWidth="1" />
        </svg>
        <span className="preview3d-flat-glue" style={{ left: 2, right: 2, top: 0, width: 'auto', height: px(K.FRAME_BORDER) * 0.8 }} />
        <span className="preview3d-flat-glue" style={{ left: 2, right: 2, top: 'auto', bottom: 0, width: 'auto', height: px(K.FRAME_BORDER) * 0.8 }} />
      </div>
      <Tag x={px(cX)} y={px(pcY - frameH / 2) - 10}>③ 장식 액자 — 위·아래만 풀칠 (좌·우 열어두기)</Tag>

      {/* ── DOORS — vertical hinges at the panel's side edges ── */}
      <div
        className="preview3d-flat-card"
        style={{
          left: px(panelW),
          top: 0,
          width: px(doorW),
          height: px(panelH),
          transformOrigin: 'left center',
          transform: `translateZ(${zDoor}px) rotateY(${-phi}deg)`,
          transformStyle: 'preserve-3d',
        }}
      >
        {doorFace('R')}
      </div>
      <div
        className="preview3d-flat-card"
        style={{
          left: -px(doorW),
          top: 0,
          width: px(doorW),
          height: px(panelH),
          transformOrigin: 'right center',
          transform: `translateZ(${zDoor}px) rotateY(${phi}deg)`,
          transformStyle: 'preserve-3d',
        }}
      >
        {doorFace('L')}
      </div>
      <Tag x={px(panelW + doorW / 2)} y={px(panelH) + 10}>오른쪽 문</Tag>
      <Tag x={-px(doorW / 2)} y={px(panelH) + 10}>왼쪽 문</Tag>
      <Tag side="back" x={px(panelW + doorW / 2)} y={px(pcY)}>돌 장식 (문 바깥면)</Tag>
    </div>
  );

  // Distance from centre to the right curtain's inner-mid edge (the reveal).
  const revealHalf = doorW - s - wMin;
  const state =
    revealHalf < 0
      ? '주인공 가려짐 (커튼 겹침)'
      : revealHalf < revealW / 2 - 0.5
        ? '커튼 걷히는 중'
        : '다이아몬드 완전 개방';
  return {
    node,
    readout: `문 열림 ${Math.round(alpha)}° · 커튼 이동 ${off.toFixed(1)} / ${travel}mm · ${state}`,
    slider,
    value: drive,
  };
}

/* ────────────────────────────────────────────────────────────────────────────
 * Magic shutter (매직 셔터) — picket-fence picture swap.
 *
 * Physical stack, front → back (see generators/magicShutter.js header):
 *   card front with the picket-grille window (bars stay, gaps are cut) →
 *   slider sheet carrying pictures ①/② sliced into interleaved strips (its
 *   grip pokes out past the card's RIGHT edge) → two guide bridges glued to
 *   the card back, the lower one carrying the fixed stop-pin that threads the
 *   slider's stop-slot. The drive maps the handle push over the REAL one-pitch
 *   stroke: at u=0 the ① strips sit under the gaps, at u=travel the ② strips
 *   do — the two hard stops of the pin-in-slot register.
 * ──────────────────────────────────────────────────────────────────────────── */
function buildMagicShutter(params, defaults, paperSize, driveRaw) {
  const slider = {
    label: '손잡이 밀기 (①↔②)',
    min: 0, max: 100, step: 1, defaultValue: 0,
    format: (v) => `${Math.round(v)}%`,
  };
  const drive = driveRaw ?? slider.defaultValue;
  const L = MAGIC_SHUTTER_LIMITS;
  const geo = resolveMagicShutter({
    paperSize,
    windowWidth: params.windowWidth ?? defaults.windowWidth,
    windowHeight: params.windowHeight ?? defaults.windowHeight,
    pitch: params.pitch ?? defaults.pitch,
    grip: params.grip ?? defaults.grip,
  });
  const paper = PAPER_SIZES[paperSize] || PAPER_SIZES.A4;

  // Card face = upper half sheet; local y ∈ [0, spineY] matches sheet mm.
  const W = paper.width;
  const H = geo.spineY;
  const u = (drive / 100) * geo.travel;

  const PX = 330 / (W + geo.gripLen + geo.travel);
  const px = (mm) => mm * PX;

  const sliderX = geo.sliderRestX + u;           // slider left edge, world x
  const sliderTopY = geo.windowY0 - geo.coverPadY;
  const gy0 = (geo.sliderH - geo.gripH) / 2;     // grip top, slider-local

  // Fixed stop-pin: the resolver's register x (slot bottoms on it at u=0 / u=travel).
  const pinX = geo.pinCx;
  const slotWorldY = sliderTopY + geo.stopZoneCy;

  // Front-face guide rows (same rows the flat pattern prints as glue targets).
  const topGuideY = sliderTopY - L.RET_GAP - L.RET_W;
  const botGuideY = geo.windowY0 + geo.winH + L.STOP_ZONE + L.RET_GAP;
  const guideX = geo.sliderRestX - L.GLUE_END;

  // Picture strips on the slider: local column k over the window band.
  // Odd k = ① (under the gaps at u=0), even k = ② (revealed at u=travel).
  const strips = [];
  for (let k = 0; k < geo.cols; k += 1) {
    const isOne = k % 2 === 1;
    strips.push(
      <span
        key={`strip-${k}`}
        style={{
          position: 'absolute',
          left: px(geo.coverPad + k * geo.pitch),
          top: px(geo.coverPadY),
          width: px(geo.pitch),
          height: px(geo.winH),
          background: isOne ? 'rgba(245, 158, 11, 0.9)' : 'rgba(59, 130, 246, 0.9)',
        }}
      />,
    );
  }

  // Card-front pieces: 4 frame bands + the grille bars (even window columns).
  // The gaps between bars are truly empty, so the slider strips show through.
  const facePiece = (key, x, y, w, h) => (
    <div
      key={key}
      className="preview3d-flat-card"
      style={{ left: px(x), top: px(y), width: px(w), height: px(h) }}
    />
  );
  const frame = [
    facePiece('band-top', 0, 0, W, geo.windowY0),
    facePiece('band-bot', 0, geo.windowY0 + geo.winH, W, H - geo.windowY0 - geo.winH),
    facePiece('band-left', 0, geo.windowY0, geo.windowX0, geo.winH),
    facePiece('band-right', geo.windowX0 + geo.winW, geo.windowY0, W - geo.windowX0 - geo.winW, geo.winH),
  ];
  for (let k = 0; k < geo.cols; k += 2) {
    frame.push(facePiece(`bar-${k}`, geo.windowX0 + k * geo.pitch, geo.windowY0, geo.pitch, geo.winH));
  }

  const guide = (y, key) => (
    <div
      key={key}
      className="preview3d-flat-retainer"
      style={{
        left: px(guideX),
        top: px(y),
        width: px(geo.guideLen),
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
      {/* ── BACK: guide bridges + fixed stop-pin ── */}
      {guide(topGuideY, 'guide-top')}
      {guide(botGuideY, 'guide-bot')}
      <div
        className="preview3d-flat-retainer"
        style={{
          left: px(pinX - L.PIN_FOOT / 2),
          top: px(slotWorldY - geo.stopSlotH / 2),
          width: px(L.PIN_FOOT),
          height: px(geo.stopSlotH),
          background: 'rgba(100, 116, 139, 0.95)',
          transform: `translateZ(${-1.5 * Z_STEP}px)`,
        }}
      />
      <Tag side="back" x={px(guideX + geo.guideLen / 2)} y={px(topGuideY - 5)}>위 안내 다리 (뒷면 · 양 끝만 풀칠)</Tag>
      <Tag side="back" x={px(guideX + geo.guideLen / 2)} y={px(botGuideY + L.RET_W + 5)}>아래 안내 다리 + 멈춤 핀</Tag>
      <Tag side="back" x={px(pinX)} y={px(slotWorldY + geo.stopSlotH + 4)}>멈춤 핀 ⇄ 슬롯 (딱 한 칸만 이동)</Tag>

      {/* ── Slider sheet behind the card (grip pokes out the right edge) ── */}
      <div
        className="preview3d-flat-strip"
        style={{
          left: px(sliderX),
          top: px(sliderTopY),
          width: px(geo.sliderW),
          height: px(geo.sliderH),
          background: 'rgba(248, 250, 252, 0.95)',
          transform: `translateZ(${-Z_STEP}px)`,
        }}
      >
        {strips}
        <div
          className="preview3d-flat-grip"
          style={{ left: px(geo.sliderW), top: px(gy0), width: px(geo.gripLen), height: px(geo.gripH) }}
        />
        <div
          className="preview3d-flat-slot"
          style={{
            left: px(geo.stopSlotCx - geo.stopSlotLen / 2),
            top: px(geo.stopZoneCy - geo.stopSlotH / 2),
            width: px(geo.stopSlotLen),
            height: px(geo.stopSlotH),
          }}
        />
      </div>
      <Tag side="back" x={px(sliderX + geo.sliderW / 2)} y={px(sliderTopY - 5)}>슬라이더 (① 노랑 / ② 파랑 줄무늬)</Tag>

      {/* ── FRONT: frame bands + picket grille bars ── */}
      {frame}
      <Tag x={px(geo.windowCx)} y={px(geo.windowY0 - 6)}>빗살 창문 (살은 자르지 않음)</Tag>
      <Tag x={px(sliderX + geo.sliderW + geo.gripLen / 2)} y={px(sliderTopY + gy0 - 6)}>손잡이 ↔ 밀기</Tag>
    </div>
  );

  const state =
    u < geo.travel * 0.25 ? '그림 ① 표시' : u > geo.travel * 0.75 ? '그림 ② 표시' : '전환 중…';
  return {
    node,
    readout: `손잡이 ${u.toFixed(1)} / ${geo.travel}mm · ${state} · 창문 ${geo.winW}×${geo.winH}mm · 세로살 ${geo.cols}칸(살폭 ${geo.pitch}mm)`,
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
  'gate-curtain': buildGateCurtain,
  'magic-shutter': buildMagicShutter,
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
