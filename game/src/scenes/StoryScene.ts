import Phaser from 'phaser';
import { StoryEngine, type EngineSnapshot, type PausedState } from '../core/storyEngine.ts';
import { GRAPH, START_NODE } from '../content/story/index.ts';
import type { GameFlow } from '../core/flow.ts';
import type { SaveManager } from '../core/save.ts';
import type { ProceduralAudio } from '../audio/procedural.ts';
import type { Settings } from '../core/settings.ts';
import type { ChoiceNode, MapNode, SayNode } from '../core/storyTypes.ts';
import { isBgKey, portraitFile } from '../content/assetsManifest.ts';
import { BALANCE } from '../content/balance.ts';
import { COLORS, FONT_SERIF, drawPanel, makeButton, toast } from '../ui/widgets.ts';

type StoryInit = { mode: 'new' } | { mode: 'load'; snap: EngineSnapshot };

const SPEAKER_COLOR: Record<string, string> = {
  Алекс: '#9fc3e8',
  Марина: '#d9a441',
  Дарья: '#8fd6a5',
  Штерн: '#c9a08c',
  Радио: '#b8a5e0',
};

// S4 STORY: центральный экран. Оверлеи запускаются поверх (scene.launch), сцена спит.
export class StoryScene extends Phaser.Scene {
  private engine!: StoryEngine;
  private flow!: GameFlow;
  private saves!: SaveManager;
  private audio!: ProceduralAudio;
  private settings!: Settings;

  private bg!: Phaser.GameObjects.Image;
  private dimRect!: Phaser.GameObjects.Rectangle;
  private fxRect!: Phaser.GameObjects.Rectangle;
  private plate: Phaser.GameObjects.Image | null = null;
  private nameText!: Phaser.GameObjects.Text;
  private bodyText!: Phaser.GameObjects.Text;
  private textboxG!: Phaser.GameObjects.Graphics;
  private dayLabel!: Phaser.GameObjects.Text;
  private choiceLayer: Phaser.GameObjects.Container | null = null;
  private timerBar: Phaser.GameObjects.Rectangle | null = null;
  private quickLayer!: Phaser.GameObjects.Container;

  private typing = false;
  private fullText = '';
  private typeEvent: Phaser.Time.TimerEvent | null = null;
  private typingDone: (() => void) | null = null;
  private autoOn = false;
  private skipOn = false;
  private nextAutoAt = 0;
  private nextSkipAt = 0;
  private plateFrame: Phaser.GameObjects.Graphics | null = null;
  private inputLocked = false;
  private globalSeen: Set<string> = new Set();

  constructor() {
    super('Story');
  }

  init(data: StoryInit): void {
    this.saves = this.registry.get('saves') as SaveManager;
    this.flow = this.registry.get('flow') as GameFlow;
    this.audio = this.registry.get('audio') as ProceduralAudio;
    this.settings = this.registry.get('settings') as Settings;
    this.engine =
      data.mode === 'load'
        ? StoryEngine.fromSnapshot(GRAPH, (data as { snap: Parameters<typeof StoryEngine.fromSnapshot>[1] }).snap)
        : new StoryEngine(GRAPH, START_NODE);
    this.globalSeen = this.saves.readGlobalSeen();
    this.autoOn = false;
    this.skipOn = false;
    this.inputLocked = false;
  }

  create(): void {
    this.cameras.main.setBackgroundColor(0x0b1216);
    this.bg = this.add.image(640, 360, 'bg_title');
    this.bg.setDisplaySize(1280, 720);
    this.dimRect = this.add.rectangle(640, 360, 1280, 720, 0x000000, 0).setDepth(2);
    this.fxRect = this.add.rectangle(640, 360, 1280, 720, 0x54707e, 0).setDepth(3);

    this.dayLabel = this.add.text(20, 16, '', {
      fontFamily: FONT_SERIF, fontSize: '18px', color: COLORS.textDim,
    }).setDepth(10);

    this.registry.set('engine', this.engine); // отладка/E2E: текущая машина истории
    this.registry.set('flowStateNow', this.flow.state);

    this.renderPaused(this.engine.current());
    this.buildQuickMenu();
    this.bindInput();
  }

  // ---------- рендер состояния ----------

