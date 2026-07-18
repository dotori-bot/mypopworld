import React, { useState } from 'react';
import { Wrench, X, MessageCircle } from 'lucide-react';
import { getMechanism } from '../../generators/registry';
import { getEditHotspots } from '../../generators/editHotspots';
import { clamp } from '../../utils/math';
import '../../styles/partEdit.css';

/**
 * Absolutely-positioned overlay of 🔧 wrench markers on the printed design.
 * Each marker sits over an editable part (in sheet-mm → % of the paper box) and
 * opens a compact editor for that part's parameters, or hands a scoped question
 * to the chat. Rendered on top of the `.svg-paper` element in SVGPreview.
 *
 * @param {object} props
 * @param {{ mechanism?: string, params?: object }} props.element  current element
 * @param {{ width:number, height:number }} props.paper            paper size (mm)
 * @param {'A4'|'LETTER'} props.paperSize
 * @param {'color'|'bw'} props.colorMode
 * @param {string} [props.theme]
 * @param {(patch: object) => void} props.onPatch     merge a param patch into the element
 * @param {(part: object) => void} props.onDiscuss    start a scoped chat about the part
 */
export default function PartEditOverlay({ element, paper, paperSize, colorMode, theme, onPatch, onDiscuss }) {
  const [openId, setOpenId] = useState(null);
  const mech = getMechanism(element?.mechanism);
  if (!mech) return null;

  let hotspots = [];
  try {
    hotspots = getEditHotspots(element, paperSize, colorMode, theme);
  } catch {
    hotspots = [];
  }
  if (hotspots.length === 0) return null;

  const schema = mech.paramSchema || [];
  const shown = { ...mech.defaultParams, ...(element.params || {}) };
  const fieldByKey = Object.fromEntries(schema.map((f) => [f.key, f]));

  const pct = (mm, span) => `${clamp((mm / span) * 100, 0, 100)}%`;

  const renderControl = (field) => {
    if (!field) return null;
    if (field.type === 'enum') {
      const current = shown[field.key] ?? field.options?.[0]?.value;
      return (
        <div className="pe-control" key={field.key}>
          <div className="pe-control-label">{field.labelKo}</div>
          <div className="pe-enum">
            {(field.options || []).map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={`pe-enum-btn${current === opt.value ? ' is-active' : ''}`}
                onClick={() => onPatch({ [field.key]: opt.value })}
              >
                {opt.labelKo}
              </button>
            ))}
          </div>
        </div>
      );
    }
    if (field.type === 'group') {
      // Nested groups (rare) aren't inline-editable here — point to the chat.
      return (
        <div className="pe-control" key={field.key}>
          <div className="pe-control-label">{field.labelKo}</div>
          <div className="pe-hint">이 항목은 채팅으로 요청해 바꿔보세요.</div>
        </div>
      );
    }
    let lim;
    try {
      lim = field.limits(shown, paperSize);
    } catch {
      lim = { min: 0, max: 100 };
    }
    const val = typeof shown[field.key] === 'number' ? shown[field.key] : lim.min;
    return (
      <div className="pe-control" key={field.key}>
        <div className="pe-control-label">
          <span>{field.labelKo}</span>
          <span className="pe-control-value">
            {field.step < 1 ? val.toFixed(2) : Math.round(val)}
            {field.unit}
          </span>
        </div>
        <input
          className="pe-range"
          type="range"
          min={lim.min}
          max={lim.max}
          step={field.step}
          value={clamp(val, lim.min, lim.max)}
          onChange={(e) => onPatch({ [field.key]: Number(e.target.value) })}
          aria-label={field.labelKo}
        />
      </div>
    );
  };

  return (
    <div className="pe-overlay">
      {hotspots.map((spot) => {
        const left = pct(spot.xMm, paper.width);
        const top = pct(spot.yMm, paper.height);
        const rightHalf = spot.xMm > paper.width / 2;
        const isOpen = openId === spot.id;
        return (
          <div key={spot.id} className="pe-anchor" style={{ left, top }}>
            <button
              type="button"
              className={`pe-wrench${isOpen ? ' is-open' : ''}`}
              title={`${spot.labelKo} 편집`}
              aria-label={`${spot.labelKo} 편집`}
              aria-expanded={isOpen}
              onClick={() => setOpenId(isOpen ? null : spot.id)}
            >
              <Wrench size={14} />
            </button>
            {isOpen && (
              <div className={`pe-popover ${rightHalf ? 'to-left' : 'to-right'}`} role="dialog">
                <div className="pe-popover-head">
                  <strong>{spot.labelKo}</strong>
                  <button type="button" className="pe-close" aria-label="닫기" onClick={() => setOpenId(null)}>
                    <X size={14} />
                  </button>
                </div>
                {spot.tip && <div className="pe-hint">{spot.tip}</div>}
                {spot.paramKeys.map((k) => renderControl(fieldByKey[k]))}
                <button
                  type="button"
                  className="pe-discuss"
                  onClick={() => { onDiscuss(spot); setOpenId(null); }}
                >
                  <MessageCircle size={14} /> 채팅으로 바꾸기
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
