import { BALANCE } from '../content/balance.ts';
import { Backlog } from './backlog.ts';
import {
  applySetOps,
  checkCond,
  defaultStats,
  type Flags,
  type StatMap,
} from './stats.ts';
import type {
  ChoiceNode,
  ChoiceOption,
  MapNode,
  NodeId,
  SayNode,
  StoryGraph,
  StoryNode,
  Visuals,
} from './storyTypes.ts';

export type EngineSnapshot = {
  v: 1;
  nodeId: NodeId;
  stats: StatMap;
  flags: Flags;
  seen: string[];
  backlog: ReturnType<Backlog['serialize']>;
  day: number;
  choicesSinceAutosave: number;
  rngSeed: number;
};

export type PauseKind = 'say' | 'choice' | 'map' | 'ending';

export type PausedState = {
  kind: PauseKind;
  node: StoryNode;
  visuals: Visuals;
  day: number;
  availableOptions: ChoiceOption[]; // для choice/map после фильтра cond
};

/**
 * Детерминированный интерпретатор графа истории (SPEC E1).
 * Правила:
 *  - step*() возвращают первый «паузный» узел (say/choice/map/ending);
 *  - промежуточные set/if разворачиваются мгновенно и детерминированно;
 *  - защита от циклов: > maxAutoSteps промежуточных узлов подряд = ошибка контента.
 */
export class StoryEngine {
  readonly graph: StoryGraph;
  nodeId: NodeId;
  stats: StatMap;
  flags: Flags;
  seen: Set<string> = new Set();
  backlog = new Backlog();
  day = 0;
  choicesSinceAutosave = 0;
  rngSeed: number;
  finishedEnding: string | null = null;
  /** Дельта статов последнего шага (для анимаций UI). */
  lastDelta: Partial<StatMap> = {};

  private static maxAutoSteps = 200;

  constructor(graph: StoryGraph, startNode: NodeId, rngSeed = 0x9e3779b9) {
    this.graph = graph;
    this.nodeId = startNode;
    this.stats = defaultStats();
    this.flags = {};
    this.rngSeed = rngSeed;
    this.assertNode(startNode);
  }

  static fromSnapshot(graph: StoryGraph, snap: EngineSnapshot): StoryEngine {
    if (snap.v !== 1) throw new Error('Unsupported snapshot version');
    const e = new StoryEngine(graph, snap.nodeId, snap.rngSeed);
    e.stats = { ...e.stats, ...snap.stats };
    e.flags = { ...(snap.flags ?? {}) };
    e.seen = new Set(snap.seen ?? []);
    e.backlog.restore(snap.backlog);
    e.day = snap.day ?? 0;
    e.choicesSinceAutosave = snap.choicesSinceAutosave ?? 0;
    return e;
  }

  snapshot(): EngineSnapshot {
    return {
      v: 1,
      nodeId: this.nodeId,
      stats: { ...this.stats },
      flags: { ...this.flags },
      seen: [...this.seen],
      backlog: this.backlog.serialize(),
      day: this.day,
      choicesSinceAutosave: this.choicesSinceAutosave,
      rngSeed: this.rngSeed,
    };
  }

  private assertNode(id: NodeId): StoryNode {
    const n = this.graph[id];
    if (!n) throw new Error(`Story node not found: ${id}`);
    return n;
  }

  private tag(): string {
    return this.day > 0 ? `День ${this.day}` : 'Пролог';
  }

  /** Разворачивает set-if цепочки и возвращает состояние «паузного» узла. */
  private pauseAtCurrent(): PausedState {
    let steps = 0;
    this.lastDelta = {};
    for (;;) {
      const node = this.assertNode(this.nodeId);
      if (node.type === 'set') {
        const d = applySetOps(this.stats, this.flags, node.set);
        this.lastDelta = { ...this.lastDelta, ...d };
        this.nodeId = node.next;
        this.guard(++steps);
        continue;
      }
      if (node.type === 'if') {
        this.nodeId = checkCond(node.cond, this.stats, this.flags) ? node.then : node.else;
        this.guard(++steps);
        continue;
      }
      return this.describe(node);
    }
  }

