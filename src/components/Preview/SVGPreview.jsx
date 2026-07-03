import React, { useEffect, useState, useRef } from 'react';
import useCardStore from '../../store/useCardStore';
import { getMechanism, buildMechanismParams, getDecorationSlots, INSTRUCTION_TEXT } from '../../generators/registry';
import { PAPER_SIZES, PRINT } from '../../generators/constants';
import { createSVG, svgToString, getLineStyle, addPath, addRect, addText } from '../../generators/svgBuilder';
import { getContourPath, getBlobPath } from '../../utils/imageProcessor';
import { polarToCartesian } from '../../utils/math';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import '../../styles/preview.css';

// Builds the "d" for a simple angle-indicator arrow: a shaft through (cx, cy)
// pointing at angleDeg (0 = up, clockwise positive, matching polarToCartesian),
// with a small two-stroke arrowhead at the tip. Purely illustrative, not a
// load-bearing measurement — see math.js's polarToCartesian for the trig.
function buildAngleArrowPath(cx, cy, angleDeg, length = 12, headLen = 3.5, headSpread = 25) {
  const tip = polarToCartesian(cx, cy, length / 2, angleDeg);
  const tail = polarToCartesian(cx, cy, length / 2, angleDeg + 180);
  const headA = polarToCartesian(tip.x, tip.y, headLen, angleDeg + 180 - headSpread);
  const headB = polarToCartesian(tip.x, tip.y, headLen, angleDeg + 180 + headSpread);
  return `M ${tail.x} ${tail.y} L ${tip.x} ${tip.y} M ${tip.x} ${tip.y} L ${headA.x} ${headA.y} M ${tip.x} ${tip.y} L ${headB.x} ${headB.y}`;
}

