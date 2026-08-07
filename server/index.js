/**
 * index.js - Servidor Principal Nexus Grid (Express + Socket.io Autoritativo)
 * Configurado para produção no Render.com e suporte a CORS dinâmico
 */

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const RoomManager = require('./game/RoomManager');

const app = express();

// Permite origens cruzadas em Produção (Vercel/Netlify) e Desenvolvimento
const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:3000',
  'http://localhost:5173'
].filter(Boolean);

app.use(cors({
  origin: allowedOrigins.length > 0 && process.env.CLIENT_URL ? allowedOrigins : '*',
  credentials: true
}));

app.use(express.json());

const server = http.createServer(app);

// Socket.io com suporte a WebSocket e Polling para hospedagem no Render
const io = new Server(server, {
  cors: {
    origin: allowedOrigins.length > 0 && process.env.CLIENT_URL ? allowedOrigins : '*',
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

const roomManager = new RoomManager(io);

// Endpoints HTTP Básicos
app.get('/', (req, res) => {
  res.send('⚡ Servidor Nexus Grid Backend está Online!');
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'online', game: 'Nexus Grid', timestamp: new Date() });
});

// Eventos do WebSocket (Socket.io)
io.on('connection', (socket) => {
  console.log(`⚡ Novo jogador conectado: ${socket.id}`);

  // Criar uma nova sala
  socket.on('create_room', ({ playerName, avatarSkin }) => {
    const roomCode = roomManager.createRoom(socket.id, playerName, avatarSkin);
    socket.join(roomCode);
    const result = roomManager.joinRoom(socket.id, roomCode, playerName, avatarSkin);

    socket.emit('room_created', {
      success: true,
      roomCode,
      player: result.player
    });
    console.log(`🎮 Sala [${roomCode}] criada por ${playerName} (${socket.id})`);
  });

  // Entrar em uma sala existente pelo código
  socket.on('join_room', ({ roomCode, playerName, avatarSkin }) => {
    const result = roomManager.joinRoom(socket.id, roomCode, playerName, avatarSkin);

    if (result.success) {
      socket.join(result.roomCode);
      socket.emit('room_joined', {
        success: true,
        roomCode: result.roomCode,
        player: result.player
      });
      console.log(`👥 ${playerName} entrou na sala [${result.roomCode}]`);
    } else {
      socket.emit('room_joined', {
        success: false,
        error: result.error
      });
    }
  });

  // Iniciar a partida (Host)
  socket.on('start_game', () => {
    const room = roomManager.getRoomBySocket(socket.id);
    if (room) {
      const res = room.startGame(socket.id);
      if (!res.success) {
        socket.emit('game_error', { message: res.error });
      }
    }
  });

  // Enviar os 3 comandos da rodada (Fase de Planejamento)
  socket.on('submit_actions', ({ actions }) => {
    const room = roomManager.getRoomBySocket(socket.id);
    if (room) {
      room.submitPlayerActions(socket.id, actions);
    }
  });

  // Enviar mensagem no chat da sala
  socket.on('send_chat', ({ text }) => {
    const room = roomManager.getRoomBySocket(socket.id);
    if (room) {
      const player = room.engine.players[socket.id];
      if (player && text && text.trim().length > 0) {
        room.addChatMessage(player.name, text.trim());
      }
    }
  });

  // Desconexão do jogador
  socket.on('disconnect', () => {
    console.log(`❌ Jogador desconectado: ${socket.id}`);
    roomManager.handleDisconnect(socket.id);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Servidor Nexus Grid rodando na porta ${PORT}`);
});
