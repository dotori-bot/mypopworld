import React, { useState } from 'react';
import useCardStore from '../../store/useCardStore';
import { SendHorizonal, Bot, User } from 'lucide-react';
import '../../styles/chat.css';

export default function ChatWindow() {
  const { messages, addMessage, isTyping, setTyping, setCardParams } = useCardStore();
  const [input, setInput] = useState('');

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMsg = { role: 'user', content: input };
    addMessage(userMsg);
    setInput('');
    setTyping(true);

    try {
      // API call to our Vercel Serverless Function
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, userMsg] })
      });
      
      const data = await res.json();
      
      if (data.error) throw new Error(data.error);

      // Parse JSON out of the AI response if it exists
      let content = data.text;
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/);
      
      if (jsonMatch) {
        try {
          const params = JSON.parse(jsonMatch[1]);
          setCardParams(params);
          // Remove JSON from displayed text
          content = content.replace(/```json\n[\s\S]*?\n```/, '').trim();
        } catch (e) {
          console.error("Failed to parse JSON from AI response", e);
        }
      }

      addMessage({ role: 'ai', content });
    } catch (error) {
      console.error(error);
      addMessage({ role: 'ai', content: '죄송합니다. 오류가 발생했습니다. 다시 시도해주세요.' });
    } finally {
      setTyping(false);
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-messages">
        {messages.length === 0 && (
          <div className="chat-message ai">
            <div className="message-avatar"><Bot size={20} /></div>
            <div className="message-bubble">
              안녕하세요! MyPopWorld입니다. 어떤 종류의 만들기를 하고 싶으신가요?<br/><br/>
              예: "친구 생일 축하 카드를 V-폴드로 만들래" 또는 "빨대에 꽂아서 부는 나비 장난감을 만들고 싶어!"
            </div>
          </div>
        )}
        
        {messages.map((msg, i) => (
          <div key={i} className={`chat-message ${msg.role}`}>
            <div className="message-avatar">
              {msg.role === 'ai' ? <Bot size={20} /> : <User size={20} />}
            </div>
            <div className="message-bubble">{msg.content}</div>
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
