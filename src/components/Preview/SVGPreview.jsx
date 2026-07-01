import React, { useEffect, useRef } from 'react';
import useCardStore from '../../store/useCardStore';
import { generateStrawRocket } from '../../generators/strawRocket';
import { generateVFold } from '../../generators/vfold';
import { generateBoxPopup } from '../../generators/boxPopup';
import { createSVG, svgToString } from '../../generators/svgBuilder';
import '../../styles/preview.css';

export default function SVGPreview() {
  const { cardParams, isTyping } = useCardStore();
  const containerRef = useRef(null);

  useEffect(() => {
    if (!cardParams || !containerRef.current) return;

    const svg = createSVG(210, 297); 
    
    if (cardParams.mechanism === 'straw-rocket') {
      generateStrawRocket(svg, { theme: cardParams.theme });
    } else if (cardParams.mechanism === 'v-fold') {
      generateVFold(svg, {});
    } else if (cardParams.mechanism === 'box-popup') {
      generateBoxPopup(svg, {});
    } else {
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', 105);
      text.setAttribute('y', 148);
      text.setAttribute('text-anchor', 'middle');
      text.textContent = '아직 지원되지 않는 메커니즘입니다.';
      svg.appendChild(text);
    }

    containerRef.current.innerHTML = svgToString(svg);

  }, [cardParams]);

  return (
    <div className="preview-content">
      <div className="svg-preview-container">
        {isTyping ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', color: 'var(--text-secondary)' }}>
            <div className="spinner" style={{ width: '40px', height: '40px', borderWidth: '4px' }}></div>
            <div>AI가 도안을 열심히 설계하고 있어요...</div>
          </div>
        ) : !cardParams ? (
          <div style={{ color: 'var(--text-secondary)' }}>
            채팅을 통해 만들고 싶은 작품을 결정하면 이곳에 도안이 표시됩니다.
          </div>
        ) : (
          <div className="svg-paper" ref={containerRef} style={{ width: '210mm', height: '297mm' }}>
          </div>
        )}
      </div>
      
      {cardParams && !isTyping && (
        <button className="btn-download download-overlay">
          PDF로 다운로드
        </button>
      )}
    </div>
  );
}
