import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

/**
 * Flyout kinds. Every object that opens in a flyout has a kind and an id, and the URL holds
 * both: `?flyout=service:svc-billing&ftab=activity`. A screenshot script or a pasted link
 * reaches any flyout without clicks. Register kinds in `app/flyouts.ts`.
 */

export interface FlyoutContentProps {
  id: string;
  /** Active tab inside the flyout, from `?ftab=`. */
  tab?: string;
}

type Loader = () => Promise<{ default: ComponentType<FlyoutContentProps> }>;

const kinds = new Map<string, LazyExoticComponent<ComponentType<FlyoutContentProps>>>();

/** Registers a flyout kind. The component loads lazily the first time it opens. */
export function registerFlyoutKind(kind: string, load: Loader): void {
  kinds.set(kind, lazy(load));
}

export function getFlyoutKind(kind: string) {
  return kinds.get(kind);
}

export function flyoutKinds(): string[] {
  return [...kinds.keys()];
}

/** `service:svc-billing` -> `{ kind, id }`; null for anything malformed. */
export function parseFlyoutTarget(value: string | undefined): { kind: string; id: string } | null {
  if (!value) return null;
  const colon = value.indexOf(':');
  if (colon <= 0 || colon === value.length - 1) return null;
  return { kind: value.slice(0, colon), id: value.slice(colon + 1) };
}
