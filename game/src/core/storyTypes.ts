// Типы узлов истории. Контракт: только эти типы существуют в движке (SPEC §8).
export type NodeId = string;

export type Speaker = 'Алекс' | 'Марина' | 'Дарья' | 'Штерн' | 'Радио' | '';

export type StatKey =
  | 'clarity'
  | 'marina.trust'
  | 'marina.bond'
  | 'daria.trust'
  | 'daria.bond';

export type SetOp = {
  k: StatKey | string; // StatKey — числовой стат; прочие строки — булевы/числовые флаги
  op: 'add' | 'set';
  v: number | boolean;
};

export type Cond = {
  stat?: StatKey;
  gte?: number;
  lt?: number;
  flag?: string;
  eq?: number | boolean;
};

export type Visuals = {
  bg?: string; // ключ фона из assets
  amb?: 'rain' | 'sea' | 'wind' | 'radio' | 'room' | 'silence'; // процедурный эмбиент
  sprite?: { who: 'marina' | 'daria' | 'ark'; pose: string } | null; // null — убрать
  dim?: boolean; // затемнить фон (сцены «под водой», низкая Ясность)
};

export type SayNode = {
  id: NodeId;
  type: 'say';
  speaker: Speaker;
  text: string;
  next: NodeId;
} & Visuals;

export type ChoiceOption = {
  text: string;
  next: NodeId;
  set?: SetOp[];
  cond?: Cond; // опция показывается только при выполнении условия
  irrevocable?: boolean; // маркер «непоправимый выбор» (●)
};

export type ChoiceNode = {
  id: NodeId;
  type: 'choice';
  prompt?: string;
  options: ChoiceOption[];
  timeout?: { sec: number; next: NodeId; set?: SetOp[] };
} & Visuals;

export type MapOption = ChoiceOption & { place: string; hint: string };

export type MapNode = {
  id: NodeId;
  type: 'map';
  prompt: string;
  day: number;
  options: MapOption[];
} & Visuals;

export type SetNode = { id: NodeId; type: 'set'; set: SetOp[]; next: NodeId };
export type IfNode = { id: NodeId; type: 'if'; cond: Cond; then: NodeId; else: NodeId };

export type EndingNode = {
  id: NodeId;
  type: 'ending';
  endingId: string;
  title: string;
  cg: string;
  text: string;
  epilogue: string[];
};

export type StoryNode = SayNode | ChoiceNode | MapNode | SetNode | IfNode | EndingNode;
export type StoryGraph = Record<NodeId, StoryNode>;

export const START_NODE: NodeId = 'prologue_01';
