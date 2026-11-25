import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Lock, Star } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { COVER, rub, STATUS_LABEL } from "@/components/app/guards";
import {
  canAccess,
  pkey,
  productPercent,
  setState,
  submitBlockReason,
  uid,
  useMe,
  useStore,
} from "@/lib/store";

export const Route = createFileRoute("/products/$id")({
  head: () => ({
    meta: [
      { title: "Мини-продукт — Внедряй" },
      { name: "description", content: "Описание, состав, автор и отзывы мини-продукта." },
      { property: "og:title", content: "Мини-продукт — Внедряй" },
      { property: "og:description", content: "Мини-продукт на платформе Внедряй." },
    ],
  }),
  component: ProductPage,
});

function ProductPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const me = useMe();
  const p = useStore((s) => s.products.find((x) => x.id === id));
  const users = useStore((s) => s.users);
  const purchases = useStore((s) => s.purchases);
  const reviews = useStore((s) => s.reviews.filter((r) => r.productId === id));
  const pr = useStore((s) => (me ? s.progress[pkey(me.id, id)] : undefined));
  const [pay, setPay] = useState(false);
  const [card, setCard] = useState("");
  const [payErr, setPayErr] = useState("");
  const [rv, setRv] = useState(5);
  const [rvText, setRvText] = useState("");

  if (!p)
    return (
      <div className="text-center">
        <h1 className="text-xl font-bold">Продукт не найден</h1>
        <Button asChild className="mt-4">
          <Link to="/marketplace">В маркетплейс</Link>
        </Button>
      </div>
    );
  const author = users.find((u) => u.id === p.authorId);
  const isOwner = !!me && (p.authorId === me.id || p.coauthors.includes(me.id));
  if (p.status !== "approved" && !isOwner && me?.role !== "admin")
    return (
      <div className="text-center">
        <h1 className="text-xl font-bold">Продукт ещё не опубликован</h1>
        <Button asChild className="mt-4">
          <Link to="/marketplace">В маркетплейс</Link>
        </Button>
      </div>
    );
  const access = canAccess(me?.id, me?.role, p, purchases);
  const bought = !!me && purchases.some((x) => x.userId === me.id && x.productId === p.id);
  const pct = productPercent(p, pr);
  const reason = submitBlockReason(p, pr);
  const avg = reviews.length ? reviews.reduce((a, r) => a + r.rating, 0) / reviews.length : 0;
  const completed = pct === 100 && (pr?.quizScore ?? 0) >= 80;
  const reviewed = !!me && reviews.some((r) => r.userId === me.id);

  const buy = () => {
    if (!me) return navigate({ to: "/auth" });
    if (p.price === 0) {
      doBuy();
      return;
    }
    setPay(true);
  };
  const doBuy = () => {
    if (!me) return;
    if (p.price > 0 && card.replace(/\D/g, "").length !== 16)
      return setPayErr("Номер карты — 16 цифр (тест: 4242 4242 4242 4242)");
    setState((s) => ({
      ...s,
      purchases: [
        ...s.purchases,
        { id: uid("b"), userId: me.id, productId: p.id, amount: p.price, createdAt: Date.now() },
      ],
    }));
    setPay(false);
    setCard("");
    toast.success("Покупка прошла! Продукт в «Мои продукты».");
  };
  const submit = () => {
    if (reason) return toast.error(reason);
    setState((s) => ({
      ...s,
      products: s.products.map((x) =>
        x.id === p.id ? { ...x, status: "pending", moderationComment: undefined } : x,
      ),
    }));
    toast.success("Отправлено на модерацию");
  };
  const addReview = () => {
    if (!me) return;
    if (rvText.trim().length < 5) return toast.error("Отзыв — минимум 5 символов");
    setState((s) => ({
      ...s,
      reviews: [
        ...s.reviews,
        { id: uid("r"), productId: p.id, userId: me.id, rating: rv, text: rvText.trim() },
      ],
    }));
    setRvText("");
    toast.success("Спасибо за отзыв!");
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <div className="space-y-6">
        <div className={`rounded-3xl bg-gradient-to-br ${COVER[p.cover] ?? COVER.violet} p-8`}>
          <span className="rounded-full bg-background/80 px-3 py-1 text-xs font-semibold">
            {p.topic}
          </span>
          <h1 className="mt-4 text-2xl font-bold sm:text-3xl">{p.title}</h1>
        </div>
        <p className="text-lg">{p.description}</p>
        <div className="rounded-3xl border bg-card p-6">
          <h2 className="font-bold">
            Состав ({p.steps.length} шагов + квиз из {p.quiz.length} вопросов)
          </h2>
          <ol className="mt-3 space-y-2">
            {p.steps.map((s, i) => (
              <li key={i} className="flex items-center gap-3 rounded-xl bg-muted p-3">
                <span className="grid size-7 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  {i + 1}
                </span>
                {s.title}
                {!access && <Lock className="ml-auto size-4 text-muted-foreground" />}
              </li>
            ))}
          </ol>
        </div>
        <div className="rounded-3xl border bg-card p-6">
          <h2 className="flex items-center gap-2 font-bold">
            Отзывы <Star className="size-4 fill-warning text-warning" />{" "}
            {avg ? avg.toFixed(1) : "—"}
          </h2>
          {reviews.length === 0 && (
            <p className="mt-2 text-sm text-muted-foreground">Пока нет отзывов.</p>
          )}
          <ul className="mt-3 space-y-2">
            {reviews.map((r) => (
              <li key={r.id} className="rounded-xl bg-muted p-3 text-sm">
                <b>{users.find((u) => u.id === r.userId)?.name}</b> · {"★".repeat(r.rating)}
                <p className="mt-1">{r.text}</p>
              </li>
            ))}
          </ul>
          {me && bought && completed && !reviewed && (
            <div className="mt-4 space-y-2">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} aria-label={`${n} звёзд`} onClick={() => setRv(n)}>
                    <Star
                      className={`size-6 ${n <= rv ? "fill-warning text-warning" : "text-muted-foreground"}`}
                    />
                  </button>
                ))}
              </div>
              <Textarea
                placeholder="Ваш отзыв"
                value={rvText}
                onChange={(e) => setRvText(e.target.value)}
              />
              <Button onClick={addReview}>Оставить отзыв</Button>
            </div>
          )}
          {me && bought && !completed && (
            <p className="mt-3 text-sm text-muted-foreground">
              Отзыв можно оставить после прохождения.
            </p>
          )}
        </div>
      </div>
      <aside className="space-y-4">
        <div className="rounded-3xl border bg-card p-6">
          <p className="font-display text-3xl font-bold text-primary">
            {p.price ? rub(p.price) : "Бесплатно"}
          </p>
          {access ? (
            <Button asChild className="mt-4 w-full" size="lg">
              <Link to="/products/$id/learn" params={{ id: p.id }}>
                {pct > 0 ? "Продолжить" : "Начать"}
              </Link>
            </Button>
          ) : (
            <Button className="mt-4 w-full" size="lg" onClick={buy}>
              {p.price ? "Купить" : "Получить"}
            </Button>
          )}
          {access && (
            <div className="mt-3">
              <Progress value={pct} />
              <p className="mt-1 text-xs text-muted-foreground">
                Пройдено {pct}%{pr?.quizScore != null && ` · квиз ${pr.quizScore}%`}
              </p>
            </div>
          )}
        </div>
        <div className="rounded-3xl border bg-card p-6">
          <p className="text-sm text-muted-foreground">Автор</p>
          <p className="font-semibold">{author?.name}</p>
          <p className="text-sm text-muted-foreground">{author?.specialization}</p>
          {p.coauthors.length > 0 && (
            <>
              <p className="mt-3 text-sm text-muted-foreground">Соавторы</p>
              {p.coauthors.map((c) => (
                <p key={c} className="font-semibold">
                  {users.find((u) => u.id === c)?.name}
                </p>
              ))}
            </>
          )}
        </div>
        {isOwner && (
          <div className="rounded-3xl border-2 border-primary/30 bg-card p-6">
            <p className="text-sm text-muted-foreground">Статус</p>
            <p className="font-bold">{STATUS_LABEL[p.status]}</p>
            {p.moderationComment && (
              <p className="mt-2 rounded-xl bg-destructive/10 p-3 text-sm">
                Комментарий модератора: {p.moderationComment}
              </p>
            )}
            {(p.status === "draft" || p.status === "rejected" || p.status === "self_passed") && (
              <>
                <Button className="mt-4 w-full" disabled={!!reason} onClick={submit}>
                  Отправить на модерацию
                </Button>
                {reason && <p className="mt-2 text-sm text-destructive">🔒 {reason}</p>}
              </>
            )}
            {p.status !== "pending" && (
              <Button asChild variant="outline" className="mt-2 w-full">
                <Link to="/products/$id/edit" params={{ id: p.id }}>
                  Редактировать
                </Link>
              </Button>
            )}
          </div>
        )}
      </aside>
      <Dialog open={pay} onOpenChange={setPay}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Оплата {rub(p.price)}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Тестовая оплата — деньги не списываются.</p>
          <Input
            placeholder="4242 4242 4242 4242"
            inputMode="numeric"
            value={card}
            onChange={(e) => {
              setCard(e.target.value);
              setPayErr("");
            }}
          />
          {payErr && <p className="text-sm text-destructive">{payErr}</p>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPay(false)}>
              Отмена
            </Button>
            <Button onClick={doBuy}>Оплатить</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
