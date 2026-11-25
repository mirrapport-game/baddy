import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RequireAuth } from "@/components/app/guards";
import {
  canAccess,
  pkey,
  productPercent,
  setState,
  useStore,
  type Product,
  type User,
} from "@/lib/store";

export const Route = createFileRoute("/products/$id_/learn")({
  head: () => ({
    meta: [
      { title: "Прохождение — Внедряй" },
      { name: "description", content: "Прохождение мини-продукта и квиз." },
      { property: "og:title", content: "Прохождение — Внедряй" },
      { property: "og:description", content: "Прохождение мини-продукта." },
    ],
  }),
  component: () => <RequireAuth>{(me) => <Learn me={me} />}</RequireAuth>,
});

function Learn({ me }: { me: User }) {
  const { id } = Route.useParams();
  const p = useStore((s) => s.products.find((x) => x.id === id));
  const purchases = useStore((s) => s.purchases);
  if (!p || !canAccess(me.id, me.role, p, purchases))
    return (
      <div className="text-center">
        <h1 className="text-xl font-bold">Нет доступа</h1>
        <p className="mt-2 text-muted-foreground">Купите продукт, чтобы пройти его.</p>
        <Button asChild className="mt-4">
          <Link to="/marketplace">В маркетплейс</Link>
        </Button>
      </div>
    );
  return <LearnInner p={p} me={me} />;
}

function LearnInner({ p, me }: { p: Product; me: User }) {
  const key = pkey(me.id, p.id);
  const pr = useStore((s) => s.progress[key]) ?? { done: [], quizScore: null };
  const [answers, setAnswers] = useState<(number | null)[]>(p.quiz.map(() => null));
  const pct = productPercent(p, pr);
  const isAuthor = p.authorId === me.id || p.coauthors.includes(me.id);

  const toggle = (i: number) =>
    setState((s) => {
      const cur = s.progress[key] ?? { done: [], quizScore: null };
      const done = cur.done.includes(i) ? cur.done.filter((x) => x !== i) : [...cur.done, i];
      return { ...s, progress: { ...s.progress, [key]: { ...cur, done } } };
    });
  const submitQuiz = () => {
    if (answers.some((a) => a === null)) return toast.error("Ответьте на все вопросы");
    const right = answers.filter((a, i) => a === p.quiz[i].correct).length;
    const score = Math.round((right / p.quiz.length) * 100);
    setState((s) => {
      const products =
        isAuthor && pct === 100 && score >= 80 && (p.status === "draft" || p.status === "rejected")
          ? s.products.map((x) => (x.id === p.id ? { ...x, status: "self_passed" as const } : x))
          : s.products;
      return {
        ...s,
        products,
        progress: {
          ...s.progress,
          [key]: { ...(s.progress[key] ?? { done: [] }), quizScore: score },
        },
      };
    });
    if (score >= 80) toast.success(`Квиз сдан: ${score}%`);
    else toast.error(`${score}% — нужно ≥80%. Попробуйте ещё раз.`);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        to="/products/$id"
        params={{ id: p.id }}
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← {p.title}
      </Link>
      <div className="rounded-3xl border bg-card p-6">
        <div className="flex justify-between text-sm font-semibold">
          <span>Прогресс</span>
          <span>{pct}%</span>
        </div>
        <Progress value={pct} className="mt-2" />
      </div>
      {p.steps.map((s, i) => {
        const d = pr.done.includes(i);
        return (
          <div
            key={i}
            className={`rounded-3xl border p-6 ${d ? "border-success bg-success/5" : "bg-card"}`}
          >
            <h2 className="font-bold">
              Шаг {i + 1}. {s.title}
            </h2>
            <p className="mt-2 whitespace-pre-line text-muted-foreground">{s.body}</p>
            <Button className="mt-4" variant={d ? "outline" : "default"} onClick={() => toggle(i)}>
              {d ? (
                <>
                  <CheckCircle2 /> Пройдено
                </>
              ) : (
                "Отметить пройденным"
              )}
            </Button>
          </div>
        );
      })}
      <div className="rounded-3xl border bg-card p-6">
        <h2 className="font-bold">
          Квиз{" "}
          {pr.quizScore != null && (
            <span className={pr.quizScore >= 80 ? "text-success" : "text-destructive"}>
              · последний результат {pr.quizScore}%
            </span>
          )}
        </h2>
        {pct < 100 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            🔒 Квиз откроется после прохождения всех шагов.
          </p>
        ) : (
          <div className="mt-4 space-y-5">
            {p.quiz.map((q, i) => (
              <div key={i}>
                <p className="font-semibold">
                  {i + 1}. {q.q}
                </p>
                <div className="mt-2 space-y-1">
                  {q.options.map((o, j) => (
                    <label
                      key={j}
                      className={`flex cursor-pointer items-center gap-2 rounded-xl border p-3 ${answers[i] === j ? "border-primary bg-primary/5" : ""}`}
                    >
                      <input
                        type="radio"
                        name={`q${i}`}
                        checked={answers[i] === j}
                        onChange={() => setAnswers(answers.map((a, k) => (k === i ? j : a)))}
                      />
                      {o}
                    </label>
                  ))}
                </div>
              </div>
            ))}
            <Button onClick={submitQuiz}>Проверить</Button>
          </div>
        )}
      </div>
      {isAuthor && pct === 100 && (pr.quizScore ?? 0) >= 80 && (
        <Button asChild size="lg" className="w-full">
          <Link to="/products/$id" params={{ id: p.id }}>
            Готово — к отправке на модерацию
          </Link>
        </Button>
      )}
    </div>
  );
}
