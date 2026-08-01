// Мобильный мост (APK): hardware-кнопка «назад». В web — неактивно (Esc покрывает то же).
// ВНИМАНИЕ: исполняется только в Capacitor-окружении; в песочнице не проверялось —
// финальная проверка на устройстве по инструкции Этапа 4.
import { BACK_MAP, type GameFlow } from './flow.ts';

type CapAppPlugin = {
  addListener(event: 'backButton', cb: () => void): unknown;
  exitApp(): void;
};

export function wireAndroidBack(flow: GameFlow, requestExitDialog: () => void): boolean {
  const cap = (globalThis as { Capacitor?: { Plugins?: { App?: CapAppPlugin } } }).Capacitor;
  const app = cap?.Plugins?.App;
  if (!app?.addListener) return false;
  app.addListener('backButton', () => {
    const to = BACK_MAP[flow.state];
    if (to === null) {
      if (flow.state === 'TITLE') requestExitDialog();
      return;
    }
    // Каркас BACK_MAP совпадает с картой «назад» каждой сцены: сцены сами слушают
    // аппаратную кнопку через Capacitor событие — здесь только резервный путь.
  });
  return true;
}
