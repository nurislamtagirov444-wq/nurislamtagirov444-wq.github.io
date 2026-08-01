// Общие UI-примитивы: кнопки, панели, слайдеры, тосты. Морская палитра.
import Phaser from 'phaser';

export const COLORS = {
  ink: 0x0b1216,
  panel: 0x101c24,
  panelEdge: 0x2a4254,
  gold: 0xd9a441,
  goldDim: 0x8a6a2c,
  text: '#d7e3e8',
  textDim: '#8fa3ad',
  danger: 0x8a3b3b,
};

export const FONT_SERIF = 'Georgia, "Times New Roman", serif';

export type ButtonOpts = {
  width?: number;
  height?: number;
  fontSize?: number;
  disabled?: boolean;
  accent?: boolean;
};

export function makeButton(
  scene: Phaser.Scene,
  x: number,
  y: number,
  label: string,
  onClick: () => void,
  opts: ButtonOpts = {},
): Phaser.GameObjects.Container {
  const w = opts.width ?? 260;
  const h = opts.height ?? 52;
  const g = scene.add.graphics();
  const draw = (hover: boolean): void => {
    g.clear();
    const enabled = !opts.disabled;
    const edge = !enabled ? 0x22303a : hover ? COLORS.gold : opts.accent ? COLORS.goldDim : COLORS.panelEdge;
    const fill = !enabled ? 0x0e1921 : COLORS.panel;
    g.fillStyle(fill, 0.94);
    g.fillRoundedRect(0, 0, w, h, 6);
    g.lineStyle(2, edge, 1);
    g.strokeRoundedRect(0, 0, w, h, 6);
  };
  draw(false);
  const txt = scene.add
    .text(w / 2, h / 2, label, {
      fontFamily: FONT_SERIF,
      fontSize: `${opts.fontSize ?? 20}px`,
      color: opts.disabled ? COLORS.textDim : COLORS.text,
    })
    .setOrigin(0.5);
  const c = scene.add.container(x, y, [g, txt]);
  c.setSize(w, h);
  if (!opts.disabled) {
    c.setInteractive({ useHandCursor: true });
    c.on('pointerover', () => draw(true));
    c.on('pointerout', () => draw(false));
    c.on('pointerdown', onClick);
  }
  return c;
}

export function drawPanel(
  scene: Phaser.Scene,
  x: number,
  y: number,
  w: number,
  h: number,
  alpha = 0.92,
): Phaser.GameObjects.Graphics {
  const g = scene.add.graphics();
  g.fillStyle(COLORS.panel, alpha);
  g.fillRoundedRect(x, y, w, h, 10);
  g.lineStyle(2, COLORS.panelEdge, 1);
  g.strokeRoundedRect(x, y, w, h, 10);
  return g;
}

export type SliderOpts = { min: number; max: number; value: number; width?: number };

export function makeSlider(
  scene: Phaser.Scene,
  x: number,
  y: number,
  opts: SliderOpts,
  onChange: (v: number) => void,
): { setValue(v: number): void; container: Phaser.GameObjects.Container } {
  const width = opts.width ?? 320;
  const trackH = 6;
  const knobR = 13;
  const g = scene.add.graphics();
  let value = opts.value;
  const render = (): void => {
    g.clear();
    g.fillStyle(0x24343f, 1);
    g.fillRoundedRect(0, -trackH / 2, width, trackH, 3);
    const t = (value - opts.min) / (opts.max - opts.min);
    g.fillStyle(COLORS.gold, 1);
    g.fillRoundedRect(0, -trackH / 2, Math.max(6, width * t), trackH, 3);
    g.fillStyle(0xe8eef2, 1);
    g.fillCircle(width * t, 0, knobR);
  };
  render();
  const c = scene.add.container(x, y, [g]);
  c.setSize(width, knobR * 2);
  c.setInteractive({ useHandCursor: true });
  const fromPointer = (p: Phaser.Input.Pointer): void => {
    const localX = Phaser.Math.Clamp(p.x - c.getBounds().x, 0, width);
    value = opts.min + (localX / width) * (opts.max - opts.min);
    render();
    onChange(value);
  };
  c.on('pointerdown', fromPointer);
  c.on('pointermove', (p: Phaser.Input.Pointer) => {
    if (p.isDown) fromPointer(p);
  });
  return {
    setValue(v: number): void {
      value = v;
      render();
    },
    container: c,
  };
}

export function toast(
  scene: Phaser.Scene,
  text: string,
  opts: { y?: number; holdMs?: number } = {},
): void {
  const y = opts.y ?? 60;
  const t = scene.add
    .text(640, y, text, {
      fontFamily: FONT_SERIF,
      fontSize: '18px',
      color: '#0b1216',
      backgroundColor: '#d9a441',
      padding: { x: 14, y: 8 },
    })
    .setOrigin(0.5, 0)
    .setDepth(999)
    .setAlpha(0);
  scene.tweens.add({ targets: t, alpha: 1, duration: 180 });
  scene.tweens.add({
    targets: t,
    alpha: 0,
    delay: opts.holdMs ?? 1600,
    duration: 400,
    onComplete: () => t.destroy(),
  });
}

export function confirmDialog(
  scene: Phaser.Scene,
  question: string,
  onYes: () => void,
): void {
  const parts: Phaser.GameObjects.GameObject[] = [];
  const dark = scene.add
    .rectangle(640, 360, 1280, 720, 0x000000, 0.55)
    .setDepth(900)
    .setInteractive();
  parts.push(dark);
  parts.push(drawPanel(scene, 420, 260, 440, 200).setDepth(901));
  parts.push(
    scene.add
      .text(640, 310, question, {
        fontFamily: FONT_SERIF,
        fontSize: '19px',
        color: COLORS.text,
        wordWrap: { width: 380 },
        align: 'center',
      })
      .setOrigin(0.5)
      .setDepth(902),
  );
  const cleanup = (): void => {
    for (const p of parts) p.destroy();
  };
  parts.push(
    makeButton(scene, 460, 370, 'Да', () => {
      cleanup();
      onYes();
    }, { width: 180, accent: true }).setDepth(903),
  );
  parts.push(makeButton(scene, 640, 370, 'Отмена', () => cleanup(), { width: 180 }).setDepth(903));
}
