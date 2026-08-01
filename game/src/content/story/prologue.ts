import type { StoryGraph } from '../../core/storyTypes.ts';

// Пролог. День 0: прибытие в Крюково, дом отца, контора Дарьи, ночная радиочастота.
export const PROLOGUE: StoryGraph = {
  prologue_01: {
    id: 'prologue_01', type: 'say', speaker: '', bg: 'bg_port_street', amb: 'rain', sprite: null,
    text: 'Ноябрь в Крюково пахнет соляркой, рыбой и мокрым железом. Город встречает меня так, будто я никуда не уезжал.',
    next: 'prologue_02',
  },
  prologue_02: {
    id: 'prologue_02', type: 'say', speaker: 'Алекс',
    text: 'Десять лет. Я вернулся продать дом, подписать бумаги и отчалить. Три дня — край.',
    next: 'prologue_03',
  },
  prologue_03: {
    id: 'prologue_03', type: 'say', speaker: '',
    text: 'Автовокзала больше нет. На его месте — пустырь и табличка «Объект законсервирован». Как и весь город.',
    next: 'prologue_04',
  },
  prologue_04: {
    id: 'prologue_04', type: 'say', speaker: '', sprite: { who: 'ark', pose: 'calm' },
    text: 'У причала — знакомая спина. Штерн постарел, но гаечный ключ в кармане спецовки лежит на том же месте.',
    next: 'prologue_05',
  },
  prologue_05: {
    id: 'prologue_05', type: 'say', speaker: 'Штерн',
    text: 'Алексей Морозов. Услышал дизель — понял, что чужой. Морозовы поездом не приезжают, Морозовы выныривают из погоды.',
    next: 'prologue_06',
  },
  prologue_06: {
    id: 'prologue_06', type: 'choice', prompt: 'Штерн протягивает руку.',
    options: [
      {
        text: 'Пожать крепко. «Рад тебя видеть, Аркадий Семёнович»',
        next: 'prologue_07a',
        set: [
          { k: 'clarity', op: 'add', v: 5 },
          { k: 'ark_respect', op: 'set', v: true },
        ],
      },
      {
        text: 'Кивнуть коротко. «Ненадолго я, Штерн. Дела»',
        next: 'prologue_07b',
        set: [{ k: 'clarity', op: 'add', v: -3 }],
      },
    ],
  },
  prologue_07a: {
    id: 'prologue_07a', type: 'say', speaker: 'Штерн',
    text: 'И я. Отец бы обрадовался. Дом-то… Дом тебя ждал дольше, чем ты его помнил.',
    next: 'prologue_08',
  },
  prologue_07b: {
    id: 'prologue_07b', type: 'say', speaker: 'Штерн',
    text: 'Дела. Город это любит: все приезжают ненадолго, а кости свои тут оставляют.',
    next: 'prologue_08',
  },
  prologue_08: {
    id: 'prologue_08', type: 'say', speaker: 'Штерн', sprite: null,
    text: 'Ключи у нотариуса, у Ржевской. Дашки твоей. Она теперь всеми бумагами в городе ворочает. Сходи до закрытия.',
    next: 'prologue_09',
  },
  prologue_09: {
    id: 'prologue_09', type: 'say', speaker: '', bg: 'bg_office', amb: 'room',
    text: 'Контора пахнет клеем ПВА и старым ковром. За стеклом перегородки — женщина, которая в детстве стащила у меня половину удочки.',
    next: 'prologue_10',
  },
  prologue_10: {
    id: 'prologue_10', type: 'say', speaker: 'Дарья', sprite: { who: 'daria', pose: 'warm' },
    text: 'Алекс Морозов. Живой. Входи, не стой в проёме — тепло выпускаешь.',
    next: 'prologue_11',
  },
  prologue_11: {
    id: 'prologue_11', type: 'say', speaker: 'Дарья',
    text: 'Документы я подготовила, но сразу предупрежу: сделка быстро не пройдёт период. Дом на обременении, плюс кадастр мудрён. Три дня — оптимистичный сценарий.',
    next: 'prologue_12',
  },
  prologue_12: {
    id: 'prologue_12', type: 'choice', prompt: 'Она смотрит поверх папки, оценивая.',
    options: [
      {
        text: '«Сколько нужно — столько и пробуду. Расскажи, что с городом»',
        next: 'prologue_13a',
        set: [
          { k: 'daria.trust', op: 'add', v: 10 },
          { k: 'clarity', op: 'add', v: 4 },
        ],
      },
      {
        text: '«Мне нужны ключи и дата. Остальное — лирика»',
        next: 'prologue_13b',
        set: [
          { k: 'daria.trust', op: 'add', v: -5 },
          { k: 'clarity', op: 'add', v: -2 },
        ],
      },
    ],
  },
  prologue_13a: {
    id: 'prologue_13a', type: 'say', speaker: 'Дарья',
    text: 'Рыба ушла, люди следом. Остались те, кому деваться некуда. И маяк. Маяк всё ещё ходит по расписанию — чудо, а не регламент.',
    next: 'prologue_14',
  },
  prologue_13b: {
    id: 'prologue_13b', type: 'say', speaker: 'Дарья',
    text: 'Ключи и дата, значит. Будут. Только город, Алекс, любит менять тебе расписание. Ты же помнишь.',
    next: 'prologue_14',
  },
  prologue_14: {
    id: 'prologue_14', type: 'say', speaker: 'Дарья', sprite: null,
    text: 'Ключи. Дом проветрен, счётчики живые. И… слушай. Если услышишь по ночам радио — не пугайся. «Ноль метров». Марина ведёт. Она тут единственная, у кого всё ещё выходит говорить правду в эфир.',
    next: 'prologue_15',
  },
  prologue_15: {
    id: 'prologue_15', type: 'say', speaker: '', bg: 'bg_house_room', amb: 'wind',
    text: 'Отечественный дом встретил меня запахом мастики и холода. На столе — лампа отца. На лампе — записка моей рукой, двенадцатилетней: «Не выключать. Я слышу маяк».',
    next: 'prologue_16',
  },
  prologue_16: {
    id: 'prologue_16', type: 'say', speaker: 'Алекс',
    text: 'Я тогда записывал радиопомехи на кассету и называл это «голосами города». Мама смеялась. Отец слушал.',
    next: 'prologue_17',
  },
  prologue_17: {
    id: 'prologue_17', type: 'say', speaker: '', amb: 'radio', dim: true,
    text: 'За стеной шуршит старый приёмник. Частота плывёт, и сквозь помехи — женский голос: «Это “Ноль метров”. Всем, кто ещё нас держится, — доброй ночи».',
    next: 'prologue_18',
  },
  prologue_18: {
    id: 'prologue_18', type: 'choice', prompt: 'Голос по радио называет мой вагон самоходкой, а город — «нашей общей палубой».',
    options: [
      {
        text: 'Слушать до конца эфира',
        next: 'prologue_end',
        set: [
          { k: 'clarity', op: 'add', v: 6 },
          { k: 'heard_first_broadcast', op: 'set', v: true },
        ],
      },
      {
        text: 'Выключить приёмник. Спать',
        next: 'prologue_19b',
        set: [{ k: 'clarity', op: 'add', v: -4 }],
      },
    ],
  },
  prologue_19a: {
    id: 'prologue_19a', type: 'say', speaker: 'Радио',
    text: '«Спасибо рыбакам за тишину. Спасибо нотариусу за крышу. Завтра — шторм, но это не беда: шторм ещё никогда не отменял утро».',
    next: 'prologue_end',
  },
  prologue_19b: {
    id: 'prologue_19b', type: 'say', speaker: '',
    text: 'Тишина в доме оказалась плотной, как вода. Я уснул под неё, как под грузом.',
    next: 'prologue_end',
  },
  prologue_end: {
    id: 'prologue_end', type: 'say', speaker: '', amb: 'silence',
    text: 'Первое утро в городе, который я собирался продать вместе с домом.',
    next: 'a1_map_01',
  },
};
