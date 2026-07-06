import React, { useState } from 'react';
import ChatWindow from './components/Chat/ChatWindow';
import ExpertPanel from './components/Expert/ExpertPanel';
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
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const { messages, pages, resetChat, appMode, setAppMode } = useCardStore();

  const hasUnsavedWork = messages.length > 0 || pages.length > 0;

  const handleLogoClick = () => {
    if (hasUnsavedWork) {
      setShowLeaveConfirm(true);
    }
  };

  const handleConfirmLeave = () => {
    resetChat();
    setActiveTab('2d');
    setShowLeaveConfirm(false);
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <button
          type="button"
          className="logo-container logo-button"
          onClick={handleLogoClick}
          aria-label="MyPopWorld 처음 화면으로 이동"
        >
          <Sparkles className="logo-icon" />
          <span className="logo-text">MyPopWorld</span>
        </button>
        <div className="toggle-group toggle-group-sm app-mode-toggle" role="group" aria-label="사용 모드">
          {[{ id: 'kids', label: '어린이 모드' }, { id: 'expert', label: '전문가 모드' }].map((m) => (
            <button
              key={m.id}
              type="button"
              className={`toggle-btn ${appMode === m.id ? 'active' : ''}`}
              aria-pressed={appMode === m.id}
              onClick={() => setAppMode(m.id)}
            >
              {m.label}
            </button>
          ))}
        </div>
      </header>

      <main className="app-main">
        <div className="chat-panel">
          {appMode === 'expert' ? <ExpertPanel /> : <ChatWindow />}
        </div>

        <div className="preview-panel">
          <div className="preview-tabs" role="tablist" aria-label="도안 미리보기 종류">
            <div className="preview-tabs-list">
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
            <PrintSettings />
          </div>
          {activeTab === '2d' ? <SVGPreview /> : activeTab === 'instructions' ? <Instructions /> : <Preview3D />}
        </div>
      </main>

      {showLeaveConfirm && (
        <div className="modal-overlay" onClick={() => setShowLeaveConfirm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>작업 중인 내용이 있어요</h3>
            <p>
              처음 화면으로 돌아가면 지금까지 만든 카드 아이디어와 대화 내용이 사라져요.
              그래도 나가시겠어요?
            </p>
            <div className="modal-actions">
              <button type="button" className="btn btn-secondary btn-md" onClick={() => setShowLeaveConfirm(false)}>
                취소
              </button>
              <button type="button" className="btn btn-primary btn-md" onClick={handleConfirmLeave}>
                나가기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
