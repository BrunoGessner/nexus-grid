/**
 * ActionResolver.js - Motor de Resolução Simultânea Autoritativo
 */

const { GRID_SIZE, GAME_BALANCING, ACTION_TYPES } = require('./Constants');

class ActionResolver {
  /**
   * Processa os 3 Ticks da rodada a partir do estado atual e das ações enviadas.
   * @param {Object} playersState - Mapa { socketId: PlayerObject }
   * @param {Object} actionsMap - Mapa { socketId: [action1, action2, action3] }
   * @param {Array} minesGrid - Matriz ou lista de minas ativas no mapa
   * @returns {Object} { updatedPlayers, updatedMines, timelineEvents, combatLogs }
   */
  static resolveRound(playersState, actionsMap, minesGrid = []) {
    // Clona o estado dos jogadores para processamento
    const players = JSON.parse(JSON.stringify(playersState));
    let mines = [...minesGrid];
    const timelineEvents = []; // Lista de Ticks para animação no cliente
    const combatLogs = [];

    // Loop através dos 3 Ticks
    for (let tickIndex = 0; tickIndex < 3; tickIndex++) {
      const tickEvents = [];
      const tickActions = {};

      // 1. Coleta a ação de cada jogador vivo para este Tick
      Object.keys(players).forEach(id => {
        const player = players[id];
        if (player.isAlive) {
          const pActions = actionsMap[id] || [ACTION_TYPES.IDLE, ACTION_TYPES.IDLE, ACTION_TYPES.IDLE];
          tickActions[id] = pActions[tickIndex] || ACTION_TYPES.IDLE;
        }
      });

      // 2. FASE DE MOVIMENTO
      const movementIntents = {};
      const targetOccupants = {};

      Object.keys(tickActions).forEach(id => {
        const action = tickActions[id];
        const player = players[id];
        let targetX = player.x;
        let targetY = player.y;

        if (action === ACTION_TYPES.MOVE_NORTH) targetY = Math.max(0, player.y - 1);
        else if (action === ACTION_TYPES.MOVE_SOUTH) targetY = Math.min(GRID_SIZE - 1, player.y + 1);
        else if (action === ACTION_TYPES.MOVE_WEST) targetX = Math.max(0, player.x - 1);
        else if (action === ACTION_TYPES.MOVE_EAST) targetX = Math.min(GRID_SIZE - 1, player.x + 1);

        movementIntents[id] = { fromX: player.x, fromY: player.y, toX: targetX, toY: targetY, isMoving: (targetX !== player.x || targetY !== player.y) };

        const key = `${targetX},${targetY}`;
        if (!targetOccupants[key]) targetOccupants[key] = [];
        targetOccupants[key].push(id);
      });

      // Checa colisões (Múltiplos jogando na mesma célula ou Swap de posição)
      const moveSuccess = {};
      Object.keys(movementIntents).forEach(id => {
        const intent = movementIntents[id];
        if (!intent.isMoving) {
          moveSuccess[id] = true;
          return;
        }

        const targetKey = `${intent.toX},${intent.toY}`;

        // Verificação 1: Mais de um jogador indo para a mesma célula
        if (targetOccupants[targetKey].length > 1) {
          moveSuccess[id] = false;
        } else {
          // Verificação 2: Troca de posição direta (Swap)
          const occupantAtTarget = Object.keys(players).find(otherId => 
            otherId !== id && players[otherId].x === intent.toX && players[otherId].y === intent.toY
          );

          if (occupantAtTarget && movementIntents[occupantAtTarget]) {
            const otherIntent = movementIntents[occupantAtTarget];
            if (otherIntent.toX === intent.fromX && otherIntent.toY === intent.fromY) {
              moveSuccess[id] = false; // Colisão frontal
            }
          }
        }

        if (moveSuccess[id] === undefined) {
          moveSuccess[id] = true;
        }
      });

      // Aplica Movimentos e Colisões
      Object.keys(movementIntents).forEach(id => {
        const intent = movementIntents[id];
        const player = players[id];

        if (intent.isMoving) {
          if (moveSuccess[id]) {
            player.x = intent.toX;
            player.y = intent.toY;
            tickEvents.push({
              type: 'MOVE',
              playerId: id,
              from: { x: intent.fromX, y: intent.fromY },
              to: { x: intent.toX, y: intent.toY }
            });

            // Checar se pisou em mina
            const mineIndex = mines.findIndex(m => m.x === player.x && m.y === player.y && m.ownerId !== id);
            if (mineIndex !== -1) {
              const mine = mines[mineIndex];
              mines.splice(mineIndex, 1);
              player.hp = Math.max(0, player.hp - GAME_BALANCING.MINE_DAMAGE);
              tickEvents.push({
                type: 'MINE_EXPLODE',
                victimId: id,
                position: { x: player.x, y: player.y },
                damage: GAME_BALANCING.MINE_DAMAGE
              });
              combatLogs.push(`💣 [Mina] ${player.name} pisou em uma mina cibernética (-${GAME_BALANCING.MINE_DAMAGE} HP)!`);
            }
          } else {
            // Dano de Colisão
            player.hp = Math.max(0, player.hp - GAME_BALANCING.COLLISION_DAMAGE);
            tickEvents.push({
              type: 'COLLISION',
              playerId: id,
              position: { x: intent.toX, y: intent.toY },
              damage: GAME_BALANCING.COLLISION_DAMAGE
            });
            combatLogs.push(`💥 [Impacto] ${player.name} colidiu com outro jogador (-${GAME_BALANCING.COLLISION_DAMAGE} HP)!`);
          }
        }
      });

      // 3. FASE DE DEFESA E SABOTAGEM
      Object.keys(tickActions).forEach(id => {
        const action = tickActions[id];
        const player = players[id];
        if (!player.isAlive) return;

        if (action === ACTION_TYPES.DEFEND) {
          player.isDefending = true;
          tickEvents.push({ type: 'DEFEND', playerId: id });
        } else {
          player.isDefending = false;
        }

        if (action === ACTION_TYPES.SABOTAGE) {
          // Planta mina na célula atual
          const existingMine = mines.find(m => m.x === player.x && m.y === player.y);
          if (!existingMine) {
            mines.push({ x: player.x, y: player.y, ownerId: id });
            tickEvents.push({ type: 'SABOTAGE', playerId: id, position: { x: player.x, y: player.y } });
            combatLogs.push(`⚡ [Sabotagem] ${player.name} armou uma mina tática.`);
          }
        }
      });

      // 4. FASE DE ATAQUES E LASERS
      Object.keys(tickActions).forEach(id => {
        const action = tickActions[id];
        const attacker = players[id];
        if (!attacker.isAlive) return;

        if (action.startsWith('ATTACK_')) {
          let dirX = 0, dirY = 0;
          let dirName = '';

          if (action === ACTION_TYPES.ATTACK_NORTH) { dirY = -1; dirName = 'Norte'; }
          else if (action === ACTION_TYPES.ATTACK_SOUTH) { dirY = 1; dirName = 'Sul'; }
          else if (action === ACTION_TYPES.ATTACK_WEST) { dirX = -1; dirName = 'Oeste'; }
          else if (action === ACTION_TYPES.ATTACK_EAST) { dirX = 1; dirName = 'Leste'; }

          const laserPath = [];
          let hitPlayer = null;

          for (let step = 1; step <= GAME_BALANCING.ATTACK_RANGE; step++) {
            const checkX = attacker.x + dirX * step;
            const checkY = attacker.y + dirY * step;

            if (checkX < 0 || checkX >= GRID_SIZE || checkY < 0 || checkY >= GRID_SIZE) break;

            laserPath.push({ x: checkX, y: checkY });

            // Procura se tem algum jogador nesta posição
            const victim = Object.values(players).find(p => p.isAlive && p.x === checkX && p.y === checkY);
            if (victim) {
              hitPlayer = victim;
              break; // Laser acerta o primeiro jogador no caminho
            }
          }

          let damageDealt = 0;
          let damageReflected = 0;

          if (hitPlayer) {
            if (hitPlayer.isDefending) {
              damageDealt = Math.round(GAME_BALANCING.ATTACK_DAMAGE * (1 - GAME_BALANCING.DEFEND_DAMAGE_REDUCTION));
              damageReflected = Math.round(GAME_BALANCING.ATTACK_DAMAGE * GAME_BALANCING.DEFEND_REFLECT_RATIO);

              hitPlayer.hp = Math.max(0, hitPlayer.hp - damageDealt);
              attacker.hp = Math.max(0, attacker.hp - damageReflected);

              combatLogs.push(`🛡️ [Escudo] ${hitPlayer.name} bloqueou o laser de ${attacker.name}! Tomou apenas ${damageDealt} de dano e refletiu ${damageReflected}!`);
            } else {
              damageDealt = GAME_BALANCING.ATTACK_DAMAGE;
              hitPlayer.hp = Math.max(0, hitPlayer.hp - damageDealt);
              combatLogs.push(`🎯 [Disparo] ${attacker.name} acertou um disparo laser em ${hitPlayer.name} (-${damageDealt} HP)!`);
            }
          } else {
            combatLogs.push(`🔫 [Disparo] ${attacker.name} disparou para o ${dirName}, mas não acertou ninguém.`);
          }

          tickEvents.push({
            type: 'ATTACK',
            attackerId: id,
            path: laserPath,
            hitTarget: hitPlayer ? {
              id: hitPlayer.id,
              damageDealt,
              damageReflected,
              wasDefending: hitPlayer.isDefending
            } : null
          });
        }
      });

      // 5. VERIFICAÇÃO DE ELIMINAÇÕES APÓS O TICK
      Object.keys(players).forEach(id => {
        const p = players[id];
        if (p.isAlive && p.hp <= 0) {
          p.isAlive = false;
          p.hp = 0;
          tickEvents.push({ type: 'ELIMINATION', victimId: id });
          combatLogs.push(`☠️ [Eliminação] ${p.name} foi destruído e eliminado da partida!`);
        }
      });

      timelineEvents.push({
        tickIndex,
        events: tickEvents,
        snapshot: JSON.parse(JSON.stringify(players))
      });
    }

    return {
      updatedPlayers: players,
      updatedMines: mines,
      timelineEvents,
      combatLogs
    };
  }
}

module.exports = ActionResolver;
