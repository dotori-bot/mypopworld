import React, { useState, useEffect } from 'react';
import useCardStore from '../../store/useCardStore';
import { getMechanism, MECHANISM_REGISTRY } from '../../generators/registry';
import { getElements, isMultiElement, withElements, makeElementId } from '../../store/cardModel';
import {
  validateCombination,
  canAddMechanism,
  spineFootprint,
  spineInterval,
  MAX_ELEMENTS,
} from '../../generators/compatibility';
import { PAPER_SIZES, PRINT } from '../../generators/constants';
import { CIRCLED_NUMBERS } from '../../generators/assemblyMap';
import MechanismPicker from './MechanismPicker';
import ParamPanel from './ParamPanel';
import PlacementCanvas from './PlacementCanvas';
import '../../styles/expert.css';

/**
 * Expert-mode left panel: theme input, element list (add/remove/select up to
 * MAX_ELEMENTS mechanisms per card), per-element parameter editor, spine
 * placement slider for combined book popups, and combination validation.
 *
 * Data-model rule: a single mechanism stays in the v1 cardParams shape
 * (identical to what the AI chat emits), so that path never regresses; the
 * moment a second mechanism is added the card switches to the v2
 * `{ elements: [...] }` shape, which every consumer reads through
 * cardModel.getElements().
 */