  private renderPaused(st: PausedState): void {
    this.applyVisuals(st.visuals);
    this.dayLabel.setText(st.day > 0 ? `День ${st.day}` : 'Пролог');

    if (st.kind === 'say') {
      this.renderSay(st.node as SayNode);
    } else if (st.kind === 'choice') {
      this.renderChoice(st);
    } else if (st.kind === 'map') {
      this.renderMap(st);
    } else if (st.kind === 'ending') {
      this.gotoEnding(st);
    }
    this.showDelta();
  }

  private applyVisuals(v: PausedState['visuals']): void {
    if (v.bg && isBgKey(v.bg) && this.textures.exists(v.bg)) {
      const tex = this.textures.get(v.bg);
      if (tex.key !== this.bg.texture.key) {
        this.bg.setTexture(v.bg);
        this.bg.setDisplaySize(1280, 720);
        this.tweens.add({ targets: this.bg, alpha: { from: 0.2, to: 1 }, duration: 350 });
      }
    }
    if (v.amb) this.audio.ambience(v.amb);
    this.dimRect.setFillStyle(0x000000, v.dim ? 0.42 : 0.0);

    if (v.sprite === null) {
      if (this.plate) {
        this.tweens.add({ targets: this.plate, alpha: 0, duration: 200, onComplete: () => this.plate?.destroy() });
        this.plate = null;
      }
    } else if (v.sprite) {
      const file = portraitFile(v.sprite.who, v.sprite.pose);
      if (file) {
        const key = `${v.sprite.who}.${v.sprite.pose}`;
        if (!this.plate || this.plate.texture.key !== key) {
          this.plate?.destroy();
          this.plateFrame?.destroy();
          this.plate = this.add.image(1030, 470, key).setDepth(4);
          const scale = 360 / this.plate.width;
          this.plate.setScale(scale * 1.15);
          this.plate.setAlpha(0);
          const bw = this.plate.displayWidth + 14;
          const bh = this.plate.displayHeight + 14;
          this.plateFrame = this.add.graphics().setDepth(3);
          this.plateFrame.lineStyle(2, COLORS.panelEdge, 1);
          this.plateFrame.strokeRoundedRect(1030 - bw / 2, 470 - bh / 2, bw, bh, 8);
          this.tweens.add({ targets: this.plate, alpha: 0.95, duration: 300 });
        }
      }
    }
    // низкая Ясность: лёгкая оптическая аномалия интерфейса (выкл. при reduceFx)
    const low = this.engine.stats.clarity < BALANCE.thresholds.lowClarityFx;
    if (low && !this.settings.reduceFx) {
      this.fxRect.setFillStyle(0x54707e, 0.08);
      this.tweens.add({ targets: this.fxRect, alpha: { from: 0.35, to: 0.08 }, duration: 1400, yoyo: true, repeat: -1 });
    } else {
      this.tweens.killTweensOf(this.fxRect);
      this.fxRect.alpha = 0;
    }
  }

  private renderSay(node: SayNode): void {
    this.clearChoiceLayer();
    this.ensureTextbox();
    this.nameText.setText(node.speaker);
    this.nameText.setColor(SPEAKER_COLOR[node.speaker] ?? COLORS.textDim);
    this.typeText(node.text);
    this.maybeAutosave();
  }

  private renderChoice(st: PausedState): void {
    const node = st.node as ChoiceNode;
    this.clearChoiceLayer();
    this.ensureTextbox();
    this.nameText.setText('');
    this.typeText(node.prompt ?? 'Выбери:', () => this.showChoices(st));
    if (node.timeout) this.startTimeoutBar(node.timeout.sec);
  }

  private renderMap(st: PausedState): void {
    const node = st.node as MapNode;
    this.clearChoiceLayer();
    this.ensureTextbox();
    this.nameText.setText('');
    this.typeText(node.prompt, () => this.showMapCards(st));
    this.saves.mergeGlobalSeen([`${node.id}`]);
  }

