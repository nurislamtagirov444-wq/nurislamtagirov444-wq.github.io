// Конфиг Capacitor. Активируется на стороне пользователя:
//   npm install @capacitor/core @capacitor/cli && npx cap add android
// В P0 игра не импортирует @capacitor/* напрямую, чтобы web-сборка не тянула мост.
export default {
  appId: 'ru.kryukovo.mayak',
  appName: 'Маяк в ноябре',
  webDir: 'dist',
  android: {
    allowMixedContent: false,
  },
};
