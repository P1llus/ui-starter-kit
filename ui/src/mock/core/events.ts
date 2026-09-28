/**
 * A small typed event bus between mock domains, so one domain can react to another without
 * importing its store (and without import cycles).
 *
 * To add an event, add a key to MockEventMap with its payload type. Handlers run
 * synchronously after the emitting action has written its own store.
 */
export interface MockEventMap {
  /** A sample service changed status (sample domain). Replace with the project's events. */
  'sample.service.status': { serviceId: string; status: string };
}

type Handler<K extends keyof MockEventMap> = (payload: MockEventMap[K]) => void;

const handlers = new Map<keyof MockEventMap, Set<Handler<keyof MockEventMap>>>();

export function on<K extends keyof MockEventMap>(name: K, handler: Handler<K>): () => void {
  let set = handlers.get(name);
  if (!set) {
    set = new Set();
    handlers.set(name, set);
  }
  set.add(handler as Handler<keyof MockEventMap>);
  return () => set.delete(handler as Handler<keyof MockEventMap>);
}

export function emit<K extends keyof MockEventMap>(name: K, payload: MockEventMap[K]): void {
  handlers.get(name)?.forEach((handler) => {
    try {
      handler(payload);
    } catch (error) {
      console.error(`[mock] handler for ${name} failed`, error);
    }
  });
}
