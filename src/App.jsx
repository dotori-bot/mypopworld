import React from 'react';
import ChatWindow from './components/Chat/ChatWindow';
import SVGPreview from './components/Preview/SVGPreview';
import { Sparkles } from 'lucide-react';
import './styles/index.css';
import './styles/layout.css';

function App() {
  return (
    <div className="app-container">
      <header className="app-header">
        <div className="logo-container">
          <Sparkles className="logo-icon" />
          <span className="logo-text">MyPopWorld</span>
        </div>
      </header>
      
      <main className="app-main">
        {/* Left Side: Chat */}
        <div className="chat-panel">
          <ChatWindow />
        </div>
        
        {/* Right Side: Preview */}
        <div className="preview-panel">
          <div className="preview-tabs">
            <div className="preview-tab active">
              2D 도안 미리보기
              <div className="preview-tab-indicator" />
            </div>
            <div className="preview-tab">조립 설명서</div>
          </div>
          <SVGPreview />
        </div>
      </main>
    </div>
  );
}

export default App;
