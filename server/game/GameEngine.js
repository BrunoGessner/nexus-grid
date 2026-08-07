/**
 * GameEngine.js - Gerenciador do Estado da Partida
 */

const { GRID_SIZE, MAX_HEALTH, SPAWN_POSITIONS, PLAYER_COLORS } = require('./Constants');
const ActionResolver = require('./ActionResolver');

class GameEngine {
  constructor() {
    this.gridSize = GRID_SIZE;
    this.players = {}; // socketId -> Player
    this.mines = []; // [{ x, y, ownerId }]
    this.roundCount = 0;
    this.logs = [];
  }

  /**
   * Adiciona um jogador à partida
   */
  addPlayer(socketId, name, avatarSkin = 'cyber_ninja') {
    const existingCount = Object.keys(this.players).length;
    const spawn = SPAWN_POSITIONS[existingCount % SPAWN_POSITIONS.length];
    const color = PLAYER_COLORS[existingCount % PLAYER_COLORS.length];

    this.players[socketId] = {
      id: socketId,
      name: name || `Agente ${existingCount + 1}`,
      x: spawn.x,
      y: spawn.y,
      hp: MAX_HEALTH,
      maxHp: MAX_HEALTH,
      color: color.hex,
      colorName: color.name,
      avatarSkin: avatarSkin,
      isAlive: true,
      isDefending: false,
      readyForRound: false,
      actions: null
    };

    return this.players[socketId];
  }

  /**
   * Remove um jogador da partida
   */
  removePlayer(socketId) {
    if (this.players[socketId]) {
      delete this.players[socketId];
    }
  }

  /**
   * Registra as 3 ações enviadas por um jogador
   */
  submitActions(socketId, actions) {
    if (this.players[socketId] && this.players[socketId].isAlive) {
      this.players[socketId].actions = actions;
      this.players[socketId].readyForRound = true;
    }
  }

  /**
   * Checa se todos os jogadores vivos enviaram suas ações
   */
  areAllPlayersReady() {
    const alivePlayers = Object.values(this.players).filter(p => p.isAlive);
    if (alivePlayers.length === 0) return false;
    return alivePlayers.every(p => p.readyForRound);
  }

  /**
   * Executa a resolução do turno atual
   */
  processTurnResolution() {
    this.roundCount++;

    const actionsMap = {};
    Object.keys(this.players).forEach(id => {
      actionsMap[id] = this.players[id].actions || [];
    });

    const result = ActionResolver.resolveRound(this.players, actionsMap, this.mines);

    // Atualiza o estado interno
    this.players = result.updatedPlayers;
    this.mines = result.updatedMines;
    this.logs.push(...result.combatLogs);

    // Reseta estado de prontidão para a próxima rodada
    Object.keys(this.players).forEach(id => {
      this.players[id].readyForRound = false;
      this.players[id].actions = null;
    });

    // Checa se sobrou apenas 1 jogador vivo ou 0 (empate)
    const alivePlayers = Object.values(this.players).filter(p => p.isAlive);
    let winner = null;
    let isGameOver = false;

    if (alivePlayers.length === 1) {
      winner = alivePlayers[0];
      isGameOver = true;
    } else if (alivePlayers.length === 0) {
      isGameOver = true;
    }

    return {
      round: this.roundCount,
      timeline: result.timelineEvents,
      combatLogs: result.combatLogs,
      players: this.players,
      mines: this.mines,
      isGameOver,
      winner
    };
  }

  /**
   * Reseta o tabuleiro para uma nova partida
   */
  resetGame() {
    this.roundCount = 0;
    this.mines = [];
    this.logs = [];

    const playerKeys = Object.keys(this.players);
    playerKeys.forEach((socketId, index) => {
      const spawn = SPAWN_POSITIONS[index % SPAWN_POSITIONS.length];
      this.players[socketId].x = spawn.x;
      this.players[socketId].y = spawn.y;
      this.players[socketId].hp = MAX_HEALTH;
      this.players[socketId].isAlive = true;
      this.players[socketId].isDefending = false;
      this.players[socketId].readyForRound = false;
      this.players[socketId].actions = null;
    });
  }
}

module.exports = GameEngine;
