import { useRef, useSyncExternalStore } from "react";

export type Role = "member" | "admin";
export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar: string;
  specialization: string;
  city: string;
  approach: string;
  bio: string;
  rating: number;
};
export type ProductStatus = "draft" | "self_passed" | "pending" | "approved" | "rejected";
export type Step = { title: string; body: string };
export type QuizQ = { q: string; options: string[]; correct: number };
export type Product = {
  id: string;
  authorId: string;
  coauthors: string[];
  title: string;
  description: string;
  price: number;
  topic: string;
  status: ProductStatus;
  steps: Step[];
  quiz: QuizQ[];
  cover: string;
  moderationComment?: string;
  createdAt: number;
};
export type ProductProgress = { done: number[]; quizScore: number | null };
export type OrderStatus = "Новый" | "В работе" | "Готов" | "Отклонён";
export type Order = {
  id: string;
  userId: string | null;
  pkg: string;
  name: string;
  email: string;
  phone: string;
  task: string;
  deadline: string;
  status: OrderStatus;
  notes: string;
  createdAt: number;
};
export type Purchase = {
  id: string;
  userId: string;
  productId: string;
  amount: number;
  createdAt: number;
};
export type Collab = {
  id: string;
  from: string;
  to: string;
  status: "pending" | "accepted" | "rejected";
  message: string;
};
export type Review = {
  id: string;
  productId: string;
  userId: string;
  rating: number;
  text: string;
};
export type GameProgress = {
  score: number;
  best: number;
  plays: number;
  completed: boolean;
  badges: string[];
  streak: number;
  lastDay?: string;
  data?: Record<string, unknown>;
  updatedAt: number;
};

export type State = {
  currentUserId: string | null;
  users: User[];
  products: Product[];
  progress: Record<string, ProductProgress>; // key userId:productId
  purchases: Purchase[];
  orders: Order[];
  collabs: Collab[];
  reviews: Review[];
  games: Record<string, Record<string, GameProgress>>; // userId -> slug
};

const covers = ["violet", "teal", "amber", "rose", "sky", "lime"];
const quiz3: QuizQ[] = [
  {
    q: "Что важнее всего на первом шаге разговора?",
    options: ["Сразу назвать цену", "Установить контакт и задать вопрос", "Рассказать о дипломах"],
    correct: 1,
  },
  {
    q: "Как ответить на «дорого»?",
    options: ["Сразу дать скидку", "Уточнить, с чем клиент сравнивает", "Закончить разговор"],
    correct: 1,
  },
  {
    q: "Чем завершать каждый контакт?",
    options: ["Конкретным следующим шагом", "Фразой «пишите, если что»", "Ничем"],
    correct: 0,
  },
];
const steps = (topic: string): Step[] => [
  { title: "Введение", body: `Зачем этот мини-продукт и как применить его в теме «${topic}».` },
  {
    title: "Практика",
    body: "Выполните упражнение: напишите 3 вопроса клиенту, которые помогают понять его запрос.",
  },
  {
    title: "Чек-лист",
    body: "Контакт → вопрос о боли → предложение → следующий шаг. Отметьте, что вы уже делаете.",
  },
];

function seed(): State {
  const users: User[] = [
    {
      id: "u1",
      name: "Анна Смирнова",
      email: "anna@vnedryai.ru",
      role: "member",
      avatar: "АС",
      specialization: "Психолог",
      city: "Москва",
      approach: "КПТ",
      bio: "Работаю с тревогой и выгоранием.",
      rating: 4.8,
    },
    {
      id: "u2",
      name: "Игорь Петров",
      email: "igor@vnedryai.ru",
      role: "member",
      avatar: "ИП",
      specialization: "Игропрактик",
      city: "Санкт-Петербург",
      approach: "Трансформационные игры",
      bio: "Автор 4 игр о деньгах.",
      rating: 4.6,
    },
    {
      id: "u3",
      name: "Мария Админова",
      email: "admin@vnedryai.ru",
      role: "admin",
      avatar: "МА",
      specialization: "Коуч",
      city: "Казань",
      approach: "Коучинг",
      bio: "Модератор платформы.",
      rating: 5,
    },
  ];
  const mk = (
    id: string,
    authorId: string,
    title: string,
    topic: string,
    price: number,
    status: ProductStatus,
    description: string,
  ): Product => ({
    id,
    authorId,
    coauthors: [],
    title,
    topic,
    price,
    status,
    description,
    steps: steps(topic),
    quiz: quiz3,
    cover: covers[Number(id.slice(1)) % covers.length],
    createdAt: Date.now() - Number(id.slice(1)) * 86400000,
  });
  return {
    currentUserId: null,
    users,
    products: [
      mk(
        "p1",
        "u1",
        "Чек-лист первой консультации",
        "Продажи",
        300,
        "approved",
        "Пошаговый чек-лист: как провести первую встречу и не забыть про следующий шаг.",
      ),
      mk(
        "p2",
        "u2",
        "Диагностика денежных блоков",
        "Деньги",
        900,
        "approved",
        "Мини-игра на 20 минут, которая показывает, что мешает назначать цену.",
      ),
      mk(
        "p3",
        "u1",
        "Мини-вебинар: возражение «дорого»",
        "Возражения",
        1500,
        "approved",
        "Запись и упражнения: 7 ответов на «дорого» без скидок.",
      ),
      mk(
        "p4",
        "u2",
        "Сценарий бесплатной встречи",
        "Продажи",
        500,
        "approved",
        "Скрипт диагностической сессии, которая конвертируется в оплату.",
      ),
      mk(
        "p5",
        "u1",
        "Упаковка услуги за вечер",
        "Маркетинг",
        1200,
        "pending",
        "Шаблон оффера и описания услуги для соцсетей.",
      ),
      mk(
        "p6",
        "u2",
        "Игра «Ценность часа»",
        "Деньги",
        700,
        "draft",
        "Помогает посчитать реальную стоимость своей работы.",
      ),
    ],
    progress: {},
    purchases: [],
    orders: [
      {
        id: "o1",
        userId: "u1",
        pkg: "5 000 ₽ — мини-продукт",
        name: "Анна Смирнова",
        email: "anna@vnedryai.ru",
        phone: "+79990000001",
        task: "Чек-лист по тревоге",
        deadline: "2026-12-10",
        status: "Новый",
        notes: "",
        createdAt: Date.now() - 86400000,
      },
      {
        id: "o2",
        userId: "u2",
        pkg: "9 900 ₽ + 1 000 ₽/мес — сайт + подписка",
        name: "Игорь Петров",
        email: "igor@vnedryai.ru",
        phone: "+79990000002",
        task: "Лендинг для игры",
        deadline: "2026-12-20",
        status: "В работе",
        notes: "Ждём тексты",
        createdAt: Date.now() - 3 * 86400000,
      },
      {
        id: "o3",
        userId: null,
        pkg: "35 000 ₽ — white-label",
        name: "Олег Сидоров",
        email: "oleg@mail.ru",
        phone: "+79990000003",
        task: "Школа под своим брендом",
        deadline: "2027-01-15",
        status: "Готов",
        notes: "",
        createdAt: Date.now() - 9 * 86400000,
      },
    ],
    collabs: [
      {
        id: "c1",
        from: "u2",
        to: "u1",
        status: "pending",
        message: "Давайте сделаем совместную игру про деньги и тревогу?",
      },
      {
        id: "c2",
        from: "u1",
        to: "u3",
        status: "accepted",
        message: "Хочу совместный вебинар по выгоранию.",
      },
    ],
    reviews: [
      {
        id: "r1",
        productId: "p1",
        userId: "u2",
        rating: 5,
        text: "Применил на следующий день — сработало.",
      },
      { id: "r2", productId: "p2", userId: "u1", rating: 4, text: "Глубоко и бережно." },
    ],
    games: {},
  };
}

