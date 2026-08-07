import React from 'react';
import { X, Award, Palette, Sparkles, Check } from 'lucide-react';
import { soundManager } from '../audio/SoundSystem';

export default function NexusStore({ 
  nexusPoints, 
  onClose, 
  unlockedItems, 
  onUnlockItem 
}) {
  const storeItems = [
    { id: 'palette_synthwave', name: 'Paleta Synthwave Neon', cost: 100, type: 'palette', desc: 'Desbloqueia os tons Violeta e Cyan Ultra' },
    { id: 'skin_cyber_dragon', name: 'Skin Dragão Cibernético', cost: 250, type: 'skin', desc: 'Avatar em pixel art exclusivo com rastro de fogo' },
    { id: 'trail_plasma', name: 'Rastro de Plasma Neon', cost: 150, type: 'trail', desc: 'Efeito de partículas ao se mover pelo tabuleiro' }
  ];

  return (
    <div className="lobby-overlay">
      <div className="lobby-card" style={{ width: 540 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 className="logo-text" style={{ fontSize: '1.6rem' }}>NEXUS STORE</h2>
            <p style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Resgate recompensas com seus Nexus Points</p>
          </div>
          <button 
            onClick={() => { soundManager.playHover(); onClose(); }}
            style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
          >
            <X size={24} />
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255, 230, 0, 0.1)', border: '1px solid #FFE600', padding: '12px 16px', borderRadius: 8 }}>
          <Award color="#FFE600" size={24} />
          <div>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block' }}>SEUS NEXUS POINTS</span>
            <span style={{ fontFamily: 'Orbitron', fontWeight: 800, fontSize: '1.3rem', color: '#FFE600' }}>{nexusPoints} NP</span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {storeItems.map((item) => {
            const isUnlocked = unlockedItems.includes(item.id);
            const canAfford = nexusPoints >= item.cost;

            return (
              <div 
                key={item.id}
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 8,
                  padding: '14px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, color: '#fff' }}>{item.name}</div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 2 }}>{item.desc}</div>
                  <div style={{ fontSize: '0.75rem', color: '#FFE600', fontFamily: 'Share Tech Mono', marginTop: 4 }}>
                    CUSTO: {item.cost} NP
                  </div>
                </div>

                {isUnlocked ? (
                  <span style={{ color: '#39FF14', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'Share Tech Mono' }}>
                    <Check size={16} /> ADQUIRIDO
                  </span>
                ) : (
                  <button 
                    className="btn-cyber"
                    disabled={!canAfford}
                    onClick={() => {
                      soundManager.playLockAction();
                      onUnlockItem(item.id, item.cost);
                    }}
                    style={{ padding: '8px 14px', fontSize: '0.8rem' }}
                  >
                    <Sparkles size={14} /> RESGATAR
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
