import React, { useState } from 'react';
import useCardStore from '../../store/useCardStore';
import { SendHorizonal, Bot, User } from 'lucide-react';
import '../../styles/chat.css';

export default function ChatWindow() {
  const { messages, addMessage, isTyping, setTyping, setCardParams } = useCardStore();
  const [input, setInput] = useState('');

  const sendMessage = async (text) => {
    if (!text.trim() || isTyping) return;

    const userMsg = { role: 'user', content: text };
    addMessage(userMsg);
    setTyping(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, userMsg] })
      });
      
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      let content = data.text;
      let options = null;
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/);
      
      if (jsonMatch) {
        try {
          const params = JSON.parse(jsonMatch[1]);
          if (params.options) {
            options = params.options;
          } else {
            setCardParams(params);
          }
          content = content.replace(/```json\n[\s\S]*?\n```/, '').trim();
        } catch (e) {
          console.error("Failed to parse JSON from AI response", e);
        }
      }

      addMessage({ role: 'ai', content, options });
    } catch (error) {
      console.error(error);
      addMessage({ role: 'ai', content: '죄송합니다. 오류가 발생했습니다. 다시 시도해주세요.' });
    } finally {
      setTyping(false);
    }
  };

  const handleSend = () => {
    sendMessage(input);
    setInput('');
  };

  return (
    <div className="chat-container">
      <div className="chat-messages">
        {messages.length === 0 && (
          <div className="chat-message ai">
            <div className="message-avatar"><Bot size={20} /></div>
            <div className="message-bubble">
              안녕하세요! 재미있는 종이 공예 장난감과 팝업 카드를 만들어주는 MyPopWorld입니다. ✨<br/><br/>
              어떤 주제로 만들기를 하고 싶으신가요? 아이의 연령대와 주제를 입력해주시면 딱 맞는 아이디어를 추천해 드릴게요!
              
              <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <select 
                  className="chat-input" 
                  id="init-age"
                  style={{ width: '100%', padding: '10px 16px', boxSizing: 'border-box', backgroundColor: 'var(--bg-glass)' }}
                >
                  <option value="4~6세">4~6세 (유아)</option>
                  <option value="7~9세" selected>7~9세 (초등 저학년)</option>
                  <option value="10세 이상">10세 이상 (초등 고학년)</option>
                </select>
                <input 
                  type="text" 
                  placeholder="주제 (예: 노아의 방주, 공룡)" 
                  className="chat-input"
                  id="init-theme"
                  style={{ width: '100%', padding: '10px 16px', boxSizing: 'border-box' }}
                />
                <input 
                  type="text" 
                  placeholder="구체적인 아이디어가 있다면 적어주세요 (선택사항)" 
                  className="chat-input"
                  id="init-idea"
                  style={{ width: '100%', padding: '10px 16px', boxSizing: 'border-box' }}
                />
                <button 
                  className="btn btn-primary" 
                  style={{ alignSelf: 'flex-start', marginTop: '4px' }}
                  onClick={() => {
                    const theme = document.getElementById('init-theme').value;
                    const age = document.getElementById('init-age').value;
                    const idea = document.getElementById('init-idea').value;
                    if(theme) {
                       let prompt = `${age} 아이를 위한 '${theme}' 주제로 재미있는 팝업이나 장난감 아이디어를 제안해줘.`;
                       if (idea) prompt += ` 특히 나는 이런 걸 만들고 싶어: ${idea}. 이 아이디어를 우선적으로 포함해서 제안해줘.`;
                       sendMessage(prompt);
                    }
                  }}
                >
                  아이디어 제안받기
                </button>
              </div>
            </div>
          </div>
        )}
        
        {messages.map((msg, i) => (
          <div key={i} className={`chat-message ${msg.role}`}>
            <div className="message-avatar">
              {msg.role === 'ai' ? <Bot size={20} /> : <User size={20} />}
            </div>
            <div>
              <div className="message-bubble">{msg.content}</div>
              {msg.options && (
                <div className="message-actions">
                  {msg.options.map((opt, idx) => (
                    <button key={idx} className="quick-action-btn" onClick={() => sendMessage(opt)}>
                      {opt}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="chat-message ai">
            <div className="message-avatar"><Bot size={20} /></div>
            <div className="typing-indicator">
              <div className="typing-dot" />
              <div className="typing-dot" />
              <div className="typing-dot" />
            </div>
          </div>
        )}
      </div>

      <div className="chat-input-area">
        <div className="chat-input-wrapper">
          <input
            type="text"
            className="chat-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="여기에 메시지를 입력하세요..."
            disabled={isTyping}
          />
          <button className="chat-send-btn" onClick={handleSend} disabled={isTyping || !input.trim()}>
            <SendHorizonal size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
