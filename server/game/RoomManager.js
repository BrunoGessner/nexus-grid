/**
 * RoomManager.js - Gerenciador Global de Salas de Jogo
 */

const { generateRoomCode } = require('../utils/codeGen');
const Room = require('./Room');

class RoomManager {
  constructor(io) {
    this.io = io;
    this.rooms = {}; // roomCode -> Room Instance
    this.socketToRoomMap = {}; // socketId -> roomCode
  }

  /**
   * Cria uma nova sala e adiciona o host
   */
  createRoom(hostSocketId, hostName, avatarSkin) {
    let roomCode = generateRoomCode();
    while (this.rooms[roomCode]) {
      roomCode = generateRoomCode();
    }

    const room = new Room(roomCode, hostSocketId, this.io);
    this.rooms[roomCode] = room;

    return roomCode;
  }

  /**
   * Entra em uma sala existente
   */
  joinRoom(socketId, roomCode, playerName, avatarSkin) {
    const formattedCode = roomCode.toUpperCase().trim();
    const room = this.rooms[formattedCode];

    if (!room) {
      return { success: false, error: 'Sala não encontrada. Verifique o código do link.' };
    }

    const playerCount = Object.keys(room.engine.players).length;
    if (playerCount >= 4) {
      return { success: false, error: 'A sala já está cheia (máximo 4 jogadores).' };
    }

    this.socketToRoomMap[socketId] = formattedCode;
    const player = room.addPlayer(socketId, playerName, avatarSkin);

    return { success: true, roomCode: formattedCode, player };
  }

  /**
   * Remove o jogador de sua sala atual ao desconectar
   */
  handleDisconnect(socketId) {
    const roomCode = this.socketToRoomMap[socketId];
    if (roomCode && this.rooms[roomCode]) {
      const room = this.rooms[roomCode];
      room.removePlayer(socketId);

      delete this.socketToRoomMap[socketId];

      // Se a sala ficou vazia, deleta a instância
      if (Object.keys(room.engine.players).length === 0) {
        if (room.timerInterval) clearInterval(room.timerInterval);
        delete this.rooms[roomCode];
      }
    }
  }

  /**
   * Retorna a sala do socket
   */
  getRoomBySocket(socketId) {
    const roomCode = this.socketToRoomMap[socketId];
    return roomCode ? this.rooms[roomCode] : null;
  }
}

module.exports = RoomManager;
