/**
 * @fileoverview Combination rules for multi-mechanism cards.
 *
 * Pure functions over registry sceneTypes + resolver geometry — no UI, no
 * store. The MVP rule set errs on the side of "will physically assemble":
 *
 *  1. At most MAX_ELEMENTS mechanisms per card.
 *  2. SOLO_ONLY mechanisms can't combine with anything (straw-rocket isn't
 *     even a card; auto-slide-window consumes the whole front face as its
 *     frame + drive strip).
 *  3. Two flat mechanisms never combine (each one owns the card face and its
 *     behind-the-face layer stack).
 *  4. book + book combines freely PROVIDED their spine-direction occupation
 *     intervals (from resolver footprints, positioned by placement.spineOffset)
 *     don't overlap and stay inside the printable spine span.
 *  5. book + flat starts as a whitelist (FLAT_COMBINABLE × exactly one book);
 *     everything else is blocked until proven to assemble.
 *
 * @module generators/compatibility
 */

import { PAPER_SIZES, CARD_SIZES, PRINT } from './constants.js';
import { getMechanism } from './registry.js';
import { clamp, degToRad } from '../utils/math.js';
import { vFoldLimits } from './vfold.js';
import { resolveFlapClapGeometry } from './flapClap.js';
import { resolveAccordionGeometry } from './accordionPopup.js';
import { resolveLayeredStageGeometry } from './layeredStage.js';
import { resolveSpiralGeometry } from './spiralSpring.js';

export const MAX_ELEMENTS = 3;
export const SOLO_ONLY = new Set(['straw-rocket', 'auto-slide-window']);
export const FLAT_COMBINABLE = new Set(['pull-tab', 'rising-slide']);

const num = (v, d) => (typeof v === 'number' && Number.isFinite(v) ? v : d);

/**
 * Spine-direction footprint of one BOOK element: how much of the fold line
 * it occupies (width, mm) and roughly how far it reaches away from the spine
 * (halfDepth, mm — illustrative, used by the assembly map, not by the
 * overlap rule). Widths come from the same resolvers the print generators
 * use, so the interval check matches what actually lands on paper.
 *
 * @returns {{ width: number, halfDepth: number } | null} null = unknown/flat
 */
export function spineFootprint(element, paperSize) {
  const mech = getMechanism(element?.mechanism);
  if (!mech || mech.sceneType !== 'book') return null;
  const p = { ...mech.defaultParams, ...element.params };
  const card = CARD_SIZES[paperSize] || CARD_SIZES.A4;

  switch (element.mechanism) {
    case 'v-fold': {
      const lim = vFoldLimits(num(p.angle, 45), card.height, paperSize);
      const L = clamp(num(p.armLength, 40), lim.armMin, lim.armMax);
      const halfSpan = L * Math.cos(degToRad(lim.angle)) + 8; // + glue tab
      return { width: 2 * halfSpan, halfDepth: L * Math.sin(degToRad(lim.angle)) };
    }
    case 'box-popup':
      return { width: num(p.width, 40) + 12, halfDepth: num(p.height, 30) };
    case 'parallel-fold':
      return { width: num(p.width, 80), halfDepth: num(p.depth, 30) };
    case 'flap-clap': {
      const geo = resolveFlapClapGeometry({ ...p, paperSize });
      return { width: 2 * geo.b + 16, halfDepth: geo.a + geo.h };
    }
    case 'accordion': {
      const geo = resolveAccordionGeometry({ ...p, paperSize });
      return { width: geo.wallHeight + 8, halfDepth: geo.a + geo.tabDepth };
    }
    case 'layered-stage': {
      const geo = resolveLayeredStageGeometry({ ...p, paperSize });
      const widest = Math.max(...geo.layers.map((l) => l.width));
      return { width: widest + 2 * geo.tabW, halfDepth: geo.cumulativeDepth };
    }
    case 'spiral-spring': {
      const geo = resolveSpiralGeometry({ ...p, paperSize });
      return { width: 2 * geo.rOuter + 12, halfDepth: geo.a };
    }
    default:
      // Unknown book mechanism: assume a generous footprint so the overlap
      // rule stays conservative instead of silently permissive.
      return { width: 80, halfDepth: 40 };
  }
}

