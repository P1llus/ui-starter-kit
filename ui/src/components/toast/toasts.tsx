import { EuiGlobalToastList, type EuiGlobalToastListToast } from '@elastic/eui';
import { create } from 'zustand';
import type { ActionResult } from '@/mock';

/**
 * One toast list for the app. Toasts are for what the user started (a save, a restart);
 * background changes show as live values and "N new" pills instead.
 *
 * They stack bottom-left: flyouts open from the right and keep their primary action in the
 * bottom-right footer, so a toast there would cover the button the user needs next.
 */

interface ToastState {
  toasts: EuiGlobalToastListToast[];
}

const useToastStore = create<ToastState>()(() => ({ toasts: [] }));
let nextId = 1;

export function addToast(toast: Omit<EuiGlobalToastListToast, 'id'>): void {
  useToastStore.setState((s) => ({ toasts: [...s.toasts, { ...toast, id: `toast-${nextId++}` }] }));
}

/** Turns a mock action result into a success or danger toast. */
export function toastResult(result: ActionResult<unknown>): void {
  addToast({
    title: result.message,
    color: result.ok ? 'success' : 'danger',
    iconType: result.ok ? 'check' : 'warning',
  });
}

export function ToastList() {
  const toasts = useToastStore((s) => s.toasts);
  return (
    <EuiGlobalToastList
      toasts={toasts}
      dismissToast={(t) => useToastStore.setState((s) => ({ toasts: s.toasts.filter((x) => x.id !== t.id) }))}
      toastLifeTimeMs={6000}
      side="left"
    />
  );
}
