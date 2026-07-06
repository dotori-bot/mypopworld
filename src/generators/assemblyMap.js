/**
 * @fileoverview "조립 배치도" page for multi-mechanism cards: one base-card
 * sheet showing, for every element, WHERE on the spine its glued footprint
 * lands (numbered ①②③ to match the per-element template page titles).
 *
 * The footprints come from compatibility.spineFootprint — the same resolver
 * geometry the print generators clamp with — so the drawn rectangles match
 * the real glue areas, not eyeballed boxes.
 *
 * @module generators/assemblyMap
 */

import { PRINT } from './constants.js';
import { createTemplate, addRect, addText } from './svgBuilder.js';
import { getMechanism } from './registry.js';
import { spineFootprint } from './compatibility.js';

export const CIRCLED_NUMBERS = ['①', '②', '③', '④', '⑤'];

const FOOTPRINT_STYLE_COLOR = { stroke: '#7c5cff', strokeWidth: 0.5, dasharray: '3 2', fill: 'rgba(124, 92, 255, 0.08)' };
const FOOTPRINT_STYLE_BW = { stroke: '#444444', strokeWidth: 0.5, dasharray: '3 2', fill: 'rgba(0, 0, 0, 0.05)' };

/**
 * @param {Array} elements - normalized element list (cardModel.getElements)
 * @param {'A4'|'LETTER'} paperSize
 * @param {'color'|'bw'} colorMode
 * @param {string} [theme]
 * @returns {SVGSVGElement}
 */
export function renderAssemblyMap(elements, paperSize, colorMode, theme) {
  const { svg, paper, spineY } = createTemplate(paperSize, colorMode);
  const style = colorMode === 'bw' ? FOOTPRINT_STYLE_BW : FOOTPRINT_STYLE_COLOR;
  const cx = paper.width / 2;

  addText(
    svg,
    cx,
    PRINT.MARGIN + 8,
    `[ ${theme || '나만의 카드'} ] 조립 배치도 — 번호 부품을 표시된 자리에 붙이세요`,
    5,
    'middle',
  );

  let noteY = paper.height - PRINT.MARGIN - 16;
  elements.forEach((el, i) => {
    const no = CIRCLED_NUMBERS[i] || `(${i + 1})`;
    const labelKo = getMechanism(el.mechanism)?.labelKo || el.mechanism;
    const fp = spineFootprint(el, paperSize);

    if (!fp) {
      // Flat element: its own front page IS the base card — say so instead
      // of drawing a fake footprint.
      addText(svg, cx, noteY, `${no} ${labelKo}: 이 장치의 앞면 카드가 베이스입니다. 책형 부품을 그 앞면의 표시 위치에 붙이세요.`, 3, 'middle');
      noteY += 6;
      return;
    }

    const off = el.placement?.spineOffset || 0;
    const x = cx + off - fp.width / 2;
    const y = spineY - fp.halfDepth;
    addRect(svg, x, y, fp.width, fp.halfDepth * 2, style);
    addText(svg, cx + off, spineY - fp.halfDepth - 3, `${no} ${labelKo}`, 3.5, 'middle');
    addText(svg, cx + off, spineY + fp.halfDepth + 5, `중심에서 ${off >= 0 ? '+' : ''}${Math.round(off)}mm`, 2.5, 'middle');
  });

  addText(
    svg,
    cx,
    paper.height - PRINT.MARGIN - 4,
    '점선 상자 = 각 부품의 풀칠 영역(척추 기준). 부품 도안 페이지의 번호와 맞춰 조립하세요.',
    3,
    'middle',
  );

  return svg;
}
