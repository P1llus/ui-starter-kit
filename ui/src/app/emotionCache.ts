import createEmotion from '@emotion/css/create-instance';

/**
 * The style cache for every `css` prop and EUI component. Without one, EuiProvider falls back
 * to a cache that writes one <style> tag per rule, and a big mount (a data-heavy page) can
 * spend a third of its time inserting tags. This one adds rules with
 * `insertRule`. The key keeps EUI's `css-` class names.
 */
export const { cache: emotionCache } = createEmotion({ key: 'css', speedy: true });

// A vendor pseudo-element or pseudo-class, such as EuiProgress's `::-moz-progress-bar`.
const VENDOR_PSEUDO = /::?-(?:moz|webkit|ms)-[a-z-]+/g;
const probe = typeof CSSStyleSheet !== 'undefined' ? new CSSStyleSheet() : null;
const parses = new Map<string, boolean>();

/** Whether this browser parses a selector with `pseudo`, tested once on a detached sheet. */
function browserParses(pseudo: string): boolean {
  let ok = parses.get(pseudo);
  if (ok === undefined) {
    try {
      probe?.insertRule(`a${pseudo}{}`);
      ok = true;
    } catch {
      ok = false;
    }
    parses.set(pseudo, ok);
  }
  return ok;
}

/**
 * `insertRule` throws on a selector the browser can't parse, and emotion logs each one as a
 * console error in dev (EuiProgress's `::-moz-progress-bar` in Chromium). Such a rule can never
 * apply in this browser, so it is skipped before the insert.
 */
const insert = emotionCache.sheet.insert.bind(emotionCache.sheet);
emotionCache.sheet.insert = (rule: string) => {
  const selector = rule.slice(0, rule.indexOf('{'));
  const pseudos = selector.match(VENDOR_PSEUDO);
  if (pseudos && !pseudos.every(browserParses)) return;
  insert(rule);
};
