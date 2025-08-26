export interface BusEvent {
  type: 'JOB_PUBLISHED' | 'JOB_NOTIFIED' | 'APPLICATION_ADDED' | 'APP_STATUS_CHANGED' | 'DM_SENT' | 'DM_REPLY';
  timestamp: number;
  data: any;
}

class EventBus {
  private channel: BroadcastChannel | null = null;
  private listeners = new Map<string, Function[]>();
  private fallbackKey = 'shokuninboshu_events';

  constructor() {
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        this.channel = new BroadcastChannel('shokuninboshu');
        this.channel.onmessage = (event) => {
          this.handleMessage(event.data);
        };
      }
    } catch (error) {
      console.warn('BroadcastChannel not available, using localStorage fallback');
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key === this.fallbackKey && e.newValue) {
          try {
            const event = JSON.parse(e.newValue);
            this.handleMessage(event);
          } catch (error) {
            console.warn('Failed to parse fallback event:', error);
          }
        }
      });
    }
  }

  private handleMessage(event: BusEvent) {
    const listeners = this.listeners.get(event.type) || [];
    listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in event listener:', error);
      }
    });
  }

  emit(type: BusEvent['type'], data: any) {
    const event: BusEvent = {
      type,
      timestamp: Date.now(),
      data
    };

    if (this.channel) {
      this.channel.postMessage(event);
    } else {
      try {
        localStorage.setItem(this.fallbackKey, JSON.stringify(event));
        localStorage.removeItem(this.fallbackKey);
      } catch (error) {
        console.warn('Failed to emit event via localStorage:', error);
      }
    }

    this.handleMessage(event);
  }

  on(type: BusEvent['type'], listener: (event: BusEvent) => void) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, []);
    }
    this.listeners.get(type)!.push(listener);
  }

  off(type: BusEvent['type'], listener: (event: BusEvent) => void) {
    const listeners = this.listeners.get(type);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  destroy() {
    if (this.channel) {
      this.channel.close();
    }
    this.listeners.clear();
  }
}

export const bus = new EventBus();