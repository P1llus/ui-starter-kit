/** Id helpers. Ids are short readable slugs, often with a type prefix (`svc-billing`). */

/** `Billing API` -> `billing-api`. */
export function slugify(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** `base`, or `base-2`, `base-3`... whichever is free. */
export function uniqueSlug(base: string, taken: (id: string) => boolean): string {
  const root = slugify(base) || 'item';
  if (!taken(root)) return root;
  for (let i = 2; ; i++) {
    const candidate = `${root}-${i}`;
    if (!taken(candidate)) return candidate;
  }
}

/**
 * A counter for ids of objects created while the app runs, continuing after the seeded ones:
 * `const nextId = sequence('act-', 1046)` gives `act-1046`, `act-1047`... `width` zero-pads.
 */
export function sequence(prefix: string, start: number, width = 0): () => string {
  let n = start;
  return () => `${prefix}${String(n++).padStart(width, '0')}`;
}
