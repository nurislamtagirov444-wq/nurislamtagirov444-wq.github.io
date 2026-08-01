// Порт хранилища (SPEC §6): web -> localStorage, APK -> Preferences (позже), тесты -> память.
export interface StoragePort {
  get(key: string): string | null;
  set(key: string, value: string): void;
  remove(key: string): void;
  keys(): string[];
}

export class LocalStoragePort implements StoragePort {
  get(key: string): string | null {
    try {
      return globalThis.localStorage?.getItem(key) ?? null;
    } catch {
      return null;
    }
  }
  set(key: string, value: string): void {
    try {
      globalThis.localStorage?.setItem(key, value);
    } catch {
      // переполнение/приватный режим: молча терять нельзя — но и падать нельзя; UI покажет ошибку сохранения
    }
  }
  remove(key: string): void {
    try {
      globalThis.localStorage?.removeItem(key);
    } catch {
      /* noop */
    }
  }
  keys(): string[] {
    try {
      const ls = globalThis.localStorage;
      if (!ls) return [];
      const out: string[] = [];
      for (let i = 0; i < ls.length; i++) {
        const k = ls.key(i);
        if (k) out.push(k);
      }
      return out;
    } catch {
      return [];
    }
  }
}

export class MemoryStoragePort implements StoragePort {
  private map = new Map<string, string>();
  get(key: string): string | null {
    return this.map.get(key) ?? null;
  }
  set(key: string, value: string): void {
    this.map.set(key, value);
  }
  remove(key: string): void {
    this.map.delete(key);
  }
  keys(): string[] {
    return [...this.map.keys()];
  }
}
