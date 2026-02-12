import { EventEmitter } from 'events';

export const chatEmitter = new EventEmitter();
export const adminEmitter = new EventEmitter();

export function emitChatUpdate(sessionId?: string) {
  chatEmitter.emit('chat:update', { sessionId, ts: Date.now() });
}

export function emitOrdersUpdate(orderId?: string) {
  adminEmitter.emit('orders:update', { orderId, ts: Date.now() });
}

export function emitTicketsUpdate(ticketId?: string) {
  adminEmitter.emit('tickets:update', { ticketId, ts: Date.now() });
}

export function emitInventoryUpdate(logId?: string) {
  adminEmitter.emit('inventory:update', { logId, ts: Date.now() });
}
