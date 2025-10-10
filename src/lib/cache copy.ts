type Entry<T> = { data: T; ts: number };

export class Cache<T> {
  private mem = new Map<string, Entry<T>>();
  private storage: Storage | null = typeof window !== 'undefined' ? window.localStorage : null;
  constructor(private ttl: number, private prefix: string, private maxSize = Infinity) {}

  get(key: string): T | null {
    const now = Date.now();
    const e = this.mem.get(key);
    if (e) {
      if (now - e.ts < this.ttl) {
        // promote for LRU
        this.mem.delete(key);
        this.mem.set(key, e);
        return e.data;
      }
      // expired: cleanup
      this.mem.delete(key);
      if (this.storage) {
        try {
          this.storage.removeItem(this.prefix + key);
        } catch {}
      }
    }
    try {
      if (this.storage) {
        const stored = this.storage.getItem(this.prefix + key);
        if (stored) {
          const parsed: Entry<T> = JSON.parse(stored);
          if (now - parsed.ts < this.ttl) {
            this.mem.set(key, parsed);
            return parsed.data;
          } else {
            // cleanup expired persisted entry
            try {
              this.storage.removeItem(this.prefix + key);
            } catch {}
          }
        }
      }
    } catch {}
    return null;
  }

  set(key: string, data: T) {
    const now = Date.now();
    const entry: Entry<T> = { data, ts: now };
    // promote if exists
    if (this.mem.has(key)) this.mem.delete(key);
    this.mem.set(key, entry);

    // enforce max size (evict oldest)
    if (this.mem.size > this.maxSize) {
      const oldestKey = this.mem.keys().next().value as string | undefined;
      if (oldestKey !== undefined) {
        this.mem.delete(oldestKey);
        if (this.storage) {
          try {
            this.storage.removeItem(this.prefix + oldestKey);
          } catch {}
        }
      }
    }

    if (this.storage) {
      try {
        this.storage.setItem(this.prefix + key, JSON.stringify(entry));
      } catch {}
    }
  }

  delete(key: string) {
    this.mem.delete(key);
    if (this.storage) {
      try {
        this.storage.removeItem(this.prefix + key);
      } catch {}
    }
  }

  clear() {
    this.mem.clear();
    if (!this.storage) return;
    // Iterate localStorage keys without materializing them all
    for (let i = this.storage.length - 1; i >= 0; i--) {
      const k = this.storage.key(i);
      if (k && k.startsWith(this.prefix)) {
        try {
          this.storage.removeItem(k);
        } catch {}
      }
    }
  }
}