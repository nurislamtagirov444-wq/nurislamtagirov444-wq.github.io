import { BALANCE } from '../content/balance.ts';
import type { Speaker } from './storyTypes.ts';

export type BacklogEntry = {
  speaker: Speaker | 'Система' | '—';
  text: string;
  tag: string; // «День N» / «Выбор ●»
  irrevocable?: boolean;
};

/** Журнал последних реплик (SPEC E7). Кольцевой буфер на maxEntries. */
export class Backlog {
  private entries: BacklogEntry[] = [];

  push(e: BacklogEntry): void {
    this.entries.push(e);
    if (this.entries.length > BALANCE.backlog.maxEntries) {
      this.entries.splice(0, this.entries.length - BALANCE.backlog.maxEntries);
    }
  }

  list(): readonly BacklogEntry[] {
    return this.entries;
  }

  serialize(): BacklogEntry[] {
    return this.entries.map((e) => ({ ...e }));
  }

  restore(data: BacklogEntry[] | undefined): void {
    this.entries = Array.isArray(data) ? data.slice(-BALANCE.backlog.maxEntries) : [];
  }
}
