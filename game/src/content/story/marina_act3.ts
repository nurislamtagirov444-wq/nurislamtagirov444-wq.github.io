import type { StoryGraph } from '../../core/storyTypes.ts';
import { BALANCE } from '../balance.ts';

// Акт 3. Дни 3–5: сделка нависает, шторм, финальные решения, развязки.
export const ACT3: StoryGraph = {
  a3_map_01: {
    id: 'a3_map_01', type: 'map', day: 3, bg: 'bg_port_street', amb: 'wind',
    prompt: 'День 3. Кадастровый инженер едет. Дарья звонит дважды.',
    options: [
      { place: 'Контора', hint: 'Узнать про сделку', text: 'К Дарье — решаться', next: 'a3_d_01' },
      { place: 'Маяк', hint: 'Незаконченный разговор', text: 'На мыс, днём', next: 'a3_m_01' },
      { place: 'Мастерская', hint: 'Штерн собирает что-то большое', text: 'В мастерскую Штерна', next: 'a3_s_01' },
    ],
  },

  // --- Дарья, день 3 ---
  a3_d_01: {
    id: 'a3_d_01', type: 'say', speaker: '', bg: 'bg_office', amb: 'room', sprite: { who: 'daria', pose: 'tense' },
    text: 'Дарья впервые не прячет того, что видно только мне: она устала. На столе — план города, мой дом обведён красным.',
    next: 'a3_d_02',
  },
  a3_d_02: {
    id: 'a3_d_02', type: 'say', speaker: 'Дарья',
    text: 'Покупатель из области. Хочет дом под снос и причал под склад. Цена — выше рынка на треть, срок — до пятницы. Вопрос не в бумагах. Вопрос — ты.',
    next: 'a3_d_03',
  },
  a3_d_03: {
    id: 'a3_d_03', type: 'choice', prompt: '«Говори, Алекс. Я — нотариус, но сначала я из этого города».',
    options: [
      {
        text: '«Приостанови. Мне нужен ещё один день — всё объясню»',
        next: 'a3_d_04a',
        set: [
          { k: 'daria.trust', op: 'add', v: 8 },
          { k: 'deal_pending', op: 'set', v: true },
        ],
      },
      {
        text: '«Готовь документы. Пятница — сделка»',
        next: 'a3_d_04b',
        set: [
          { k: 'clarity', op: 'add', v: -8 },
          { k: 'deal_signed_intent', op: 'set', v: true },
        ],
        irrevocable: true,
      },
    ],
  },
  a3_d_04a: {
    id: 'a3_d_04a', type: 'say', speaker: 'Дарья',
    text: 'День у тебя есть. Два, даже. Только знай: этот покупатель не единственный, кто чует по городу… усталость. Не опаздывай, Алекс:',
    next: 'a3_d_05',
  },
  a3_d_04b: {
    id: 'a3_d_04b', type: 'say', speaker: 'Дарья',
    text: 'Будет сделка. Я скажу одно, и больше ни слова: купил ты это «до пятницы» — не продашь обратно никогда.',
    next: 'a3_d_05',
  },
  a3_d_05: {
    id: 'a3_d_05', type: 'say', speaker: 'Дарья', sprite: null,
    text: '«Кстати. Марина спрашивала у меня про лицензию на передатчик. Значит, ты уже там, где я не смогла». — Она улыбается ровно на миллиметр.',
    next: 'a3_evening_01',
  },

  // --- Маяк, день 3 ---
  a3_m_01: {
    id: 'a3_m_01', type: 'say', speaker: '', bg: 'bg_lighthouse_day', amb: 'sea',
    text: 'Дневной маяк без мистики: бетон, краска, пятнистый свет. Марина на площадке ремонтирует антенну и впервые — без перчаток.',
    next: 'a3_m_02',
  },
  a3_m_02: {
    id: 'a3_m_02', type: 'say', speaker: 'Марина', sprite: { who: 'marina', pose: 'calm' },
    text: 'Ты принёс непогоду? За окном стемнело ровно в момент твоего подъёма. Это, Морозов, статистика, не лирика.',
    next: 'a3_m_03',
  },
  a3_m_03: {
    id: 'a3_m_03', type: 'choice', prompt: 'Она кивает на динамик: «Слушай. Передатчик живой, но эфир пустой. Говори».',
    options: [
      {
        text: 'В эфир: «Мыс, у меня к тебе личное дело на полчаса»',
        next: 'a3_m_04a',
        cond: { flag: 'marina_truth', eq: true },
        set: [{ k: 'marina.bond', op: 'add', v: 15 }, { k: 'went_on_air', op: 'set', v: true }],
      },
      {
        text: 'Молча взяться за ремонт антенны рядом',
        next: 'a3_m_04b',
        set: [{ k: 'marina.trust', op: 'add', v: 7 }],
      },
    ],
  },
  a3_m_04a: {
    id: 'a3_m_04a', type: 'say', speaker: 'Марина',
    text: 'В эфире?! — Она смеётся впервые за все мои дни здесь. — Включаю. Три, две… Ты уверен, Морозов? Отсюда уже не вернуть «проездом».',
    next: 'a3_m_05',
  },
  a3_m_04b: {
    id: 'a3_m_04b', type: 'say', speaker: 'Марина',
    text: 'Язык у тебя холодный, руки горячие. Ладно. Держи ключ, не болтайся. Рука у тебя в этом деле точная.',
    next: 'a3_m_05',
  },
  a3_m_05: {
    id: 'a3_m_05', type: 'say', speaker: '', sprite: null,
    text: 'Мы чиним антенну под прибывающий шторм. Она впервые спускается по лестнице первой — и ждёт меня, не «иду-одна», а «идём».',
    next: 'a3_evening_01',
  },

  // --- Штерн, день 3 ---
  a3_s_01: {
    id: 'a3_s_01', type: 'say', speaker: '', bg: 'bg_port_street', amb: 'room', sprite: { who: 'ark', pose: 'calm' },
    text: 'В мастерской — длинный стол. На нём — новый контур передатчика, собранный из деталей всего порта. Подписывай, говорит Штерн, и снова не подписывай.',
    next: 'a3_s_02',
  },
  a3_s_02: {
    id: 'a3_s_02', type: 'say', speaker: 'Штерн',
    text: 'Магнитофон ей пригодится. И стойка. Я собрал по списку… Главное — не лишнее. Посмотри на меня, Алекс: ты ведь остаёшься?',
    next: 'a3_s_03',
  },
  a3_s_03: {
    id: 'a3_s_03', type: 'choice', prompt: 'Вопрос повис, как якорь над водой.',
    options: [
      {
        text: '«Не решил. Но уже не «уезжаю» — видишь разницу?»',
        next: 'a3_s_04a',
        set: [{ k: 'clarity', op: 'add', v: 8 }],
      },
      {
        text: '«Уезжаю, Семёныч. Дом на снос. Всё»',
        next: 'a3_s_04b',
        set: [
          { k: 'clarity', op: 'add', v: -10 },
          { k: 'leaving_confirmed', op: 'set', v: true },
          { k: 'deal_signed_intent', op: 'set', v: true }, // форк «уезжаю» единый
        ],
        irrevocable: true,
      },
    ],
  },
  a3_s_04a: {
    id: 'a3_s_04a', type: 'say', speaker: 'Штерн',
    text: 'Вижу. Это первое честное, что я слышу от тебя с приезда. Несмотря на все лампы. Пусть город услышит его тоже.',
    next: 'a3_evening_01',
  },
  a3_s_04b: {
    id: 'a3_s_04b', type: 'say', speaker: 'Штерн',
    text: 'Всё. Ладно. Стойку я всё равно соберу — Марине не из камня же держать частоту. Иди, пока я считаю до десяти и обратно.',
    next: 'a3_evening_01',
  },

  // --- Вечер дня 3 ---
  a3_evening_01: {
    id: 'a3_evening_01', type: 'say', speaker: '', bg: 'bg_house_room', amb: 'rain', sprite: null,
    text: 'Вечер третьего дня. Прогноз: шторм к полуночи, самый сильный за сезон. Приёмник молчит: Марина взяла радиомолчание до нуля.',
    next: 'a3_evening_02',
  },
  a3_evening_02: {
    id: 'a3_evening_02', type: 'if', cond: { flag: 'deal_signed_intent', eq: true },
    then: 'a3_path_leaving_01', else: 'a3_path_stay_01',
  },

  // --- Ветка «продаю» ---
  a3_path_leaving_01: {
    id: 'a3_path_leaving_01', type: 'say', speaker: '', bg: 'bg_house_room', amb: 'radio', dim: true,
    text: '0:00. Эфир слышен сквозь первые порывы: «Сегодня город потерял дом на холме и человека в придачу. Ничего. Мыс всегда держится сам».',
    next: 'a3_path_leaving_02',
  },
  a3_path_leaving_02: {
    id: 'a3_path_leaving_02', type: 'if', cond: { stat: 'marina.bond', gte: BALANCE.thresholds.leavingBondGate },
    then: 'end_route_bad_close', else: 'end_route_solo',
  },

  // --- Ветка «остаюсь» ---
  a3_path_stay_01: {
    id: 'a3_path_stay_01', type: 'say', speaker: '', bg: 'bg_lighthouse_night', amb: 'rain',
    text: 'К полуночи я у маяка. Она открывает сразу, в ней — штормовая вахта: «Случится порыв в районе мыса — мне нужны руки и ухо. Ты готов?»',
    next: 'a3_path_stay_02',
  },
  a3_path_stay_02: {
    id: 'a3_path_stay_02', type: 'choice', prompt: 'Шторм наращивает шаг. Минуты сочтены.',
    options: [
      {
        text: '«Готов. Веди вахту»',
        next: 'a3_storm_01',
        set: [{ k: 'marina.trust', op: 'add', v: 12 }, { k: 'storm_watch', op: 'set', v: true }],
      },
    ],
    timeout: { sec: BALANCE.choice.timedSec, next: 'a3_storm_01', set: [{ k: 'clarity', op: 'add', v: -4 }] },
  },

  a3_storm_01: {
    id: 'a3_storm_01', type: 'say', speaker: '', bg: 'bg_radio_room', amb: 'radio', dim: true,
    text: 'В радиорубке — бой: шквалы в стёкла, индикаторы в красном. Она ведёт эфир спокойно, как никогда: «Всем судам. Мыс говорит. Мыс держит».',
    next: 'a3_storm_02',
  },
  a3_storm_02: {
    id: 'a3_storm_02', type: 'say', speaker: 'Марина', sprite: { who: 'marina', pose: 'smile' },
    text: '«Сегодня со мной в эфире человек, который чинит города. Скажи им, Алекс. Скажи, что ты слышишь, когда слушаешь нас»',
    next: 'a3_storm_choice',
  },
  a3_storm_choice: {
    id: 'a3_storm_choice', type: 'choice', prompt: 'Эфир открыт. Микрофон мой. Секунды валятся.',
    options: [
      {
        text: '«Слышу дом. Запишите меня в расписание — я остаюсь»',
        next: 'confess_stay',
        cond: { stat: 'marina.trust', gte: BALANCE.thresholds.stormConfessTrust },
        set: [
          { k: 'stay_confessed', op: 'set', v: true },
          { k: 'marina.trust', op: 'add', v: 8 },
          { k: 'clarity', op: 'add', v: 12 },
        ],
        irrevocable: true,
      },
      {
        text: '«Слышу тех, кто не вернулся. Они тут, пока мы говорим»',
        next: 'confess_memory',
        set: [{ k: 'marina.bond', op: 'add', v: 12 }, { k: 'honored_lost', op: 'set', v: true }],
      },
      {
        text: '«…шторм скоро сменит волну. Держитесь» (уйти в штурманку)',
        next: 'confess_none',
        set: [{ k: 'clarity', op: 'add', v: -6 }],
      },
    ],
    timeout: { sec: BALANCE.choice.timedSec, next: 'confess_none', set: [{ k: 'clarity', op: 'add', v: -8 }] },
  },
  confess_stay: {
    id: 'confess_stay', type: 'say', speaker: 'Марина',
    text: 'Прямым эфиром, в шторм, при всех — она делает то, чего не делала никогда: усмехается в микрофон. «Принято, мыс. Мы дождались».',
    next: 'a4_map_01',
  },
  confess_memory: {
    id: 'confess_memory', type: 'say', speaker: 'Марина',
    text: '«Тогда запишем это тоже». — Она заводит новую катушку. — «Назовём её “Оставшиеся”. Спасибо, Алекс. За них. За меня».',
    next: 'a4_map_01',
  },
  confess_none: {
    id: 'confess_none', type: 'say', speaker: '',
    text: 'Я не говорю главного. Эфир всё прощает, кроме молчания в ответственный момент. Она водит вахту дальше — уже одна за двоих.',
    next: 'a4_map_01',
  },

  act3_resolve: {
    id: 'act3_resolve', type: 'if', cond: { flag: 'stay_confessed', eq: true },
    then: 'resolve_good_gate', else: 'resolve_mid_gate',
  },
  resolve_good_gate: {
    id: 'resolve_good_gate', type: 'if', cond: { flag: 'marina_truth', eq: true },
    then: 'check_light_ending', else: 'resolve_mid_gate',
  },
  check_light_ending: {
    id: 'check_light_ending', type: 'if',
    cond: { stat: 'marina.trust', gte: BALANCE.thresholds.gateMarinaGoodTrust },
    then: 'check_light_bond', else: 'resolve_mid_gate',
  },
  check_light_bond: {
    id: 'check_light_bond', type: 'if',
    cond: { stat: 'marina.bond', gte: BALANCE.thresholds.gateMarinaGoodBond },
    then: 'end_route_light', else: 'end_route_waterline',
  },
  resolve_mid_gate: {
    id: 'resolve_mid_gate', type: 'if', cond: { stat: 'marina.trust', gte: BALANCE.thresholds.gateMarinaBitterTrust },
    then: 'check_bond_for_water', else: 'resolve_low_gate',
  },
  check_bond_for_water: {
    id: 'check_bond_for_water', type: 'if', cond: { stat: 'marina.bond', gte: BALANCE.thresholds.gateMarinaBitterBond },
    then: 'end_route_waterline', else: 'end_route_static',
  },
  resolve_low_gate: {
    id: 'resolve_low_gate', type: 'if', cond: { stat: 'clarity', lt: BALANCE.thresholds.lowClarityFx },
    then: 'end_route_static', else: 'end_route_solo',
  },

  // переходники к концовкам
  end_route_light: { id: 'end_route_light', type: 'ending', endingId: 'ending_marina_light',
    title: '«Частота оставшихся»', cg: 'cg_marina_light',
    text: 'Мы так и не решили, кто кого оставил: меня — город или её — тишина.',
    epilogue: [
      'Передатчик работает уже пять лет без сбоев. Мы — тоже, хоть и с треском.',
      'Раз в год мы включаем старую катушку «Голоса города» и смеёмся над тем, каким хриплым был маяк до нас.',
    ] },
  end_route_waterline: { id: 'end_route_waterline', type: 'ending', endingId: 'ending_marina_waterline',
    title: '«Ватерлиния»', cg: 'cg_marina_waterline',
    text: 'Я уехал в январе. Но каждую ночь, в ноль-ноль, мой приёмник ловит ноль метров.',
    epilogue: [
      'Марина пишет мне письма на чистовиках судовых журналов. Каждое — короткое и честное.',
      'Весной я снова еду в Крюково. Может быть, на этот раз — без вопроса о продаже.',
    ] },
  end_route_static: { id: 'end_route_static', type: 'ending', endingId: 'ending_marina_static',
    title: '«Помехи»', cg: 'cg_marina_static',
    text: 'Я уехал в пятницу. Эфир ловится, но голос в нём — только мой собственный, записанный раньше.',
    epilogue: [
      'Квартплата за городскую квартиру выросла. Цена тишины — неизвестна, но высока.',
      'Иногда я просыпаюсь в ноль-ноль — без причины, как от звонка.',
    ] },
  end_route_solo: { id: 'end_route_solo', type: 'ending', endingId: 'ending_solo_castoff',
    title: '«Отчалить»', cg: 'cg_solo',
    text: 'Дом продан. Пятое ноября я смотрю, как мыс отходит к горизонту, и половина меня — за.',
    epilogue: [
      'Штерн проводил меня молча и вложил в карман катушку без подписи.',
      'Дарья прислала документы и записку: «Город держится. Возвращайся — узнаешь почему».',
    ] },
  end_route_bad_close: {
    id: 'end_route_bad_close', type: 'say', speaker: '', bg: 'bg_lighthouse_night', amb: 'radio', dim: true,
    text: 'В ночь перед сделкой я всё же поднимаюсь на мыс. Она встречает у двери, не открывая: «Ты пришёл проститься — это я услышала ещё до стука».',
    next: 'end_route_bad_close_02',
  },
  end_route_bad_close_02: {
    id: 'end_route_bad_close_02', type: 'say', speaker: 'Марина', sprite: { who: 'marina', pose: 'sad' },
    text: '«Я не буду просить. Я умею только держать. Держи себя там, куда плывёшь, Морозов. Хоть кто-то должен»',
    next: 'end_route_static',
  },
};
