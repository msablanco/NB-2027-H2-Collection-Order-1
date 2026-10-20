// Safe localStorage helper with in-memory fallback for iframes and private mode
const memoryStore: Record<string, string> = {};

export function safeGetItem(key: string): string | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const val = window.localStorage.getItem(key);
      if (val !== null) return val;
    }
  } catch {
    // Access denied or not supported in iframe/sandbox
  }
  return memoryStore[key] ?? null;
}

export function safeSetItem(key: string, value: string): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, value);
    }
  } catch {
    // Fallback silently to memory
  }
  memoryStore[key] = value;
}

export function safeRemoveItem(key: string): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(key);
    }
  } catch {
    // Fallback silently to memory
  }
  delete memoryStore[key];
}

export function safeGetJSON<T>(key: string, defaultValue: T): T {
  try {
    const raw = safeGetItem(key);
    if (!raw) return defaultValue;
    return JSON.parse(raw) as T;
  } catch {
    return defaultValue;
  }
}

export function safeSetJSON<T>(key: string, value: T): void {
  try {
    safeSetItem(key, JSON.stringify(value));
  } catch {
    // Fallback silently
  }
}
