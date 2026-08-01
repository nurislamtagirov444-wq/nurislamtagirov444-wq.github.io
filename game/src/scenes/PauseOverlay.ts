import Phaser from 'phaser';
import type { GameFlow } from '../core/flow.ts';
import type { ProceduralAudio } from '../audio/procedural.ts';
import { COLORS, FONT_SERIF, confirmDialog, drawPanel, makeButton } from '../ui/widgets.ts';

// S5 PAUSE: поверх STORY (story спит).
export class PauseOverlay extends Phaser.Scene {
  constructor() {
    super('Pause');
  }

  create(data: { storyRef?: unknown }): void {
    const flow = this.registry.get('flow') as GameFlow;
    const audio = this.registry.get('audio') as ProceduralAudio;
    void data;

    this.add.rectangle(640, 360, 1280, 720, 0x000000, 0.6).setInteractive();
    drawPanel(this, 480, 170, 320, 400);
    this.add.text(640, 210, 'Пауза', {
      fontFamily: FONT_SERIF, fontSize: '26px', color: COLORS.text,
    }).setOrigin(0.5);

    const closeToStory = (): void => {
      flow.go('T15');
      this.scene.resume('Story');
      this.scene.stop();
    };
    makeButton(this, 510, 250, 'Продолжить', () => { audio.uiBack(); closeToStory(); }, { width: 260 });
    makeButton(this, 510, 312, 'Сохранить', () => {
      audio.uiClick();
      flow.go('T16');
      flow.overlaySource = 'pause';
      this.scene.launch('SaveLoad', { mode: 'save', source: 'pause' });
      this.scene.stop();
    }, { width: 260 });
    makeButton(this, 510, 374, 'Загрузить', () => {
      audio.uiClick();
      flow.go('T16');
      flow.overlaySource = 'pause';
      this.scene.launch('SaveLoad', { mode: 'load', source: 'pause' });
      this.scene.stop();
    }, { width: 260 });
    makeButton(this, 510, 436, 'Настройки', () => {
      audio.uiClick();
      flow.go('T19');
      flow.overlaySource = 'pause';
      this.scene.launch('Settings', { source: 'pause' });
      this.scene.stop();
    }, { width: 260 });
    makeButton(this, 510, 498, 'На титул', () => {
      audio.uiBack();
      confirmDialog(this, 'Выйти на титульный экран?', () => {
        flow.go('T29');
        this.scene.stop('Story');
        this.scene.start('Title');
      });
    }, { width: 260 });

    this.input.keyboard?.on('keydown-ESC', closeToStory);
  }
}
