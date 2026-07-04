import React, { useState } from 'react';
import ChatWindow from './components/Chat/ChatWindow';
import SVGPreview from './components/Preview/SVGPreview';
import Instructions from './components/Preview/Instructions';
import Preview3D from './components/Preview/Preview3D';
import useCardStore from './store/useCardStore';
import { Sparkles } from 'lucide-react';
import './styles/index.css';
import './styles/layout.css';

const TABS = [
  { id: '2d', label: '2D 도안 미리보기' },
  { id: 'instructions', label: '조립 설명서' },
  { id: '3d', label: '3D 미리보기' },
];

function PrintSettings() {
  const { paperSize, setPaperSize, colorMode, setColorMode } = useCardStore();

  return (
    <div className="print-settings">
      <div className="toggle-group toggle-group-sm" role="group" aria-label="종이 크기">
        {['A4', 'LETTER'].map((size) => (
          <button
            key={size}
            type="button"
            className={`toggle-btn ${paperSize === size ? 'active' : ''}`}
            aria-pressed={paperSize === size}
            onClick={() => setPaperSize(size)}
          >
            {size === 'A4' ? 'A4' : 'Letter'}
          </button>
        ))}
      </div>
      <div className="toggle-group toggle-group-sm" role="group" aria-label="색상 모드">
        {[{ id: 'color', label: '컬러' }, { id: 'bw', label: '흑백' }].map((mode) => (
          <button
            key={mode.id}
            type="button"
            className={`toggle-btn ${colorMode === mode.id ? 'active' : ''}`}
            aria-pressed={colorMode === mode.id}
            onClick={() => setColorMode(mode.id)}
          >
            {mode.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function App() {
  const [activeTab, setActiveTab] = useState('2d');

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="logo-container">
          <Sparkles className="logo-icon" />
          <span className="logo-text">MyPopWorld</span>
        </div>
        <PrintSettings />
      </header>

      <main className="app-main">
        <div className="chat-panel">
          <ChatWindow />
        </div>

        <div className="preview-panel">
          <div className="preview-tabs" role="tablist" aria-label="도안 미리보기 종류">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.id}
                className={`preview-tab ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
                <div className="preview-tab-indicator" />
              </button>
            ))}
          </div>
          {activeTab === '2d' ? <SVGPreview /> : activeTab === 'instructions' ? <Instructions /> : <Preview3D />}
        </div>
      </main>
    </div>
  );
}

export default App;
