import React, { useState } from 'react';
import { Play, Users, Link as LinkIcon, Shield, Sparkles, Copy, Check, Wifi, Loader2 } from 'lucide-react';
import { soundManager } from '../audio/SoundSystem';

const AVATAR_SKINS = [
  { id: 'cyber_ninja', name: 'Cyber Ninja', color: '#00F0FF', icon: '🥷' },
  { id: 'volt_mech', name: 'Volt Mech', color: '#FFE600', icon: '🤖' },
  { id: 'neon_assassin', name: 'Neon Assassin', color: '#FF0055', icon: '⚡' },
  { id: 'phantom_spectre', name: 'Phantom Spectre', color: '#39FF14', icon: '👁️' }
];

export default function Lobby({ 
  onCreateRoom, 
  onJoinRoom, 
  roomData, 
  onStartGame,
  isHost,
  isConnected
}) {
  const [playerName, setPlayerName] = useState('');
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [selectedSkin, setSelectedSkin] = useState(AVATAR_SKINS[0].id);
  const [copiedLink, setCopiedLink] = useState(false);

  // Se já está em uma sala
  if (roomData && roomData.code) {
    const players = Object.values(roomData.players || {});

    const copyInvite = () => {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      soundManager.playLockAction();
      setTimeout(() => setCopiedLink(false), 2000);
    };

    return (
      <div className="lobby-overlay">
        <div className="lobby-card">
          <div style={{ textAlign: 'center' }}>
            <h2 className="logo-text" style={{ fontSize: '1.8rem' }}>SALA DE ESPERA</h2>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: 4 }}>
              Compartilhe o código da sala ou o link com 2 a 4 amigos!
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(0,240,255,0.08)', border: '1px solid #00F0FF', padding: '12px 16px', borderRadius: 8 }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block' }}>CÓDIGO DA SALA</span>
              <span style={{ fontFamily: 'Orbitron', fontWeight: 800, fontSize: '1.4rem', color: '#00F0FF' }}>{roomData.code}</span>
            </div>
            <button className="btn-cyber" onClick={copyInvite} style={{ padding: '8px 16px', fontSize: '0.8rem' }}>
              {copiedLink ? <Check size={16} /> : <Copy size={16} />} {copiedLink ? 'COPIADO!' : 'COPIAR LINK'}
            </button>
          </div>

          {/* Lista de Jogadores na Sala */}
          <div>
            <h4 style={{ fontFamily: 'Share Tech Mono', color: '#00F0FF', fontSize: '0.85rem', marginBottom: 10 }}>
              JOGADORES CONECTADOS ({players.length}/4)
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {players.map((p) => (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.03)', padding: '10px 14px', borderRadius: 6, borderLeft: `4px solid ${p.color}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: '1.2rem' }}>
                      {AVATAR_SKINS.find(s => s.id === p.avatarSkin)?.icon || '🥷'}
                    </span>
                    <div>
                      <div style={{ fontWeight: 600, color: '#fff' }}>{p.name} {p.id === roomData.hostId ? '👑 (Host)' : ''}</div>
                      <div style={{ fontSize: '0.75rem', color: p.color }}>{p.colorName}</div>
                    </div>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#39FF14', fontFamily: 'Share Tech Mono' }}>PRONTO</span>
                </div>
              ))}
            </div>
          </div>

          {/* Botão de Iniciar Partida (Host Apenas) */}
          {isHost ? (
            <button 
              className="btn-cyber btn-magenta" 
              onClick={() => { soundManager.playLockAction(); onStartGame(); }}
              disabled={players.length < 2}
              style={{ width: '100%', justifyContent: 'center', padding: '14px' }}
            >
              <Play size={20} /> INICIAR COMBATE ({players.length}/4)
            </button>
          ) : (
            <div style={{ textAlign: 'center', color: '#FFE600', fontSize: '0.85rem', fontStyle: 'italic' }}>
              Aguardando o Host iniciar a partida...
            </div>
          )}
        </div>
      </div>
    );
  }

  // Menu Inicial
  return (
    <div className="lobby-overlay">
      <div className="lobby-card">
        {/* Status de Conexão */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          fontSize: '0.75rem',
          fontFamily: 'Share Tech Mono',
          padding: '4px 12px',
          borderRadius: 20,
          background: isConnected ? 'rgba(57, 255, 20, 0.1)' : 'rgba(255, 230, 0, 0.1)',
          border: `1px solid ${isConnected ? '#39FF14' : '#FFE600'}`,
          color: isConnected ? '#39FF14' : '#FFE600',
          alignSelf: 'center'
        }}>
          {isConnected ? (
            <><Wifi size={14} /> SERVIDOR ONLINE</>
          ) : (
            <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> CONECTANDO AO SERVIDOR...</>
          )}
        </div>

        <div style={{ textAlign: 'center' }}>
          <h2 className="logo-text" style={{ fontSize: '2.2rem' }}>Nexus Grid</h2>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: 4 }}>
            Estratégia Tática em Grade via Browser com Programação Simultânea
          </p>
        </div>

        {/* Input Nome do Jogador */}
        <div className="form-group">
          <label>Codenome do Agente</label>
          <input 
            type="text" 
            className="input-cyber" 
            placeholder="Ex: Agente Cyber" 
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
          />
        </div>

        {/* Seleção de Skin em Pixel Art */}
        <div className="form-group">
          <label>Avatar & Skin Tática</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
            {AVATAR_SKINS.map((skin) => (
              <div 
                key={skin.id}
                onClick={() => { setSelectedSkin(skin.id); soundManager.playHover(); }}
                style={{
                  background: selectedSkin === skin.id ? 'rgba(0,240,255,0.15)' : 'rgba(255,255,255,0.03)',
                  border: selectedSkin === skin.id ? `2px solid ${skin.color}` : '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 8,
                  padding: 10,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <span style={{ fontSize: '1.6rem' }}>{skin.icon}</span>
                <span style={{ fontSize: '0.65rem', color: skin.color, marginTop: 4, fontFamily: 'Share Tech Mono' }}>{skin.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Botão Criar Nova Sala */}
        <button 
          className="btn-cyber" 
          onClick={() => {
            if (!playerName.trim()) return alert('Por favor digite um codenome.');
            soundManager.playLockAction();
            onCreateRoom(playerName.trim(), selectedSkin);
          }}
          style={{ width: '100%', justifyContent: 'center' }}
        >
          <Sparkles size={18} /> CRIAR NOVA SALA MULTIPLAYER
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, opacity: 0.5 }}>
          <div style={{ flex: 1, height: 1, background: '#fff' }} />
          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>OU ENTRAR COM CÓDIGO</span>
          <div style={{ flex: 1, height: 1, background: '#fff' }} />
        </div>

        {/* Entrar em Sala Existente */}
        <div style={{ display: 'flex', gap: 8 }}>
          <input 
            type="text" 
            className="input-cyber" 
            placeholder="CÓDIGO (EX: A8F2)" 
            value={roomCodeInput}
            onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
            style={{ fontFamily: 'Orbitron', letterSpacing: 2, textTransform: 'uppercase' }}
          />
          <button 
            className="btn-cyber btn-magenta"
            onClick={() => {
              if (!playerName.trim()) return alert('Por favor digite um codenome.');
              if (!roomCodeInput.trim()) return alert('Digite o código da sala.');
              soundManager.playLockAction();
              onJoinRoom(roomCodeInput.trim(), playerName.trim(), selectedSkin);
            }}
          >
            <Users size={18} /> ENTRAR
          </button>
        </div>
      </div>
    </div>
  );
}
