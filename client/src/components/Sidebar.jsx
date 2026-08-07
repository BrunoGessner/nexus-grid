import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, ShieldAlert, Send, ChevronRight, ChevronLeft } from 'lucide-react';
import { soundManager } from '../audio/SoundSystem';

export default function Sidebar({ 
  combatLogs, 
  chatMessages, 
  onSendChat 
}) {
  const [activeTab, setActiveTab] = useState('logs'); // 'logs' ou 'chat'
  const [chatInput, setChatInput] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const logEndRef = useRef(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [combatLogs, chatMessages, activeTab]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (chatInput.trim()) {
      soundManager.playLockAction();
      onSendChat(chatInput);
      setChatInput('');
    }
  };

  return (
    <div className={`sidebar-panel ${isCollapsed ? 'collapsed' : ''}`}>
      {/* Botão de colapsar sidebar */}
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        style={{
          position: 'absolute',
          left: -32,
          top: 20,
          width: 32,
          height: 32,
          background: 'rgba(13, 14, 18, 0.95)',
          border: '1px solid rgba(0, 240, 255, 0.3)',
          borderRight: 'none',
          borderRadius: '4px 0 0 4px',
          color: '#00F0FF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer'
        }}
      >
        {isCollapsed ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
      </button>

      {/* Abas */}
      <div className="sidebar-tabs">
        <button 
          className={`tab-btn ${activeTab === 'logs' ? 'active' : ''}`}
          onClick={() => { setActiveTab('logs'); soundManager.playHover(); }}
        >
          <ShieldAlert size={14} style={{ display: 'inline', marginRight: 6 }} /> LOGS DE COMBATE
        </button>
        <button 
          className={`tab-btn ${activeTab === 'chat' ? 'active' : ''}`}
          onClick={() => { setActiveTab('chat'); soundManager.playHover(); }}
        >
          <MessageSquare size={14} style={{ display: 'inline', marginRight: 6 }} /> CHAT DA SALA
        </button>
      </div>

      {/* Conteúdo da Aba: LOGS DE COMBATE */}
      {activeTab === 'logs' && (
        <div className="sidebar-content">
          {combatLogs.length === 0 ? (
            <div style={{ color: '#64748b', fontSize: '0.8rem', fontStyle: 'italic', textAlign: 'center', marginTop: 40 }}>
              Aguardando início do combate...
            </div>
          ) : (
            combatLogs.map((log, index) => (
              <div key={index} className="log-item">
                {log}
              </div>
            ))
          )}
          <div ref={logEndRef} />
        </div>
      )}

      {/* Conteúdo da Aba: CHAT DA SALA */}
      {activeTab === 'chat' && (
        <div className="sidebar-content">
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {chatMessages.map((msg) => (
              <div key={msg.id} style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '6px 10px', borderRadius: 4, fontSize: '0.8rem' }}>
                <span style={{ color: msg.sender === 'SYSTEM' ? '#FFE600' : '#00F0FF', fontWeight: 600 }}>
                  [{msg.time}] {msg.sender}:
                </span>{' '}
                <span style={{ color: '#e2e8f0' }}>{msg.text}</span>
              </div>
            ))}
            <div ref={logEndRef} />
          </div>

          <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: 6, marginTop: 10 }}>
            <input 
              type="text" 
              className="input-cyber" 
              placeholder="Digite uma mensagem..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              style={{ padding: '8px 12px', fontSize: '0.85rem' }}
            />
            <button type="submit" className="btn-cyber" style={{ padding: '8px 12px' }}>
              <Send size={14} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
