// Storage helpers. Every access is wrapped: private browsing or blocked storage
// must never break the flow, it just means nothing is remembered.

function safe(storage) {
  return {
    get(key, fallback = null) {
      try {
        const raw = storage().getItem(key);
        return raw === null ? fallback : JSON.parse(raw);
      } catch {
        return fallback;
      }
    },
    set(key, value) {
      try {
        storage().setItem(key, JSON.stringify(value));
      } catch {
        /* storage unavailable */
      }
    },
    remove(key) {
      try {
        storage().removeItem(key);
      } catch {
        /* storage unavailable */
      }
    },
  };
}

export const local = safe(() => window.localStorage);
// Simulation progress and the current report live only for this tab session.
export const session = safe(() => window.sessionStorage);

export const KEYS = {
  accounts: "ch.accounts",
  auth: "ch.auth",
  sim: "ch.sim",
  report: "ch.report",
  surveys: "ch.surveys",
  voice: "ch.voice",
};
