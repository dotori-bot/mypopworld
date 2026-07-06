import React, { useState } from 'react';
import useCardStore from '../../store/useCardStore';
import { getMechanism } from '../../generators/registry';
import MechanismPicker from './MechanismPicker';
import ParamPanel from './ParamPanel';
import '../../styles/expert.css';

/**
 * Expert-mode left panel: theme text input + direct mechanism picker + full
 * parameter editor. Writes the same v1 cardParams shape the AI chat flow
 * produces ({ mechanism, theme, params }), so the entire preview/PDF pipeline
 * works unmodified.
 */
export default function ExpertPanel() {
  const { cardParams, setCardParams } = useCardStore();
  const [theme, setTheme] = useState(cardParams?.theme || '');
  const mech = getMechanism(cardParams?.mechanism);

  const applyTheme = () => {
    const t = theme.trim();
    if (cardParams && t && t !== cardParams.theme) {
      setCardParams({ ...cardParams, theme: t });
    }
  };

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

      <div className="expert-section">
        <h3 className="expert-section-title">메커니즘 선택</h3>
        <MechanismPicker theme={theme} />
      </div>

      {mech && (
        <div className="expert-section">
          <h3 className="expert-section-title">파라미터 — {mech.labelKo}</h3>
          <ParamPanel />
        </div>
      )}
    </div>
  );
}
