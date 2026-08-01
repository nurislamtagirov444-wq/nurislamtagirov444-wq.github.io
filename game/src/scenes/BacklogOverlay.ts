import Phaser from 'phaser';
import type { GameFlow } from '../core/flow.ts';
import type { StoryEngine } from '../core/storyEngine.ts';
import { COLORS, FONT_SERIF, drawPanel, makeButton } from '../ui/widgets.ts';

// S8 BACKLOG: последние 100 реплик, скролл колесом/драгом.
export class BacklogOverlay extends Phaser.Scene {
  constructor() {
    super('Backlog');
  }

  create(data: { engine: StoryEngine }): void {
    const flow = this.registry.get('flow') as GameFlow;

    this.add.rectangle(640, 360, 1280, 720, 0x000000, 0.72).setInteractive();
    drawPanel(this, 140, 60, 1000, 600);
    this.add.text(640, 102, 'Журнал', {
      fontFamily: FONT_SERIF, fontSize: '26px', color: COLORS.text,
    }).setOrigin(0.5);

    const entries = data.engine.backlog.list();
    const layer = this.add.container(0, 0);
    let y = 140;
    for (let i = entries.length - 1; i >= 0; i--) {
      const e = entries[i];
      const mark = e.irrevocable ? ' ●' : '';
      const head = this.add.text(170, y, `${e.speaker}   [${e.tag}]${mark}`, {
        fontFamily: FONT_SERIF, fontSize: '15px', color: e.irrevocable ? '#d9a441' : COLORS.textDim,
      });
      const body = this.add.text(170, y + 20, e.text, {
        fontFamily: FONT_SERIF, fontSize: '17px', color: COLORS.text, wordWrap: { width: 940 },
      });
      layer.add([head, body]);
      y += 30 + body.height + 12;
    }
    const contentH = Math.max(0, y - 140 - 460);
    let scroll = 0;
    const applyScroll = (): void => {
      layer.y = -scroll;
    };
    applyScroll();
    const mask = this.make.graphics({});
    mask.fillRect(150, 130, 980, 470);
    layer.setMask(new Phaser.Display.Masks.GeometryMask(this, mask));

    this.input.on('wheel', (_p: unknown, _o: unknown, _dx: number, dy: number) => {
      scroll = Phaser.Math.Clamp(scroll + dy * 0.7, 0, contentH);
      applyScroll();
    });
    let dragY: number | null = null;
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      dragY = p.y;
    });
    this.input.on('pointerup', () => {
      dragY = null;
    });
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (dragY === null || !p.isDown) return;
      scroll = Phaser.Math.Clamp(scroll + (dragY - p.y), 0, contentH);
      dragY = p.y;
      applyScroll();
    });

    if (entries.length === 0) {
      this.add.text(640, 330, 'Журнал пуст — история только началась', {
        fontFamily: FONT_SERIF, fontSize: '18px', color: COLORS.textDim,
      }).setOrigin(0.5);
    }

    const close = (): void => {
      flow.go('T21');
      this.scene.resume('Story');
      this.scene.stop();
    };
    makeButton(this, 540, 610, 'Закрыть', close, { width: 200, height: 44 });
    this.input.keyboard?.on('keydown-ESC', close);
  }
}