  private gotoEnding(st: PausedState): void {
    const node = st.node as Extract<PausedState['node'], { type: 'ending' }>;
    this.saves.markEnding(node.endingId);
    this.saves.mergeGlobalSeen([...this.engine.seen]);
    this.engine.finishedEnding = node.endingId;
    // автосейв финального состояния нужен для «Продолжить» (позволит пересмотреть финал/сделать сейв до развязки)
    this.saves.auto(this.engine.snapshot());
    this.flow.go('T26');
    this.scene.start('Ending', {
      endingId: node.endingId,
      title: node.title,
      cg: node.cg,
      text: node.text,
      epilogue: node.epilogue,
    });
  }

  // ---------- текстовое окно ----------

  private ensureTextbox(): void {
    if (this.textboxG) return;
    const alpha = this.settings.textboxAlpha;
    this.textboxG = drawPanel(this, 60, 480, 900, 210, alpha).setDepth(8);
    this.nameText = this.add.text(90, 496, '', {
      fontFamily: FONT_SERIF, fontSize: '20px', color: COLORS.text,
    }).setDepth(9);
    this.bodyText = this.add.text(90, 532, '', {
      fontFamily: FONT_SERIF, fontSize: '21px', color: COLORS.text,
      wordWrap: { width: 840 }, lineSpacing: 6,
    }).setDepth(9);
    this.bodyText.setInteractive({ useHandCursor: true });
    this.bodyText.on('pointerdown', () => this.onAdvanceTap());
  }

  private typeText(text: string, onDone?: () => void): void {
    this.fullText = text;
    this.typing = true;
    this.typingDone = onDone ?? null;
    this.bodyText.setText('');
    this.typeEvent?.remove();
    const cps = Math.max(10, this.settings.textSpeedCps);
    let i = 0;
    this.typeEvent = this.time.addEvent({
      delay: 1000 / cps,
      repeat: Math.max(0, text.length - 1),
      callback: () => {
        i++;
        this.bodyText.setText(text.slice(0, i));
        if (i >= text.length) this.completeTyping();
      },
    });
  }

  private completeTyping(): void {
    if (!this.typing) return;
    this.typeEvent?.remove();
    this.bodyText.setText(this.fullText);
    this.typing = false;
    this.nextAutoAt = this.time.now + this.settings.autoDelayMs;
    const cb = this.typingDone;
    this.typingDone = null;
    cb?.();
  }

  private finishTyping(): void {
    this.completeTyping();
  }

  // ---------- выборы ----------

  private showChoices(st: PausedState): void {
    this.clearChoiceLayer();
    const layer = this.add.container(0, 0).setDepth(20);
    const opts = st.availableOptions;
    opts.forEach((opt, i) => {
      const y = 240 + i * 74;
      const marker = opt.irrevocable ? '● ' : '';
      const btn = makeButton(this, 340, y, `${marker}${opt.text}`, () => {
        this.audio.uiClick();
        this.stopTimeoutBar();
        this.pick(i);
      }, { width: 640, fontSize: 19 });
      layer.add(btn);
    });
    this.choiceLayer = layer;
  }

  private showMapCards(st: PausedState): void {
    this.clearChoiceLayer();
    const layer = this.add.container(0, 0).setDepth(20);
    const opts = st.availableOptions;
    opts.forEach((opt, i) => {
      const x = 120 + i * 360;
      const cardG = this.add.graphics();
      cardG.fillStyle(COLORS.panel, 0.95);
      cardG.fillRoundedRect(0, 0, 320, 150, 8);
      cardG.lineStyle(2, COLORS.goldDim, 1);
      cardG.strokeRoundedRect(0, 0, 320, 150, 8);
      const place = (opt as { place?: string }).place ?? '';
      const hint = (opt as { hint?: string }).hint ?? '';
      const t1 = this.add.text(160, 40, place, {
        fontFamily: FONT_SERIF, fontSize: '24px', color: '#e8eef2',
      }).setOrigin(0.5);
      const t2 = this.add.text(160, 86, `${opt.text}\n${hint}`, {
        fontFamily: FONT_SERIF, fontSize: '15px', color: COLORS.textDim, align: 'center',
        wordWrap: { width: 290 },
      }).setOrigin(0.5);
      const card = this.add.container(x, 250, [cardG, t1, t2]);
      card.setSize(320, 150);
      card.setInteractive({ useHandCursor: true });
      card.on('pointerdown', () => {
        this.audio.uiClick();
        this.pick(i);
      });
      layer.add(card);
    });
    this.choiceLayer = layer;
  }

