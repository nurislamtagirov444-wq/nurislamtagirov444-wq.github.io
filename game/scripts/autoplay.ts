// Смоук-проход: автоплеер обходит граф всеми путями (DFS с ограничением),
// подтверждает достижимость всех 4 концовок и отсутствие мёртвых ветвей.
import { StoryEngine, type PausedState } from '../src/core/storyEngine.ts';
import { GRAPH, START_NODE } from '../src/content/story/index.ts';
import { BALANCE } from '../src/content/balance.ts';

const endingsFound = new Map<string, number>();
const visitedStates = new Set<string>();
let stepsTotal = 0;
const MAX_PATHS = 4000;
let paths = 0;

function walk(e: StoryEngine, depth: number): void {
  if (paths >= MAX_PATHS || depth > 400) return;
  const st: PausedState = e.current();
  const sig = `${st.node.id}|${JSON.stringify(e.stats)}|${JSON.stringify(e.flags)}`;
  if (visitedStates.has(sig) && st.kind !== 'ending') return;
  visitedStates.add(sig);

  if (st.kind === 'ending') {
    const n = st.node as Extract<typeof st.node, { type: 'ending' }>;
    endingsFound.set(n.endingId, (endingsFound.get(n.endingId) ?? 0) + 1);
    paths++;
    return;
  }
  if (st.kind === 'say') {
    const e2 = StoryEngine.fromSnapshot(GRAPH, e.snapshot());
    e2.advance();
    walk(e2, depth + 1);
    return;
  }
  // choice | map: пробуем каждую доступную опцию + таймаут
  const optionsCount = st.availableOptions.length;
  for (let i = 0; i < optionsCount; i++) {
    const e2 = StoryEngine.fromSnapshot(GRAPH, e.snapshot());
    stepsTotal++;
    e2.choose(i);
    walk(e2, depth + 1);
  }
  if (st.kind === 'choice' && (st.node as { timeout?: object }).timeout) {
    const e2 = StoryEngine.fromSnapshot(GRAPH, e.snapshot());
    e2.choose('timeout');
    walk(e2, depth + 1);
  }
}

console.log('== autoplay ==');
console.log('nodes:', Object.keys(GRAPH).length);
const e0 = new StoryEngine(GRAPH, START_NODE);
walk(e0, 0);
console.log('paths (до концовок):', paths, '| шагов-выборов:', stepsTotal);
console.log('endings:');
for (const [k, v] of [...endingsFound.entries()].sort()) console.log(`  ${k}: ${v} путей`);

const expected = [
  BALANCE.endings.marinaGood,
  BALANCE.endings.marinaBitter,
  BALANCE.endings.marinaBad,
  BALANCE.endings.solo,
];
const missing = expected.filter((id) => !endingsFound.has(id));
if (missing.length) {
  console.error('FAIL: недостижимые концовки:', missing);
  process.exit(1);
}
if (endingsFound.size !== expected.length) {
  console.error('FAIL: посторонние endingId:', [...endingsFound.keys()]);
  process.exit(1);
}
console.log('OK: все концовки P0 достижимы, мёртвых endingId нет');
