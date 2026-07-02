import React, { useEffect, useState, useRef } from 'react';
import useCardStore from '../../store/useCardStore';
import { getMechanism, buildMechanismParams, INSTRUCTION_TEXT } from '../../generators/registry';
import { PAPER_SIZES } from '../../generators/constants';
import { createSVG, svgToString, getLineStyle, addPath, addText } from '../../generators/svgBuilder';
import { getContourPath } from '../../utils/imageProcessor';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import '../../styles/preview.css';

export default function SVGPreview() {
  const { cardParams, isTyping, paperSize, colorMode, language } = useCardStore();
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

      // --- Page 2: Themed Decoration using Pollinations.ai ---
      const svg2 = createSVG(paper.width, paper.height);
      const queryText = cardParams.imagePrompt ? cardParams.imagePrompt : cardParams.theme;
      const themeQuery = encodeURIComponent(`${queryText} simple cute cartoon vector isolated on pure white background for kids sticker`);
      const imgUrl = `https://image.pollinations.ai/prompt/${themeQuery}?width=512&height=512&nologo=true`;

      const img = document.createElementNS('http://www.w3.org/2000/svg', 'image');
      img.setAttribute('href', imgUrl);
      img.setAttribute('x', 55);
      img.setAttribute('y', 80);
      img.setAttribute('width', 100);
      img.setAttribute('height', 100);
      svg2.appendChild(img);

      // Add contour cut line
      const contourPath = await getContourPath(imgUrl, 55, 80, 100, 100, 5);
      addPath(svg2, contourPath, getLineStyle('CUT', isColor));

      addText(svg2, paper.width / 2, 65, `[ ${cardParams.theme} ] 장식 조각`, 5, 'middle');
      addText(svg2, paper.width / 2, 195, '가위로 윤곽선을 따라 오린 후, 팝업 장치(풀칠 부위)에 붙여주세요!', 3, 'middle');

      pageElementsRef.current = [svg1, svg2];
      setPages([svgToString(svg1), svgToString(svg2)]);
      setCurrentPage(0);
    };

    generatePages();

  }, [cardParams, paperSize, colorMode]);

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

  return (
    <div className="preview-content">
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

          <button
            className="btn-download download-overlay"
            onClick={handleDownload}
          >
            PDF로 다운로드
          </button>
        </>
      )}
    </div>
  );
}
