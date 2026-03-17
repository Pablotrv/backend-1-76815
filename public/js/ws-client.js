// ======= WebSocket Client =======
(function () {
  const dot = document.getElementById('wsDot');
  const label = document.getElementById('wsLabel');

  function getWsUrl() {
    const proto = location.protocol === 'https:' ? 'wss' : 'ws';
    return `${proto}://${location.host}`;
  }

  function connect() {
    const ws = new WebSocket(getWsUrl());

    ws.onopen = () => {
      dot.className = 'ws-dot connected';
      label.textContent = 'En vivo';
      if (typeof window.onWsConnect === 'function') window.onWsConnect();
    };

    ws.onmessage = (event) => {
      try {
        const { type, data } = JSON.parse(event.data);
        if (typeof window.onWsMessage === 'function') window.onWsMessage(type, data);
        handleGlobalEvents(type, data);
      } catch (e) { console.warn('WS parse error', e); }
    };

    ws.onclose = () => {
      dot.className = 'ws-dot disconnected';
      label.textContent = 'Desconectado';
      if (typeof window.onWsDisconnect === 'function') window.onWsDisconnect();
      setTimeout(connect, 3000); // Reconectar automático
    };

    ws.onerror = () => ws.close();
  }

  function handleGlobalEvents(type, data) {
    if (type === 'order:created') showToast(`Nueva orden #${String(data?.orderId || '').slice(-6)} — $${data?.total}`, 'success');
    if (type === 'order:status_changed') showToast(`Orden actualizada: ${data?.status}`, 'warning');
  }

  connect();
})();

// ======= Toast helper =======
function showToast(msg, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.textContent = msg;
  container.appendChild(t);
  setTimeout(() => t.remove(), 3500);
}

// ======= Cart badge helper =======
function updateCartBadge(count) {
  const badge = document.getElementById('cartBadge');
  if (badge) badge.textContent = count;
}