/** The element's occupied interval along the spine, centred on spineOffset. */
export function spineInterval(element, paperSize) {
  const fp = spineFootprint(element, paperSize);
  if (!fp) return null;
  const off = num(element.placement?.spineOffset, 0);
  return { lo: off - fp.width / 2, hi: off + fp.width / 2, width: fp.width };
}

/**
 * @param {Array} elements - normalized element list (see cardModel.getElements)
 * @param {'A4'|'LETTER'} paperSize
 * @returns {{ ok: boolean, errors: string[], warnings: string[] }}
 */
export function validateCombination(elements, paperSize) {
  const errors = [];
  const warnings = [];
  const label = (el) => getMechanism(el.mechanism)?.labelKo || el.mechanism;

  if (elements.length > MAX_ELEMENTS) {
    errors.push(`한 카드에는 최대 ${MAX_ELEMENTS}개의 메커니즘만 조합할 수 있습니다.`);
  }

  if (elements.length > 1) {
    for (const el of elements) {
      if (SOLO_ONLY.has(el.mechanism)) {
        errors.push(`'${label(el)}'은(는) 카드 전체를 사용하는 구조라 다른 메커니즘과 조합할 수 없습니다.`);
      }
    }

    const flats = elements.filter((el) => getMechanism(el.mechanism)?.sceneType === 'flat');
    const books = elements.filter((el) => getMechanism(el.mechanism)?.sceneType === 'book');

    if (flats.length >= 2) {
      errors.push('평면형 메커니즘은 카드 앞면과 뒷면 층을 통째로 사용하므로 두 개를 한 카드에 넣을 수 없습니다.');
    } else if (flats.length === 1) {
      const flat = flats[0];
      if (!FLAT_COMBINABLE.has(flat.mechanism)) {
        errors.push(`'${label(flat)}'은(는) 아직 책형 팝업과의 조합이 검증되지 않았습니다. (조합 가능 평면형: 풀탭, 빛줄기 상승 슬라이드)`);
      } else if (books.length > 1) {
        errors.push('평면형 장치와 조합할 때는 책형 팝업을 1개만 넣을 수 있습니다.');
      }
    }

    // Rule 4: pairwise spine-interval overlap among book elements.
    const intervals = books
      .map((el) => ({ el, iv: spineInterval(el, paperSize) }))
      .filter((x) => x.iv);
    for (let i = 0; i < intervals.length; i++) {
      for (let j = i + 1; j < intervals.length; j++) {
        const a = intervals[i];
        const b = intervals[j];
        if (a.iv.lo < b.iv.hi && b.iv.lo < a.iv.hi) {
          errors.push(
            `'${label(a.el)}'과(와) '${label(b.el)}'의 풀칠 영역이 척추 위에서 겹칩니다. 배치 위치(spineOffset)를 벌려주세요.`,
          );
        }
      }
    }

    // Printable spine span check (warn — the generators will clamp/clip).
    const paper = PAPER_SIZES[paperSize] || PAPER_SIZES.A4;
    const half = paper.width / 2 - PRINT.MARGIN;
    for (const { el, iv } of intervals) {
      if (iv.lo < -half || iv.hi > half) {
        warnings.push(`'${label(el)}'이(가) 인쇄 가능 폭을 벗어납니다. 배치 위치를 카드 안쪽으로 옮겨주세요.`);
      }
    }
  }

  return { ok: errors.length === 0, errors, warnings };
}

/**
 * Sanitize an AI-authored v2 (combination) cardParams before it reaches the
 * store. Gemini is prompted with the combination rules, but an LLM will
 * still occasionally emit invalid JSON — unknown mechanisms, solo-only
 * mechanisms in a combo, two flats, overlapping placements. This never
 * rejects: it repairs what it can (drop invalid members, re-space overlapping
 * book footprints left-to-right) and degrades the rest (a combo that can't
 * be repaired collapses to a v1 single-mechanism card of its first element),
 * so the child always gets a printable card.
 *
 * v1 input (no `elements`) is returned untouched.
 *
 * @param {object} cardParams - parsed AI JSON
 * @param {'A4'|'LETTER'} paperSize
 * @returns {object|null} safe cardParams (v1 or v2), or null if nothing usable
 */
