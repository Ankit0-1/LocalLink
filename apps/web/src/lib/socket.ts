import { io, type Socket } from 'socket.io-client';
import { env } from '../config/env';

let socket: Socket | null = null;

export function connectSocket(token: string): Socket {
  socket?.disconnect();
  socket = io(env.apiUrl, { auth: { token } });
  return socket;
}

export function disconnectSocket(): void {
  socket?.disconnect();
  socket = null;
}

export function getSocket(): Socket | null {
  return socket;
}
