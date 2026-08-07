import React, { useState } from 'react';
import { 
  ArrowUp, ArrowDown, ArrowLeft, ArrowRight, 
  Crosshair, Shield, Zap, Lock, Trash2, CheckCircle2 
} from 'lucide-react';
import { soundManager } from '../audio/SoundSystem';

export default function CommandDock({ 
  onSubmitActions, 
  isLocked, 
  isPlanningPhase,
  myPlayer
}) {
  const [selectedActions, setSelectedActions] = useState([null, null, null]);
  const [activeSlotIndex, setActiveSlotIndex] = useState(0);

  const isAlive = myPlayer ? myPlayer.isAlive : true;

  const handleSelectAction = (actionType) => {
    if (isLocked || !isPlanningPhase || !isAlive) return;

    soundManager.playLockAction();

    const newActions = [...selectedActions];
    newActions[activeSlotIndex] = actionType;
    setSelectedActions(newActions);

    // Avança automaticamente para o próximo slot se houver
    if (activeSlotIndex < 2) {
      setActiveSlotIndex(activeSlotIndex + 1);
    }
  };

  const handleClearSlot = (index, e) => {
    e.stopPropagation();
    if (isLocked || !isPlanningPhase || !isAlive) return;

    soundManager.playHover();
    const newActions = [...selectedActions];
    newActions[index] = null;
    setSelectedActions(newActions);
    setActiveSlotIndex(index);
  };

  const handleConfirmTurn = () => {
    if (isLocked || !isPlanningPhase || !isAlive) return;

    // Substitui slots vazios por IDLE
    const finalActions = selectedActions.map(act => act || 'IDLE');
    soundManager.playLockAction();
    onSubmitActions(finalActions);
  };

  const getActionLabel = (act) => {
    if (!act) return null;
    if (act.startsWith('MOVE_')) {
      const dir = act.split('_')[1];
      return <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ fontSize: '0.7rem' }}>MOVER</span> {getDirIcon(dir)}</div>;
    }
    if (act.startsWith('ATTACK_')) {
      const dir = act.split('_')[1];
      return <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#FF0055' }}><Crosshair size={14} /> {getDirIcon(dir)}</div>;
    }
    if (act === 'DEFEND') return <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#FFE600' }}><Shield size={14} /> ESCUDO</div>;
    if (act === 'SABOTAGE') return <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#39FF14' }}><Zap size={14} /> MINA</div>;
    return 'IDLE';
  };

  const getDirIcon = (dir) => {
    if (dir === 'NORTH') return <ArrowUp size={14} />;
    if (dir === 'SOUTH') return <ArrowDown size={14} />;
    if (dir === 'WEST') return <ArrowLeft size={14} />;
    if (dir === 'EAST') return <ArrowRight size={14} />;
    return null;
  };

  return (
    <footer className="command-dock">
      {/* 1. SLOTS DE COMANDO (1, 2, 3) */}
      <div className="dock-slots-container">
        {selectedActions.map((action, idx) => (
          <div 
            key={idx}
            className={`dock-slot ${action ? 'filled' : ''} ${activeSlotIndex === idx ? 'active-selecting' : ''}`}
            onClick={() => setActiveSlotIndex(idx)}
            onMouseEnter={() => soundManager.playHover()}
            style={{
              borderColor: activeSlotIndex === idx ? '#00F0FF' : undefined,
              boxShadow: activeSlotIndex === idx ? '0 0 15px rgba(0, 240, 255, 0.4)' : undefined
            }}
          >
            <span className="slot-number">0{idx + 1}</span>
            {action ? (
              <>
                {getActionLabel(action)}
                {!isLocked && (
                  <button 
                    onClick={(e) => handleClearSlot(idx, e)}
                    style={{ position: 'absolute', bottom: 4, right: 4, background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </>
            ) : (
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>SLOT {idx + 1}</span>
            )}
          </div>
        ))}
      </div>

      {/* 2. PAINEL DE SELEÇÃO DE AÇÕES */}
      <div className="action-selector-group">
        {/* Movimentos */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: '0.65rem', fontFamily: 'Share Tech Mono', color: '#00F0FF' }}>MOVIMENTO</span>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4 }}>
            <button className="action-card-btn move" onClick={() => handleSelectAction('MOVE_NORTH')} onMouseEnter={() => soundManager.playHover()}><ArrowUp size={16} /><span>Norte</span></button>
            <button className="action-card-btn move" onClick={() => handleSelectAction('MOVE_SOUTH')} onMouseEnter={() => soundManager.playHover()}><ArrowDown size={16} /><span>Sul</span></button>
            <button className="action-card-btn move" onClick={() => handleSelectAction('MOVE_WEST')} onMouseEnter={() => soundManager.playHover()}><ArrowLeft size={16} /><span>Oeste</span></button>
            <button className="action-card-btn move" onClick={() => handleSelectAction('MOVE_EAST')} onMouseEnter={() => soundManager.playHover()}><ArrowRight size={16} /><span>Leste</span></button>
          </div>
        </div>

        {/* Ataques */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: '0.65rem', fontFamily: 'Share Tech Mono', color: '#FF0055' }}>LASER ATAQUE</span>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4 }}>
            <button className="action-card-btn attack" onClick={() => handleSelectAction('ATTACK_NORTH')} onMouseEnter={() => soundManager.playHover()}><Crosshair size={16} /><span>Norte</span></button>
            <button className="action-card-btn attack" onClick={() => handleSelectAction('ATTACK_SOUTH')} onMouseEnter={() => soundManager.playHover()}><Crosshair size={16} /><span>Sul</span></button>
            <button className="action-card-btn attack" onClick={() => handleSelectAction('ATTACK_WEST')} onMouseEnter={() => soundManager.playHover()}><Crosshair size={16} /><span>Oeste</span></button>
            <button className="action-card-btn attack" onClick={() => handleSelectAction('ATTACK_EAST')} onMouseEnter={() => soundManager.playHover()}><Crosshair size={16} /><span>Leste</span></button>
          </div>
        </div>

        {/* Defesa e Sabotagem */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: '0.65rem', fontFamily: 'Share Tech Mono', color: '#FFE600' }}>TÁTICO</span>
          <div style={{ display: 'flex', gap: 4 }}>
            <button className="action-card-btn defend" onClick={() => handleSelectAction('DEFEND')} onMouseEnter={() => soundManager.playHover()}><Shield size={16} /><span>Escudo</span></button>
            <button className="action-card-btn sabotage" onClick={() => handleSelectAction('SABOTAGE')} onMouseEnter={() => soundManager.playHover()}><Zap size={16} /><span>Mina</span></button>
          </div>
        </div>
      </div>

      {/* 3. BOTÃO DE CONFIRMAR / LOCK */}
      <button 
        className={`btn-cyber ${isLocked ? 'btn-magenta' : ''}`}
        onClick={handleConfirmTurn}
        disabled={isLocked || !isPlanningPhase || !isAlive}
      >
        {isLocked ? (
          <><CheckCircle2 size={18} /> COMANDOS TRAVADOS</>
        ) : (
          <><Lock size={18} /> CONFIRMAR COMANDOS</>
        )}
      </button>
    </footer>
  );
}
