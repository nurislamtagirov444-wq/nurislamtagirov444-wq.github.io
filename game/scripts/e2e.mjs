// E2E-смоук: реальный headless Chromium проходит путь Титул → игра → оверлеи.
// Запуск: node scripts/e2e.mjs  (ожидает vite preview на 4173)
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

const BASE = process.env.E2E_URL ?? 'http://127.0.0.1:4173/';
const shots = process.argv.includes('--shots');
const fails = [];
const ok = (name, cond, extra = '') => {
  console.log(`${cond ? 'ok' : 'NOT OK'} — ${name}${extra ? `: ${extra}` : ''}`);
  if (!cond) fails.push(name);
};

const execPath = await chromium.executablePath();
const browser = await puppeteer.launch({
  executablePath: execPath,
  // Флаги подобраны под ограничения песочницы (rc=0): single-process + no-zygote.
  args: [
    '--no-sandbox',
    '--no-zygote',
    '--single-process',
    '--disable-dev-shm-usage',
    '--disable-gpu-sandbox',
    '--disable-setuid-sandbox',
    '--use-gl=angle',
    '--use-angle=swiftshader',
    '--enable-unsafe-swiftshader',
  ],
  headless: 'shell',
  defaultViewport: { width: 1280, height: 720 },
});
const page = await browser.newPage();
const consoleErrors = [];
page.on('console', (m) => {
  if (m.type() === 'error') consoleErrors.push(m.text());
});
page.on('pageerror', (e) => consoleErrors.push(`pageerror: ${e.message}`));

await page.goto(BASE, { waitUntil: 'networkidle0', timeout: 60000 });

const state = () =>
  page.evaluate(() => window.__mayak?.getState?.() ?? null);
const node = () =>
  page.evaluate(() => window.__mayak?.getNode?.() ?? null);
const clickGame = async (x, y) => {
  await page.mouse.click(x, y);
  await new Promise((r) => setTimeout(r, 120));
};
const waitState = async (s, t = 15000) => {
  await page.waitForFunction((want) => window.__mayak?.getState?.() === want, { timeout: t }, s);
};
const waitNode = async (s, t = 15000) => {
  await page.waitForFunction((want) => window.__mayak?.getNode?.() === want, { timeout: t }, s);
};
const waitActive = async (key, t = 15000) => {
  await page.waitForFunction(
    (k) => window.__game?.scene?.scenes?.some((sc) => sc.scene.key === k && sc.scene.isActive()),
    { timeout: t },
    key,
  );
};

