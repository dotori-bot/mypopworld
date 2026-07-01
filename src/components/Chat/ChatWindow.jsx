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
              어떤 주제로 만들기를 하고 싶으신가요? 그리고 이 만들기를 할 <b>아이의 연령대(몇 살)</b>를 먼저 알려주시면, 딱 맞는 재미있는 아이디어들을 추천해 드릴게요!<br/><br/>
              (예: "7살 아이랑 노아의 방주 이야기를 주제로 만들고 싶어")
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
