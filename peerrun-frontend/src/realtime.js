import { io } from 'socket.io-client';
import { USE_MOCK, SOCKET_URL } from './config';

// Tiny event bus: stands in for Socket.io while the backend does not exist yet.
const listeners = {};
export const bus = {
  on(e, f) {
    (listeners[e] ||= []).push(f);
    return () => { listeners[e] = listeners[e].filter((x) => x !== f); };
  },
  emit(e, p) { (listeners[e] || []).forEach((f) => f(p)); },
};

const EVENTS = ['errand:accepted', 'errand:updated'];

// Backend contract: emit these events to the requester's socket with
// { errandId, requesterId, title, status, runnerName }
export function connectRealtime(token, onEvent) {
  if (USE_MOCK) {
    const offs = EVENTS.map((e) => bus.on(e, (p) => onEvent(e, p)));
    return () => offs.forEach((off) => off());
  }
  const socket = io(SOCKET_URL, { auth: { token } });
  EVENTS.forEach((e) => socket.on(e, (p) => onEvent(e, p)));
  return () => socket.disconnect();
}