  private pick(index: number): void {
    if (this.inputLocked) return;
    this.inputLocked = true;
    this.clearChoiceLayer();
    const st = this.engine.choose(index);
    this.inputLocked = false;
    this.renderPaused(st);
    this.maybeAutosave();
  }

  private startTimeoutBar(sec: number): void {
    this.stopTimeoutBar();
    const barBg = this.add.rectangle(340, 520, 640, 6, 0x24343f).setOrigin(0, 0.5).setDepth(21);
    this.timerBar = this.add.rectangle(340, 520, 640, 6, COLORS.danger).setOrigin(0, 0.5).setDepth(22);
    this.tweens.add({
      targets: this.timerBar,
      displayWidth: 0,
      duration: sec * 1000,
      onComplete: () => {
        barBg.destroy();
        this.pickTimeout();
      },
    });
    this.timerBar.setData('bgBar', barBg);
  }

  private stopTimeoutBar(): void {
    if (this.timerBar) {
      this.tweens.killTweensOf(this.timerBar);
      const bg = this.timerBar.getData('bgBar') as Phaser.GameObjects.Rectangle | undefined;
      bg?.destroy();
      this.timerBar.destroy();
      this.timerBar = null;
    }
  }

  private pickTimeout(): void {
    if (this.inputLocked) return;
    this.clearChoiceLayer();
    const st = this.engine.choose('timeout');
    this.renderPaused(st);
  }

  private clearChoiceLayer(): void {
    this.choiceLayer?.destroy(true);
    this.choiceLayer = null;
    this.stopTimeoutBar();
  }

  // ---------- quick-меню ----------

  private buildQuickMenu(): void {
    this.quickLayer = this.add.container(1010, 24).setDepth(30);
    const mk = (label: string, i: number, cb: () => void, w = 74): Phaser.GameObjects.Container => {
      const b = makeButton(this, i * 84, 0, label, cb, { width: w, height: 40, fontSize: 15 });
      this.quickLayer.add(b);
      return b;
    };
    mk('Журнал', -9, () => { this.audio.uiClick(); this.flow.go('T20'); this.scene.launch('Backlog', { engine: this.engine }); this.scene.pause(); });
    mk('Auto', -8, () => { this.autoOn = !this.autoOn; this.audio.uiClick(); toast(this, this.autoOn ? 'Авто: вкл' : 'Авто: выкл', { y: 70 }); });
    mk('Skip', -7, () => this.toggleSkip());
    mk('Save', -6, () => { this.audio.uiClick(); this.flow.go('T17'); this.flow.overlaySource = 'story'; this.scene.launch('SaveLoad', { mode: 'save', source: 'story', engine: this.engine }); this.scene.pause(); });
    mk('Load', -5, () => { this.audio.uiClick(); this.flow.go('T17'); this.flow.overlaySource = 'story'; this.scene.launch('SaveLoad', { mode: 'load', source: 'story' }); this.scene.pause(); });
    mk('Статы', -4, () => { this.audio.uiClick(); this.flow.go('T22'); this.scene.launch('Stats', { engine: this.engine }); this.scene.pause(); });
    mk('⚙', -3, () => { this.audio.uiClick(); this.flow.go('T18'); this.flow.overlaySource = 'story'; this.scene.launch('Settings', { source: 'story', storyRef: this }); this.scene.pause(); });
    mk('☰', -2, () => this.openPause(), 50);
  }

  private openPause(): void {
    if (this.flow.state !== 'STORY') return;
    this.audio.uiClick();
    this.flow.go('T14');
    this.scene.launch('Pause', { storyRef: this });
    this.scene.pause();
  }

  private toggleSkip(): void {
    if (!this.skipAllowed()) {
      toast(this, 'Скип доступен только по прочитанному', { y: 70 });
      return;
    }
    this.skipOn = !this.skipOn;
    this.audio.uiClick();
    toast(this, this.skipOn ? 'Скип: вкл (прочитанное)' : 'Скип: выкл', { y: 70 });
  }

  private skipAllowed(): boolean {
    const id = this.engine.nodeId;
    return this.globalSeen.has(id) || this.engine.isSeen(id);
  }

  // ---------- ввод ----------

