import React, { useState, useRef, useEffect } from 'react';
import useCardStore from '../../store/useCardStore';
import { getMechanism } from '../../generators/registry';
import { validatePrintability } from '../../generators/validation';
import { clamp } from '../../utils/math';

const COMMIT_DELAY_MS = 150;

const fmt = (v, field) =>
  typeof v === 'number' ? (field.step < 1 ? v.toFixed(2) : Math.round(v)) : '—';

/**
 * Expert-mode parameter editor. Renders one slider + number-input pair per
 * paramSchema field of the selected mechanism. Values shown are the merged
 * `{...defaultParams, ...cardParams.params}` plus any not-yet-committed edits;
 * edits are committed to the store (→ 2D/3D regeneration) after a short
 * debounce so slider drags stay smooth.
 *
 * limits(params, paperSize) is re-evaluated on every render, so a change to
 * one parameter immediately tightens/loosens its dependents' slider ranges
 * (e.g. flap-clap: offset↑ → flapLength max↓).
 */
export default function ParamPanel() {
  const { cardParams, setCardParams, paperSize } = useCardStore();
  // Pending (uncommitted) full override object in cardParams.params shape.
  const [pending, setPending] = useState(null);
  const commitTimer = useRef(null);
  const mechanism = cardParams?.mechanism;

  // Switching mechanisms discards any in-flight edit of the previous one.
  useEffect(() => {
    setPending(null);
    clearTimeout(commitTimer.current);
  }, [mechanism]);
  useEffect(() => () => clearTimeout(commitTimer.current), []);

  const mech = getMechanism(mechanism);
  if (!cardParams || !mech) return null;
  const schema = mech.paramSchema || [];
  if (schema.length === 0) {
    return <div className="param-panel-empty">이 메커니즘은 조절할 수치 파라미터가 없습니다.</div>;
  }

  const overrides = { ...(cardParams.params || {}), ...(pending || {}) };
  const shown = { ...mech.defaultParams, ...overrides };

  const update = (patch) => {
    const next = { ...overrides, ...patch };
    setPending(next);
    clearTimeout(commitTimer.current);
    commitTimer.current = setTimeout(() => {
      setCardParams({ ...cardParams, params: next });
      setPending(null);
    }, COMMIT_DELAY_MS);
  };

  const warnings = validatePrintability({ ...cardParams, params: overrides }, paperSize);

  const renderNumberField = (field, value, onChange) => {
    let lim;
    try {
      lim = field.limits(shown, paperSize);
    } catch {
      lim = { min: 0, max: 100 };
    }
    const sliderValue = clamp(typeof value === 'number' ? value : lim.min, lim.min, lim.max);
    return (
      <div className="param-field" key={field.key}>
        <div className="fold-slider-labels">
          <span>{field.labelKo}</span>
          <span>
            {fmt(value, field)}
            {field.unit}
          </span>
        </div>
        <div className="param-field-row">
          <input
            className="custom-range"
            type="range"
            min={lim.min}
            max={lim.max}
            step={field.step}
            value={sliderValue}
            onChange={(e) => onChange(Number(e.target.value))}
            aria-label={field.labelKo}
          />
          <input
            className="param-number"
            type="number"
            min={lim.min}
            max={lim.max}
            step={field.step}
            value={typeof value === 'number' ? value : ''}
            onChange={(e) => {
              const v = Number(e.target.value);
              if (!Number.isNaN(v)) onChange(v);
            }}
            aria-label={`${field.labelKo} 직접 입력`}
          />
        </div>
      </div>
    );
  };

  const renderField = (field) => {
    if (field.type === 'group') {
      const groupVal = shown[field.key];
      return (
        <div className="param-group" key={field.key}>
          <label className="fold-slider-labels param-group-toggle">
            <input
              type="checkbox"
              checked={!!groupVal}
              onChange={(e) => update({ [field.key]: e.target.checked ? { ...field.enableValue } : null })}
            />
            <span>{field.labelKo}</span>
          </label>
          {groupVal &&
            field.children.map((child) =>
              renderNumberField(child, groupVal[child.key], (v) =>
                update({ [field.key]: { ...groupVal, [child.key]: v } }),
              ),
            )}
        </div>
      );
    }
    return renderNumberField(field, shown[field.key], (v) => update({ [field.key]: v }));
  };

  return (
    <div className="param-panel">
      {schema.map(renderField)}
      {warnings.length > 0 && (
        <div className="param-warnings" role="alert">
          {warnings.map((w, i) => (
            <div key={i} className="param-warning">
              ⚠️ {w.messageKo}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