export default function SVGPreview() {
  const { cardParams, isTyping, paperSize, colorMode, language, decorationMode, setDecorationMode } = useCardStore();
  const [pages, setPages] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const containerRef = useRef(null);
  // Real SVGSVGElement references (not just serialized strings), kept around
  // so the PDF export can hand them to svg2pdf.js directly.
  const pageElementsRef = useRef([]);

  const paper = PAPER_SIZES[paperSize] || PAPER_SIZES.A4;
  const isColor = colorMode !== 'bw';

  useEffect(() => {
    if (!cardParams) {
      setPages([]);
      pageElementsRef.current = [];
      return;
    }

    const generatePages = async () => {
      // --- Page 1: Mechanism Template ---
      const mech = getMechanism(cardParams.mechanism);
      let svg1;
      if (mech) {
        const params = buildMechanismParams(cardParams, paperSize, colorMode);
        const rendered = mech.render(params);
        svg1 = rendered.svg;
      } else {
        svg1 = createSVG(paper.width, paper.height);
        addText(svg1, paper.width / 2, paper.height / 2, '아직 지원되지 않는 메커니즘입니다.', 5, 'middle');
      }

      // --- Page 2..N+1: Themed Decoration (one page per decoration slot) ---
      // A mechanism can ask for more than one decoration image/guide (e.g.
      // 'layered-stage' wants one per wall). getDecorationSlots() returns a
      // content-size hint per slot; every mechanism without an explicit
      // decorationSlots() definition falls back to today's single 100x100mm
      // slot, so this loop reduces to exactly the old single-page behavior
      // for them.
      const slots = getDecorationSlots(cardParams, paperSize, colorMode);

      // Slot width/height are mm hints designed against an A4 (210mm-wide)
      // reference — the same ratio the original single 100mm hint used — so
      // a single 100x100 slot scales identically to the pre-existing
      // A4/Letter-proportional logic (no regression).
      const slotScale = Math.min(paper.width, paper.height) / 210;
      const maxDecoW = paper.width - 2 * PRINT.MARGIN;
      const maxDecoH = paper.height * (115 / 297);
      const titleY = paper.height * (65 / 297);
      const decoY = paper.height * (80 / 297);

      const decorationPages = await Promise.all(slots.map(async (slot, i) => {
        const svg = createSVG(paper.width, paper.height);

        // Fit this slot's aspect ratio proportionally to the paper, then
        // defensively clamp inside the printable area (guards against
        // unusually tall/wide slot hints from a mechanism).
        let decoW = slot.width * slotScale;
        let decoH = slot.height * slotScale;
        const fitScale = Math.min(1, maxDecoW / decoW, maxDecoH / decoH);
        decoW *= fitScale;
        decoH *= fitScale;
        const decoX = (paper.width - decoW) / 2;

        // Per-slot image prompt: an explicit decorationVariants[i] (see
        // api/chat.js for 'layered-stage') wins; otherwise fall back to the
        // single shared imagePrompt/theme exactly like before. When there
        // are multiple slots but no variant was supplied, append the slot's
        // own label as a distinguishing hint so the pages at least look
        // intentionally different — reusing the same image across slots in
        // that degraded case is acceptable, just never blank/erroring.
        const variant = cardParams.decorationVariants?.[i];
        const basePrompt = variant || cardParams.imagePrompt || cardParams.theme;
        const queryText = variant || (slots.length > 1 ? `${basePrompt} ${slot.label}` : basePrompt);
        const themeQuery = encodeURIComponent(`${queryText} simple cute cartoon vector isolated on pure white background for kids sticker`);
        const imgUrl = `https://image.pollinations.ai/prompt/${themeQuery}?width=512&height=512&nologo=true`;

        // Title suffix: preserve the exact old single-slot wording; only
        // switch to the per-slot label once there's more than one page.
        const titleSuffix = slots.length > 1 ? slot.label : '장식 조각';

        if (decorationMode === 'ai-image') {
          // Full-size AI image embedded as the actual cuttable artwork, with a
          // traced cut-contour around it.
          const img = document.createElementNS('http://www.w3.org/2000/svg', 'image');
          img.setAttribute('href', imgUrl);
          img.setAttribute('x', decoX);
          img.setAttribute('y', decoY);
          img.setAttribute('width', decoW);
          img.setAttribute('height', decoH);
          svg.appendChild(img);

          // Add contour cut line
          const contourPath = await getContourPath(imgUrl, decoX, decoY, decoW, decoH, 5);
          addPath(svg, contourPath, getLineStyle('CUT', isColor));

          addText(svg, paper.width / 2, titleY, `[ ${cardParams.theme} ] ${titleSuffix}`, 5, 'middle');
          addText(svg, paper.width / 2, paper.height * (195 / 297), '가위로 윤곽선을 따라 오린 후, 팝업 장치(풀칠 부위)에 붙여주세요!', 3, 'middle');
        } else {
          // 'freehand': a neutral placeholder outline the child draws inside,
          // annotated with size/position/angle, plus a small AI image shown
          // only as an inspirational reference thumbnail (not meant to be cut).
          const decorationAngle = cardParams.decorationAngle || 0;

          const freehandTitle = slots.length > 1
            ? `[ ${cardParams.theme} ] ${slot.label} 직접 그리기 가이드`
            : `[ ${cardParams.theme} ] 직접 그리기 가이드`;
          addText(svg, paper.width / 2, titleY, freehandTitle, 5, 'middle');

          // Neutral "draw inside this outline" placeholder cut-shape.
          const placeholderPath = getBlobPath(decoX, decoY, decoW, decoH);
          addPath(svg, placeholderPath, getLineStyle('CUT', isColor));

          const shapeCenterX = decoX + decoW / 2;
          const shapeBottom = decoY + decoH;

          // Dimension labels, right on/under the shape.
          addText(svg, shapeCenterX, decoY + decoH / 2, `${decoW.toFixed(0)}mm × ${decoH.toFixed(0)}mm`, 4, 'middle');

          // Position description in human terms, relative to the page center,
          // plus the exact mm offset for precision.
          const centerX = paper.width / 2;
          const centerY = paper.height / 2;
          const dx = shapeCenterX - centerX;
          const dy = decoY + decoH / 2 - centerY;
          const vertDesc = dy < -5 ? '위쪽' : dy > 5 ? '아래쪽' : '중앙';
          const horizDesc = dx < -5 ? '왼쪽' : dx > 5 ? '오른쪽' : '';
          const posDesc = `카드 중앙 ${vertDesc}${horizDesc ? ' ' + horizDesc : ''} (중심에서 x:${dx.toFixed(0)}mm, y:${dy.toFixed(0)}mm)`;
          addText(svg, shapeCenterX, shapeBottom + 12, posDesc, 3, 'middle');

          // Angle indicator: a small rotated arrow + label. decorationAngle
          // defaults to 0 (upright) but every mechanism can pass a value.
          const arrowCenterY = shapeBottom + 26;
          const arrowStyle = { stroke: isColor ? '#FF8800' : '#333333', strokeWidth: 0.6, dasharray: 'none', fill: 'none' };
          addPath(svg, buildAngleArrowPath(shapeCenterX, arrowCenterY, decorationAngle), arrowStyle);
          addText(svg, shapeCenterX, arrowCenterY + 12, `회전 각도: ${decorationAngle}°`, 3, 'middle');

          addText(svg, paper.width / 2, paper.height - PRINT.MARGIN - 8, '위 안내에 맞춰 자유롭게 그린 후, 그린 선을 따라 오려서 팝업 장치(풀칠 부위)에 붙여주세요!', 3, 'middle');

          // Small AI reference thumbnail — illustrative only, not cut geometry.
          // Sized well inside the print-safe margin so it never overlaps it.
          const thumbSize = 25;
          const thumbX = paper.width - PRINT.MARGIN - 10 - thumbSize;
          const thumbY = PRINT.MARGIN + 8;
          const thumbImg = document.createElementNS('http://www.w3.org/2000/svg', 'image');
          thumbImg.setAttribute('href', imgUrl);
          thumbImg.setAttribute('x', thumbX);
          thumbImg.setAttribute('y', thumbY);
          thumbImg.setAttribute('width', thumbSize);
          thumbImg.setAttribute('height', thumbSize);
          svg.appendChild(thumbImg);
          const dashedBorderStyle = { stroke: isColor ? '#888888' : '#555555', strokeWidth: 0.4, dasharray: '2 1', fill: 'none' };
          addRect(svg, thumbX, thumbY, thumbSize, thumbSize, dashedBorderStyle);
          addText(svg, thumbX + thumbSize / 2, thumbY + thumbSize + 4, '참고 예시', 2.5, 'middle');
          addText(svg, thumbX + thumbSize / 2, thumbY + thumbSize + 8, '(그대로 따라 그리지 않아도 돼요)', 2, 'middle');
        }

        return svg;
      }));

      pageElementsRef.current = [svg1, ...decorationPages];
      setPages([svgToString(svg1), ...decorationPages.map(svgToString)]);
      setCurrentPage(0);
    };

    generatePages();

  }, [cardParams, paperSize, colorMode, decorationMode]);

  useEffect(() => {
    if (containerRef.current && pages.length > 0) {
      containerRef.current.innerHTML = pages[currentPage];
    }
  }, [pages, currentPage]);

  const handleDownload = async () => {
    const { exportAndDownload } = await import('../../generators/pdfExporter.js');
    const svgEls = pageElementsRef.current;
    if (!svgEls || svgEls.length === 0) return;

    // svg2pdf.js needs the elements attached to the document (and any
    // embedded raster images decoded) before it can read them correctly.
    const offscreen = document.createElement('div');
    offscreen.style.position = 'absolute';
    offscreen.style.left = '-9999px';
    offscreen.style.top = '0';
    offscreen.style.width = `${paper.width}mm`;
    offscreen.style.height = `${paper.height}mm`;
    offscreen.style.background = 'white';
    document.body.appendChild(offscreen);

    try {
      for (const svgEl of svgEls) {
        offscreen.appendChild(svgEl);
        const images = svgEl.querySelectorAll('image');
        for (const imageNode of images) {
          const href = imageNode.getAttribute('href') || imageNode.getAttribute('xlink:href');
          if (!href) continue;
          await new Promise((resolve) => {
            const tempImg = new Image();
            tempImg.crossOrigin = 'anonymous';
            tempImg.onload = resolve;
            tempImg.onerror = resolve;
            tempImg.src = href;
          });
        }
      }

      const mech = getMechanism(cardParams.mechanism);
      const instructionText = mech ? INSTRUCTION_TEXT[mech.instructionStyle] : null;
      const instructions = instructionText ? {
        title: `${cardParams.theme ? cardParams.theme + ' - ' : ''}${instructionText.title}`,
        steps: instructionText.steps,
        materials: instructionText.materials,
        tips: instructionText.tips,
      } : undefined;

      await exportAndDownload(
        svgEls,
        {
          paperSize,
          filename: `${cardParams.theme || 'popup'}_도안.pdf`,
          title: `${cardParams.theme || 'MyPopWorld'} Template`,
        },
        instructions,
        language
      );
    } finally {
      document.body.removeChild(offscreen);
    }
  };

  // SVG export — download each generated page as its own .svg file (vector,
  // editable in Illustrator/Inkscape/Figma). Flagged as a planned premium
  // feature (no gating exists yet anywhere in this app); freely usable for now.
  const handleSvgExport = () => {
    const svgEls = pageElementsRef.current;
    if (!svgEls || svgEls.length === 0) return;

    svgEls.forEach((svgEl, i) => {
      const svgString = svgToString(svgEl);
      const blob = new Blob([svgString], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${cardParams.theme || 'popup'}_도안_${i + 1}.svg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  };

  return (
    <div className="preview-content">
      <div className="decoration-mode-toggle">
        <span className="decoration-mode-label">장식 그리기 방식:</span>
        <button
          type="button"
          className={`decoration-mode-btn ${decorationMode === 'ai-image' ? 'active' : ''}`}
          onClick={() => setDecorationMode('ai-image')}
        >
          🎨 AI 이미지
        </button>
        <button
          type="button"
          className={`decoration-mode-btn ${decorationMode === 'freehand' ? 'active' : ''}`}
          onClick={() => setDecorationMode('freehand')}
        >
          ✏️ 내가 직접 그리기
        </button>
      </div>
      <div className="svg-preview-container">
        {isTyping ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', color: 'var(--text-secondary)' }}>
            <div className="spinner" style={{ width: '40px', height: '40px', borderWidth: '4px' }}></div>
            <div>AI가 도안과 일러스트를 열심히 설계하고 있어요...</div>
          </div>
        ) : pages.length === 0 ? (
          <div style={{ color: 'var(--text-secondary)' }}>
            채팅을 통해 만들고 싶은 작품을 결정하면 이곳에 도안이 표시됩니다.
          </div>
        ) : (
          <div className="svg-paper" ref={containerRef} style={{ width: `${paper.width}mm`, height: `${paper.height}mm` }}>
            {/* SVG injected here */}
          </div>
        )}
      </div>

      {pages.length > 0 && !isTyping && (
        <>
          <div className="page-navigator">
            <button
              className="btn-icon btn-secondary"
              disabled={currentPage === 0}
              onClick={() => setCurrentPage(p => p - 1)}
            >
              <ChevronLeft size={20} />
            </button>
            <div className="page-dots">
              {pages.map((_, i) => (
                <div key={i} className={`page-dot ${i === currentPage ? 'active' : ''}`} />
              ))}
            </div>
            <button
              className="btn-icon btn-secondary"
              disabled={currentPage === pages.length - 1}
              onClick={() => setCurrentPage(p => p + 1)}
            >
              <ChevronRight size={20} />
            </button>
          </div>

          <div className="download-overlay">
            <button
              className="btn-download"
              onClick={handleDownload}
            >
              PDF로 다운로드
            </button>
            <button
              className="btn-download-secondary"
              onClick={handleSvgExport}
              title="벡터 SVG 파일로 내보내기 (일러스트레이터/잉크스케이프 등에서 편집 가능)"
            >
              SVG로 내보내기 <span className="premium-badge">✨ 프리미엄 예정</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
