import React, { useEffect, useRef } from 'react';
import { soundManager } from '../audio/SoundSystem';

const GRID_SIZE = 10;
const CELL_SIZE = 56;
const CANVAS_SIZE = GRID_SIZE * CELL_SIZE; // 560x560 px

export default function GameCanvas({ 
  players, 
  mines, 
  resolutionData, 
  onAnimationEnd 
}) {
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);

  // Armazena posições locais para animação fluida
  const renderStateRef = useRef({
    players: JSON.parse(JSON.stringify(players || {})),
    mines: [...(mines || [])],
    activeLasers: [],
    activeExplosions: [],
    floatingTexts: []
  });

  // Atualiza posições base quando não está em animação
  useEffect(() => {
    if (!resolutionData) {
      renderStateRef.current.players = JSON.parse(JSON.stringify(players || {}));
      renderStateRef.current.mines = [...(mines || [])];
    }
  }, [players, mines, resolutionData]);

  // Efeito principal de animação quando recebe resolução de turno
  useEffect(() => {
    if (!resolutionData || !resolutionData.timeline) return;

    soundManager.playRewind();

    const timeline = resolutionData.timeline;
    let tickIdx = 0;

    const playNextTick = () => {
      if (tickIdx >= timeline.length) {
        if (onAnimationEnd) onAnimationEnd();
        return;
      }

      const tickData = timeline[tickIdx];
      const events = tickData.events;

      // Executa os sons dos eventos deste Tick
      events.forEach(evt => {
        if (evt.type === 'ATTACK') soundManager.playLaser();
        if (evt.type === 'MINE_EXPLODE' || evt.type === 'COLLISION' || evt.type === 'ELIMINATION') {
          soundManager.playExplosion();
        }
      });

      // Adiciona efeitos visuais temporários (Lasers, Explosões, Números de Dano)
      events.forEach(evt => {
        if (evt.type === 'ATTACK' && evt.path) {
          renderStateRef.current.activeLasers.push({
            path: evt.path,
            color: evt.attackerId ? (players[evt.attackerId]?.color || '#00F0FF') : '#00F0FF',
            life: 1.0
          });
        }
        if (evt.type === 'ATTACK' && evt.hitTarget) {
          const victim = players[evt.hitTarget.id];
          if (victim) {
            renderStateRef.current.floatingTexts.push({
              text: `-${evt.hitTarget.damageDealt}`,
              x: victim.x * CELL_SIZE + CELL_SIZE / 2,
              y: victim.y * CELL_SIZE,
              color: '#FF0055',
              life: 1.0
            });
          }
        }
        if (evt.type === 'COLLISION') {
          renderStateRef.current.activeExplosions.push({
            x: evt.position.x * CELL_SIZE + CELL_SIZE / 2,
            y: evt.position.y * CELL_SIZE + CELL_SIZE / 2,
            radius: 25,
            life: 1.0
          });
        }
      });

      // Atualiza o snapshot dos jogadores para a posição final do Tick
      renderStateRef.current.players = JSON.parse(JSON.stringify(tickData.snapshot));

      tickIdx++;
      setTimeout(playNextTick, 1800); // 1.8 segundos por Tick
    };

    const timerTimeout = setTimeout(playNextTick, 600);

    return () => clearTimeout(timerTimeout);
  }, [resolutionData]);

  // Loop de Renderização do Canvas (60 FPS)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const render = () => {
      // 1. Limpa o Fundo
      ctx.fillStyle = '#0b0c10';
      ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

      // 2. Desenha a Grade 10x10
      for (let x = 0; x < GRID_SIZE; x++) {
        for (let y = 0; y < GRID_SIZE; y++) {
          const posX = x * CELL_SIZE;
          const posY = y * CELL_SIZE;

          // Células alternadas com tom sutil
          ctx.fillStyle = (x + y) % 2 === 0 ? 'rgba(20, 24, 36, 0.6)' : 'rgba(14, 17, 26, 0.6)';
          ctx.fillRect(posX, posY, CELL_SIZE, CELL_SIZE);

          // Borda neon da grade
          ctx.strokeStyle = 'rgba(0, 240, 255, 0.08)';
          ctx.lineWidth = 1;
          ctx.strokeRect(posX, posY, CELL_SIZE, CELL_SIZE);
        }
      }

      // 3. Desenha Minas Ativas
      renderStateRef.current.mines.forEach(mine => {
        const cx = mine.x * CELL_SIZE + CELL_SIZE / 2;
        const cy = mine.y * CELL_SIZE + CELL_SIZE / 2;

        ctx.save();
        ctx.fillStyle = 'rgba(255, 0, 85, 0.3)';
        ctx.beginPath();
        ctx.arc(cx, cy, 14 + Math.sin(Date.now() / 200) * 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#FF0055';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#FF0055';
        ctx.font = 'bold 12px Share Tech Mono';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('💣', cx, cy);
        ctx.restore();
      });

      // 4. Desenha Lasers Ativos
      renderStateRef.current.activeLasers.forEach((laser, index) => {
        if (laser.life <= 0) return;

        ctx.save();
        ctx.strokeStyle = laser.color;
        ctx.shadowColor = laser.color;
        ctx.shadowBlur = 15;
        ctx.lineWidth = 6 * laser.life;

        laser.path.forEach(pt => {
          const lx = pt.x * CELL_SIZE + CELL_SIZE / 2;
          const ly = pt.y * CELL_SIZE + CELL_SIZE / 2;
          ctx.beginPath();
          ctx.arc(lx, ly, 10, 0, Math.PI * 2);
          ctx.stroke();
        });

        ctx.restore();
        laser.life -= 0.03;
      });
      renderStateRef.current.activeLasers = renderStateRef.current.activeLasers.filter(l => l.life > 0);

      // 5. Desenha Explosões
      renderStateRef.current.activeExplosions.forEach(exp => {
        if (exp.life <= 0) return;
        ctx.save();
        ctx.fillStyle = `rgba(255, 230, 0, ${exp.life * 0.6})`;
        ctx.beginPath();
        ctx.arc(exp.x, exp.y, exp.radius * (2 - exp.life), 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        exp.life -= 0.05;
      });
      renderStateRef.current.activeExplosions = renderStateRef.current.activeExplosions.filter(e => e.life > 0);

      // 6. Desenha os Jogadores (Avatares Cyber)
      const currentPlayers = renderStateRef.current.players || {};
      Object.values(currentPlayers).forEach(player => {
        if (!player.isAlive) return;

        const px = player.x * CELL_SIZE + CELL_SIZE / 2;
        const py = player.y * CELL_SIZE + CELL_SIZE / 2;

        ctx.save();

        // Glow externo
        ctx.shadowColor = player.color;
        ctx.shadowBlur = 12;

        // Corpo do Avatar
        ctx.fillStyle = player.color;
        ctx.beginPath();
        ctx.arc(px, py, 18, 0, Math.PI * 2);
        ctx.fill();

        // Núcleo interno
        ctx.fillStyle = '#0b0c10';
        ctx.beginPath();
        ctx.arc(px, py, 10, 0, Math.PI * 2);
        ctx.fill();

        // Escudo Ativo
        if (player.isDefending) {
          ctx.strokeStyle = '#FFE600';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(px, py, 24, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Barra de Vida acima da cabeça
        const hpPercent = player.hp / player.maxHp;
        const barW = 40;
        const barH = 5;
        const barX = px - barW / 2;
        const barY = py - 30;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(barX, barY, barW, barH);

        ctx.fillStyle = hpPercent > 0.5 ? '#39FF14' : hpPercent > 0.25 ? '#FFE600' : '#FF0055';
        ctx.fillRect(barX, barY, barW * hpPercent, barH);

        // Nome do Jogador
        ctx.fillStyle = '#ffffff';
        ctx.font = '10px Outfit';
        ctx.textAlign = 'center';
        ctx.fillText(player.name, px, py + 32);

        ctx.restore();
      });

      // 7. Desenha Textos Flutuantes de Dano
      renderStateRef.current.floatingTexts.forEach(txt => {
        if (txt.life <= 0) return;
        ctx.save();
        ctx.fillStyle = txt.color;
        ctx.font = 'bold 16px Orbitron';
        ctx.textAlign = 'center';
        ctx.fillText(txt.text, txt.x, txt.y - (1 - txt.life) * 20);
        ctx.restore();
        txt.life -= 0.02;
      });
      renderStateRef.current.floatingTexts = renderStateRef.current.floatingTexts.filter(t => t.life > 0);

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  return (
    <div className="canvas-container">
      <canvas 
        ref={canvasRef} 
        width={CANVAS_SIZE} 
        height={CANVAS_SIZE} 
        className="game-canvas" 
      />
    </div>
  );
}
