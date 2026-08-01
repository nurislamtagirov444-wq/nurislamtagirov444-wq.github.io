// Процедурный аудио-движок (SPEC E9): весь эмбиент и UI-звуки синтезируются
// на WebAudio в рантайме. В игре НЕТ ни одного аудиофайла.

export type AmbName = 'rain' | 'sea' | 'wind' | 'radio' | 'room' | 'silence';

type LoopHandle = {
  stop(): void;
  setGain(v: number): void;
};

function makeNoiseBuffer(ctx: AudioContext, seconds = 2): AudioBuffer {
  const len = Math.floor(ctx.sampleRate * seconds);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < len; i++) {
    last = last * 0.97 + (Math.random() * 2 - 1) * 0.03; // коричневатый шум, мягко
    data[i] = last * 8 + (Math.random() * 2 - 1) * 0.12;
  }
  return buf;
}

export class ProceduralAudio {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private ambBus: GainNode | null = null;
  private sfxBus: GainNode | null = null;
  private loop: LoopHandle | null = null;
  private ambVol = 0.7;
  private currentAmb: AmbName | null = null;

  private ensure(): boolean {
    if (this.ctx) return true;
    try {
      const AC =
        (globalThis as { AudioContext?: typeof AudioContext }).AudioContext ?? null;
      if (!AC) return false;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.connect(this.ctx.destination);
      this.ambBus = this.ctx.createGain();
      this.ambBus.connect(this.master);
      this.sfxBus = this.ctx.createGain();
      this.sfxBus.connect(this.master);
      this.ambBus.gain.value = this.ambVol;
      return true;
    } catch {
      return false;
    }
  }

  /** Обязателен вызов из жеста пользователя (Chrome autoplay policy). Идемпотентен. */
  unlock(): void {
    if (!this.ensure()) return;
    if (this.ctx!.state === 'suspended') void this.ctx!.resume();
  }

  suspend(): void {
    if (this.ctx && this.ctx.state === 'running') void this.ctx.suspend();
  }

  setMaster(v: number): void {
    if (!this.ensure()) return;
    this.master!.gain.setTargetAtTime(v, this.ctx!.currentTime, 0.05);
  }
  setAmb(v: number): void {
    this.ambVol = v;
    if (this.ensure()) this.ambBus!.gain.setTargetAtTime(v, this.ctx!.currentTime, 0.1);
  }
  setSfx(v: number): void {
    if (!this.ensure()) return;
    this.sfxBus!.gain.setTargetAtTime(v, this.ctx!.currentTime, 0.05);
  }

  /** Переключает эмбиент с кроссфейдом. 'silence' = выключить цикл. */
  ambience(name: AmbName): void {
    if (!this.ensure()) return;
    if (this.currentAmb === name) return;
    this.currentAmb = name;
    const t = this.ctx!.currentTime;
    if (this.loop) {
      const old = this.loop;
      old.setGain(0);
      setTimeout(() => old.stop(), 800);
      this.loop = null;
    }
    if (name === 'silence') return;
    this.loop = this.buildLoop(name);
    this.loop.setGain(0);
    setTimeout(() => this.loop?.setGain(1), 30);
    void t;
  }

  private buildLoop(name: AmbName): LoopHandle {
    const ctx = this.ctx!;
    const noise = makeNoiseBuffer(ctx);
    const src = ctx.createBufferSource();
    src.buffer = noise;
    src.loop = true;
    const gain = ctx.createGain();
    gain.gain.value = 0;
    let node: AudioNode = src;

    const connectChain = (filter: BiquadFilterNode | null): void => {
      if (filter) {
        node.connect(filter);
        node = filter;
      }
      node.connect(gain);
      gain.connect(this.ambBus!);
    };

    const lfo = (freq: number, depth: number, target: AudioParam): void => {
      const o = ctx.createOscillator();
      o.frequency.value = freq;
      const g = ctx.createGain();
      g.gain.value = depth;
      o.connect(g);
      g.connect(target);
      o.start();
    };

    switch (name) {
      case 'rain': {
        const f = ctx.createBiquadFilter();
        f.type = 'highpass';
        f.frequency.value = 900;
        connectChain(f);
        gain.gain.value = 0;
        lfo(0.4, 0.15, gain.gain);
        break;
      }
      case 'sea': {
        const f = ctx.createBiquadFilter();
        f.type = 'lowpass';
        f.frequency.value = 420;
        connectChain(f);
        lfo(0.09, 0.45, gain.gain); // накаты волн
        break;
      }
      case 'wind': {
        const f = ctx.createBiquadFilter();
        f.type = 'bandpass';
        f.frequency.value = 300;
        f.Q.value = 2;
        connectChain(f);
        lfo(0.07, 120, f.frequency); // завывание гуляет по частоте
        break;
      }
      case 'radio': {
        const f = ctx.createBiquadFilter();
        f.type = 'bandpass';
        f.frequency.value = 1400;
        f.Q.value = 6;
        connectChain(f);
        lfo(12.5, 0.06, gain.gain); // дрожание помех
        // периодические трески-«искры»
        const crackle = (): void => {
          if (this.currentAmb !== 'radio') return;
          this.blip(2200 + Math.random() * 800, 0.02, 0.05);
          setTimeout(crackle, 250 + Math.random() * 900);
        };
        setTimeout(crackle, 300);
        break;
      }
      case 'room': {
        const f = ctx.createBiquadFilter();
        f.type = 'lowpass';
        f.frequency.value = 220;
        connectChain(f);
        break;
      }
      default:
        connectChain(null);
    }
    src.start();
    return {
      stop: () => {
        try {
          src.stop();
          gain.disconnect();
        } catch {
          /* уже остановлен */
        }
      },
      setGain: (v: number) => {
        const level = name === 'room' ? v * 0.35 : name === 'sea' ? v * 0.6 : v * 0.5;
        gain.gain.setTargetAtTime(level, ctx.currentTime, 0.35);
      },
    };
  }

  /** Короткий синтезированный щелчок/блип для UI. */
  blip(freq = 660, dur = 0.045, vol = 0.2): void {
    if (!this.ensure()) return;
    const ctx = this.ctx!;
    const o = ctx.createOscillator();
    o.type = 'triangle';
    o.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
    o.connect(g);
    g.connect(this.sfxBus!);
    o.start();
    o.stop(ctx.currentTime + dur + 0.02);
  }

  uiClick(): void {
    this.blip(700, 0.045, 0.22);
  }
  uiBack(): void {
    this.blip(420, 0.06, 0.2);
  }
  statTick(): void {
    this.blip(980, 0.05, 0.14);
  }
}
