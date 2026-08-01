import type { EngineSnapshot } from './storyEngine.ts';
import type { StoragePort } from './storage.ts';

// SPEC E5: 9 слотов + quicksave + autosave, schema v1, checksum, валидация на старте.
export const SAVE_SCHEMA_V = 1;
export const SLOT_COUNT = 9;
export const QUICK_KEY = 'mayak.save.quick';
export const AUTO_KEY = 'mayak.save.auto';
export const SLOT_KEY_PREFIX = 'mayak.save.slot.';
export const SEEN_KEY = 'mayak.seen.global';
export const ENDINGS_KEY = 'mayak.endings';

export type SaveRecord = {
  v: typeof SAVE_SCHEMA_V;
  ts: number; // epoch ms
  label: string; // «День N · узел»
  snap: EngineSnapshot;
  checksum: string;
};

function fnv1a(str: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}

export function packSave(snap: EngineSnapshot, ts = Date.now()): SaveRecord {
  const label = snap.day > 0 ? `День ${snap.day} · ${snap.nodeId}` : `Пролог · ${snap.nodeId}`;
  const body = JSON.stringify({ v: SAVE_SCHEMA_V, ts, label, snap });
  return { v: SAVE_SCHEMA_V, ts, label, snap, checksum: fnv1a(body) };
}

export function unpackSave(raw: string | null): SaveRecord | null {
  if (!raw) return null;
  try {
    const rec = JSON.parse(raw) as SaveRecord;
    if (rec.v !== SAVE_SCHEMA_V) return null;
    const body = JSON.stringify({ v: rec.v, ts: rec.ts, label: rec.label, snap: rec.snap });
    if (fnv1a(body) !== rec.checksum) return null;
    if (!rec.snap || rec.snap.v !== 1 || typeof rec.snap.nodeId !== 'string') return null;
    return rec;
  } catch {
    return null;
  }
}

export class SaveManager {
  private storage: StoragePort;

  constructor(storage: StoragePort) {
    this.storage = storage;
  }

  slotKey(i: number): string {
    return `${SLOT_KEY_PREFIX}${i}`;
  }

  saveTo(key: string, snap: EngineSnapshot, ts = Date.now()): boolean {
    const rec = packSave(snap, ts);
    this.storage.set(key, JSON.stringify(rec));
    const check = unpackSave(this.storage.get(key));
    return check !== null;
  }

  loadFrom(key: string): EngineSnapshot | null {
    const rec = unpackSave(this.storage.get(key));
    return rec ? rec.snap : null;
  }

  /** Метаданные слотов для UI. Битые слоты показываются как «повреждено». */
  describeSlots(): ({ key: string; rec: SaveRecord | null; corrupted: boolean } | null)[] {
    const out: ({ key: string; rec: SaveRecord | null; corrupted: boolean } | null)[] = [];
    for (let i = 0; i < SLOT_COUNT; i++) {
      const key = this.slotKey(i);
      const raw = this.storage.get(key);
      if (raw === null) {
        out.push(null);
      } else {
        const rec = unpackSave(raw);
        out.push(rec ? { key, rec, corrupted: false } : { key, rec: null, corrupted: true });
      }
    }
    return out;
  }

  quick(snap: EngineSnapshot): boolean {
    return this.saveTo(QUICK_KEY, snap);
  }

  auto(snap: EngineSnapshot): boolean {
    return this.saveTo(AUTO_KEY, snap);
  }

  loadQuickOrAuto(): EngineSnapshot | null {
    return this.loadFrom(AUTO_KEY) ?? this.loadFrom(QUICK_KEY);
  }

  hasContinue(): boolean {
    return this.loadQuickOrAuto() !== null;
  }

  clearSlot(key: string): void {
    this.storage.remove(key);
  }

  /** Глобальный «прочитанное» для skip-read-only (не зависит от слотов). */
  mergeGlobalSeen(ids: Iterable<string>): void {
    const set = this.readGlobalSeen();
    for (const id of ids) set.add(id);
    this.storage.set(SEEN_KEY, JSON.stringify([...set]));
  }

  readGlobalSeen(): Set<string> {
    try {
      const raw = this.storage.get(SEEN_KEY);
      const arr = raw ? (JSON.parse(raw) as string[]) : [];
      return new Set(Array.isArray(arr) ? arr : []);
    } catch {
      return new Set();
    }
  }

  markEnding(endingId: string): void {
    const set = this.readEndings();
    set.add(endingId);
    this.storage.set(ENDINGS_KEY, JSON.stringify([...set]));
  }

  readEndings(): Set<string> {
    try {
      const raw = this.storage.get(ENDINGS_KEY);
      const arr = raw ? (JSON.parse(raw) as string[]) : [];
      return new Set(Array.isArray(arr) ? arr : []);
    } catch {
      return new Set();
    }
  }
}
