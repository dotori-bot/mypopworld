import React, { useRef, useState } from 'react';
import useCardStore from '../../store/useCardStore';
import { getElements } from '../../store/cardModel';
import { getMechanism, getElementDecorationSlots } from '../../generators/registry';
import { CIRCLED_NUMBERS } from '../../generators/assemblyMap';
import { ImagePlus, X } from 'lucide-react';

// Longest edge of the stored data URL. Uploads are usually photos/scans of a
// child's drawing (multi-MP) — downscaling keeps the zustand store, the SVG
// pages and the PDF export light while staying plenty sharp for a preview.
const MAX_DIM = 768;

/**
 * Decode an uploaded image file and re-encode it as a downscaled PNG data URL.
 * PNG keeps transparency for drawings exported from paint apps; photos of
 * paper drawings simply keep their white background.
 */
async function fileToArtDataUrl(file) {
  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('이미지를 읽을 수 없습니다.'));
      el.src = objectUrl;
    });
    const scale = Math.min(1, MAX_DIM / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.max(1, Math.round(img.naturalWidth * scale));
    const h = Math.max(1, Math.round(img.naturalHeight * scale));
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    canvas.getContext('2d').drawImage(img, 0, 0, w, h);
    return canvas.toDataURL('image/png');
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

/**
 * Build the flattened slot rows for the current card: one row per decoration
 * slot, in the SAME order getDecorationSlots() flattens them (element order,
 * then each element's own slots), so row.index lines up 1:1 with the
 * userArts store keys, the 2D decoration pages and the 3D --slot-art vars.
 */
export function buildSlotRows(cardParams, paperSize, colorMode) {
  const elements = getElements(cardParams);
  const rows = [];
  elements.forEach((el, ei) => {
    const slots = getElementDecorationSlots(el, paperSize, colorMode, cardParams?.theme);
    slots.forEach((slot) => {
      rows.push({
        index: rows.length,
        label: slot.label || '장식 그림',
        width: slot.width,
        height: slot.height,
        elLabel:
          elements.length > 1
            ? `${CIRCLED_NUMBERS[ei] || ei + 1} ${(getMechanism(el.mechanism)?.labelKo || el.mechanism).split(' (')[0]}`
            : null,
      });
    });
  });
  return rows;
}

/**
 * UserArtSlots — per-slot "내 그림" upload map, shared by the 2D template
 * preview and the 3D simulation. Lists every decoration slot of the current
 * card with its recommended drawing size (mm, from the mechanism's own
 * resolver geometry) BEFORE anything is uploaded, and one upload button per
 * slot. Uploads land in useCardStore.userArts keyed by the slot's flattened
 * index; consumers decide how to apply them (decoration pages / CSS vars).
 *
 * @param {boolean} [collapsible=false] 3D-stage mode: render as a small
 *   toggle chip that expands into the slot map, so it doesn't cover the scene.
 */
export default function UserArtSlots({ collapsible = false }) {
  const { cardParams, paperSize, colorMode, userArts, setUserArtAt } = useCardStore();
  const inputRef = useRef(null);
  const pendingSlot = useRef(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState(null);

  const rows = buildSlotRows(cardParams, paperSize, colorMode);
  if (rows.length === 0) return null;

  const uploadedCount = rows.filter((r) => userArts[r.index]).length;

  const pickFor = (index) => {
    pendingSlot.current = index;
    inputRef.current?.click();
  };

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    // Reset so picking the same file again still fires a change event.
    e.target.value = '';
    const slot = pendingSlot.current;
    pendingSlot.current = null;
    if (!file || slot == null) return;
    try {
      setError(null);
      setUserArtAt(slot, await fileToArtDataUrl(file));
    } catch {
      setError('이미지를 불러오지 못했어요. 다른 파일을 시도해 주세요.');
    }
  };

  const map = (
    <div className="user-art-slots" role="list" aria-label="내 그림 업로드 슬롯">
      {rows.map((r) => {
        const art = userArts[r.index];
        return (
          <div className="user-art-slot" role="listitem" key={r.index}>
            <div className="user-art-slot-head">
              <span className="user-art-slot-no">{r.index + 1}</span>
              <span className="user-art-slot-size">약 {Math.round(r.width)}×{Math.round(r.height)}mm</span>
            </div>
            <button
              type="button"
              className={`user-art-slot-drop ${art ? 'has-art' : ''}`}
              onClick={() => pickFor(r.index)}
              title={`${r.label} — 권장 크기 약 ${Math.round(r.width)}×${Math.round(r.height)}mm (가로×세로). 클릭해서 그림 ${art ? '바꾸기' : '업로드'}`}
            >
              {art ? (
                <img className="user-art-thumb" src={art} alt={`${r.index + 1}번 슬롯에 업로드한 그림`} />
              ) : (
                <ImagePlus size={16} aria-hidden />
              )}
            </button>
            {art && (
              <button
                type="button"
                className="user-art-clear"
                aria-label={`${r.index + 1}번 슬롯 그림 지우기`}
                onClick={() => setUserArtAt(r.index, null)}
              >
                <X size={12} />
              </button>
            )}
            <div className="user-art-slot-label" title={r.label}>
              {r.elLabel && <span className="user-art-slot-el">{r.elLabel} · </span>}
              {r.label}
            </div>
          </div>
        );
      })}
      {error && <span className="user-art-error">{error}</span>}
    </div>
  );

  return (
    <div className={`user-art-map ${collapsible ? 'user-art-map-overlay' : ''}`}>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFile}
      />
      {collapsible ? (
        <>
          <button
            type="button"
            className="decoration-mode-btn"
            onClick={() => setOpen((v) => !v)}
            title="자리별 권장 크기를 확인하고 직접 그린 그림을 올리면 3D에 적용돼요"
          >
            <ImagePlus size={14} style={{ verticalAlign: '-2px', marginRight: '4px' }} />
            내 그림 ({uploadedCount}/{rows.length}) {open ? '▴' : '▾'}
          </button>
          {open && map}
        </>
      ) : (
        map
      )}
    </div>
  );
}
