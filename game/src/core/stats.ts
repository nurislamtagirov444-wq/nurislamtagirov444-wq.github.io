import type { Cond, SetOp, StatKey } from './storyTypes.ts';
import { BALANCE } from '../content/balance.ts';

export type StatMap = Record<StatKey, number>;

export type Flags = Record<string, number | boolean>;

export function defaultStats(): StatMap {
  return {
    clarity: BALANCE.stats.startClarity,
    'marina.trust': BALANCE.stats.startTrust,
    'marina.bond': BALANCE.stats.startBond,
    'daria.trust': BALANCE.stats.startTrust,
    'daria.bond': BALANCE.stats.startBond,
  };
}

const STAT_KEYS: StatKey[] = [
  'clarity',
  'marina.trust',
  'marina.bond',
  'daria.trust',
  'daria.bond',
];

export function isStatKey(k: string): k is StatKey {
  return (STAT_KEYS as string[]).includes(k);
}

export function clampStat(v: number): number {
  return Math.max(BALANCE.stats.min, Math.min(BALANCE.stats.max, Math.round(v)));
}

/** Применяет набор операций к статам/флагам. Возвращает дельту статов для анимации UI. */
export function applySetOps(
  stats: StatMap,
  flags: Flags,
  ops: SetOp[] | undefined,
): Partial<StatMap> {
  const changed: Partial<StatMap> = {};
  if (!ops) return changed;
  for (const op of ops) {
    if (isStatKey(op.k)) {
      const key = op.k as StatKey;
      const cur = stats[key];
      const next =
        op.op === 'add' ? clampStat(cur + Number(op.v)) : clampStat(Number(op.v));
      if (next !== cur) changed[key] = next;
      stats[key] = next;
    } else {
      const cur = flags[op.k];
      if (op.op === 'add' && typeof op.v === 'number') {
        flags[op.k] = (typeof cur === 'number' ? cur : 0) + op.v;
      } else {
        flags[op.k] = op.v;
      }
    }
  }
  return changed;
}

export function checkCond(cond: Cond | undefined, stats: StatMap, flags: Flags): boolean {
  if (!cond) return true;
  if (cond.stat !== undefined) {
    const v = stats[cond.stat];
    if (cond.gte !== undefined && v < cond.gte) return false;
    if (cond.lt !== undefined && v >= cond.lt) return false;
  }
  if (cond.flag !== undefined) {
    const fv = flags[cond.flag];
    if (cond.eq === undefined) return Boolean(fv);
    return fv === cond.eq;
  }
  return true;
}
