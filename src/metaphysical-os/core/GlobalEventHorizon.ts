import { GESemanticEvent, EventSubscriber, EventSubscription } from '../types/GESemanticEvent';

class GlobalEventHorizonSingleton {
  private subscribers: Map<string, Set<EventSubscriber>> = new Map();
  private eventLog: GESemanticEvent[] = [];
  private maxLogSize = 1000;

  emit<T>(event: GESemanticEvent<T>): void {
    this.logEvent(event);

    const eventSubscribers = this.subscribers.get(event.eventType);
    if (eventSubscribers) {
      eventSubscribers.forEach(subscriber => {
        try {
          const result = subscriber(event);
          if (result instanceof Promise) {
            result.catch(error => {
              console.error(`Error in async event subscriber for ${event.eventType}:`, error);
            });
          }
        } catch (error) {
          console.error(`Error in event subscriber for ${event.eventType}:`, error);
        }
      });
    }

    const wildcardSubscribers = this.subscribers.get('*');
    if (wildcardSubscribers) {
      wildcardSubscribers.forEach(subscriber => {
        try {
          subscriber(event);
        } catch (error) {
          console.error('Error in wildcard event subscriber:', error);
        }
      });
    }
  }

  subscribe<T>(eventType: string, subscriber: EventSubscriber<T>): EventSubscription {
    if (!this.subscribers.has(eventType)) {
      this.subscribers.set(eventType, new Set());
    }

    this.subscribers.get(eventType)!.add(subscriber as EventSubscriber);

    return {
      eventType,
      subscriber: subscriber as EventSubscriber,
      unsubscribe: () => this.unsubscribe(eventType, subscriber as EventSubscriber)
    };
  }

  unsubscribe(eventType: string, subscriber: EventSubscriber): void {
    const eventSubscribers = this.subscribers.get(eventType);
    if (eventSubscribers) {
      eventSubscribers.delete(subscriber);
      if (eventSubscribers.size === 0) {
        this.subscribers.delete(eventType);
      }
    }
  }

  private logEvent(event: GESemanticEvent): void {
    this.eventLog.push(event);
    if (this.eventLog.length > this.maxLogSize) {
      this.eventLog.shift();
    }
  }

  getEventLog(): GESemanticEvent[] {
    return [...this.eventLog];
  }

  getRecentEvents(count: number = 10): GESemanticEvent[] {
    return this.eventLog.slice(-count);
  }

  clearEventLog(): void {
    this.eventLog = [];
  }
}

export const GlobalEventHorizon = new GlobalEventHorizonSingleton();
