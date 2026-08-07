import { io } from 'socket.io-client';

// URL do Servidor Backend no Render:
// 1. Tenta usar VITE_SERVER_URL se definida no Vercel
// 2. Se for localhost, usa http://localhost:3001
// 3. Caso contrário, usa a URL oficial do Render
const RENDER_BACKEND_URL = 'https://nexus-grid-server-hb5e.onrender.com';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 
  (window.location.hostname === 'localhost' ? 'http://localhost:3001' : RENDER_BACKEND_URL);

console.log(`🔌 Conectando Socket.io ao servidor: ${SERVER_URL}`);

export const socket = io(SERVER_URL, {
  autoConnect: true,
  transports: ['websocket', 'polling']
});
