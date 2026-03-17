const WebSocket = require('ws');

let wss = null;

const initWebSocket = (server) => {
  wss = new WebSocket.Server({ server });

  wss.on('connection', (ws, req) => {
    const ip = req.socket.remoteAddress;
    console.log(`🔌 WebSocket conectado desde ${ip}`);

    ws.send(JSON.stringify({ type: 'connected', message: 'Conectado al servidor en tiempo real' }));

    ws.on('message', (data) => {
      try {
        const msg = JSON.parse(data);
        console.log('📨 Mensaje recibido:', msg);
        // Echo de vuelta al cliente
        ws.send(JSON.stringify({ type: 'echo', data: msg }));
      } catch (e) {
        ws.send(JSON.stringify({ type: 'error', message: 'Formato JSON inválido' }));
      }
    });

    ws.on('close', () => console.log('🔌 WebSocket desconectado'));
    ws.on('error', (err) => console.error('❌ WS Error:', err.message));
  });

  return wss;
};

// Broadcast a TODOS los clientes conectados
const broadcast = (type, data) => {
  if (!wss) return;
  const payload = JSON.stringify({ type, data, timestamp: new Date().toISOString() });
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
};

// Emitir evento específico
const emitEvent = (type, data) => broadcast(type, data);

const getConnectedClients = () => wss ? wss.clients.size : 0;

module.exports = { initWebSocket, broadcast, emitEvent, getConnectedClients };
