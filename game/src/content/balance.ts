// ВСЕ числа баланса проекта — только здесь (SPEC: никаких магических чисел в сценах).
export const BALANCE = {
  stats: {
    min: 0,
    max: 100,
    startClarity: 55,
    startTrust: 0,
    startBond: 0,
  },
  thresholds: {
    lowClarityFx: 30, // ниже — визуальные искажения
    gateMarinaGoodTrust: 55, // светлая концовка Марины (идеальный путь даёт 58)
    gateMarinaGoodBond: 55, // (идеальный путь даёт 61)
    gateMarinaBitterTrust: 25, // минимум доверия для «Ватерлинии»
    gateMarinaBitterBond: 20, // минимум близости для «Ватерлинии»
    walkShoulderBond: 20, // опция «молча сесть рядом»
    invitedAshoreTrust: 40, // приглашение на берег (день 4)
    stormConfessTrust: 45, // прямое признание в эфире (шторм)
    leavingBondGate: 40, // прощание на мысе в ветке продажи
  },
  choice: {
    timedSec: 8,
  },
  backlog: {
    maxEntries: 100,
  },
  autosave: {
    everyNChoices: 3,
  },
  // Дельты выборов авторские: лежат в узлах рядом с самим выбором.
  endings: {
    marinaGood: 'ending_marina_light',
    marinaBitter: 'ending_marina_waterline',
    marinaBad: 'ending_marina_static',
    solo: 'ending_solo_castoff',
  },
} as const;

export type BALANCE_TYPE = typeof BALANCE;
