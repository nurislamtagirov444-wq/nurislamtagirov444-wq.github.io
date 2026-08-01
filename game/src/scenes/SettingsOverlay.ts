import Phaser from 'phaser';
import type { GameFlow } from '../core/flow.ts';
import type { ProceduralAudio } from '../audio/procedural.ts';
import type { LocalStoragePort } from '../core/storage.ts';
import { saveSettings, type Settings } from '../core/settings.ts';
import type { StoryScene } from './StoryScene.ts';
import { COLORS, FONT_SERIF, drawPanel, makeButton, makeSlider, toast } from '../ui/widgets.ts';

// S7 SETTINGS: слайдеры живого применения, persist на выходе.
export class SettingsOverlay extends Phaser.Scene {
  constructor() {
    super('Settings');
  }

  create(data: { source: 'title' | 'story' | 'pause' }): void {
    const flow = this.registry.get('flow') as GameFlow;
    const audio = this.registry.get('audio') as ProceduralAudio;
    const storage = this.registry.get('storage') as LocalStoragePort;
    const settings = this.registry.get('settings') as Settings;
    const { source } = data;
    const story = source !== 'title' ? (this.scene.get('Story') as StoryScene) : null;

    this.add.rectangle(640, 360, 1280, 720, 0x000000, 0.66).setInteractive();
    drawPanel(this, 380, 70, 520, 580);
    this.add.text(640, 112, 'Настройки', {
      fontFamily: FONT_SERIF, fontSize: '26px', color: COLORS.text,
    }).setOrigin(0.5);

    let y = 160;
    const row = (label: string): void => {
      this.add.text(430, y, label, {
        fontFamily: FONT_SERIF, fontSize: '18px', color: COLORS.text,
      }).setOrigin(0, 0.5);
      y += 62;
    };

    row('Скорость текста');
    makeSlider(this, 430, y - 18, { min: 10, max: 60, value: settings.textSpeedCps, width: 410 }, (v) => {
      settings.textSpeedCps = Math.round(v);
    });
    row(`Задержка авто, мс`);
    makeSlider(this, 430, y - 18, { min: 400, max: 6000, value: settings.autoDelayMs, width: 410 }, (v) => {
      settings.autoDelayMs = Math.round(v / 100) * 100;
    });
    row('Громкость: мастер');
    makeSlider(this, 430, y - 18, { min: 0, max: 1, value: settings.volMaster, width: 410 }, (v) => {
      settings.volMaster = v;
      audio.setMaster(v);
    });
    row('Громкость: эмбиент');
    makeSlider(this, 430, y - 18, { min: 0, max: 1, value: settings.volAmb, width: 410 }, (v) => {
      settings.volAmb = v;
      audio.setAmb(v);
    });
    row('Громкость: интерфейс');
    makeSlider(this, 430, y - 18, { min: 0, max: 1, value: settings.volSfx, width: 410 }, (v) => {
      settings.volSfx = v;
      audio.uiClick();
    });
    row('Окно текста: непрозрачность');
    makeSlider(this, 430, y - 18, { min: 0.3, max: 1, value: settings.textboxAlpha, width: 410 }, (v) => {
      settings.textboxAlpha = v;
      story?.refreshTextbox();
    });

    // тоглы
    const fxBtn = makeButton(this, 430, y + 4, `Снижение эффектов: ${settings.reduceFx ? 'вкл' : 'выкл'}`, () => {
      settings.reduceFx = !settings.reduceFx;
      audio.uiClick();
      this.scene.restart(data);
    }, { width: 410, height: 44, fontSize: 17 });
    void fxBtn;
    const isApk = Boolean((globalThis as { Capacitor?: unknown }).Capacitor);
    if (!isApk) {
      makeButton(this, 430, y + 58, `Полноэкранный: ${settings.fullscreen ? 'вкл' : 'выкл'}`, () => {
        settings.fullscreen = !settings.fullscreen;
        audio.uiClick();
        if (settings.fullscreen) this.scale.startFullscreen();
        else this.scale.stopFullscreen();
        this.scene.restart(data);
      }, { width: 410, height: 44, fontSize: 17 });
    }

    const close = (): void => {
      audio.uiBack();
      saveSettings(storage, settings);
      toast(this, 'Настройки сохранены', { y: 24 });
      this.time.delayedCall(250, () => {
        if (source === 'title') flow.go('T12');
        else flow.go('T13');
        if (source === 'pause') {
          this.scene.launch('Pause', {});
          this.scene.stop();
          return;
        }
        if (source === 'story') {
          this.scene.resume('Story');
          this.scene.stop();
          return;
        }
        this.scene.stop();
      });
    };
    makeButton(this, 535, 606, 'Готово', close, { width: 210, height: 44, accent: true });
    this.input.keyboard?.on('keydown-ESC', close);
  }
}
