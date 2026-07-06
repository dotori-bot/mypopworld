import React from 'react';
import useCardStore from '../../store/useCardStore';
import { MECHANISM_REGISTRY } from '../../generators/registry';

const SCENE_BADGE = {
  book: { label: '책형', title: '카드를 여닫는 동작으로 움직이는 팝업' },
  flat: { label: '평면형', title: '당기기/돌리기/넘기기 등으로 움직이는 장치' },
};

/**
 * Expert-mode mechanism grid — direct selection of any registered mechanism,
 * no AI in the loop. Selecting one resets params to the mechanism's defaults
 * (the ParamPanel then edits overrides on top of them).
 */
export default function MechanismPicker({ theme }) {
  const { cardParams, setCardParams } = useCardStore();
  const selected = cardParams?.mechanism;

  const pick = (id) => {
    setCardParams({
      mechanism: id,
      theme: (theme || '').trim() || '나만의 디자인',
      params: {},
    });
  };

  return (
    <div className="mechanism-grid" role="listbox" aria-label="메커니즘 선택">
      {Object.entries(MECHANISM_REGISTRY).map(([id, mech]) => {
        const badge = SCENE_BADGE[mech.sceneType] || SCENE_BADGE.book;
        return (
          <button
            key={id}
            type="button"
            role="option"
            aria-selected={selected === id}
            className={`mechanism-card ${selected === id ? 'active' : ''}`}
            onClick={() => pick(id)}
          >
            <span className={`mechanism-badge mechanism-badge-${mech.sceneType}`} title={badge.title}>
              {badge.label}
            </span>
            <span className="mechanism-name">{mech.labelKo}</span>
          </button>
        );
      })}
    </div>
  );
}
