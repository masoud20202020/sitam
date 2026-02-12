import { chatEmitter, adminEmitter } from '@/lib/chatEvents';

export async function GET(request: Request) {
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();

  const send = (obj: unknown) => {
    writer.write(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
  };

  const chatListener = (payload: Record<string, unknown>) => {
    send({ type: 'chat:update', ...(payload || {}) });
  };
  const ordersListener = (payload: Record<string, unknown>) => {
    send({ type: 'orders:update', ...(payload || {}) });
  };
  const ticketsListener = (payload: Record<string, unknown>) => {
    send({ type: 'tickets:update', ...(payload || {}) });
  };
  const inventoryListener = (payload: Record<string, unknown>) => {
    send({ type: 'inventory:update', ...(payload || {}) });
  };

  chatEmitter.on('chat:update', chatListener);
  adminEmitter.on('orders:update', ordersListener);
  adminEmitter.on('tickets:update', ticketsListener);
  adminEmitter.on('inventory:update', inventoryListener);
  send({ type: 'connected' });

  const keepAlive = setInterval(() => {
    writer.write(encoder.encode(': ping\n\n'));
  }, 20000);

  const close = () => {
    clearInterval(keepAlive);
    chatEmitter.off('chat:update', chatListener);
    adminEmitter.off('orders:update', ordersListener);
    adminEmitter.off('tickets:update', ticketsListener);
    adminEmitter.off('inventory:update', inventoryListener);
    writer.close();
  };

  try {
    const reqAny = request as unknown as { signal?: { addEventListener?: (type: string, cb: () => void) => void } };
    reqAny.signal?.addEventListener?.('abort', close);
  } catch {}

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
