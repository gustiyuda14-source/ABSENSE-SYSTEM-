// websocket-client.js — WebSocket client for real-time updates

class WebSocketClient {
  constructor(url) {
    this.url = url;
    this.socket = null;
    this.listeners = [];
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.reconnectDelay = 1000;
    this.isConnected = false;
  }

  connect(token) {
    if (this.socket) return Promise.resolve();

    return new Promise((resolve, reject) => {
      try {
        // Dynamically load Socket.IO client
        if (typeof io === 'undefined') {
          console.error('Socket.IO client not loaded. Add <script src="https://cdn.socket.io/4.5.4/socket.io.min.js"></script>');
          reject(new Error('Socket.IO not available'));
          return;
        }

        this.socket = io(this.url, {
          auth: { token },
          reconnection: true,
          reconnectionDelay: this.reconnectDelay,
          reconnectionDelayMax: 5000,
          reconnectionAttempts: this.maxReconnectAttempts,
        });

        this.socket.on('connect', () => {
          console.log('✓ WebSocket connected');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.emit('connected');
          resolve();
        });

        this.socket.on('disconnect', () => {
          console.log('✗ WebSocket disconnected');
          this.isConnected = false;
          this.emit('disconnected');
        });

        this.socket.on('connect_error', (error) => {
          console.error('WebSocket connection error:', error);
          this.emit('error', error);
        });

        // Setup default event handlers
        this.setupDefaultHandlers();
      } catch (error) {
        reject(error);
      }
    });
  }

  setupDefaultHandlers() {
    // Real-time attendance events
    this.on('attendance:checked-in', (data) => {
      console.log('✓ Employee checked in:', data);
      this.emit('attendance-update', {
        event: 'checked-in',
        data,
      });
    });

    this.on('attendance:checked-out', (data) => {
      console.log('✓ Employee checked out:', data);
      this.emit('attendance-update', {
        event: 'checked-out',
        data,
      });
    });

    // Configuration update events
    this.on('config:updated', (data) => {
      console.log('✓ Config updated:', data);
      this.emit('config-update', data);
    });

    // Notification events
    this.on('notification:warning-issued', (data) => {
      console.log('⚠️ Warning issued:', data);
      this.emit('warning', data);
    });
  }

  on(event, callback) {
    if (!this.socket) {
      console.warn('WebSocket not connected. Event listener may not work.');
      return;
    }
    this.socket.on(event, callback);
  }

  once(event, callback) {
    if (!this.socket) {
      console.warn('WebSocket not connected. Event listener may not work.');
      return;
    }
    this.socket.once(event, callback);
  }

  emit(event, data) {
    if (!this.socket || !this.isConnected) {
      console.warn(`Cannot emit event '${event}': WebSocket not connected`);
      return false;
    }
    this.socket.emit(event, data);
    return true;
  }

  // For internal app event handling
  subscribe(event, callback) {
    this.listeners.push({ event, callback });
    return () => {
      this.listeners = this.listeners.filter((l) => l.event !== event);
    };
  }

  _emit(event, data) {
    this.listeners
      .filter((l) => l.event === event)
      .forEach((l) => l.callback(data));
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      console.log('WebSocket disconnected');
    }
  }

  reconnect(token) {
    this.disconnect();
    return this.connect(token);
  }

  isReady() {
    return this.isConnected && this.socket && this.socket.connected;
  }

  getId() {
    return this.socket?.id;
  }
}

// Create singleton instance
let wsClient = null;

const getWSClient = () => {
  if (!wsClient) {
    const wsUrl = window.WS_URL || window.CONFIG?.WS_URL || 'http://localhost:3000';
    wsClient = new WebSocketClient(wsUrl);
  }
  return wsClient;
};

// Export for use
if (typeof window !== 'undefined') {
  window.getWSClient = getWSClient;
}
