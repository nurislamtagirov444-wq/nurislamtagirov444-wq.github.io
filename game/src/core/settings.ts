import type { StoragePort } from './storage.ts';

export type Settings = {
  textSpeedCps: number; // символов в секунду
  autoDelayMs: number;
  volMaster: number; // 0..1
  volAmb: number;
  volSfx: number;
  textboxAlpha: number; // 0..1
  reduceFx: boolean; // accessibility: выключает глитчи/интенсивные партиклы
  fullscreen: boolean;
};

export const SETTINGS_KEY = 'mayak.settings';

export function defaultSettings(): Settings {
  return {
    textSpeedCps: 28,
    autoDelayMs: 1800,
    volMaster: 0.8,
    volAmb: 0.7,
    volSfx: 0.8,
    textboxAlpha: 0.82,
    reduceFx: false,
    fullscreen: false,
  };
}

export function loadSettings(storage: StoragePort): Settings {
  try {
    const raw = storage.get(SETTINGS_KEY);
    if (!raw) return defaultSettings();
    const parsed = JSON.parse(raw) as Partial<Settings>;
    const d = defaultSettings();
    return {
      textSpeedCps: num(parsed.textSpeedCps, d.textSpeedCps, 10, 60),
      autoDelayMs: num(parsed.autoDelayMs, d.autoDelayMs, 400, 6000),
      volMaster: num(parsed.volMaster, d.volMaster, 0, 1),
      volAmb: num(parsed.volAmb, d.volAmb, 0, 1),
      volSfx: num(parsed.volSfx, d.volSfx, 0, 1),
      textboxAlpha: num(parsed.textboxAlpha, d.textboxAlpha, 0.3, 1),
      reduceFx: parsed.reduceFx === true,
      fullscreen: parsed.fullscreen === true,
    };
  } catch {
    return defaultSettings();
  }
}

function num(v: unknown, dflt: number, min: number, max: number): number {
  return typeof v === 'number' && Number.isFinite(v) ? Math.max(min, Math.min(max, v)) : dflt;
}

export function saveSettings(storage: StoragePort, s: Settings): void {
  storage.set(SETTINGS_KEY, JSON.stringify(s));
}