const KEY = "vnedryai-v1";
let state: State = seed();
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) state = { ...seed(), ...JSON.parse(raw) };
  } catch {
    /* ignore */
  }
}

export function getState() {
  load();
  return state;
}
export function setState(fn: (s: State) => State) {
  load();
  state = fn(state);
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l());
}
export function resetDemo() {
  setState(() => ({ ...seed(), currentUserId: state.currentUserId }));
}

export function useStore<T>(sel: (s: State) => T): T {
  // Cache per store snapshot so selectors returning new arrays don't loop useSyncExternalStore.
  const cache = useRef<{ st: State | null; sel: unknown; v: T }>({ st: null, sel: null, v: undefined as T });
  const get = () => {
    const st = getState();
    if (cache.current.st !== st || cache.current.sel !== sel) cache.current = { st, sel, v: sel(st) };
    return cache.current.v;
  };
  return useSyncExternalStore((l) => { listeners.add(l); return () => listeners.delete(l); }, get, get);
}
export function useMe() {
  const id = useStore((s) => s.currentUserId);
  const users = useStore((s) => s.users);
  return users.find((u) => u.id === id) ?? null;
}

export const uid = (p: string) => p + Math.random().toString(36).slice(2, 9);
export const pkey = (u: string, p: string) => `${u}:${p}`;

export function productPercent(p: Product, pr?: ProductProgress) {
  if (!pr || p.steps.length === 0) return 0;
  return Math.round((pr.done.length / p.steps.length) * 100);
}
/** Author may submit only after 100% steps and quiz ≥ 80%. Returns reason or null. */
export function submitBlockReason(p: Product, pr?: ProductProgress): string | null {
  if (p.steps.length === 0) return "Добавьте хотя бы один шаг";
  if (p.quiz.length === 0) return "Добавьте хотя бы один вопрос квиза";
  if (productPercent(p, pr) < 100)
    return `Пройдите свой продукт на 100% (сейчас ${productPercent(p, pr)}%)`;
  if (pr?.quizScore == null) return "Сдайте квиз (нужно ≥80%)";
  if (pr.quizScore < 80) return `Квиз сдан на ${pr.quizScore}% — нужно ≥80%`;
  return null;
}

export const today = () => new Date().toISOString().slice(0, 10);

export function saveGame(userId: string, slug: string, patch: (g: GameProgress) => GameProgress) {
  setState((s) => {
    const mine = s.games[userId] ?? {};
    const cur: GameProgress = mine[slug] ?? {
      score: 0,
      best: 0,
      plays: 0,
      completed: false,
      badges: [],
      streak: 0,
      updatedAt: 0,
    };
    return {
      ...s,
      games: {
        ...s.games,
        [userId]: { ...mine, [slug]: { ...patch(cur), updatedAt: Date.now() } },
      },
    };
  });
}

/** Who may open a product: admin, author, co-author or buyer. */
export function canAccess(
  meId: string | undefined,
  role: string | undefined,
  p: { authorId: string; coauthors: string[]; id: string },
  purchases: { userId: string; productId: string }[],
) {
  if (!meId) return false;
  return (
    role === "admin" ||
    p.authorId === meId ||
    p.coauthors.includes(meId) ||
    purchases.some((x) => x.userId === meId && x.productId === p.id)
  );
}
