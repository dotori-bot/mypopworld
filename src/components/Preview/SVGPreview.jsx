import React, { useEffect, useState, useRef } from 'react';
import useCardStore from '../../store/useCardStore';
import { generateStrawRocket } from '../../generators/strawRocket';
import { generateVFold } from '../../generators/vfold';
import { generateBoxPopup } from '../../generators/boxPopup';
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
      if (cardParams.mechanism === 'straw-rocket') {
        generateStrawRocket(svg1, { theme: cardParams.theme });
      } else if (cardParams.mechanism === 'v-fold') {
        generateVFold(svg1, {});
      } else if (cardParams.mechanism === 'box-popup') {
        generateBoxPopup(svg1, {});
      } else if (cardParams.mechanism === 'pull-tab') {
        addRect(svg1, 50, 100, 100, 20, getLineStyle('CUT', true));
        addRect(svg1, 60, 90, 80, 40, getLineStyle('MOUNTAIN_FOLD', true));
        addText(svg1, 100, 115, '풀탭 (Pull Tab) 장치', 4, 'middle');
      } else if (cardParams.mechanism === 'parallel-fold') {
        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        const spineY = 148.5;
        const cardWidth = 210;
        addPath(g, `M 10 10 L 200 10 L 200 287 L 10 287 Z`, getLineStyle('CUT', true));
        addPath(g, `M 10 ${spineY} L 200 ${spineY}`, getLineStyle('VALLEY_FOLD', true));
        const stepWidth = 80;
        const depth = 35; 
        const startX = (cardWidth - stepWidth) / 2;
        const endX = startX + stepWidth;
        addPath(g, `M ${startX} ${spineY - depth} L ${startX} ${spineY + depth}`, getLineStyle('CUT', true));
        addPath(g, `M ${endX} ${spineY - depth} L ${endX} ${spineY + depth}`, getLineStyle('CUT', true));
        addPath(g, `M ${startX} ${spineY - depth} L ${endX} ${spineY - depth}`, getLineStyle('VALLEY_FOLD', true));
        addPath(g, `M ${startX} ${spineY + depth} L ${endX} ${spineY + depth}`, getLineStyle('VALLEY_FOLD', true));
        addPath(g, `M ${startX} ${spineY} L ${endX} ${spineY}`, getLineStyle('MOUNTAIN_FOLD', true));
        addRect(g, startX + 5, spineY - depth + 5, stepWidth - 10, depth - 10, getLineStyle('GUIDE', true));
        addText(g, startX + stepWidth/2, spineY - depth/2 + 2, '여기에 장식을 풀로 붙이세요', 3, 'middle');
        addText(g, 105, 20, '[ 평행 접기 (무대 팝업) 기본 카드 ]', 5, 'middle');
        svg1.appendChild(g);
      } else {
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', 105);
        text.setAttribute('y', 148);
        text.setAttribute('text-anchor', 'middle');
        text.textContent = '아직 지원되지 않는 메커니즘입니다.';
        svg1.appendChild(text);
      }
      
      // --- Page 2: Themed Decoration using Pollinations.ai ---
      const svg2 = createSVG(210, 297);
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
      addPath(svg2, contourPath, getLineStyle('CUT', true));
      
      addText(svg2, 105, 65, `[ ${cardParams.theme} ] 장식 조각`, 5, 'middle');
      addText(svg2, 105, 195, '가위로 윤곽선을 따라 오린 후, 팝업 장치(풀칠 부위)에 붙여주세요!', 3, 'middle');

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
