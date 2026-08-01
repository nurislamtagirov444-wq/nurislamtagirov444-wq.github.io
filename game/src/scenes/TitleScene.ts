import Phaser from 'phaser';
import type { GameFlow } from '../core/flow.ts';
import type { SaveManager } from '../core/save.ts';
import type { ProceduralAudio } from '../audio/procedural.ts';
import type { Settings } from '../core/settings.ts';
import { COLORS, FONT_SERIF, makeButton, toast } from '../ui/widgets.ts';

// S3 TITLE: Новая игра / Продолжить* / Загрузить / Настройки / Выход(APK).
export class TitleScene extends Phaser.Scene {
  private menu: Phaser.GameObjects.Container | null = null;

  constructor() {
    super('Title');
  }

  create(): void {
    const flow = this.registry.get('flow') as GameFlow;
    const saves = this.registry.get('saves') as SaveManager;
    const audio = this.registry.get('audio') as ProceduralAudio;
    const settings = this.registry.get('settings') as Settings;
    if (flow.state !== 'TITLE') {
      // Единственные легальные пути сюда: T2, T9, T12, T28 — все идут через go().
      console.error(`TitleScene reached in illegal flow state: ${flow.state}`);
      throw new Error(`TitleScene: illegal flow state ${flow.state}`);
    }

    this.cameras.main.setBackgroundColor(0x0b1216);
    const bg = this.add.image(640, 360, 'bg_title');
    bg.setDisplaySize(1280, 720);
    this.add.rectangle(640, 360, 1280, 720, 0x000000, 0.35);

    // дождь (ленивая процедурная партикл-система; выкл. при reduceFx)
    if (!settings.reduceFx) this.spawnRain();

    this.add
      .text(120, 110, 'МАЯК В НОЯБРЕ', {
        fontFamily: FONT_SERIF,
        fontSize: '56px',
        color: '#e8eef2',
      })
      .setShadow(0, 4, '#000000', 12, true, true);
    this.add
      .text(122, 172, 'новелла о городе, который держит', {
        fontFamily: FONT_SERIF,
        fontSize: '20px',
        color: COLORS.textDim,
      });

    const canContinue = saves.hasContinue();
    const purged = this.registry.get('corruptedSlotsPurged') as number;
    const items = this.add.container(140, 300);
    this.menu = items;
    const stack = (btn: Phaser.GameObjects.Container, i: number): void => {
      btn.setY(i * 66);
      items.add(btn);
    };

    stack(
      makeButton(this, 0, 0, 'Новая игра', () => {
        audio.unlock();
        audio.uiClick();
        flow.go('T3');
        this.scene.start('Story', { mode: 'new' });
      }, { width: 320, fontSize: 22, accent: true }),
      0,
    );
    stack(
      makeButton(this, 0, 0, 'Продолжить', () => {
        audio.unlock();
        audio.uiClick();
        const snap = saves.loadQuickOrAuto();
        if (!snap) {
          toast(this, 'Сохранение недоступно');
          return;
        }
        flow.go('T4');
        this.scene.start('Story', { mode: 'load', snap });
      }, { width: 320, fontSize: 22, disabled: !canContinue }),
      1,
    );
    if (purged > 0) toast(this, `Повреждённых слотов очищено: ${purged}`, { y: 24, holdMs: 2600 });

    stack(
      makeButton(this, 0, 0, 'Загрузить', () => {
        audio.unlock();
        audio.uiClick();
        flow.go('T5');
        flow.overlaySource = 'title';
        this.scene.launch('SaveLoad', { mode: 'load', source: 'title' });
      }, { width: 320, fontSize: 22 }),
      2,
    );
    stack(
      makeButton(this, 0, 0, 'Настройки', () => {
        audio.unlock();
        audio.uiClick();
        flow.go('T6');
        flow.overlaySource = 'title';
        this.scene.launch('Settings', { source: 'title' });
      }, { width: 320, fontSize: 22 }),
      3,
    );

    const isApk = Boolean((globalThis as { Capacitor?: unknown }).Capacitor);
    if (isApk) {
      stack(
        makeButton(this, 0, 0, 'Выход', () => {
          audio.uiBack();
          const cap = (globalThis as { Capacitor?: { Plugins?: { App?: { exitApp(): void } } } }).Capacitor;
          cap?.Plugins?.App?.exitApp();
        }, { width: 320, fontSize: 22 }),
        4,
      );
    }

    audio.ambience('rain');

    this.input.keyboard?.on('keydown-ESC', () => {
      // web: ничего (SPEC §7). APK (hardware back → тот же Esc): диалог выхода.
      import('../core/platform.ts').then((m) => void m.confirmAndExit());
    });
  }
  private spawnRain(): void {
    const g = this.add.graphics().setDepth(5);
    const drops = Array.from({ length: 90 }, () => ({
      x: Math.random() * 1280,
      y: Math.random() * 720,
      s: 9 + Math.random() * 10,
    }));
    this.time.addEvent({
      delay: 33,
      loop: true,
      callback: () => {
        g.clear();
        g.lineStyle(1, 0xaec4d4, 0.35);
        for (const d of drops) {
          g.lineBetween(d.x, d.y, d.x - 3, d.y + d.s);
          d.y += d.s * 1.7;
          d.x -= 1;
          if (d.y > 730) {
            d.y = -10;
            d.x = Math.random() * 1300;
          }
        }
      },
    });
  }
}
