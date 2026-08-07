import { io } from 'socket.io-client';

// Em produção (Vercel), aponta para a variável de ambiente VITE_SERVER_URL (URL do Render)
// Em desenvolvimento local, aponta para http://localhost:3001
const SERVER_URL = import.meta.env.VITE_SERVER_URL || 
  (window.location.hostname === 'localhost' ? 'http://localhost:3001' : window.location.origin);

export const socket = io(SERVER_URL, {
  autoConnect: true,
  transports: ['websocket', 'polling']
});
