import React, { useState, useRef, useEffect } from 'react';
import { PAPER_SIZES, PRINT } from '../../generators/constants';
import { getMechanism } from '../../generators/registry';
import { spineFootprint } from '../../generators/compatibility';
import { CIRCLED_NUMBERS } from '../../generators/assemblyMap';

const COMMIT_DELAY_MS = 150;

/**
 * Interactive mini assembly map: drag each book element's glue footprint
 * along the spine to set its placement. Same coordinate system and footprint
 * math as the printed 조립 배치도 page (generators/assemblyMap.js), so what
 * you drag here is exactly what prints there.
 *
 * The 2D-preview map page itself is injected as a static SVG string
 * (innerHTML), which is why the editable canvas lives here in the panel
 * instead: dragging commits through the normal placement path, and the
 * printed page / 3D scene / validation all follow automatically.
 *
 * @param {Array}  props.elements   normalized element list
 * @param {string} props.paperSize
 * @param {string} props.selectedId
 * @param {(id: string) => void} props.onSelect
 * @param {(id: string, spineOffset: number) => void} props.onMove  debounced commit
 */
export default function PlacementCanvas({ elements, paperSize, selectedId, onSelect, onMove }) {
  // Local offsets shown while dragging, before the debounced store commit.
  const [draft, setDraft] = useState({}); // id → spineOffset (mm)
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef(null); // { id, startX, startOffset, scale }
  const svgRef = useRef(null);
  const commitTimer = useRef(null);
  useEffect(() => () => clearTimeout(commitTimer.current), []);

  const paper = PAPER_SIZES[paperSize] || PAPER_SIZES.A4;
  const spineY = paper.height / 2;
  const cx = paper.width / 2;

  const boxes = elements
    .map((el, i) => {
      const fp = spineFootprint(el, paperSize);
      if (!fp) return null;
      const offset = draft[el.id] ?? (el.placement?.spineOffset || 0);
      return { el, i, fp, offset };
    })
    .filter(Boolean);

  // Pairwise overlap with draft offsets applied — live feedback while dragging.
  const overlapping = new Set();
  for (let i = 0; i < boxes.length; i++) {
    for (let j = i + 1; j < boxes.length; j++) {
      const a = boxes[i];
      const b = boxes[j];
      if (
        a.offset - a.fp.width / 2 < b.offset + b.fp.width / 2 &&
        b.offset - b.fp.width / 2 < a.offset + a.fp.width / 2
      ) {
        overlapping.add(a.el.id);
        overlapping.add(b.el.id);
      }
    }
  }

  const clampOffset = (box, off) => {
    const half = paper.width / 2 - PRINT.MARGIN - box.fp.width / 2;
    return Math.round(Math.max(-half, Math.min(half, off)));
  };

  const handlePointerDown = (box) => (e) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    // px-per-mm at the current rendered size, from the svg's on-screen width.
    const rect = svgRef.current?.getBoundingClientRect();
    const scale = rect ? rect.width / paper.width : 1;
    dragRef.current = { id: box.el.id, startX: e.clientX, startOffset: box.offset, scale, box };
    setDragging(true);
    onSelect?.(box.el.id);
  };

  const handlePointerMove = (e) => {
    const d = dragRef.current;
    if (!d) return;
    const next = clampOffset(d.box, d.startOffset + (e.clientX - d.startX) / d.scale);
    setDraft((prev) => ({ ...prev, [d.id]: next }));
    clearTimeout(commitTimer.current);
    commitTimer.current = setTimeout(() => onMove?.(d.id, next), COMMIT_DELAY_MS);
  };

  const handlePointerUp = (e) => {
    const d = dragRef.current;
    if (!d) return;
    if (e.currentTarget.hasPointerCapture?.(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    dragRef.current = null;
    setDragging(false);
    const next = draft[d.id];
    if (typeof next === 'number') {
      clearTimeout(commitTimer.current);
      onMove?.(d.id, next);
    }
    // Keep the draft value until the store echoes it back, then clear on the
    // next render cycle — simplest is to clear now; the commit above already
    // carries the final value, so the rect can't snap back.
    setDraft((prev) => {
      const { [d.id]: _, ...rest } = prev;
      return rest;
    });
  };

  const flatEls = elements.filter((el) => getMechanism(el.mechanism)?.sceneType === 'flat');

  return (
    <div className="placement-canvas-wrap">
      <div className="placement-canvas-title">배치 편집 — 상자를 좌우로 드래그하세요</div>
      <svg
        ref={svgRef}
        className={`placement-canvas${dragging ? ' is-dragging' : ''}`}
        viewBox={`0 0 ${paper.width} ${paper.height}`}
        role="application"
        aria-label="조립 배치 편집 캔버스"
      >
        {/* print-safe margin + spine, same as the printed map page */}
        <rect
          x={PRINT.MARGIN}
          y={PRINT.MARGIN}
          width={paper.width - 2 * PRINT.MARGIN}
          height={paper.height - 2 * PRINT.MARGIN}
          className="placement-margin"
        />
        <line x1={PRINT.MARGIN} y1={spineY} x2={paper.width - PRINT.MARGIN} y2={spineY} className="placement-spine" />
        <text x={cx} y={spineY - 2} className="placement-caption" textAnchor="middle">
          척추 (접는 선)
        </text>

        {boxes.map((box) => {
          const x = cx + box.offset - box.fp.width / 2;
          const y = spineY - box.fp.halfDepth;
          const cls = [
            'placement-rect',
            selectedId === box.el.id ? 'active' : '',
            overlapping.has(box.el.id) ? 'overlap' : '',
          ]
            .join(' ')
            .trim();
          return (
            <g
              key={box.el.id}
              className={cls}
              onPointerDown={handlePointerDown(box)}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
            >
              <rect x={x} y={y} width={box.fp.width} height={box.fp.halfDepth * 2} rx="2" />
              <text x={cx + box.offset} y={spineY - box.fp.halfDepth - 3} textAnchor="middle" className="placement-label">
                {CIRCLED_NUMBERS[box.i] || box.i + 1} {getMechanism(box.el.mechanism)?.labelKo?.split(' ')[0]}
              </text>
              <text x={cx + box.offset} y={spineY + box.fp.halfDepth + 6} textAnchor="middle" className="placement-caption">
                {box.offset >= 0 ? '+' : ''}
                {box.offset}mm
              </text>
            </g>
          );
        })}
      </svg>
      {flatEls.length > 0 && (
        <div className="placement-note">
          평면형 장치({flatEls.map((el) => getMechanism(el.mechanism)?.labelKo?.split(' ')[0]).join(', ')})는 자체
          앞면 카드가 베이스라 배치 대상이 아닙니다.
        </div>
      )}
    </div>
  );
}
