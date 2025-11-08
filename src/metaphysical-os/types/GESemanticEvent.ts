export interface GESemanticEvent<T = any> {
  eventType: string;
  moduleId: string;
  timestamp: number;
  payload: T;
  semanticLabels: string[];
  metadata?: Record<string, any>;
}

export type EventSubscriber<T = any> = (event: GESemanticEvent<T>) => void | Promise<void>;

export interface EventSubscription {
  eventType: string;
  subscriber: EventSubscriber;
  unsubscribe: () => void;
}
