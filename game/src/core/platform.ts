// Мобильный мост (APK): hardware-кнопка «назад» через @capacitor/app.
// Маппинг = BACK_MAP из SPEC §7. В web-окружении listener не регистрируется:
// там ту же карту покрывает Esc (каждая сцена слушает keydown-ESC).
// ПРИМЕЧАНИЕ: проверяется только на устройстве/эмуляторе (Этап 4) — в песочнице нет SDK.
import { App } from '@capacitor/app';

/** Активен ли Capacitor-рантайм (APK) — в web false. */
export function isNative(): boolean {
  return Boolean((globalThis as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor?.isNativePlatform?.());
}

/**
 * Регистрирует hardware «назад»: синтезирует DOM-событие Escape,
 * которое сцены уже обрабатывают 1:1 по карте BACK_MAP (SPEC §7).
 * TITLE → диалог выхода (native confirm) → App.exitApp().
 * ENDING/EPILOGUE переходы проходят тем же путём, что и Esc.
 */
export async function wireAndroidBack(): Promise<boolean> {
  if (!isNative()) return false;
  await App.addListener('backButton', () => {
    globalThis.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
  });
  return true;
}

/** Выход из приложения с подтверждением (только APK; вызывается сценой Title при Esc). */
export async function confirmAndExit(): Promise<void> {
  if (!isNative()) return;
  const ok = globalThis.confirm('Выйти из «Маяка в ноябре»?');
  if (ok) await App.exitApp();
}
