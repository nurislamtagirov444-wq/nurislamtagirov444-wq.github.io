import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene.ts';
import { PreloadScene } from './scenes/PreloadScene.ts';
import { TitleScene } from './scenes/TitleScene.ts';
import { StoryScene } from './scenes/StoryScene.ts';
import { PauseOverlay } from './scenes/PauseOverlay.ts';
import { SaveLoadOverlay } from './scenes/SaveLoadOverlay.ts';
import { SettingsOverlay } from './scenes/SettingsOverlay.ts';
import { BacklogOverlay } from './scenes/BacklogOverlay.ts';
import { StatsOverlay } from './scenes/StatsOverlay.ts';
import { EndingScene } from './scenes/EndingScene.ts';
import { EpilogueScene } from './scenes/EpilogueScene.ts';
import type { GameFlow } from './core/flow.ts';
import type { SaveManager } from './core/save.ts';
import type { ProceduralAudio } from './audio/procedural.ts';
import type { StoryScene as StorySceneType } from './scenes/StoryScene.ts';
import { wireAndroidBack } from './core/platform.ts';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'app',
  width: 1280,
  height: 720,
  backgroundColor: '#0b1216',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  render: {
    antialias: true,
    powerPreference: 'low-power',
  },
  fps: { target: 60, forceSetTimeOut: false },
  scene: [
    BootScene,
    PreloadScene,
    TitleScene,
    StoryScene,
    PauseOverlay,
    SaveLoadOverlay,
    SettingsOverlay,
    BacklogOverlay,
    StatsOverlay,
    EndingScene,
    EpilogueScene,
  ],
};

const game = new Phaser.Game(config);

// APK: hardware «назад» (в web — неактивно; Esc покрывает ту же карту).
void wireAndroidBack();

// Диагностический интерфейс (используется E2E-смоуком; на геймплей не влияет).
(globalThis as { __game?: unknown }).__game = game;
(globalThis as { __mayak?: unknown }).__mayak = {
  getState: () => (game.registry.get('flow') as GameFlow | undefined)?.state ?? null,
  getNode: () =>
    (game.registry.get('engine') as { nodeId?: string } | undefined)?.nodeId ?? null,
  getBacklog: () =>
    ((game.registry.get('engine') as { backlog?: { list(): unknown[] } } | undefined)
      ?.backlog?.list().length ?? -1),
  getStat: (k: string) =>
    (game.registry.get('engine') as { stats?: Record<string, number> } | undefined)?.stats?.[k] ?? null,
};

// Телепорт для автотестов: активен только при ?e2e=1 в URL.
if (typeof location !== 'undefined' && location.search.includes('e2e=1')) {
  (globalThis as unknown as { __mayak: Record<string, unknown> }).__mayak.debugJump = (id: string) => {
    const story = game.scene.getScene('Story') as StorySceneType | null;
    story?.jumpToNode(id);
    return (game.registry.get('flow') as GameFlow | undefined)?.state ?? null;
  };
}

// Сворачивание/возврат (SPEC §7): autosave + авто-пауза + глушение звука.
document.addEventListener('visibilitychange', () => {
  const scene = game.scene.getScene('Story') as StorySceneType | null;
  const flow = game.registry.get('flow') as GameFlow | undefined;
  const saves = game.registry.get('saves') as SaveManager | undefined;
  const audio = game.registry.get('audio') as ProceduralAudio | undefined;
  if (document.hidden) {
    audio?.suspend();
    if (flow && saves && scene && flow.state === 'STORY') {
      saves.auto(scene.snapshotNow());
      if (scene.scene.isActive()) {
        const pauseLaunched = game.scene.isActive('Pause') || game.scene.isSleeping('Story');
        if (!pauseLaunched) {
          try {
            flow.go('T14');
            scene.scene.launch('Pause', {});
            scene.scene.pause();
          } catch {
            // flow в несоответствующем состоянии — сохранились, этого достаточно
          }
        }
      }
    }
  }
});
