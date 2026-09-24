// =============================================================================
// Persistence Adapter — localStorage implementation
// Source of truth: MOCK-DATA.md §Persistence abstraction
//
// Components and stores NEVER import from this file directly.
// Only src/services/*.service.ts touches the persistence layer.
// =============================================================================

export interface PersistenceAdapter {
  get<T>(key: string): T | undefined;
  set<T>(key: string, value: T): void;
  remove(key: string): void;
  clear(): void;
}

const PREFIX = 'millance:';

function fullKey(key: string): string {
  return `${PREFIX}${key}`;
}

export const localStorageAdapter: PersistenceAdapter = {
  get<T>(key: string): T | undefined {
    try {
      const raw = localStorage.getItem(fullKey(key));
      if (raw === null) return undefined;
      return JSON.parse(raw) as T;
    } catch {
      // Corrupted JSON — treat as missing
      return undefined;
    }
  },

  set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(fullKey(key), JSON.stringify(value));
    } catch (e) {
      // Storage quota exceeded — log but don't throw (graceful degradation)
      console.warn('[Millance] localStorage write failed for key:', key, e);
    }
  },

  remove(key: string): void {
    localStorage.removeItem(fullKey(key));
  },

  clear(): void {
    // Only clear keys with our prefix so we don't disturb other apps sharing origin
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(PREFIX)) {
        keysToRemove.push(k);
      }
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));
  },
};

/** Singleton: the adapter used throughout the app */
export const persistence = localStorageAdapter;

// Persistence keys — centralised so a typo doesn't create a silent second store
export const KEYS = {
  AUTH_SESSION:  'auth:session',
  DEMO_CLOCK:    'demo:clock',
  FRANCHISES:    'data:franchises',
  GROUPS:        'data:groups',
  PLANS:         'data:plans',
  USERS:         'data:users',
  PAYMENTS:      'data:payments',
  VAULTS:        'data:vaults',
  DRAWS:         'data:draws',
  PRIZES:        'data:prizes',
  PRODUCTS:      'data:products',
  PURCHASES:     'data:purchases',
  VOUCHERS:      'data:vouchers',
  NOTIFICATIONS: 'data:notifications',
  ACTIVITY_LOG:  'data:activity_log',
  SETTINGS:      'data:settings',
  SEEDED:        'meta:seeded',
} as const;
