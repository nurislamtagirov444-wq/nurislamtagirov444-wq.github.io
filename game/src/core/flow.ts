// GameFlow — конечный автомат экранов, 1:1 с SPEC §3 (S1..S12, T1..T31).
// Это единственный владелец переходов. Неизвестный переход = исключение.

export type FlowState =
  | 'BOOT'
  | 'PRELOAD'
  | 'TITLE'
  | 'STORY'
  | 'PAUSE'
  | 'SAVE_LOAD'
  | 'SETTINGS'
  | 'BACKLOG'
  | 'STATS'
  | 'ENDING'
  | 'EPILOGUE'
  | 'FREE_TALK';

export type OverlaySource = 'title' | 'story' | 'pause';

export type Transition = {
  id: string; // T1..T31 из SPEC
  from: FlowState[];
  to: FlowState;
  guard?: string; // описание условия (для диагностики)
};

// Таблица = спецификация. P1-переходы (T24/T25) объявлены, но выключены в P0.
export const FLOW_TABLE: Transition[] = [
  { id: 'T1', from: ['BOOT'], to: 'PRELOAD' },
  { id: 'T2', from: ['PRELOAD'], to: 'TITLE' },
  { id: 'T3', from: ['TITLE'], to: 'STORY' },
  { id: 'T4', from: ['TITLE'], to: 'STORY' },
  { id: 'T5', from: ['TITLE'], to: 'SAVE_LOAD' },
  { id: 'T6', from: ['TITLE'], to: 'SETTINGS' },
  { id: 'T8', from: ['SAVE_LOAD'], to: 'STORY' },
  { id: 'T9', from: ['SAVE_LOAD'], to: 'TITLE' },
  { id: 'T10', from: ['SAVE_LOAD'], to: 'PAUSE' },
  { id: 'T11', from: ['SAVE_LOAD'], to: 'STORY' },
  { id: 'T12', from: ['SETTINGS'], to: 'TITLE' },
  { id: 'T13', from: ['SETTINGS'], to: 'STORY' },
  { id: 'T14', from: ['STORY'], to: 'PAUSE' },
  { id: 'T15', from: ['PAUSE'], to: 'STORY' },
  { id: 'T16', from: ['PAUSE'], to: 'SAVE_LOAD' },
  { id: 'T17', from: ['STORY'], to: 'SAVE_LOAD' },
  { id: 'T18', from: ['STORY'], to: 'SETTINGS' },
  { id: 'T19', from: ['PAUSE'], to: 'SETTINGS' },
  { id: 'T20', from: ['STORY'], to: 'BACKLOG' },
  { id: 'T21', from: ['BACKLOG'], to: 'STORY' },
  { id: 'T22', from: ['STORY'], to: 'STATS' },
  { id: 'T23', from: ['STATS'], to: 'STORY' },
  { id: 'T24', from: ['STORY'], to: 'FREE_TALK', guard: 'P1: ключ+сеть (выключено в P0)' },
  { id: 'T25', from: ['FREE_TALK'], to: 'STORY', guard: 'P1' },
  { id: 'T26', from: ['STORY'], to: 'ENDING' },
  { id: 'T27', from: ['ENDING'], to: 'EPILOGUE' },
  { id: 'T28', from: ['EPILOGUE'], to: 'TITLE' },
  { id: 'T29', from: ['PAUSE'], to: 'TITLE' },
];

// Системная «назад» (SPEC §7): куда возвращает каждое состояние. null = диалог выхода/ничего.
export const BACK_MAP: Record<FlowState, FlowState | null> = {
  BOOT: null,
  PRELOAD: null,
  TITLE: null,
  STORY: 'PAUSE',
  PAUSE: 'STORY',
  SAVE_LOAD: 'STORY', // уточняется источником в рантайме (story/pause/title)
  SETTINGS: 'STORY',
  BACKLOG: 'STORY',
  STATS: 'STORY',
  ENDING: 'EPILOGUE',
  EPILOGUE: 'TITLE',
  FREE_TALK: 'STORY',
};

export type FlowListener = (state: FlowState, prev: FlowState, tid: string) => void;

export class GameFlow {
  state: FlowState = 'BOOT';
  overlaySource: OverlaySource = 'title';
  private listeners: FlowListener[] = [];

  onChange(l: FlowListener): void {
    this.listeners.push(l);
  }

  can(tid: string): boolean {
    const t = FLOW_TABLE.find((x) => x.id === tid);
    return !!t && t.from.includes(this.state);
  }

  go(tid: string): FlowState {
    const t = FLOW_TABLE.find((x) => x.id === tid);
    if (!t) throw new Error(`Unknown transition ${tid}`);
    if (!t.from.includes(this.state)) {
      throw new Error(`Illegal transition ${tid}: ${this.state} -> ${t.to}`);
    }
    if (t.guard && t.guard.startsWith('P1')) {
      throw new Error(`Transition ${tid} disabled in P0 (${t.guard})`);
    }
    const prev = this.state;
    this.state = t.to;
    for (const l of this.listeners) l(this.state, prev, tid);
    return this.state;
  }
}
