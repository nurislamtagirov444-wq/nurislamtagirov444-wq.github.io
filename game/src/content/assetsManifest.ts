// Манифест ассетов: сцены грузят и рисуют ТОЛЬКО то, что перечислено здесь.
// Если файл не существует в assets/art — его здесь нет (правило «нет битых ссылок»).

export const ART_BASE = 'assets/art/';

export type BgKey =
  | 'bg_title'
  | 'bg_port_street'
  | 'bg_house_room'
  | 'bg_office'
  | 'bg_lighthouse_day'
  | 'bg_lighthouse_night'
  | 'bg_radio_room';

export const BG_FILES: Record<BgKey, string> = {
  bg_title: 'bg_title.jpg',
  bg_port_street: 'bg_port_street.jpg',
  bg_house_room: 'bg_house_room.jpg',
  bg_office: 'bg_office.jpg',
  bg_lighthouse_day: 'bg_lighthouse_day.jpg',
  bg_lighthouse_night: 'bg_lighthouse_night.jpg',
  bg_radio_room: 'bg_radio_room.jpg',
};

export function isBgKey(k: string): k is BgKey {
  return k in BG_FILES;
}

// Портретные планшеты: ключ `${who}.${pose}` -> файл. Присутствуют только сгенерированные.
export const PORTRAIT_FILES: Record<string, string> = {
  'marina.calm': 'p_marina_calm.png',
  'marina.smile': 'p_marina_smile.png',
  'marina.sad': 'p_marina_sad.png',
  'daria.warm': 'p_daria_warm.png',
  'daria.tense': 'p_daria_tense.png',
  'ark.calm': 'p_ark_calm.png',
};

export function portraitFile(who: string, pose: string): string | null {
  return PORTRAIT_FILES[`${who}.${pose}`] ?? null;
}

// Концовки: композиция из существующего фона + цветокор + символ эффекта.
// ( Уникальные CG-арты — срез P1: файлы появятся в assets/art и заменят композиции. )
export type CgGrade = { tint: number; effect: 'bloom' | 'wanes' | 'noise' | 'fade' };

export const CG_COMPOSITIONS: Record<string, { base: BgKey; grade: CgGrade }> = {
  cg_marina_light: { base: 'bg_lighthouse_day', grade: { tint: 0xffd9a0, effect: 'bloom' } },
  cg_marina_waterline: { base: 'bg_lighthouse_night', grade: { tint: 0x9ec3d6, effect: 'wanes' } },
  cg_marina_static: { base: 'bg_port_street', grade: { tint: 0x7d8a94, effect: 'noise' } },
  cg_solo: { base: 'bg_port_street', grade: { tint: 0xa8b4bd, effect: 'fade' } },
};

export function cgBase(cgKey: string): BgKey | null {
  return CG_COMPOSITIONS[cgKey]?.base ?? null;
}

export function cgGrade(cgKey: string): CgGrade | null {
  return CG_COMPOSITIONS[cgKey]?.grade ?? null;
}
