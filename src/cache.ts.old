type Entry<T> = { data: T; ts: number };

export class Cache<T> {
  private mem = new Map<string, Entry<T>>();
  constructor(private ttl: number, private prefix: string) {}

  get(key: string): T | null {
    const e = this.mem.get(key);
    if (e && Date.now() - e.ts < this.ttl) return e.data;
    try {
      const stored = localStorage.getItem(this.prefix + key);
      if (stored) {
        const parsed: Entry<T> = JSON.parse(stored);
        if (Date.now() - parsed.ts < this.ttl) {
          this.mem.set(key, parsed);
          return parsed.data;
        }
      }
    } catch {}
    return null;
  }

  set(key: string, data: T) {
    const entry = { data, ts: Date.now() };
    this.mem.set(key, entry);
    try {
      localStorage.setItem(this.prefix + key, JSON.stringify(entry));
    } catch {}
  }

  delete(key: string) {
    this.mem.delete(key);
    localStorage.removeItem(this.prefix + key);
  }

  clear() {
    this.mem.clear();
    Object.keys(localStorage).forEach(k => {
      if (k.startsWith(this.prefix)) localStorage.removeItem(k);
    });
  }
}