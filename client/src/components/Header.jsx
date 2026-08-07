import React from 'react';
import { Shield, Volume2, VolumeX, ShoppingBag, Copy, Check } from 'lucide-react';
import { soundManager } from '../audio/SoundSystem';

export default function Header({ 
  timer, 
  players, 
  roomCode, 
  onOpenStore, 
  isMuted, 
  onToggleMute 
}) {
  const [copied, setCopied] = React.useState(false);
  const playerList = Object.values(players || {});

  const copyRoomLink = () => {
    const link = `${window.location.origin}/play/${roomCode}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    soundManager.playLockAction();
    setTimeout(() => setCopied(false), 2000);
  };

  const progressPercent = Math.max(0, Math.min(100, (timer / 30) * 100));
  const isDanger = timer <= 5;

  return (
    <header className="header-bar">
      {/* Esquerda: Logo & Link da Sala */}
      <div className="logo-group">
        <h1 className="logo-text">Nexus Grid</h1>
        {roomCode && (
          <button 
            className="player-status-badge alive" 
            onClick={copyRoomLink} 
            title="Clique para copiar o link da sala"
            style={{ cursor: 'pointer', border: '1px solid rgba(0, 240, 255, 0.4)' }}
          >
            <span style={{ color: '#00F0FF', fontWeight: 'bold' }}>SALA: {roomCode}</span>
            {copied ? <Check size={14} color="#39FF14" /> : <Copy size={14} color="#00F0FF" />}
          </button>
        )}
      </div>

      {/* Centro: Temporizador de 30s & Barra de Progresso */}
      <div className="timer-section">
        <div className="timer-title">FASE DE PLANEJAMENTO</div>
        <div className={`timer-value ${isDanger ? 'danger' : ''}`}>
          00:{timer < 10 ? `0${timer}` : timer}
        </div>
        <div className="progress-bar-bg">
          <div 
            className={`progress-bar-fill ${isDanger ? 'danger' : ''}`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Direita: Status dos Jogadores & Controles */}
      <div className="players-status-group">
        {playerList.map(p => (
          <div 
            key={p.id} 
            className={`player-status-badge ${p.isAlive ? 'alive' : 'dead'}`}
            style={{ borderColor: p.color }}
          >
            <div className="status-dot" style={{ backgroundColor: p.color }} />
            <div style={{ display: 'flex', flexDirection: 'column', fontSize: '0.75rem' }}>
              <span style={{ fontWeight: 600, color: p.isAlive ? '#fff' : '#64748b' }}>{p.name}</span>
              <span style={{ color: p.color }}>HP: {p.hp}/{p.maxHp}</span>
            </div>
          </div>
        ))}

        <button 
          className="btn-cyber" 
          onClick={onOpenStore} 
          style={{ padding: '8px 12px', fontSize: '0.8rem', background: 'rgba(255, 230, 0, 0.15)', color: '#FFE600', border: '1px solid #FFE600' }}
        >
          <ShoppingBag size={16} /> Loja
        </button>

        <button 
          className="btn-cyber" 
          onClick={onToggleMute}
          style={{ padding: '8px 12px', fontSize: '0.8rem', background: 'rgba(255, 255, 255, 0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}
        >
          {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
        </button>
      </div>
    </header>
  );
}
