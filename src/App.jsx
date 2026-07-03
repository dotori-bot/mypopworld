import React, { useState } from 'react';
import ChatWindow from './components/Chat/ChatWindow';
import SVGPreview from './components/Preview/SVGPreview';
import Instructions from './components/Preview/Instructions';
import Preview3D from './components/Preview/Preview3D';
import { Sparkles } from 'lucide-react';
import './styles/index.css';
import './styles/layout.css';

function App() {
  const [activeTab, setActiveTab] = useState('2d');

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="logo-container">
          <Sparkles className="logo-icon" />
          <span className="logo-text">MyPopWorld</span>
        </div>
      </header>
      
      <main className="app-main">
        <div className="chat-panel">
          <ChatWindow />
        </div>
        
        <div className="preview-panel">
          <div className="preview-tabs">
            <div 
              className={`preview-tab ${activeTab === '2d' ? 'active' : ''}`}
              onClick={() => setActiveTab('2d')}
            >
              2D 도안 미리보기
              <div className="preview-tab-indicator" />
            </div>
            <div
              className={`preview-tab ${activeTab === 'instructions' ? 'active' : ''}`}
              onClick={() => setActiveTab('instructions')}
            >
              조립 설명서
              <div className="preview-tab-indicator" />
            </div>
            <div
              className={`preview-tab ${activeTab === '3d' ? 'active' : ''}`}
              onClick={() => setActiveTab('3d')}
            >
              3D 미리보기
              <div className="preview-tab-indicator" />
            </div>
          </div>
          {activeTab === '2d' ? <SVGPreview /> : activeTab === 'instructions' ? <Instructions /> : <Preview3D />}
        </div>
      </main>
    </div>
  );
}

export default App;
