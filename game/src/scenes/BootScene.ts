import Phaser from 'phaser';
import { GameFlow } from '../core/flow.ts';
import { LocalStoragePort } from '../core/storage.ts';
import { SaveManager } from '../core/save.ts';
import { loadSettings } from '../core/settings.ts';
import { ProceduralAudio } from '../audio/procedural.ts';

// S1 BOOT: хранилище, сейвы, настройки, аудио. Битые слоты чистятся здесь (SPEC E5).
export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create(): void {
    const storage = new LocalStoragePort();
    const saves = new SaveManager(storage);
    const corrupted: string[] = [];
    for (const s of saves.describeSlots()) {
      if (s?.corrupted) {
        saves.clearSlot(s.key);
        corrupted.push(s.key);
      }
    }
    const settings = loadSettings(storage);
    const audio = new ProceduralAudio();
    audio.setMaster(settings.volMaster);
    audio.setAmb(settings.volAmb);
    audio.setSfx(settings.volSfx);
    const flow = new GameFlow();

    this.registry.set('storage', storage);
    this.registry.set('saves', saves);
    this.registry.set('settings', settings);
    this.registry.set('audio', audio);
    this.registry.set('flow', flow);
    this.registry.set('corruptedSlotsPurged', corrupted.length);

    this.cameras.main.setBackgroundColor(0x0b1216);
    flow.go('T1');
    this.scene.start('Preload');
  }
}
