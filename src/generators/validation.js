/**
 * @fileoverview Printability validation for expert-mode parameter editing.
 *
 * Third layer of the guard stack: paramSchema limits keep the UI inside
 * bounds (prevention), each generator clamps internally when rendering (the
 * final safety net), and this module NOTIFIES — it compares what the user
 * asked for against what the shared limits say will actually print, so an
 * out-of-range value (usually created indirectly, e.g. raising flap-clap's
 * `offset` after maxing out `flapLength`) surfaces as a banner instead of a
 * silently shrunken cut piece.
 *
 * @module generators/validation
 */

import { getMechanism } from './registry.js';

const fmt = (v, field) => `${field.step < 1 ? Number(v).toFixed(2) : Math.round(v)}${field.unit}`;

/**
 * @param {{ mechanism?: string, params?: object }} cardParams
 * @param {'A4'|'LETTER'} paperSize
 * @returns {Array<{ level: 'warn', messageKo: string }>}
 */
export function validatePrintability(cardParams, paperSize) {
  const mech = getMechanism(cardParams?.mechanism);
  if (!mech || !Array.isArray(mech.paramSchema)) return [];

  const params = { ...mech.defaultParams, ...cardParams.params };
  const issues = [];

  const checkField = (field, value) => {
    if (typeof value !== 'number' || !Number.isFinite(value)) return;
    let lim;
    try {
      lim = field.limits(params, paperSize);
    } catch {
      return; // a limits fn choking on partial input must never break the UI
    }
    if (value > lim.max) {
      issues.push({
        level: 'warn',
        messageKo: `${field.labelKo} ${fmt(value, field)} → ${paperSize} 한계 ${fmt(lim.max, field)}(으)로 줄여서 인쇄됩니다.`,
      });
    } else if (value < lim.min) {
      issues.push({
        level: 'warn',
        messageKo: `${field.labelKo} ${fmt(value, field)} → 최소값 ${fmt(lim.min, field)}(으)로 키워서 인쇄됩니다.`,
      });
    }
  };

  for (const field of mech.paramSchema) {
    if (field.type === 'group') {
      const groupVal = params[field.key];
      if (!groupVal) continue;
      for (const child of field.children) checkField(child, groupVal[child.key]);
    } else {
      checkField(field, params[field.key]);
    }
  }
  return issues;
}
