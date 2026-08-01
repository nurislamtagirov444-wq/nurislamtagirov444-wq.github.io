import Phaser from 'phaser';
import { ART_BASE, BG_FILES, PORTRAIT_FILES } from '../content/assetsManifest.ts';
import { COLORS, FONT_SERIF } from '../ui/widgets.ts';
import type { GameFlow } from '../core/flow.ts';

// S2 PRELOAD: грузит только файлы из манифеста; провал файла = ошибка сборки контента.
export class PreloadScene extends Phaser.Scene {
  constructor() {
    super('Preload');
  }

  preload(): void {
    this.cameras.main.setBackgroundColor(0x0b1216);
    const barBg = this.add.rectangle(640, 380, 480, 10, 0x24343f);
    const bar = this.add.rectangle(400, 380, 0, 10, COLORS.gold).setOrigin(0, 0.5);
    this.add
      .text(640, 330, 'Крюково загружается…', {
        fontFamily: FONT_SERIF,
        fontSize: '20px',
        color: COLORS.textDim,
      })
      .setOrigin(0.5);
    this.load.on('progress', (v: number) => {
      bar.width = Math.max(4, 480 * v);
      void barBg;
    });

    for (const [key, file] of Object.entries(BG_FILES)) {
      this.load.image(key, `${ART_BASE}${file}`);
    }
    for (const [key, file] of Object.entries(PORTRAIT_FILES)) {
      this.load.image(key, `${ART_BASE}${file}`);
    }
  }

  create(): void {
    const failed = this.load.isLoading() ? [] : this.failedList();
    if (failed.length > 0) {
      this.add
        .text(640, 420, `Не загружены ассеты: ${failed.join(', ')}`, {
          fontFamily: FONT_SERIF,
          fontSize: '16px',
          color: '#d97a7a',
        })
        .setOrigin(0.5);
      // Продолжать нельзя: игра без арта = битая ссылка, честно стоим здесь.
      return;
    }
    const flow = this.registry.get('flow') as GameFlow;
    flow.go('T2');
    this.scene.start('Title');
  }

  private failedList(): string[] {
    // Phaser помечает неудачные файлы в логе, но открытого API списка нет:
    // проверяем факт наличия каждой текстуры из манифеста.
    const missing: string[] = [];
    for (const key of [...Object.keys(BG_FILES), ...Object.keys(PORTRAIT_FILES)]) {
      if (!this.textures.exists(key)) missing.push(key);
    }
    return missing;
  }
}
