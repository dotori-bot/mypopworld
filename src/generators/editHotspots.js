/**
 * @fileoverview Edit "hotspots" for the preview's 🔧 wrench markers.
 *
 * Each mechanism's printable design has a few parts a user might want to tweak
 * (the window, the handle, the reveal style…). getEditHotspots() returns, for a
 * given element, a list of markers positioned in SHEET mm coordinates
 * (`xMm`/`yMm` over the full paper, matching the SVG viewBox) together with the
 * paramSchema keys that control that part. The preview overlays a wrench at each
 * marker; clicking it opens a compact editor for exactly those params — or hands
 * a scoped question to the chat ("이 부분을 바꿔줘").
 *
 * magic-shutter gets geometry-anchored markers (the mechanism this feature was
 * built around). Every other mechanism falls back to a simple stack of one
 * wrench per editable parameter along the sheet's left edge, so every design
 * still exposes the feature without hand-authoring anchors for all 17.
 *
 * @module generators/editHotspots
 */

import { getMechanism, buildElementParams } from './registry.js';
import { resolveMagicShutter } from './magicShutter.js';
import { PAPER_SIZES, PRINT } from './constants.js';

/** Trim the "(paramKey)" suffix many labels carry, for a compact marker label. */
function shortLabel(labelKo) {
  return String(labelKo || '').replace(/\s*\([^)]*\)\s*$/, '').trim() || labelKo;
}

/** Geometry-anchored markers for magic-shutter. */
function magicShutterHotspots(geo, paperSize) {
  const paper = PAPER_SIZES[paperSize] || PAPER_SIZES.A4;
  const spots = [
    {
      id: 'window', labelKo: '창 크기', xMm: geo.windowCx, yMm: geo.windowCy,
      paramKeys: ['windowWidth', 'windowHeight'],
      tip: '창문(그림이 바뀌는 부분)의 폭과 높이를 조절합니다.',
    },
    {
      id: 'shape', labelKo: '창 모양', xMm: geo.windowX0, yMm: geo.windowY0,
      paramKeys: ['windowShape'],
      tip: '창을 사각형 또는 원/타원으로 바꿉니다.',
    },
    {
      id: 'style', labelKo: '전환 방식', xMm: geo.windowCx, yMm: geo.windowY0,
      paramKeys: ['revealStyle'],
      tip: '빗살형(절반 보임)과 통째 전환형(창 전체가 바뀜) 중에서 고릅니다.',
    },
    {
      id: 'grip', labelKo: '손잡이',
      xMm: Math.min(geo.windowX0 + geo.winW + 7, paper.width - PRINT.MARGIN - 3),
      yMm: geo.windowCy,
      paramKeys: ['grip'],
      tip: '옆으로 튀어나온 손잡이의 길이를 조절합니다.',
    },
  ];
  if (geo.revealStyle !== 'swap') {
    spots.push({
      id: 'pitch', labelKo: '세로살 폭',
      xMm: geo.windowX0 + geo.pitch * 1.5, yMm: geo.windowCy,
      paramKeys: ['pitch'],
      tip: '빗살(살/틈)의 폭이자 손잡이 이동 거리입니다. (빗살형만)',
    });
  }
  return spots;
}

/**
 * @param {{ mechanism?: string, params?: object }} element
 * @param {'A4'|'LETTER'} paperSize
 * @param {'color'|'bw'} colorMode
 * @param {string} [theme]
 * @returns {Array<{ id:string, labelKo:string, xMm:number, yMm:number,
 *                   paramKeys:string[], tip?:string }>}
 */
export function getEditHotspots(element, paperSize, colorMode, theme) {
  const mech = getMechanism(element?.mechanism);
  if (!mech) return [];
  const schema = mech.paramSchema || [];
  if (schema.length === 0) return [];
  const params = buildElementParams(element, paperSize, colorMode, theme);

  if (element.mechanism === 'magic-shutter') {
    return magicShutterHotspots(resolveMagicShutter(params), paperSize);
  }

  // Generic fallback: one wrench per editable field, stacked down the left edge
  // of the card front (upper half of the sheet), clamped inside the trim.
  const paper = PAPER_SIZES[paperSize] || PAPER_SIZES.A4;
  const maxY = paper.height / 2 - PRINT.MARGIN;
  return schema.map((f, i) => ({
    id: f.key,
    labelKo: shortLabel(f.labelKo),
    xMm: PRINT.MARGIN + 10,
    yMm: Math.min(PRINT.MARGIN + 16 + i * 11, maxY),
    paramKeys: [f.key],
    tip: '이 값을 조절하거나, 채팅으로 바꿔달라고 요청할 수 있습니다.',
  }));
}
