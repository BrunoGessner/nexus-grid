/**
 * Room.js - Gerenciador de Máquina de Estados da Sala Multiplayer
 */

const { ROOM_STATES, TURN_TIME_LIMIT, MIN_PLAYERS_TO_START } = require('./Constants');
const GameEngine = require('./GameEngine');

class Room {
  constructor(roomCode, hostSocketId, io) {
    this.code = roomCode;
    this.hostId = hostSocketId;
    this.io = io;

    this.state = ROOM_STATES.LOBBY;
    this.engine = new GameEngine();
    this.timer = TURN_TIME_LIMIT;
    this.timerInterval = null;
    this.chatMessages = [];
  }

  /**
   * Adiciona um jogador à sala
   */
  addPlayer(socketId, name, avatarSkin) {
    const player = this.engine.addPlayer(socketId, name, avatarSkin);
    this.addChatMessage('SYSTEM', `${player.name} entrou na sala.`);
    this.broadcastRoomState();
    return player;
  }

  /**
   * Remove um jogador da sala
   */
  removePlayer(socketId) {
    const player = this.engine.players[socketId];
    if (player) {
      this.addChatMessage('SYSTEM', `${player.name} saiu da sala.`);
      this.engine.removePlayer(socketId);

      // Se o host saiu, repassa o comando da sala
      if (socketId === this.hostId) {
        const remainingIds = Object.keys(this.engine.players);
        if (remainingIds.length > 0) {
          this.hostId = remainingIds[0];
          this.addChatMessage('SYSTEM', `${this.engine.players[this.hostId].name} agora é o host da sala.`);
        }
      }

      // Se durante o planejamento todos os restantes responderem, resolve
      if (this.state === ROOM_STATES.PLANNING && this.engine.areAllPlayersReady()) {
        this.executeResolutionPhase();
      }

      this.broadcastRoomState();
    }
  }

  /**
   * Transmite o estado completo da sala para todos os clientes no canal Socket.io da sala
   */
  broadcastRoomState() {
    this.io.to(this.code).emit('room_state_update', {
      code: this.code,
      hostId: this.hostId,
      state: this.state,
      players: this.engine.players,
      timer: this.timer,
      round: this.engine.roundCount,
      chatMessages: this.chatMessages
    });
  }

  /**
   * Adiciona mensagem ao chat da sala
   */
  addChatMessage(senderName, text) {
    const msg = {
      id: Date.now() + Math.random().toString(36).substring(2, 5),
      sender: senderName,
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    this.chatMessages.push(msg);
    if (this.chatMessages.length > 50) this.chatMessages.shift(); // Limite de 50 mensagens
    this.io.to(this.code).emit('chat_message', msg);
  }

  /**
   * Inicia a partida (Host apenas)
   */
  startGame(socketId) {
    if (socketId !== this.hostId) return { success: false, error: 'Apenas o Host pode iniciar a partida.' };

    const playerCount = Object.keys(this.engine.players).length;
    if (playerCount < MIN_PLAYERS_TO_START) {
      return { success: false, error: `Necessário pelo menos ${MIN_PLAYERS_TO_START} jogadores para iniciar.` };
    }

    this.engine.resetGame();
    this.addChatMessage('SYSTEM', '🔥 Partida iniciada! Fase de Planejamento aberta.');
    this.startPlanningPhase();
    return { success: true };
  }

  /**
   * Fase de Planejamento (30 segundos)
   */
  startPlanningPhase() {
    this.state = ROOM_STATES.PLANNING;
    this.timer = TURN_TIME_LIMIT;
    this.broadcastRoomState();

    if (this.timerInterval) clearInterval(this.timerInterval);

    this.timerInterval = setInterval(() => {
      this.timer--;
      
      // Notifica o tempo restante em tempo real
      this.io.to(this.code).emit('timer_tick', { timer: this.timer });

      if (this.timer <= 0) {
        clearInterval(this.timerInterval);
        this.executeResolutionPhase();
      }
    }, 1000);
  }

  /**
   * Envio de ações pelo jogador
   */
  submitPlayerActions(socketId, actions) {
    if (this.state !== ROOM_STATES.PLANNING) return;

    this.engine.submitActions(socketId, actions);
    this.broadcastRoomState();

    // Se todos confirmaram antes do tempo acabar
    if (this.engine.areAllPlayersReady()) {
      if (this.timerInterval) clearInterval(this.timerInterval);
      this.executeResolutionPhase();
    }
  }

  /**
   * Transição para Fase de Resolução Simultânea
   */
  executeResolutionPhase() {
    this.state = ROOM_STATES.RESOLVING;
    this.broadcastRoomState();

    // Processa a resolução simultânea
    const result = this.engine.processTurnResolution();

    // Transmite a timeline de animações e logs para todos os clientes
    this.io.to(this.code).emit('turn_resolution_data', {
      round: result.round,
      timeline: result.timeline,
      combatLogs: result.combatLogs,
      players: result.players,
      mines: result.mines,
      isGameOver: result.isGameOver,
      winner: result.winner
    });

    if (result.isGameOver) {
      this.state = ROOM_STATES.GAME_OVER;
      const winnerName = result.winner ? result.winner.name : 'Ninguém (Empate)';
      this.addChatMessage('SYSTEM', `🏆 Fim de Partida! Vencedor: ${winnerName}`);
      this.broadcastRoomState();
    } else {
      // Após 6.5 segundos de animação dramática no cliente, inicia próximo turno
      setTimeout(() => {
        if (this.state === ROOM_STATES.RESOLVING) {
          this.startPlanningPhase();
        }
      }, 6500);
    }
  }
}

module.exports = Room;
