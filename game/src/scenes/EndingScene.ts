import Phaser from 'phaser';
import type { GameFlow } from '../core/flow.ts';
import type { SaveManager } from '../core/save.ts';
import { cgBase, cgGrade } from '../content/assetsManifest.ts';
import { COLORS, FONT_SERIF, makeButton } from '../ui/widgets.ts';

type EndingPayload = {
  endingId: string;
  title: string;
  cg: string;
  text: string;
  epilogue: string[];
};

// S10 ENDING: карточка концовки. Из состояния доступен только переход в EPILOGUE (SPEC §3).
export class EndingScene extends Phaser.Scene {
  constructor() {
    super('Ending');
  }

  create(data: EndingPayload): void {
    const flow = this.registry.get('flow') as GameFlow;
    const saves = this.registry.get('saves') as SaveManager;
    this.cameras.main.setBackgroundColor(0x000000);

    const base = cgBase(data.cg);
    if (base && this.textures.exists(base)) {
      const img = this.add.image(640, 360, base);
      img.setDisplaySize(1280, 720);
      const grade = cgGrade(data.cg);
      if (grade) {
        img.setTintFill(grade.tint);
        img.setAlpha(0.28);
        this.tweens.add({
          targets: img,
          alpha: grade.effect === 'bloom' ? 0.5 : 0.3,
          duration: grade.effect === 'noise' ? 380 : 2400,
          yoyo: grade.effect !== 'fade',
          repeat: grade.effect === 'fade' ? 0 : -1,
        });
      }
    }
    this.add.rectangle(640, 640, 1280, 160, 0x000000, 0.55);

    const endingsTotal = 4;
    const got = saves.readEndings().size;
    this.add.text(640, 210, data.title, {
      fontFamily: FONT_SERIF, fontSize: '44px', color: '#e8eef2', align: 'center',
    }).setOrigin(0.5).setShadow(0, 4, '#000', 12, true, true);
    this.add.text(640, 265, `Концовка открыта · ${got}/${endingsTotal}`, {
      fontFamily: FONT_SERIF, fontSize: '17px', color: '#d9a441',
    }).setOrigin(0.5);
    this.add.text(640, 560, data.text, {
      fontFamily: FONT_SERIF, fontSize: '21px', color: COLORS.text,
      align: 'center', wordWrap: { width: 900 },
    }).setOrigin(0.5);

    const proceed = (): void => {
      flow.go('T27');
      this.scene.start('Epilogue', { lines: data.epilogue, title: data.title });
    };
    makeButton(this, 540, 648, 'Далее', proceed, { width: 200, height: 46, accent: true });
    this.input.keyboard?.on('keydown-SPACE', proceed);
    this.input.keyboard?.on('keydown-ESC', proceed); // «назад» из ENDING -> EPILOGUE (SPEC §7)
  }
}