  private bindInput(): void {
    this.input.on('pointerdown', (_p: Phaser.Input.Pointer, targets: Phaser.GameObjects.GameObject[]) => {
      void _p;
      if (targets.length > 0) return; // клик по кнопкам/карточкам — не «далее»
      this.onAdvanceTap();
    });
    this.input.keyboard?.on('keydown-SPACE', () => this.onAdvanceTap());
    this.input.keyboard?.on('keydown-ESC', () => this.openPause());
  }

  private onAdvanceTap(): void {
    if (this.inputLocked || this.flow.state !== 'STORY') return;
    if (this.typing) {
      this.finishTyping();
      return;
    }
    if (this.engine.nodeType() !== 'say') return; // choice/map/ending ждут явного выбора
    this.audio.unlock();
    const st = this.engine.advance();
    this.renderPaused(st);
    this.maybeAutosave();
  }

  /** Авто-чтение и скип (только «далее» по say-узлам; скип — только прочитанное). */
  update(): void {
    if (this.flow.state !== 'STORY' || this.typing || this.inputLocked) return;
    if (this.engine.nodeType() !== 'say') {
      this.skipOn = false; // скип останавливается на решениях/концовках
      return;
    }
    const now = this.time.now;
    if (this.skipOn) {
      if (!this.skipAllowed()) {
        this.skipOn = false;
        toast(this, 'Скип: остановка (новый текст)', { y: 70 });
        return;
      }
      if (now >= this.nextSkipAt) {
        this.nextSkipAt = now + 90;
        this.onAdvanceTap();
      }
      return;
    }
    if (this.autoOn && now >= this.nextAutoAt) {
      this.onAdvanceTap();
    }
  }

  private maybeAutosave(): void {
    if (this.engine.needsAutosave()) {
      this.saves.auto(this.engine.snapshot());
      this.engine.markAutosaved();
      this.saves.mergeGlobalSeen([...this.engine.seen]);
    }
  }

  private showDelta(): void {
    const d = this.engine.lastDelta;
    const labels: Record<string, string> = {
      clarity: 'Ясность',
      'marina.trust': 'Доверие Марины',
      'marina.bond': 'Близость Марины',
      'daria.trust': 'Доверие Дарьи',
      'daria.bond': 'Близость Дарьи',
    };
    let i = 0;
    for (const [k, v] of Object.entries(d)) {
      const cur = (this.engine.stats as Record<string, number>)[k];
      const prev = v as number;
      const diff = cur - prev;
      if (diff === 0) continue;
      const sign = diff > 0 ? `+${diff}` : `${diff}`;
      toast(this, `${labels[k] ?? k}: ${sign}`, { y: 100 + i * 44, holdMs: 1400 });
      this.audio.statTick();
      i++;
    }
  }

  // возобновление после оверлея
  resumeFromOverlay(): void {
    this.scene.resume();
    this.inputLocked = false;
    this.clearChoiceLayer();
    this.renderPaused(this.engine.current());
  }

  /** Снапшот для оверлеев сохранения. */
  snapshotNow(): EngineSnapshot {
    return this.engine.snapshot();
  }

  /** Живая перерисовка текстбокса при смене прозрачности в настройках. */
  refreshTextbox(): void {
    if (!this.textboxG) return;
    const t = this.bodyText.text;
    const name = this.nameText.text;
    const typing = this.typing;
    this.textboxG.destroy();
    this.nameText.destroy();
    this.bodyText.destroy();
    this.textboxG = null as unknown as Phaser.GameObjects.Graphics;
    this.ensureTextbox();
    this.nameText.setText(name);
    this.bodyText.setText(t);
    this.typing = typing;
  }

  /** E2E/отладка: телепорт в любой узел (без геймплей-эффектов за пределами движка). */
  jumpToNode(id: string): void {
    this.engine = new StoryEngine(GRAPH, id, 0x9e3779b9);
    this.registry.set('engine', this.engine);
    this.inputLocked = false;
    this.clearChoiceLayer();
    this.renderPaused(this.engine.current());
  }

  reloadEngine(snap: EngineSnapshot): void {
    this.engine = StoryEngine.fromSnapshot(GRAPH, snap);
    this.inputLocked = false;
    this.renderPaused(this.engine.current());
  }
}
