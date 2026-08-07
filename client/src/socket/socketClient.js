import { io } from 'socket.io-client';

const RENDER_BACKEND_URL = 'https://nexus-grid-server-hb5e.onrender.com';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 
  (window.location.hostname === 'localhost' ? 'http://localhost:3001' : RENDER_BACKEND_URL);

console.log(`🔌 Conectando Socket.io ao servidor: ${SERVER_URL}`);

export const socket = io(SERVER_URL, {
  autoConnect: true,
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionAttempts: 20,
  reconnectionDelay: 1000,
  timeout: 20000
});
