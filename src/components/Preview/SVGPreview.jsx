import React, { useEffect, useState, useRef } from 'react';
import useCardStore from '../../store/useCardStore';
import { generateStrawRocket } from '../../generators/strawRocket';
import { generateVFold } from '../../generators/vfold';
import { generateBoxPopup } from '../../generators/boxPopup';
import { createSVG, svgToString, getLineStyle, addRect, addText } from '../../generators/svgBuilder';
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

    // --- Page 1: Mechanism Template ---
    const svg1 = createSVG(210, 297); 
    if (cardParams.mechanism === 'straw-rocket') {
      generateStrawRocket(svg1, { theme: cardParams.theme });
    } else if (cardParams.mechanism === 'v-fold') {
      generateVFold(svg1, {});
    } else if (cardParams.mechanism === 'box-popup') {
      generateBoxPopup(svg1, {});
    } else if (cardParams.mechanism === 'pull-tab') {
      // Basic pull tab placeholder since full generator isn't linked
      addRect(svg1, 50, 100, 100, 20, getLineStyle('CUT', true));
      addRect(svg1, 60, 90, 80, 40, getLineStyle('MOUNTAIN_FOLD', true));
      addText(svg1, 100, 115, '풀탭 (Pull Tab) 장치', 4, 'middle');
    } else if (cardParams.mechanism === 'parallel-fold') {
      addRect(svg1, 50, 100, 100, 60, getLineStyle('CUT', true));
      addRect(svg1, 50, 130, 100, 1, getLineStyle('MOUNTAIN_FOLD', true));
      addText(svg1, 100, 135, '평행 접기 (Parallel Fold)', 4, 'middle');
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
    
    // Add cut line around the image
    addRect(svg2, 50, 75, 110, 110, getLineStyle('CUT', true));
    addText(svg2, 105, 65, `[ ${cardParams.theme} ] 장식 조각`, 5, 'middle');
    addText(svg2, 105, 195, '가위로 점선을 따라 오린 후, 팝업 장치(풀칠 부위)에 붙여주세요!', 3, 'middle');

    setPages([svgToString(svg1), svgToString(svg2)]);
    setCurrentPage(0);

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

          <button className="btn-download download-overlay">
            PDF로 다운로드
          </button>
        </>
      )}
    </div>
  );
}
