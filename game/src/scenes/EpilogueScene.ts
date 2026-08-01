import Phaser from 'phaser';
import type { GameFlow } from '../core/flow.ts';
import type { ProceduralAudio } from '../audio/procedural.ts';
import { COLORS, FONT_SERIF, makeButton } from '../ui/widgets.ts';

// S11 EPILOGUE: 1–3 кадра послетекста, затем TITLE (T28).
export class EpilogueScene extends Phaser.Scene {
  private lines: string[] = [];
  private idx = 0;
  private text!: Phaser.GameObjects.Text;

  constructor() {
    super('Epilogue');
  }

  create(data: { lines: string[]; title: string }): void {
    const flow = this.registry.get('flow') as GameFlow;
    const audio = this.registry.get('audio') as ProceduralAudio;
    this.lines = data.lines;
    this.idx = 0;
    this.cameras.main.setBackgroundColor(0x05090c);
    audio.ambience('silence');

    this.add.text(640, 180, data.title, {
      fontFamily: FONT_SERIF, fontSize: '20px', color: COLORS.textDim,
    }).setOrigin(0.5);
    this.text = this.add.text(640, 360, '', {
      fontFamily: FONT_SERIF, fontSize: '24px', color: COLORS.text,
      align: 'center', wordWrap: { width: 880 },
    }).setOrigin(0.5).setAlpha(0);

    const next = (): void => {
      if (this.idx >= this.lines.length) {
        flow.go('T28');
        this.scene.start('Title');
        return;
      }
      audio.uiClick();
      this.text.setText(this.lines[this.idx]);
      this.tweens.add({ targets: this.text, alpha: { from: 0, to: 1 }, duration: 450 });
      this.idx++;
    };
    this.input.on('pointerdown', (_p: Phaser.Input.Pointer, targets: Phaser.GameObjects.GameObject[]) => {
      void _p;
      if (targets.length > 0) return; // кнопка «Далее» сама вызовет next — без двойного продвижения
      next();
    });
    this.input.keyboard?.on('keydown-SPACE', next);
    this.input.keyboard?.on('keydown-ESC', () => {
      flow.go('T28');
      this.scene.start('Title');
    });
    makeButton(this, 560, 640, 'Далее', next, { width: 160, height: 44 });
    next();
  }
}
