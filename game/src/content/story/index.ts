// Единый граф истории. Все узлы P0 (пролог + акты 1–4 + концовки).
import type { StoryGraph } from '../../core/storyTypes.ts';
import { PROLOGUE } from './prologue.ts';
import { ACT1 } from './marina_act1.ts';
import { ACT2 } from './marina_act2.ts';
import { ACT3 } from './marina_act3.ts';
import { ACT4 } from './marina_act4.ts';

export const GRAPH: StoryGraph = {
  ...PROLOGUE,
  ...ACT1,
  ...ACT2,
  ...ACT3,
  ...ACT4,
};

function checkDuplicateIds(parts: readonly StoryGraph[]): void {
  const seen = new Set<string>();
  for (const g of parts) {
    for (const id of Object.keys(g)) {
      if (seen.has(id)) throw new Error(`Duplicate story node id: ${id}`);
      seen.add(id);
    }
  }
}
checkDuplicateIds([PROLOGUE, ACT1, ACT2, ACT3, ACT4]);

export { START_NODE } from '../../core/storyTypes.ts';
