/**
 * index.js - Servidor Principal Nexus Grid (Express + Socket.io Autoritativo)
 * Configurado para produção no Render.com com suporte total a CORS público
 */

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const RoomManager = require('./game/RoomManager');

const app = express();

// Permite todas as origens para evitar bloqueio por CORS no frontend Vercel/Netlify
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST']
}));

app.use(express.json());

const server = http.createServer(app);

// Socket.io com suporte completo a WebSocket e Polling
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  },
  transports: ['websocket', 'polling']
});

const roomManager = new RoomManager(io);

// Endpoints HTTP
app.get('/', (req, res) => {
  res.send(`
    <div style="font-family: sans-serif; background: #0b0c10; color: #00F0FF; height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center;">
      <h1>⚡ Servidor Backend Nexus Grid está 100% ONLINE!</h1>
      <p style="color: #ffffff;">Este é o servidor de API/WebSocket. Para jogar o jogo, acesse a URL da <strong>Vercel</strong> do seu frontend.</p>
    </div>
  `);
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
