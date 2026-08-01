import Phaser from 'phaser';
import type { GameFlow } from '../core/flow.ts';
import type { StoryEngine } from '../core/storyEngine.ts';
import { BALANCE } from '../content/balance.ts';
import { COLORS, FONT_SERIF, drawPanel, makeButton } from '../ui/widgets.ts';

// S9 STATS: Ясность + Доверие/Близость по героиням + день.
export class StatsOverlay extends Phaser.Scene {
  constructor() {
    super('Stats');
  }

  create(data: { engine: StoryEngine }): void {
    const flow = this.registry.get('flow') as GameFlow;
    const stats = data.engine.stats;

    this.add.rectangle(640, 360, 1280, 720, 0x000000, 0.6).setInteractive();
    drawPanel(this, 430, 130, 420, 470);
    this.add.text(640, 172, 'Состояние', {
      fontFamily: FONT_SERIF, fontSize: '24px', color: COLORS.text,
    }).setOrigin(0.5);
    this.add.text(640, 206, data.engine.day > 0 ? `День ${data.engine.day}` : 'Пролог', {
      fontFamily: FONT_SERIF, fontSize: '16px', color: COLORS.textDim,
    }).setOrigin(0.5);

    const bar = (label: string, v: number, y: number, warnBelow?: number): void => {
      this.add.text(470, y, label, {
        fontFamily: FONT_SERIF, fontSize: '17px', color: COLORS.text,
      }).setOrigin(0, 0.5);
      const w = 320;
      this.add.rectangle(470, y + 24, w, 10, 0x24343f).setOrigin(0, 0.5);
      const color = warnBelow !== undefined && v < warnBelow ? 0xd97a7a : COLORS.gold;
      this.add.rectangle(470, y + 24, Math.max(4, (w * v) / 100), 10, color).setOrigin(0, 0.5);
      this.add.text(810, y + 24, `${v}`, {
        fontFamily: FONT_SERIF, fontSize: '15px', color: COLORS.textDim,
      }).setOrigin(1, 0.5);
    };

    bar('Ясность Алекса', stats.clarity, 250, BALANCE.thresholds.lowClarityFx);
    bar('Марина · Доверие', stats['marina.trust'], 320);
    bar('Марина · Близость', stats['marina.bond'], 390);
    bar('Дарья · Доверие', stats['daria.trust'], 460);
    bar('Дарья · Близость', stats['daria.bond'], 530);

    const close = (): void => {
      flow.go('T23');
      this.scene.resume('Story');
      this.scene.stop();
    };
    makeButton(this, 535, 556, 'Закрыть', close, { width: 210, height: 40 });
    this.input.keyboard?.on('keydown-ESC', close);
  }
}
