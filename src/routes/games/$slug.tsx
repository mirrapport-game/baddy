import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, Timer } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { RequireAuth } from "@/components/app/guards";
import { analyzeChat, BRIDGE_TIPS, gameBySlug, scoreVoice, type Game } from "@/lib/games";
import { saveGame, today, useStore, type GameProgress } from "@/lib/store";

export const Route = createFileRoute("/games/$slug")({
  loader: ({ params }) => {
    const g = gameBySlug(params.slug);
    if (!g) throw notFound();
    return { title: g.title, description: g.description };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.title ?? "Игра"} — Внедряй` },
      { name: "description", content: loaderData?.description ?? "Игра-тренажёр продаж" },
      { property: "og:title", content: `${loaderData?.title ?? "Игра"} — Внедряй` },
      { property: "og:description", content: loaderData?.description ?? "Игра-тренажёр продаж" },
    ],
  }),
  component: GamePage,
});

function GamePage() {
  const { slug } = Route.useParams();
  const game = gameBySlug(slug)!;
  return (
    <RequireAuth>
      {(me) => (
        <div className="mx-auto max-w-3xl">
          <Link
            to="/games"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" /> Все игры
          </Link>
          <div className="mt-4 flex items-center gap-3">
            <span className="text-5xl">{game.emoji}</span>
            <div>
              <h1 className="text-2xl font-bold">{game.title}</h1>
              <p className="text-sm text-muted-foreground">{game.description}</p>
            </div>
          </div>
          <ProgressBar userId={me.id} slug={slug} />
          <div className="mt-6">
            {game.kind === "choice" && <ChoiceGame game={game} userId={me.id} />}
            {game.kind === "mission" && <Mission userId={me.id} />}
            {game.kind === "timer" && <Voice userId={me.id} />}
            {game.kind === "analyze" && <Spy userId={me.id} />}
          </div>
        </div>
      )}
    </RequireAuth>
  );
}

function ProgressBar({ userId, slug }: { userId: string; slug: string }) {
  const p = useStore((s) => s.games[userId]?.[slug]);
  if (!p) return null;
  return (
    <div className="mt-4 flex flex-wrap gap-2 text-sm">
      <Chip>Лучший: {p.best}</Chip>
      <Chip>Попыток: {p.plays}</Chip>
      {p.streak > 0 && <Chip>🔥 Серия {p.streak}</Chip>}
      {p.badges.map((b) => (
        <Chip key={b}>🏅 {b}</Chip>
      ))}
    </div>
  );
}
const Chip = ({ children }: { children: React.ReactNode }) => (
  <span className="rounded-full bg-muted px-3 py-1 font-medium">{children}</span>
);

function finish(userId: string, game: Game, score: number, max: number) {
  const passed = score >= Math.ceil(max * 0.6);
  saveGame(userId, game.slug, (g: GameProgress) => ({
    ...g,
    score,
    best: Math.max(g.best, score),
    plays: g.plays + 1,
    completed: g.completed || passed,
    badges: passed && !g.badges.includes(game.badge) ? [...g.badges, game.badge] : g.badges,
    data: undefined,
  }));
  if (passed) toast.success(`Бейдж «${game.badge}»!`);
  return passed;
}

function ChoiceGame({ game, userId }: { game: Game; userId: string }) {
  const saved = useStore(
    (s) =>
      s.games[userId]?.[game.slug]?.data as { i: number; score: number; mood: number } | undefined,
  );
  const [i, setI] = useState(saved?.i ?? 0);
  const [score, setScore] = useState(saved?.score ?? 0);
  const [mood, setMood] = useState(saved?.mood ?? 1);
  const [picked, setPicked] = useState<number | null>(null);
  const [result, setResult] = useState<null | boolean>(null);
  const [log, setLog] = useState<string[]>([]);
  const round = game.rounds[i];
  const max = game.rounds.length * 10;
  const rot = (i * 2) % 3;
  const options = round ? [...round.options.slice(rot), ...round.options.slice(0, rot)] : [];
  const labels = game.moodLabels ?? ["Холодно", "Тепло", "Горячо"];

  const choose = (idx: number) => {
    if (picked !== null) return;
    const o = options[idx];
    setPicked(idx);
    const ns = score + (o.good ? 10 : 0);
    const nm = Math.max(0, Math.min(2, mood + (o.good ? 1 : -1)));
    setScore(ns);
    setMood(nm);
    setLog((l) => [...l, `${round.title}: ${o.good ? "✅" : "❌"} ${o.feedback}`]);
    saveGame(userId, game.slug, (g) => ({ ...g, data: { i: i + 1, score: ns, mood: nm } }));
  };
  const next = () => {
    setPicked(null);
    if (i + 1 >= game.rounds.length) setResult(finish(userId, game, score, max));
    else setI(i + 1);
  };
  const restart = () => {
    setI(0);
    setScore(0);
    setMood(1);
    setPicked(null);
    setResult(null);
    setLog([]);
    saveGame(userId, game.slug, (g) => ({ ...g, data: undefined }));
  };

  if (result !== null)
    return (
      <div className="rounded-3xl border bg-card p-6 text-center">
        <p className="text-5xl">{result ? "🏆" : "💪"}</p>
        <h2 className="mt-3 text-xl font-bold">{result ? "Победа!" : "Почти получилось"}</h2>
        <p className="mt-1 text-muted-foreground">
          Очки: {score} из {max}.{" "}
          {result ? `Получен бейдж «${game.badge}».` : "Нужно 60% для бейджа."}
        </p>
        {log.length > 0 && (
          <ul className="mt-4 space-y-1 text-left text-sm">
            {log.map((l, k) => (
              <li key={k} className="rounded-lg bg-muted p-2">
                {l}
              </li>
            ))}
          </ul>
        )}
        <div className="mt-5 flex justify-center gap-2">
          <Button onClick={restart}>Сыграть снова</Button>
          <Button asChild variant="outline">
            <Link to="/games">К играм</Link>
          </Button>
        </div>
      </div>
    );

  return (
    <div className="rounded-3xl border bg-card p-6">
      <div className="flex items-center justify-between text-sm">
        <span className="font-semibold text-primary">{round.title}</span>
        <span>
          {i + 1} / {game.rounds.length} · {score} очк.
        </span>
      </div>
      <Progress value={(i / game.rounds.length) * 100} className="mt-3" />
      <div className="mt-5 flex items-center gap-3">
        <span className="text-3xl">{["😠", "🤔", "😊"][mood]}</span>
        <span className="rounded-full bg-secondary px-3 py-1 text-sm font-semibold text-secondary-foreground">
          {labels[mood]}
        </span>
      </div>
      <p className="mt-4 rounded-2xl bg-muted p-4 text-lg">{round.prompt}</p>
      <div className="mt-4 space-y-2">
        {options.map((o, k) => (
          <button
            key={k}
            onClick={() => choose(k)}
            disabled={picked !== null}
            className={`w-full rounded-2xl border p-4 text-left transition ${picked === null ? "hover:border-primary hover:bg-primary/5" : o.good ? "border-success bg-success/10" : picked === k ? "border-destructive bg-destructive/10" : "opacity-60"}`}
          >
            {o.text}
            {picked !== null && (picked === k || o.good) && (
              <span className="mt-1 block text-sm text-muted-foreground">{o.feedback}</span>
            )}
          </button>
        ))}
      </div>
      {picked !== null && (
        <Button className="mt-4 w-full" onClick={next}>
          {i + 1 >= game.rounds.length ? "Результат" : "Дальше"}
        </Button>
      )}
    </div>
  );
}

function Mission({ userId }: { userId: string }) {
  const p = useStore((s) => s.games[userId]?.bridge);
  const day = today();
  const doneToday = p?.lastDay === day;
  const boards = p?.plays ?? 0;
  const tip = BRIDGE_TIPS[boards % BRIDGE_TIPS.length];
  const [note, setNote] = useState("");
  const [refused, setRefused] = useState(false);
  const complete = () => {
    if (note.trim().length < 5) return toast.error("Опишите коротко, что вы сделали");
    const y = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    saveGame(userId, "bridge", (g) => {
      const streak = g.lastDay === y ? g.streak + 1 : 1;
      const done = g.plays + 1 >= 3;
      return {
        ...g,
        plays: g.plays + 1,
        score: g.score + 10,
        best: g.score + 10,
        streak,
        lastDay: day,
        completed: g.completed || done,
        badges:
          done && !g.badges.includes("Строитель моста")
            ? [...g.badges, "Строитель моста"]
            : g.badges,
      };
    });
    setNote("");
    toast.success("Доска моста уложена! 🌉");
  };
  return (
    <div className="space-y-4">
      <div className="rounded-3xl border bg-card p-6">
        <p className="text-sm font-semibold text-muted-foreground">Мост: {boards} досок</p>
        <div className="mt-3 flex flex-wrap gap-1">
          {Array.from({ length: Math.max(7, boards) }).map((_, k) => (
            <span key={k} className={`h-6 w-8 rounded ${k < boards ? "bg-accent" : "bg-muted"}`} />
          ))}
        </div>
      </div>
      {doneToday ? (
        <div className="rounded-3xl border bg-success/10 p-6">
          <h2 className="font-bold">Миссия на сегодня выполнена ✅</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Возвращайтесь завтра, чтобы продолжить серию. (3 доски — бейдж.)
          </p>
        </div>
      ) : (
        <div className="rounded-3xl border bg-card p-6">
          <p className="text-sm font-semibold text-primary">Фишка дня</p>
          <p className="mt-1 text-lg font-semibold">{tip.tip}</p>
          <p className="mt-3 rounded-2xl bg-muted p-4">🎯 {tip.action}</p>
          <Textarea
            className="mt-4"
            placeholder="Что вы сделали и что ответили?"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <Button onClick={complete}>Выполнено</Button>
            <Button variant="outline" onClick={() => setRefused(true)}>
              Мне отказали 😔
            </Button>
          </div>
          {refused && (
            <p className="mt-4 rounded-2xl bg-secondary p-4 text-secondary-foreground">
              Отказ — это смелость, а не провал. Вы сделали действие — это и есть доска моста.
              Опишите, что произошло, и нажмите «Выполнено».
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function Voice({ userId }: { userId: string }) {
  const [left, setLeft] = useState<number | null>(null);
  const [text, setText] = useState("");
  const [res, setRes] = useState<ReturnType<typeof scoreVoice> | null>(null);
  useEffect(() => {
    if (left === null || left <= 0) return;
    const t = setTimeout(() => setLeft((l) => (l ?? 1) - 1), 1000);
    return () => clearTimeout(t);
  }, [left]);
  useEffect(() => {
    if (left === 0 && !res) submit();
  }, [left]); // eslint-disable-line react-hooks/exhaustive-deps
  const submit = () => {
    if (text.trim().length < 10) {
      toast.error("Напишите хотя бы одно предложение");
      setLeft(null);
      return;
    }
    const r = scoreVoice(text);
    setRes(r);
    setLeft(null);
    const game = gameBySlug("voice")!;
    finish(userId, game, r.total, 100);
  };
  if (res)
    return (
      <div className="rounded-3xl border bg-card p-6">
        <h2 className="text-xl font-bold">Итог: {res.total} / 100</h2>
        {[
          ["Смысл", res.meaning],
          ["Уверенность", res.confidence],
          ["Следующий шаг", res.next],
        ].map(([l, v]) => (
          <div key={l as string} className="mt-3">
            <div className="flex justify-between text-sm">
              <span>{l}</span>
              <span>{v}</span>
            </div>
            <Progress value={v as number} />
          </div>
        ))}
        <p className="mt-4 text-sm text-muted-foreground">
          Совет: избегайте «может быть», «наверное» и обязательно назовите конкретное время встречи.
        </p>
        <Button
          className="mt-4"
          onClick={() => {
            setRes(null);
            setText("");
          }}
        >
          Ещё раз
        </Button>
      </div>
    );
  return (
    <div className="rounded-3xl border bg-card p-6">
      <p className="rounded-2xl bg-muted p-4">🤖 «У вас 30 секунд. Предложите мне консультацию.»</p>
      {left === null ? (
        <Button className="mt-4" onClick={() => setLeft(30)}>
          <Timer /> Старт (30 сек)
        </Button>
      ) : (
        <>
          <div className="mt-4 flex items-center gap-3">
            <Timer className="text-primary" />
            <span className="font-display text-2xl font-bold">{left}</span>
            <Progress value={(left / 30) * 100} />
          </div>
          <Textarea
            autoFocus
            className="mt-3 min-h-32"
            placeholder="Текстовый режим: напишите, что бы вы сказали…"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <Button className="mt-3" onClick={submit}>
            Отправить
          </Button>
        </>
      )}
    </div>
  );
}

function Spy({ userId }: { userId: string }) {
  const [text, setText] = useState("");
  const [res, setRes] = useState<ReturnType<typeof analyzeChat> | null>(null);
  const run = () => {
    if (text.trim().length < 20) return toast.error("Вставьте фрагмент переписки (от 20 символов)");
    const r = analyzeChat(text);
    setRes(r);
    const game = gameBySlug("spy-mentor")!;
    saveGame(userId, "spy-mentor", (g) => ({
      ...g,
      plays: g.plays + 1,
      score: r.score,
      best: Math.max(g.best, r.score),
      completed: true,
      badges: g.badges.includes(game.badge) ? g.badges : [...g.badges, game.badge],
    }));
  };
  return (
    <div className="space-y-4">
      <div className="rounded-3xl border bg-card p-6">
        <Textarea
          className="min-h-40"
          placeholder={
            "Клиент: Здравствуйте, сколько стоит?\nЯ: 5000 рублей.\nКлиент: Дорого, подумаю."
          }
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <Button className="mt-3" onClick={run}>
          Получить разбор
        </Button>
      </div>
      {res && (
        <div className="rounded-3xl border bg-card p-6">
          <h2 className="font-bold">Разбор шпиона · {res.score}/100</h2>
          <ul className="mt-3 space-y-2">
            {res.findings.map((f) => (
              <li key={f} className="rounded-xl bg-muted p-3 text-sm">
                🔍 {f}
              </li>
            ))}
          </ul>
          <p className="mt-4 rounded-xl bg-secondary p-3 font-semibold text-secondary-foreground">
            💡 Фишка на завтра: {res.tip}
          </p>
        </div>
      )}
    </div>
  );
}