export default function ExpertPanel() {
  const { cardParams, setCardParams, paperSize } = useCardStore();
  const [theme, setTheme] = useState(cardParams?.theme || '');
  const [selectedId, setSelectedId] = useState(null);
  const [showPicker, setShowPicker] = useState(false);

  const elements = getElements(cardParams);
  const multi = elements.length > 1;
  const selected = elements.find((el) => el.id === selectedId) || elements[0] || null;

  useEffect(() => {
    if (selected && selectedId !== selected.id) setSelectedId(selected.id);
  }, [selected, selectedId]);

  const applyTheme = () => {
    const t = theme.trim();
    if (cardParams && t && t !== cardParams.theme) {
      setCardParams({ ...cardParams, theme: t });
    }
  };

  const themeOrDefault = () => theme.trim() || '나만의 디자인';

  /** Place a new element just past the current elements' spine intervals. */
  const suggestSpineOffset = (mechanismId) => {
    const trial = { mechanism: mechanismId, params: {}, placement: { spineOffset: 0 } };
    const fp = spineFootprint(trial, paperSize);
    if (!fp) return 0; // flat element: spine placement is meaningless
    const his = elements
      .map((el) => spineInterval(el, paperSize))
      .filter(Boolean)
      .map((iv) => iv.hi);
    if (his.length === 0) return 0;
    const off = Math.max(...his) + 4 + fp.width / 2;
    const half = (PAPER_SIZES[paperSize] || PAPER_SIZES.A4).width / 2 - PRINT.MARGIN;
    return Math.round(Math.min(off, half - fp.width / 2));
  };

  const pickMechanism = (id) => {
    if (elements.length === 0) {
      // First mechanism → plain v1 card, byte-compatible with the AI flow.
      setCardParams({ mechanism: id, theme: themeOrDefault(), params: {} });
    } else {
      const newEl = {
        id: makeElementId(),
        mechanism: id,
        params: {},
        placement: { spineOffset: suggestSpineOffset(id) },
      };
      const base = isMultiElement(cardParams)
        ? cardParams
        : { ...cardParams, theme: cardParams.theme || themeOrDefault() };
      // Existing v1 element needs a real id once it has siblings.
      const current = elements.map((el) => (el.id === 'main' ? { ...el, id: makeElementId() } : el));
      setCardParams(withElements(base, [...current, newEl]));
      setSelectedId(newEl.id);
    }
    setShowPicker(false);
  };

  const removeElement = (id) => {
    const rest = elements.filter((el) => el.id !== id);
    if (rest.length === 0) {
      setCardParams(null);
      setSelectedId(null);
    } else {
      setCardParams(withElements(cardParams, rest));
      if (selectedId === id) setSelectedId(rest[0].id);
    }
  };

  const commitElement = (id, patch) => {
    if (!isMultiElement(cardParams)) {
      // v1 single-mechanism card: params live at the top level.
      if (patch.params) setCardParams({ ...cardParams, params: patch.params });
      return;
    }
    setCardParams(
      withElements(
        cardParams,
        elements.map((el) => (el.id === id ? { ...el, ...patch, placement: { ...el.placement, ...patch.placement } } : el)),
      ),
    );
  };

  const combo = multi ? validateCombination(elements, paperSize) : { ok: true, errors: [], warnings: [] };

  const disabledReasons = {};
  if (elements.length > 0) {
    for (const id of Object.keys(MECHANISM_REGISTRY)) {
      const res = canAddMechanism(id, elements, paperSize);
      if (!res.ok) disabledReasons[id] = res.reason;
    }
  }

  const half = (PAPER_SIZES[paperSize] || PAPER_SIZES.A4).width / 2 - PRINT.MARGIN;
  const selectedMech = selected ? getMechanism(selected.mechanism) : null;
  const selectedIsBook = selectedMech?.sceneType === 'book';

  return (
    <div className="expert-panel">
      <div className="expert-section">
        <h3 className="expert-section-title">테마 (장식 그림 주제)</h3>
        <input
          className="expert-theme-input"
          type="text"
          value={theme}
          placeholder="예: 바닷속 상어, 공룡 생일 카드"
          onChange={(e) => setTheme(e.target.value)}
          onBlur={applyTheme}
          onKeyDown={(e) => {
            if (e.key === 'Enter') applyTheme();
          }}
        />
      </div>

      {elements.length === 0 ? (
        <div className="expert-section">
          <h3 className="expert-section-title">메커니즘 선택</h3>
          <MechanismPicker onPick={pickMechanism} />
        </div>
      ) : (
        <div className="expert-section">
          <div className="expert-section-head">
            <h3 className="expert-section-title">카드 구성 ({elements.length}/{MAX_ELEMENTS})</h3>
            {elements.length < MAX_ELEMENTS && (
              <button type="button" className="expert-add-btn" onClick={() => setShowPicker((v) => !v)}>
                {showPicker ? '닫기' : '+ 메커니즘 추가'}
              </button>
            )}
          </div>

          <div className="element-list">
            {elements.map((el, i) => {
              const mech = getMechanism(el.mechanism);
              return (
                <div
                  key={el.id}
                  className={`element-row ${selected?.id === el.id ? 'active' : ''}`}
                  onClick={() => setSelectedId(el.id)}
                >
                  <span className="element-no">{CIRCLED_NUMBERS[i] || i + 1}</span>
                  <span className="element-name">{mech?.labelKo || el.mechanism}</span>
                  <button
                    type="button"
                    className="element-remove"
                    aria-label={`${mech?.labelKo || el.mechanism} 삭제`}
                    onClick={(e) => {
                      e.stopPropagation();
                      removeElement(el.id);
                    }}
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>

          {showPicker && (
            <MechanismPicker onPick={pickMechanism} disabledReasons={disabledReasons} />
          )}

          {multi && elements.some((el) => getMechanism(el.mechanism)?.sceneType === 'book') && (
            <PlacementCanvas
              elements={elements}
              paperSize={paperSize}
              selectedId={selected?.id}
              onSelect={setSelectedId}
              onMove={(id, spineOffset) => commitElement(id, { placement: { spineOffset } })}
            />
          )}

          {(combo.errors.length > 0 || combo.warnings.length > 0) && (
            <div className="param-warnings" role="alert">
              {combo.errors.map((m, i) => (
                <div key={`e${i}`} className="param-warning param-error">⛔ {m}</div>
              ))}
              {combo.warnings.map((m, i) => (
                <div key={`w${i}`} className="param-warning">⚠️ {m}</div>
              ))}
            </div>
          )}
        </div>
      )}

      {selected && (
        <div className="expert-section">
          <h3 className="expert-section-title">
            파라미터 — {selectedMech?.labelKo || selected.mechanism}
          </h3>

          {multi && selectedIsBook && (
            <div className="param-field">
              <div className="fold-slider-labels">
                <span>배치 위치 (척추 중심 기준)</span>
                <span>{Math.round(selected.placement?.spineOffset || 0)}mm</span>
              </div>
              <input
                className="custom-range"
                type="range"
                min={-Math.round(half)}
                max={Math.round(half)}
                step="1"
                value={Math.round(selected.placement?.spineOffset || 0)}
                onChange={(e) =>
                  commitElement(selected.id, { placement: { spineOffset: Number(e.target.value) } })
                }
                aria-label="배치 위치"
              />
            </div>
          )}

          <ParamPanel
            element={selected}
            onCommit={(params) => commitElement(selected.id, { params })}
          />
        </div>
      )}
    </div>
  );
}
