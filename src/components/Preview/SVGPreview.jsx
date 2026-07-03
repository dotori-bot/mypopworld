import React, { useEffect, useState, useRef } from 'react';
import useCardStore from '../../store/useCardStore';
import { generateStrawRocket } from '../../generators/strawRocket';
import { generateVFold } from '../../generators/vfold';
import { generateBoxPopup } from '../../generators/boxPopup';
import { generateParallelFold } from '../../generators/parallelFold';
import { generateLayeredStage } from '../../generators/layeredStage';
import { generateFoldingScreen } from '../../generators/foldingScreen';
import { createSVG, svgToString, getLineStyle, addRect, addText, addPath } from '../../generators/svgBuilder';
import { getContourPath } from '../../utils/imageProcessor';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import '../../styles/preview.css';

export default function SVGPreview() {
  const { cardParams, isTyping } = useCardStore();
  const [pages, setPages] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!cardParams) {
      setPages([]);
      return;
    }

    const generatePages = async () => {
      // --- Page 1: Mechanism Template ---
      const svg1 = createSVG(210, 297);
      // Fallback decoration area for mechanisms without real geometry yet
      // (pull-tab placeholder, unsupported mechanisms).
      let decorationAreas = [{ x: 55, y: 80, width: 100, height: 100 }];

      if (cardParams.mechanism === 'straw-rocket') {
        ({ decorationAreas } = generateStrawRocket(svg1, { theme: cardParams.theme }));
      } else if (cardParams.mechanism === 'v-fold') {
        ({ decorationAreas } = generateVFold(svg1, {}));
      } else if (cardParams.mechanism === 'box-popup') {
        ({ decorationAreas } = generateBoxPopup(svg1, {}));
      } else if (cardParams.mechanism === 'pull-tab') {
        addRect(svg1, 50, 100, 100, 20, getLineStyle('CUT', true));
        addRect(svg1, 60, 90, 80, 40, getLineStyle('MOUNTAIN_FOLD', true));
        addText(svg1, 100, 115, '풀탭 (Pull Tab) 장치', 4, 'middle');
      } else if (cardParams.mechanism === 'parallel-fold') {
        ({ decorationAreas } = generateParallelFold(svg1, {}));
      } else if (cardParams.mechanism === 'layered-stage') {
        ({ decorationAreas } = generateLayeredStage(svg1, {}));
      } else if (cardParams.mechanism === 'folding-screen') {
        ({ decorationAreas } = generateFoldingScreen(svg1, {}));
      } else {
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', 105);
        text.setAttribute('y', 148);
        text.setAttribute('text-anchor', 'middle');
        text.textContent = '아직 지원되지 않는 메커니즘입니다.';
        svg1.appendChild(text);
      }

      // --- Page 2: Themed Decoration using Pollinations.ai ---
      // Sized/positioned from the mechanism piece's OWN decoration area
      // (computed above from its real geometry) instead of a fixed square,
      // so the cut-out actually fits the popup it gets glued onto.
      const svg2 = createSVG(210, 297);
      const area = decorationAreas[0];
      const queryText = cardParams.imagePrompt ? cardParams.imagePrompt : cardParams.theme;
      const themeQuery = encodeURIComponent(`${queryText} simple cute cartoon vector isolated on pure white background for kids sticker`);
      // Request the image at the same aspect ratio as the target area so it
      // isn't letterboxed (or mismatched against the traced cut line) when
      // the area isn't square.
      const aspect = area.width / area.height;
      const imgPxW = aspect >= 1 ? 512 : Math.round(512 * aspect);
      const imgPxH = aspect >= 1 ? Math.round(512 / aspect) : 512;
      const imgUrl = `https://image.pollinations.ai/prompt/${themeQuery}?width=${imgPxW}&height=${imgPxH}&nologo=true`;

      const img = document.createElementNS('http://www.w3.org/2000/svg', 'image');
      img.setAttribute('href', imgUrl);
      img.setAttribute('x', area.x);
      img.setAttribute('y', area.y);
      img.setAttribute('width', area.width);
      img.setAttribute('height', area.height);
      svg2.appendChild(img);

      // Add contour cut line
      const contourPath = await getContourPath(imgUrl, area.x, area.y, area.width, area.height, 5);
      addPath(svg2, contourPath, getLineStyle('CUT', true));

      addText(svg2, 105, area.y - 15, `[ ${cardParams.theme} ] 장식 조각`, 5, 'middle');
      addText(svg2, 105, area.y + area.height + 15, '가위로 윤곽선을 따라 오린 후, 팝업 장치(풀칠 부위)에 붙여주세요!', 3, 'middle');

      setPages([svgToString(svg1), svgToString(svg2)]);
      setCurrentPage(0);
    };

    generatePages();

  }, [cardParams]);

  useEffect(() => {
    if (containerRef.current && pages.length > 0) {
      containerRef.current.innerHTML = pages[currentPage];
    }
  }, [pages, currentPage]);

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
          <div className="svg-paper" ref={containerRef} style={{ width: '210mm', height: '297mm' }}>
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
            onClick={async () => {
              const { jsPDF } = await import('jspdf');
              const html2canvas = (await import('html2canvas')).default;
              
              const offscreen = document.createElement('div');
              offscreen.style.position = 'absolute';
              offscreen.style.left = '-9999px';
              offscreen.style.width = '210mm';
              offscreen.style.height = '297mm';
              offscreen.style.background = 'white';
              document.body.appendChild(offscreen);

              const pdf = new jsPDF('p', 'mm', 'a4');

              for (let i = 0; i < pages.length; i++) {
                if (i > 0) pdf.addPage();
                
                offscreen.innerHTML = pages[i];
                // wait for image to load if there's an image
                const img = offscreen.querySelector('image');
                if (img) {
                  await new Promise(resolve => {
                    const tempImg = new Image();
                    tempImg.crossOrigin = 'anonymous';
                    tempImg.onload = resolve;
                    tempImg.onerror = resolve;
                    tempImg.src = img.getAttribute('href');
                  });
                }
                
                const canvas = await html2canvas(offscreen, { scale: 2, useCORS: true });
                const imgData = canvas.toDataURL('image/png');
                
                pdf.addImage(imgData, 'PNG', 0, 0, 210, 297);
              }

              pdf.save(`${cardParams.theme}_도안.pdf`);
              document.body.removeChild(offscreen);
            }}
          >
            PDF로 다운로드
          </button>
        </>
      )}
    </div>
  );
}
