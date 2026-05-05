// offline-manager.js — Offline request queue management for PWA

class OfflineManager {
  constructor() {
    this.queue = this.loadQueue();
    this.isOnline = navigator.onLine;
    this.listeners = [];

    // Listen for online/offline events
    window.addEventListener('online', () => this.handleOnline());
    window.addEventListener('offline', () => this.handleOffline());
  }

  loadQueue() {
    const stored = localStorage.getItem('offlineQueue');
    return stored ? JSON.parse(stored) : [];
  }

  saveQueue() {
    localStorage.setItem('offlineQueue', JSON.stringify(this.queue));
  }

  addRequest(request) {
    const queuedRequest = {
      id: Date.now() + Math.random(),
      timestamp: new Date().toISOString(),
      ...request,
    };

    this.queue.push(queuedRequest);
    this.saveQueue();
    this.notifyListeners({ event: 'request-queued', request: queuedRequest });

    return queuedRequest.id;
  }

  removeRequest(id) {
    this.queue = this.queue.filter((req) => req.id !== id);
    this.saveQueue();
  }

  getQueue() {
    return [...this.queue];
  }

  getQueueLength() {
    return this.queue.length;
  }

  async flushQueue() {
    if (!this.isOnline || this.queue.length === 0) {
      return;
    }

    console.log(`Flushing offline queue (${this.queue.length} requests)...`);
    this.notifyListeners({ event: 'flush-start' });

    const results = [];
    const failed = [];

    for (const request of this.queue) {
      try {
        const response = await this.executeRequest(request);
        results.push({ id: request.id, success: true, response });
        this.removeRequest(request.id);
      } catch (error) {
        console.error('Failed to flush request:', request.id, error);
        failed.push({ id: request.id, error: error.message });
      }
    }

    this.notifyListeners({
      event: 'flush-complete',
      results,
      failed,
    });

    return { results, failed };
  }

  async executeRequest(request) {
    const { method, endpoint, data, headers } = request;
    const url = `${window.API_BASE_URL}${endpoint}`;
    const token = window.authService?.getToken();

    const config = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    if (data) {
      config.body = JSON.stringify(data);
    }

    const response = await fetch(url, config);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  }

  handleOnline() {
    console.log('✓ Back online');
    this.isOnline = true;
    this.notifyListeners({ event: 'online' });

    // Automatically flush queue
    if (this.queue.length > 0) {
      console.log(`Syncing ${this.queue.length} queued requests...`);
      this.flushQueue();
    }
  }

  handleOffline() {
    console.log('✗ Offline');
    this.isOnline = false;
    this.notifyListeners({ event: 'offline' });
  }

  onStatusChange(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  notifyListeners(event) {
    this.listeners.forEach((callback) => callback(event));
  }

  clearQueue() {
    this.queue = [];
    this.saveQueue();
  }

  isOffline() {
    return !this.isOnline;
  }
}

// Create singleton instance
const offlineManager = new OfflineManager();

// Export for use
if (typeof window !== 'undefined') {
  window.offlineManager = offlineManager;
}
