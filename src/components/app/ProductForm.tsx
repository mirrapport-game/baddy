import { useNavigate } from "@tanstack/react-router";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { COVER, EMAIL_RE } from "@/components/app/guards";
import {
  getState,
  setState,
  uid,
  useStore,
  type Product,
  type QuizQ,
  type Step,
} from "@/lib/store";

export const TOPICS = ["Продажи", "Возражения", "Деньги", "Маркетинг", "Тревога", "Отношения"];

export function ProductForm({ authorId, initial }: { authorId: string; initial?: Product }) {
  const navigate = useNavigate();
  const users = useStore((s) => s.users);
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [price, setPrice] = useState(String(initial?.price ?? ""));
  const [topic, setTopic] = useState(initial?.topic ?? TOPICS[0]);
  const [cover, setCover] = useState(initial?.cover ?? "violet");
  const [steps, setSteps] = useState<Step[]>(initial?.steps ?? [{ title: "", body: "" }]);
  const [quiz, setQuiz] = useState<QuizQ[]>(
    initial?.quiz ?? [{ q: "", options: ["", "", ""], correct: 0 }],
  );
  const [coauthors, setCoauthors] = useState<string[]>(initial?.coauthors ?? []);
  const [coEmail, setCoEmail] = useState("");
  const [errors, setErrors] = useState<string[]>([]);

  const addCo = (id?: string) => {
    let target = id;
    if (!target) {
      const em = coEmail.trim().toLowerCase();
      if (!EMAIL_RE.test(em)) return toast.error("Введите корректный email");
      target = getState().users.find((u) => u.email === em)?.id;
      if (!target) return toast.error("Пользователь с таким email не найден");
    }
    if (target === authorId) return toast.error("Вы уже автор");
    if (!coauthors.includes(target)) setCoauthors([...coauthors, target]);
    setCoEmail("");
  };

  const save = () => {
    const e: string[] = [];
    if (title.trim().length < 3) e.push("Название — минимум 3 символа");
    if (description.trim().length < 10) e.push("Описание — минимум 10 символов");
    const pr = Number(price);
    if (!Number.isFinite(pr) || pr < 0 || price.trim() === "") e.push("Цена — число от 0");
    if (steps.some((s) => !s.title.trim() || !s.body.trim())) e.push("Заполните все шаги");
    if (quiz.some((q) => !q.q.trim() || q.options.some((o) => !o.trim())))
      e.push("Заполните все вопросы и варианты квиза");
    setErrors(e);
    if (e.length) return;
    const id = initial?.id ?? uid("p");
    const data: Product = {
      id,
      authorId: initial?.authorId ?? authorId,
      coauthors,
      title: title.trim(),
      description: description.trim(),
      price: pr,
      topic,
      cover,
      steps,
      quiz,
      status: "draft",
      createdAt: initial?.createdAt ?? Date.now(),
    };
    setState((s) => {
      // Content changed → author must pass it again.
      const progress = { ...s.progress };
      delete progress[`${data.authorId}:${id}`];
      return {
        ...s,
        progress,
        products: initial ? s.products.map((p) => (p.id === id ? data : p)) : [...s.products, data],
      };
    });
    toast.success(
      initial ? "Сохранено. Пройдите продукт заново перед модерацией." : "Черновик создан",
    );
    navigate({ to: "/products/$id", params: { id } });
  };

  return (
    <div className="space-y-6">
      <section className="space-y-4 rounded-3xl border bg-card p-6">
        <div className="space-y-1.5">
          <Label>Название</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Описание</Label>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Цена, ₽</Label>
            <Input
              inputMode="numeric"
              value={price}
              onChange={(e) => setPrice(e.target.value.replace(/[^\d]/g, ""))}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Тема</Label>
            <select
              className="h-9 w-full rounded-md border bg-background px-3"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            >
              {TOPICS.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <Label>Обложка</Label>
          <div className="mt-2 flex gap-2">
            {Object.keys(COVER).map((c) => (
              <button
                key={c}
                type="button"
                aria-label={c}
                onClick={() => setCover(c)}
                className={`size-10 rounded-xl bg-gradient-to-br ${COVER[c]} ${cover === c ? "ring-2 ring-primary ring-offset-2" : ""}`}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-3 rounded-3xl border bg-card p-6">
        <h2 className="font-bold">Состав: шаги, уроки, чек-листы</h2>
        {steps.map((s, i) => (
          <div key={i} className="space-y-2 rounded-2xl bg-muted p-4">
            <div className="flex gap-2">
              <Input
                placeholder={`Шаг ${i + 1}: заголовок`}
                value={s.title}
                onChange={(e) =>
                  setSteps(steps.map((x, k) => (k === i ? { ...x, title: e.target.value } : x)))
                }
              />
              <Button
                variant="ghost"
                size="icon"
                aria-label="Удалить шаг"
                disabled={steps.length === 1}
                onClick={() => setSteps(steps.filter((_, k) => k !== i))}
              >
                <Trash2 />
              </Button>
            </div>
            <Textarea
              placeholder="Содержание"
              value={s.body}
              onChange={(e) =>
                setSteps(steps.map((x, k) => (k === i ? { ...x, body: e.target.value } : x)))
              }
            />
          </div>
        ))}
        <Button variant="outline" onClick={() => setSteps([...steps, { title: "", body: "" }])}>
          <Plus /> Шаг
        </Button>
      </section>

      <section className="space-y-3 rounded-3xl border bg-card p-6">
        <h2 className="font-bold">Квиз (для прохождения нужно ≥80%)</h2>
        {quiz.map((q, i) => (
          <div key={i} className="space-y-2 rounded-2xl bg-muted p-4">
            <div className="flex gap-2">
              <Input
                placeholder={`Вопрос ${i + 1}`}
                value={q.q}
                onChange={(e) =>
                  setQuiz(quiz.map((x, k) => (k === i ? { ...x, q: e.target.value } : x)))
                }
              />
              <Button
                variant="ghost"
                size="icon"
                aria-label="Удалить вопрос"
                disabled={quiz.length === 1}
                onClick={() => setQuiz(quiz.filter((_, k) => k !== i))}
              >
                <Trash2 />
              </Button>
            </div>
            {q.options.map((o, j) => (
              <label key={j} className="flex items-center gap-2">
                <input
                  type="radio"
                  name={`c${i}`}
                  checked={q.correct === j}
                  onChange={() => setQuiz(quiz.map((x, k) => (k === i ? { ...x, correct: j } : x)))}
                />
                <Input
                  placeholder={`Вариант ${j + 1}`}
                  value={o}
                  onChange={(e) =>
                    setQuiz(
                      quiz.map((x, k) =>
                        k === i
                          ? {
                              ...x,
                              options: x.options.map((y, m) => (m === j ? e.target.value : y)),
                            }
                          : x,
                      ),
                    )
                  }
                />
              </label>
            ))}
            <p className="text-xs text-muted-foreground">Отметьте правильный вариант кружком.</p>
          </div>
        ))}
        <Button
          variant="outline"
          onClick={() => setQuiz([...quiz, { q: "", options: ["", "", ""], correct: 0 }])}
        >
          <Plus /> Вопрос
        </Button>
      </section>

      <section className="space-y-3 rounded-3xl border bg-card p-6">
        <h2 className="font-bold">Соавторы</h2>
        <div className="flex flex-wrap gap-2">
          {coauthors.map((c) => {
            const u = users.find((x) => x.id === c);
            return (
              <span
                key={c}
                className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-sm text-secondary-foreground"
              >
                {u?.name}
                <button
                  aria-label="Убрать"
                  onClick={() => setCoauthors(coauthors.filter((x) => x !== c))}
                >
                  ×
                </button>
              </span>
            );
          })}
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="email соавтора"
            value={coEmail}
            onChange={(e) => setCoEmail(e.target.value)}
          />
          <Button variant="outline" onClick={() => addCo()}>
            Добавить
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {users
            .filter((u) => u.id !== authorId && !coauthors.includes(u.id))
            .map((u) => (
              <Button key={u.id} size="sm" variant="ghost" onClick={() => addCo(u.id)}>
                + {u.name}
              </Button>
            ))}
        </div>
      </section>

      {errors.length > 0 && (
        <ul className="rounded-2xl bg-destructive/10 p-4 text-sm text-destructive">
          {errors.map((e) => (
            <li key={e}>• {e}</li>
          ))}
        </ul>
      )}
      <Button size="lg" className="w-full" onClick={save}>
        {initial ? "Сохранить изменения" : "Создать черновик"}
      </Button>
    </div>
  );
}