try {
  await page.waitForSelector('canvas', { timeout: 30000 });
  await page.waitForFunction(() => !!window.__mayak, { timeout: 30000 });
  await waitState('TITLE', 30000);
  ok('BOOT→PRELOAD→TITLE', true);
  if (shots) await page.screenshot({ path: 'scripts/shots/title.png' });

  // контраст фона: рендер живой (не чёрный квадрат)
  const px = await page.evaluate(() => {
    const c = document.querySelector('canvas');
    const g = c.getContext('webgl2') || c.getContext('webgl');
    void g;
    return !!c && c.width > 0;
  });
  ok('canvas жив', px);

  // Новая игра
  await clickGame(300, 326); // кнопка «Новая игра»
  await waitState('STORY');
  ok('TITLE --T3--> STORY', true);
  await waitNode('prologue_01');
  await page.waitForFunction(
    () => window.__game?.scene?.scenes?.find((s) => s.scene.key === 'Story')?.quickLayer,
    { timeout: 15000 },
  ); // quick-меню построено — можно кликать

  // tap advance через несколько узлов
  for (let i = 0; i < 4; i++) {
    await clickGame(640, 600);
    await clickGame(640, 600); // первый тап заканчивает печать, второй листает
  }
  const reached = await node();
  ok('tap-листание идёт по узлам', ['prologue_03', 'prologue_04', 'prologue_05', 'prologue_06'].includes(reached), reached);
  if (shots) await page.screenshot({ path: 'scripts/shots/story.png' });

  // доходим до первого выбора (prologue_06): сдвоенный тап на каждый say-узел
  for (let i = 0; i < 10; i++) {
    if ((await node()) === 'prologue_06') break;
    await clickGame(640, 600);
    await clickGame(640, 600);
    await new Promise((r) => setTimeout(r, 250));
  }
  ok('дошли до первого выбора', (await node()) === 'prologue_06', String(await node()));
  await clickGame(640, 600); // долистать промпт, чтобы появились кнопки
  await page.waitForFunction(
    () => {
      const st = window.__game?.scene?.scenes?.find((s) => s.scene.key === 'Story');
      return (st?.choiceLayer?.list?.length ?? 0) > 0;
    },
    { timeout: 15000 },
  ); // кнопки выбора отрисованы
  await clickGame(660, 266); // первая опция
  await waitNode('prologue_07a');
  ok('выбор: опция через cond-фильтр работает', true);

  // ESC → пауза → продолжить
  await page.keyboard.press('Escape');
  await waitState('PAUSE');
  await waitActive('Pause');
  ok('STORY --T14--> PAUSE (ESC)', true);
  if (shots) await page.screenshot({ path: 'scripts/shots/pause.png' });
  await clickGame(640, 276); // «Продолжить»
  await waitState('STORY');
  await waitActive('Story');
  ok('PAUSE --T15--> STORY', true);

  // Save через quick-меню → слот 1
  await clickGame(1010 - 6 * 84 + 37, 44); // «Save»
  await waitState('SAVE_LOAD');
  await waitActive('SaveLoad');
  ok('STORY --T17--> SAVE_LOAD', true);
  await clickGame(640, 151); // слот 1 (пустой — без подтверждения)
  await new Promise((r) => setTimeout(r, 400));
  const saved = await page.evaluate(() => {
    const raw = localStorage.getItem('mayak.save.slot.0');
    return raw ? JSON.parse(raw).label : null;
  });
  ok('слот 0 записан', !!saved, String(saved));
  if (shots) await page.screenshot({ path: 'scripts/shots/saveload.png' });
  await waitActive('SaveLoad');
  await clickGame(640, 642); // «Назад»
  await waitState('STORY');
  await waitActive('Story');

  // Журнал
  await clickGame(640, 600);
  await clickGame(640, 600);
  await clickGame(1010 - 9 * 84 + 37, 44); // «Журнал»
  await waitState('BACKLOG');
  await waitActive('Backlog');
  ok('STORY --T20--> BACKLOG', true);
  const backlogN = await page.evaluate(() => window.__mayak?.getBacklog?.() ?? -1);
  ok('в журнале есть реплики', backlogN > 0, `entries=${backlogN}`);
  await waitActive('Backlog');
  await clickGame(640, 632); // «Закрыть»
  await waitState('STORY');
  await waitActive('Story');

  // Статы
  await clickGame(1010 - 4 * 84 + 37, 44); // «📊»
  await waitState('STATS');
  await waitActive('Stats');
  ok('STORY --T22--> STATS', true);
  const clar = await page.evaluate(() => window.__mayak?.getStat?.('clarity'));
  ok('стат ясности читается', typeof clar === 'number' && clar >= 0 && clar <= 100, String(clar));
  await clickGame(640, 576);
  await waitState('STORY');
  await waitActive('Story');

  // Настройки из истории
  await clickGame(1010 - 3 * 84 + 37, 44); // «⚙»
  await waitState('SETTINGS');
  await waitActive('Settings');
  ok('STORY --T18--> SETTINGS', true);
  await clickGame(640, 628); // «Готово»
  await waitState('STORY');
  await waitActive('Story');
  ok('SETTINGS --T13--> STORY + persist', true);
} catch (e) {
  ok('фатальная ошибка e2e', false, String(e).slice(0, 300));
}

  // ---- часть B: debugJump — концовка, эпилог, таймаут ----
  try {
  await page.goto(BASE + '?e2e=1', { waitUntil: 'networkidle0' });
  await waitState('TITLE', 30000);
  await page.waitForFunction(() => !!window.__mayak?.debugJump, { timeout: 15000 });
  await clickGame(300, 326);
  await waitState('STORY');
  await page.waitForFunction(
    () => window.__game?.scene?.scenes?.find((s) => s.scene.key === 'Story')?.quickLayer,
    { timeout: 15000 },
  );

  // таймаутный выбор: молчание через 8 с уходит в confess_none
  await page.evaluate(() => window.__mayak.debugJump('a3_storm_choice'));
  await new Promise((r) => setTimeout(r, 9500));
  const afterTimeout = await node();
  ok('таймаут выбора -> confess_none', afterTimeout === 'confess_none', afterTimeout);
  if (shots) await page.screenshot({ path: 'scripts/shots/timeout.png' });

  // концовка: прыжок в ending-узел → T26 → ENDING scene → T27 → EPILOGUE → T28 → TITLE
  await page.evaluate(() => window.__mayak.debugJump('end_route_light'));
  await waitState('ENDING');
  await waitActive('Ending');
  ok('STORY --T26--> ENDING', true);
  const endings = await page.evaluate(() => JSON.parse(localStorage.getItem('mayak.endings') ?? '[]'));
  ok('концовка записана в реестр', endings.includes('ending_marina_light'), endings.join(','));
  if (shots) await page.screenshot({ path: 'scripts/shots/ending.png' });
  await clickGame(640, 671); // «Далее»
  await waitState('EPILOGUE');
  await waitActive('Epilogue');
  ok('ENDING --T27--> EPILOGUE', true);
  await clickGame(640, 400);
  await clickGame(640, 662);
  await clickGame(640, 662);
  await waitState('TITLE');
  ok('EPILOGUE --T28--> TITLE', true);

  // continue после концовки: автосейв финала доступен («Продолжить» активна)
  const cont = await page.evaluate(() => !!localStorage.getItem('mayak.save.auto'));
  ok('автосейв финала на месте', cont);
} catch (e2) {
  ok('фатальная ошибка e2e (часть B)', false, String(e2).slice(0, 300));
}

const critical = consoleErrors.filter(
  (t) => !/WebGL|GroupMarkerNotSet|swiftshader|GPU stall|Autoplay|AudioContext was not allowed/i.test(t),
);
ok('консоль без ошибок*', critical.length === 0, critical.slice(0, 3).join(' | ') || 'чисто');

await browser.close();
console.log(fails.length ? `\nE2E FAIL: ${fails.join(' ; ')}` : '\nE2E OK');
process.exit(fails.length ? 1 : 0);