  private guard(steps: number): void {
    if (steps > StoryEngine.maxAutoSteps) {
      throw new Error(`Infinite set/if loop near node ${this.nodeId}`);
    }
  }

  private describe(node: StoryNode): PausedState {
    const visuals: Visuals =
      'bg' in node || 'amb' in node || 'sprite' in node
        ? { bg: node.bg, amb: node.amb, sprite: node.sprite, dim: node.dim }
        : {};
    if (node.type === 'choice') {
      const c = node as ChoiceNode;
      return {
        kind: 'choice',
        node,
        visuals,
        day: this.day,
        availableOptions: c.options.filter((o) => checkCond(o.cond, this.stats, this.flags)),
      };
    }
    if (node.type === 'map') {
      const m = node as MapNode;
      this.day = m.day; // день переключается только картой города (баланс, не флаги)
      this.seen.add(node.id);
      return {
        kind: 'map',
        node,
        visuals,
        day: this.day,
        availableOptions: m.options.filter((o) => checkCond(o.cond, this.stats, this.flags)),
      };
    }
    if (node.type === 'say') {
      const s = node as SayNode;
      return { kind: 'say', node, visuals, day: this.day, availableOptions: [] };
    }
    this.seen.add(node.id);
    return { kind: 'ending', node, visuals, day: this.day, availableOptions: [] };
  }

  /** Текущее паузное состояние (после создания или restore). */
  current(): PausedState {
    return this.pauseAtCurrent();
  }

  /** Тап «далее» из say-узла. Отдаёт следующее паузное состояние. */
  advance(): PausedState {
    const node = this.assertNode(this.nodeId);
    if (node.type !== 'say') throw new Error(`advance() on ${node.type} node ${this.nodeId}`);
    this.seen.add(node.id);
    this.backlog.push({ speaker: node.speaker || '—', text: node.text, tag: this.tag() });
    this.nodeId = node.next;
    return this.pauseAtCurrent();
  }

  /**
   * Выбор опции. Для choice — по индексу из availableOptions, либо 'timeout'.
   * Для map — по индексу. Возвращает следующее паузное состояние.
   */
  choose(index: number | 'timeout'): PausedState {
    const node = this.assertNode(this.nodeId);
    if (node.type !== 'choice' && node.type !== 'map') {
      throw new Error(`choose() on ${node.type} node ${this.nodeId}`);
    }
    let opt: ChoiceOption | undefined;
    if (index === 'timeout') {
      if (node.type !== 'choice' || !node.timeout) throw new Error('No timeout branch');
      opt = { text: '…молчание', next: node.timeout.next, set: node.timeout.set };
    } else {
      const avail =
        node.type === 'choice'
          ? (node as ChoiceNode).options.filter((o) => checkCond(o.cond, this.stats, this.flags))
          : (node as MapNode).options.filter((o) => checkCond(o.cond, this.stats, this.flags));
      opt = avail[index];
      if (!opt) throw new Error(`Option ${index} unavailable at ${this.nodeId}`);
    }
    this.seen.add(node.id);
    const delta = applySetOps(this.stats, this.flags, opt.set);
    this.backlog.push({
      speaker: 'Система',
      text: `Выбор: ${opt.text}`,
      tag: this.tag(),
      irrevocable: opt.irrevocable === true,
    });
    this.choicesSinceAutosave++;
    this.nodeId = opt.next;
    const st = this.pauseAtCurrent(); // он сбрасывает lastDelta — возвращаем дельту выбора
    this.lastDelta = { ...delta, ...this.lastDelta };
    return st;
  }

  needsAutosave(): boolean {
    return this.choicesSinceAutosave >= BALANCE.autosave.everyNChoices;
  }

  markAutosaved(): void {
    this.choicesSinceAutosave = 0;
  }

  /** Можно ли скипать «далее» по этому узлу после загрузки (skip-read-only). */
  isSeen(id: NodeId): boolean {
    return this.seen.has(id);
  }

  /** Тип текущего узла (для UI-логики ввода без доступа к приватным полям). */
  nodeType(): StoryNode['type'] {
    return this.assertNode(this.nodeId).type;
  }
}
