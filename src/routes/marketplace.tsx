import { createFileRoute, Link } from "@tanstack/react-router";
import { Star } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { COVER, rub } from "@/components/app/guards";
import { TOPICS } from "@/components/app/ProductForm";
import { useMe, useStore } from "@/lib/store";

export const Route = createFileRoute("/marketplace")({
  head: () => ({
    meta: [
      { title: "Маркетплейс мини-продуктов — Внедряй" },
      {
        name: "description",
        content: "Чек-листы, диагностики и мини-вебинары от психологов и экспертов.",
      },
      { property: "og:title", content: "Маркетплейс мини-продуктов — Внедряй" },
      { property: "og:description", content: "Мини-продукты от экспертов." },
    ],
  }),
  component: Market,
});

function Market() {
  const me = useMe();
  const products = useStore((s) => s.products);
  const users = useStore((s) => s.users);
  const reviews = useStore((s) => s.reviews);
  const [q, setQ] = useState("");
  const [topic, setTopic] = useState("");
  const [author, setAuthor] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [minRating, setMinRating] = useState(0);
  const rating = (id: string) => {
    const r = reviews.filter((x) => x.productId === id);
    return r.length ? r.reduce((a, b) => a + b.rating, 0) / r.length : 0;
  };
  const list = useMemo(
    () =>
      products.filter(
        (p) =>
          p.status === "approved" &&
          (!q || p.title.toLowerCase().includes(q.toLowerCase())) &&
          (!topic || p.topic === topic) &&
          (!author || p.authorId === author) &&
          (!maxPrice || p.price <= Number(maxPrice)) &&
          rating(p.id) >= minRating,
      ),
    [products, q, topic, author, maxPrice, minRating, reviews],
  ); // eslint-disable-line react-hooks/exhaustive-deps
  const sel = "h-9 rounded-md border bg-background px-3 text-sm";
  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">Маркетплейс</h1>
          <p className="mt-1 text-muted-foreground">Только проверенные модерацией мини-продукты.</p>
        </div>
        {me && (
          <Button asChild>
            <Link to="/products/new">+ Создать мини-продукт</Link>
          </Button>
        )}
      </div>
      <div className="mt-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
        <Input placeholder="Поиск" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className={sel} value={topic} onChange={(e) => setTopic(e.target.value)}>
          <option value="">Все темы</option>
          {TOPICS.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
        <select className={sel} value={author} onChange={(e) => setAuthor(e.target.value)}>
          <option value="">Все авторы</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </select>
        <Input
          inputMode="numeric"
          placeholder="Цена до, ₽"
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value.replace(/\D/g, ""))}
        />
        <select
          className={sel}
          value={minRating}
          onChange={(e) => setMinRating(Number(e.target.value))}
        >
          <option value={0}>Любой рейтинг</option>
          <option value={4}>от 4★</option>
          <option value={4.5}>от 4.5★</option>
        </select>
      </div>
      {list.length === 0 ? (
        <p className="mt-10 text-center text-muted-foreground">
          Ничего не найдено — измените фильтры.
        </p>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((p) => {
            const a = users.find((u) => u.id === p.authorId);
            const r = rating(p.id);
            return (
              <Link
                key={p.id}
                to="/products/$id"
                params={{ id: p.id }}
                className="overflow-hidden rounded-3xl border bg-card transition hover:-translate-y-1 hover:shadow-pop"
              >
                <div className={`h-28 bg-gradient-to-br ${COVER[p.cover] ?? COVER.violet} p-4`}>
                  <span className="rounded-full bg-background/80 px-2.5 py-1 text-xs font-semibold">
                    {p.topic}
                  </span>
                </div>
                <div className="p-5">
                  <h3 className="font-bold">{p.title}</h3>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{p.description}</p>
                  <div className="mt-4 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{a?.name}</span>
                    <span className="flex items-center gap-1">
                      <Star className="size-4 fill-warning text-warning" />
                      {r ? r.toFixed(1) : "—"}
                    </span>
                  </div>
                  <p className="mt-2 font-display text-lg font-bold text-primary">
                    {p.price ? rub(p.price) : "Бесплатно"}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
