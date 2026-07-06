import React from 'react';
import { MECHANISM_REGISTRY } from '../../generators/registry';

const SCENE_BADGE = {
  book: { label: '책형', title: '카드를 여닫는 동작으로 움직이는 팝업' },
  flat: { label: '평면형', title: '당기기/돌리기/넘기기 등으로 움직이는 장치' },
};

/**
 * Mechanism grid used by expert mode both to pick the first mechanism and to
 * add more to a combination.
 *
 * @param {(id: string) => void} props.onPick
 * @param {string} [props.selected]  highlight this mechanism id
 * @param {Record<string, string>} [props.disabledReasons]  id → why it can't
 *   be added to the current combination (renders the card disabled)
 */
export default function MechanismPicker({ onPick, selected, disabledReasons = {} }) {
  return (
    <div className="mechanism-grid" role="listbox" aria-label="메커니즘 선택">
      {Object.entries(MECHANISM_REGISTRY).map(([id, mech]) => {
        const badge = SCENE_BADGE[mech.sceneType] || SCENE_BADGE.book;
        const reason = disabledReasons[id];
        return (
          <button
            key={id}
            type="button"
            role="option"
            aria-selected={selected === id}
            disabled={!!reason}
            title={reason || badge.title}
            className={`mechanism-card ${selected === id ? 'active' : ''}`}
            onClick={() => onPick(id)}
          >
            <span className={`mechanism-badge mechanism-badge-${mech.sceneType}`}>{badge.label}</span>
            <span className="mechanism-name">{mech.labelKo}</span>
          </button>
        );
      })}
    </div>
  );
}