export function sanitizeAiCombination(cardParams, paperSize) {
  if (!cardParams || !Array.isArray(cardParams.elements)) return cardParams;
  const { elements: rawElements, mechanism: _m, params: _p, ...rest } = cardParams;

  // Keep only known mechanisms, normalize shape, cap the count.
  let els = rawElements
    .filter((el) => getMechanism(el?.mechanism))
    .slice(0, MAX_ELEMENTS)
    .map((el, i) => ({
      id: `ai-${i + 1}`,
      mechanism: el.mechanism,
      params: el.params && typeof el.params === 'object' ? el.params : {},
      placement: { spineOffset: num(el.placement?.spineOffset, 0) },
    }));

  // Structural repairs (only meaningful for actual combos).
  if (els.length > 1) {
    els = els.filter((el) => !SOLO_ONLY.has(el.mechanism));
  }
  if (els.length > 1) {
    const isFlat = (el) => getMechanism(el.mechanism)?.sceneType === 'flat';
    const flats = els.filter((el) => isFlat(el) && FLAT_COMBINABLE.has(el.mechanism));
    const books = els.filter((el) => !isFlat(el));
    // Non-whitelisted flats are dropped by construction above; at most one
    // whitelisted flat, and with a flat present at most one book.
    els = flats.length > 0 ? [...books.slice(0, 1), ...flats.slice(0, 1)] : books;
  }

  // Placement repair: lay overlapping/colliding book footprints out
  // left-to-right with a 4mm gap, honoring requested offsets when they fit.
  if (els.length > 1) {
    const paper = PAPER_SIZES[paperSize] || PAPER_SIZES.A4;
    const half = paper.width / 2 - PRINT.MARGIN;
    const boxed = els
      .map((el) => ({ el, fp: spineFootprint(el, paperSize) }))
      .filter((b) => b.fp)
      .sort((a, b) => a.el.placement.spineOffset - b.el.placement.spineOffset);
    let prevHi = -Infinity;
    for (const b of boxed) {
      const w = b.fp.width;
      let off = Math.max(b.el.placement.spineOffset, prevHi === -Infinity ? -half + w / 2 : prevHi + 4 + w / 2);
      off = Math.min(off, half - w / 2);
      b.el.placement.spineOffset = Math.round(off);
      prevHi = off + w / 2;
    }
  }

  // Last resort: if the repaired combo still doesn't validate, degrade by
  // dropping trailing elements until it does.
  while (els.length > 1 && !validateCombination(els, paperSize).ok) {
    els = els.slice(0, -1);
  }

  if (els.length === 0) return null;
  if (els.length === 1) {
    // Collapse to v1 so the card is byte-compatible with the classic flow.
    return { ...rest, version: undefined, mechanism: els[0].mechanism, params: els[0].params };
  }
  return { ...rest, version: 2, elements: els };
}

/**
 * Can `mechanismId` be added to the current element list? Used to disable
 * picker cards. Simulates the add and reuses validateCombination, minus the
 * overlap rule (the user can still fix placement after adding).
 */
export function canAddMechanism(mechanismId, elements, paperSize) {
  if (elements.length >= MAX_ELEMENTS) return { ok: false, reason: `최대 ${MAX_ELEMENTS}개까지 조합할 수 있습니다.` };
  const trial = [
    ...elements,
    { id: '__trial__', mechanism: mechanismId, params: {}, placement: { spineOffset: 0 } },
  ];
  const res = validateCombination(trial, paperSize);
  // Ignore overlap/span messages — those are placement problems, fixable
  // after adding; only structural incompatibilities block the add.
  const structural = res.errors.filter((m) => !m.includes('겹칩니다'));
  return structural.length === 0 ? { ok: true } : { ok: false, reason: structural[0] };
}
