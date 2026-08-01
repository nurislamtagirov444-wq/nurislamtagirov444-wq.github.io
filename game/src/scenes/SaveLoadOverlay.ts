import Phaser from 'phaser';
import type { GameFlow } from '../core/flow.ts';
import type { SaveManager } from '../core/save.ts';
import type { ProceduralAudio } from '../audio/procedural.ts';
import type { StoryScene } from './StoryScene.ts';
import { COLORS, FONT_SERIF, confirmDialog, drawPanel, makeButton, toast } from '../ui/widgets.ts';

type Source = 'title' | 'story' | 'pause';

// S6 SAVE_LOAD: 9 слотов + quick/auto отображение. Режимы save/load, источник решает «Назад».
export class SaveLoadOverlay extends Phaser.Scene {
  constructor() {
    super('SaveLoad');
  }

  create(data: { mode: 'save' | 'load'; source: Source }): void {
    const flow = this.registry.get('flow') as GameFlow;
    const saves = this.registry.get('saves') as SaveManager;
    const audio = this.registry.get('audio') as ProceduralAudio;
    const { mode, source } = data;

    this.add.rectangle(640, 360, 1280, 720, 0x000000, 0.66).setInteractive();
    drawPanel(this, 330, 50, 620, 620);
    this.add.text(640, 92, mode === 'save' ? 'Сохранить' : 'Загрузить', {
      fontFamily: FONT_SERIF, fontSize: '26px', color: COLORS.text,
    }).setOrigin(0.5);

    const closeBack = (): void => {
      audio.uiBack();
      if (source === 'title') {
        flow.go('T9');
        this.scene.stop();
      } else if (source === 'story') {
        flow.go('T11');
        this.scene.resume('Story');
        this.scene.stop();
      } else {
        flow.go('T10');
        this.scene.launch('Pause', {});
        this.scene.stop();
      }
    };
    makeButton(this, 530, 620, 'Назад', closeBack, { width: 220, height: 44 });

    const doLoad = (key: string): void => {
      const snap = saves.loadFrom(key);
      if (!snap) {
        toast(this, 'Слот повреждён или пуст', { y: 120 });
        return;
      }
      audio.uiClick();
      if (source === 'title') {
        flow.go('T8');
        this.scene.stop('Title');
        this.scene.start('Story', { mode: 'load', snap });
        return;
      }
      const story = this.scene.get('Story') as StoryScene;
      story.reloadEngine(snap);
      if (source === 'story') {
        flow.go('T11');
        story.resumeFromOverlay();
        this.scene.resume('Story');
        this.scene.stop();
      } else {
        // источник pause: загрузка идёт прямо в STORY (пауза больше не актуальна)
        const f = this.registry.get('flow') as GameFlow;
        if (f.state === 'SAVE_LOAD') f.go('T11');
        this.scene.resume('Story');
        story.resumeFromOverlay();
        this.scene.stop();
      }
    };

    const doSave = (key: string): void => {
      const story = this.scene.get('Story') as StoryScene | null;
      if (!story) {
        toast(this, 'Нет активной истории', { y: 120 });
        return;
      }
      const ok = saves.saveTo(key, story.snapshotNow());
      toast(this, ok ? 'Сохранено' : 'Ошибка записи (место?)', { y: 120 });
      audio.uiClick();
      this.scene.restart({ mode, source });
    };

    const slots = saves.describeSlots();
    slots.forEach((s, i) => {
      const y = 130 + i * 50;
      const label = !s
        ? `${i + 1}. — пусто —`
        : s.corrupted
          ? `${i + 1}. ⚠ повреждён`
          : `${i + 1}. ${s.rec!.label} · ${new Date(s.rec!.ts).toLocaleString('ru-RU')}`;
      const btn = makeButton(this, 350, y, label, () => {
        if (mode === 'save') {
          if (s && !s.corrupted) {
            confirmDialog(this, 'Перезаписать слот?', () => doSave(s.key));
          } else {
            doSave(s?.key ?? saves.slotKey(i));
          }
        } else if (s && !s.corrupted) {
          doLoad(s.key);
        } else {
          toast(this, 'Слот пуст', { y: 120 });
        }
      }, { width: 580, height: 42, fontSize: 16, disabled: mode === 'load' && (!s || s.corrupted) });
    });

    // quick/auto — инфо-строка: они служебные, не слоты
    const cont = saves.hasContinue() ? 'доступны' : 'пусты';
    this.add.text(640, 592, `Quicksave/Autosave: ${cont} («Продолжить» на титуле)`, {
      fontFamily: FONT_SERIF, fontSize: '14px', color: COLORS.textDim,
    }).setOrigin(0.5);

    this.input.keyboard?.on('keydown-ESC', closeBack);
  }
}
