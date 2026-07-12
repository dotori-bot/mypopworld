import React, { useEffect, useRef, useState } from 'react';
import useCardStore from '../../store/useCardStore';
import UserArtUpload, { fileToArtDataUrl } from './UserArtUpload';
import { Palette, ImagePlus, X } from 'lucide-react';

/**
 * CustomizePanel — the single "🎨 꾸미기" menu that unifies every
 * decoration/customization control that used to be scattered as separate
 * top-bar buttons (AI 이미지 · 내가 직접 그리기 · 내 그림 · 내 그림 업로드):
 *
 *  1. 장식 그림 — how the cut-out decoration pages (page 2+) are produced:
 *     AI 이미지 / 직접 그리기 가이드 / 내 그림(업로드한 그림 + 자동 오림선).
 *  2. 도안 배경 — a colour or uploaded image painted UNDER every pattern
 *     page (inside the trim line) AND onto the 3D simulation's card faces.
 *
 * Rendered both above the 2D preview and as an overlay chip on the 3D stage,
 * so the same menu is reachable from either tab.
 */
export default function CustomizePanel() {
  const {
    decorationMode, setDecorationMode, userArt,
    cardSkin, setCardSkin,
  } = useCardStore();
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const skinFileRef = useRef(null);
  const colorTimer = useRef(null);
  const [skinError, setSkinError] = useState(null);

  // Close on outside click / Escape.
  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  useEffect(() => () => clearTimeout(colorTimer.current), []);

  const handleSkinFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      setSkinError(null);
      setCardSkin({ type: 'image', image: await fileToArtDataUrl(file) });
    } catch {
      setSkinError('이미지를 불러오지 못했어요. 다른 파일을 시도해 주세요.');
    }
  };

  // Colour drags fire a stream of input events; debounce the store commit so
  // the (synchronous) full-page SVG rebuild doesn't run on every tick.
  const handleColor = (e) => {
    const color = e.target.value;
    clearTimeout(colorTimer.current);
    colorTimer.current = setTimeout(() => setCardSkin({ type: 'color', color }), 150);
  };

  const decoModes = [
    { id: 'ai-image', label: '🎨 AI 이미지', disabled: false },
    { id: 'freehand', label: '✏️ 직접 그리기', disabled: false },
    { id: 'user-image', label: '🖼️ 내 그림', disabled: !userArt, title: userArt ? undefined : '아래에서 그림을 먼저 업로드하세요' },
  ];

  return (
    <div className="customize-menu" ref={rootRef}>
      <button
        type="button"
        className={`decoration-mode-btn customize-toggle ${open || cardSkin.type !== 'none' ? 'active' : ''}`}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <Palette size={14} style={{ verticalAlign: '-2px', marginRight: '4px' }} />
        꾸미기
      </button>

      {open && (
        <div className="customize-panel" role="dialog" aria-label="꾸미기 설정">
          <div className="customize-section">
            <div className="customize-section-title">장식 그림 (오려 붙이는 조각 페이지)</div>
            <div className="customize-chip-row">
              {decoModes.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  className={`decoration-mode-btn ${decorationMode === m.id ? 'active' : ''}`}
                  disabled={m.disabled}
                  title={m.title}
                  onClick={() => setDecorationMode(m.id)}
                >
                  {m.label}
                </button>
              ))}
            </div>
            <div className="customize-chip-row">
              <UserArtUpload />
            </div>
          </div>

          <div className="customize-section">
            <div className="customize-section-title">도안 배경 (모든 도안 페이지 + 3D 카드 면)</div>
            <div className="customize-chip-row">
              <button
                type="button"
                className={`decoration-mode-btn ${cardSkin.type === 'none' ? 'active' : ''}`}
                onClick={() => setCardSkin({ type: 'none' })}
              >
                없음
              </button>
              <button
                type="button"
                className={`decoration-mode-btn ${cardSkin.type === 'color' ? 'active' : ''}`}
                onClick={() => setCardSkin({ type: 'color' })}
              >
                🎨 단색
              </button>
              <button
                type="button"
                className={`decoration-mode-btn ${cardSkin.type === 'image' ? 'active' : ''}`}
                onClick={() =>
                  cardSkin.image ? setCardSkin({ type: 'image' }) : skinFileRef.current?.click()
                }
              >
                🖼️ 내 이미지
              </button>
            </div>
            {cardSkin.type === 'color' && (
              <div className="customize-chip-row">
                <input
                  type="color"
                  className="customize-color-input"
                  defaultValue={cardSkin.color}
                  onChange={handleColor}
                  aria-label="도안 배경 색"
                />
                <span className="customize-hint">밝은 색일수록 오리는 선이 잘 보여요</span>
              </div>
            )}
            <div className="customize-chip-row">
              <input
                ref={skinFileRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleSkinFile}
              />
              <button type="button" className="decoration-mode-btn" onClick={() => skinFileRef.current?.click()}>
                <ImagePlus size={14} style={{ verticalAlign: '-2px', marginRight: '4px' }} />
                {cardSkin.image ? '배경 이미지 바꾸기' : '배경 이미지 업로드'}
              </button>
              {cardSkin.image && (
                <span className="user-art-thumb-wrap">
                  <img className="user-art-thumb" src={cardSkin.image} alt="배경 이미지" />
                  <button
                    type="button"
                    className="user-art-clear"
                    aria-label="배경 이미지 지우기"
                    onClick={() => setCardSkin({ image: null })}
                  >
                    <X size={12} />
                  </button>
                </span>
              )}
              {skinError && <span className="user-art-error">{skinError}</span>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
