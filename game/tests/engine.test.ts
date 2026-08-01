import { test } from 'node:test';
import assert from 'node:assert/strict';
import { StoryEngine } from '../src/core/storyEngine.ts';
import { GRAPH, START_NODE } from '../src/content/story/index.ts';
import { defaultStats, applySetOps, checkCond } from '../src/core/stats.ts';
import { SaveManager, packSave, unpackSave } from '../src/core/save.ts';
import { MemoryStoragePort } from '../src/core/storage.ts';
import { GameFlow, FLOW_TABLE } from '../src/core/flow.ts';
import { BALANCE } from '../src/content/balance.ts';

test('граф: старт существует, все next/опции указывают на существующие узлы', () => {
  assert.ok(GRAPH[START_NODE], 'start node missing');
  for (const [id, n] of Object.entries(GRAPH)) {
    const check = (to: string, where: string) =>
      assert.ok(GRAPH[to], `${id}.${where} -> missing "${to}"`);
    if (n.type === 'say') check(n.next, 'next');
    if (n.type === 'set') check(n.next, 'next');
    if (n.type === 'if') {
      check(n.then, 'then');
      check(n.else, 'else');
    }
    if (n.type === 'choice' || n.type === 'map') {
      for (const o of n.options) check(o.next, `option:${o.text.slice(0, 12)}`);
      if (n.type === 'choice' && n.timeout) check(n.timeout.next, 'timeout');
    }
  }
});

test('граф: ни один ending не имеет next; у каждой карты день > 0', () => {
  let endings = 0;
  for (const n of Object.values(GRAPH)) {
    if (n.type === 'ending') endings++;
    if (n.type === 'map') assert.ok(n.day > 0);
  }
  assert.equal(endings, 4, 'P0 ровно 4 концовки');
});

test('движок: старт -> первый say, продвижение работает', () => {
  const e = new StoryEngine(GRAPH, START_NODE);
  const st = e.current();
  assert.equal(st.kind, 'say');
  const next = e.advance();
  assert.notEqual(next.node.id, st.node.id);
});

test('статы: add клампит в [0,100], флаги пишутся', () => {
  const s = defaultStats();
  const f: Record<string, number | boolean> = {};
  applySetOps(s, f, [{ k: 'clarity', op: 'add', v: 1000 }, { k: 'flag_x', op: 'set', v: true }]);
  assert.equal(s.clarity, BALANCE.stats.max);
  applySetOps(s, f, [{ k: 'clarity', op: 'add', v: -1000 }]);
  assert.equal(s.clarity, BALANCE.stats.min);
  assert.ok(checkCond({ flag: 'flag_x', eq: true }, s, f));
  assert.ok(checkCond({ stat: 'marina.trust', gte: 0 }, s, f));
  assert.ok(!checkCond({ stat: 'marina.trust', gte: 10 }, s, f));
});

test('выборы: cond-опции фильтруются, таймаут идёт отдельной веткой', () => {
  const e = new StoryEngine(GRAPH, 'a2_walk_04');
  e.advance(); // в choice a2_walk_05
  const st = e.current();
  assert.equal(st.kind, 'choice');
  // опция «место рядом» требует bond>=20 — при дефолте её нет
  assert.equal(st.availableOptions.length, 2);
  e.stats['marina.bond'] = 25;
  const st2 = e.current();
  assert.equal(st2.availableOptions.length, 3);
});

test('тайм-аут: молчание — валидный выбор со своими последствиями', () => {
  const e = new StoryEngine(GRAPH, 'a3_storm_02');
  e.advance();
  const before = e.stats.clarity;
  const st = e.choose('timeout');
  assert.ok(e.stats.clarity < before);
  assert.ok(st.kind === 'say' || st.kind === 'map' || st.kind === 'choice');
});

test('сейвы: round-trip, битый сейв отвергается', () => {
  const st = new MemoryStoragePort();
  const sm = new SaveManager(st);
  const e = new StoryEngine(GRAPH, START_NODE);
  e.advance();
  const snap = e.snapshot();
  assert.ok(sm.saveTo(sm.slotKey(0), snap, 1700000000000));
  const loaded = sm.loadFrom(sm.slotKey(0));
  assert.ok(loaded);
  assert.equal(loaded!.nodeId, snap.nodeId);
  assert.deepEqual(loaded!.stats, snap.stats);
  // битость байта = checksum mismatch
  const raw = st.get(sm.slotKey(0))!;
  const broken = raw.slice(0, 20) + (raw[20] === 'a' ? 'b' : 'a') + raw.slice(21);
  st.set(sm.slotKey(1), broken);
  assert.equal(sm.loadFrom(sm.slotKey(1)), null);
  // describeSlots: слот1 помечен corrupted
  const slots = sm.describeSlots();
  assert.equal(slots[0]?.corrupted, false);
  assert.equal(slots[1]?.corrupted, true);
  assert.equal(slots[2], null);
});

test('restart: engine из снапшота равен engine до снапшота', () => {
  const e = new StoryEngine(GRAPH, START_NODE);
  e.advance(); e.advance();
  const st1 = e.current();
  assert.equal(st1.node.id, 'prologue_03');
  const e2 = StoryEngine.fromSnapshot(GRAPH, e.snapshot());
  assert.equal(e2.current().node.id, 'prologue_03');
  // snapshot не ссылается на живые объекты
  e2.stats.clarity = 1;
  assert.notEqual(e.stats.clarity, 1);
});

test('flow: легальные и НЕлегальные переходы (SPEC §3)', () => {
  const f = new GameFlow();
  assert.equal(f.state, 'BOOT');
  f.go('T1'); f.go('T2');
  assert.equal(f.state, 'TITLE');
  f.go('T3');
  assert.equal(f.state, 'STORY');
  f.go('T14');
  assert.equal(f.state, 'PAUSE');
  assert.throws(() => f.go('T27')); // PAUSE -> EPILOGUE запрещён
  f.go('T29');
  assert.equal(f.state, 'TITLE');
  // T24 выключен в P0
  f.go('T3');
  assert.throws(() => f.go('T24'));
});

test('flow: таблица покрывает все 29 переходов P0 без дублей', () => {
  const ids = new Set(FLOW_TABLE.map((t) => t.id));
  assert.equal(ids.size, FLOW_TABLE.length);
  assert.ok(ids.has('T29'));
  assert.ok(ids.has('T24')); // объявлен, выключен guard'ом P1
});

test('autosave: срабатывает после N выборов', () => {
  const e = new StoryEngine(GRAPH, START_NODE);
  e.choicesSinceAutosave = BALANCE.autosave.everyNChoices;
  assert.ok(e.needsAutosave());
  e.markAutosaved();
  assert.ok(!e.needsAutosave());
});
