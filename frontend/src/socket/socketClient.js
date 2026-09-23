import { io } from 'socket.io-client';

let socket = null;

export const getSocketUrl = () => {
  if (import.meta.env.VITE_SOCKET_URL) {
    return import.meta.env.VITE_SOCKET_URL;
  }

  const apiBase = import.meta.env.VITE_API_BASE_URL;
  if (apiBase && (apiBase.startsWith('http://') || apiBase.startsWith('https://'))) {
    try {
      const url = new URL(apiBase);
      return url.origin;
    } catch {
    
    }
  }


  if (typeof window !== 'undefined') {
    return window.location.origin;
  }

  return 'http://localhost:8000';
};

export const connectSocket = (token) => {
  if (socket && socket.connected) {
    return socket;
  }

  if (socket) {
    socket.disconnect();
  }

  const socketUrl = getSocketUrl();
  console.log(`[SocketClient] Connecting to Socket.io server at: ${socketUrl}`);

  socket = io(socketUrl, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1500,
    withCredentials: true,
  });

  socket.on('connect', () => {
    console.log(`[SocketClient] Connected successfully! Socket ID: ${socket.id}`);
  });

  socket.on('connect_error', (err) => {
    console.warn(`[SocketClient] Connection error: ${err.message}`);
  });

  socket.on('disconnect', (reason) => {
    console.log(`[SocketClient] Disconnected: ${reason}`);
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    console.log('[SocketClient] Disconnecting socket...');
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = () => socket;
