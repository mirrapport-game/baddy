import { createFileRoute, Link } from "@tanstack/react-router";
import { Gamepad2, ShoppingBag, Users, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GAMES } from "@/lib/games";
import { useMe } from "@/lib/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Внедряй — учись продавать играючи" },
      {
        name: "description",
        content:
          "10 игр-тренажёров продаж для психологов, экспертов и игропрактиков. Первая сделка без страха.",
      },
      { property: "og:title", content: "Внедряй — учись продавать играючи" },
      {
        property: "og:description",
        content: "Первая сделка без страха: игры, мини-продукты, коллаборации.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  const me = useMe();
  const feats = [
    {
      icon: Gamepad2,
      t: "10 игр-тренажёров",
      d: "Возражения, боль клиента, follow-up — в игровом формате.",
    },
    {
      icon: ShoppingBag,
      t: "Маркетплейс",
      d: "Продавайте мини-продукты от 300 ₽ и собирайте репутацию.",
    },
    { icon: Users, t: "Коллаборации", d: "Находите партнёров и создавайте совместные продукты." },
    {
      icon: Wand2,
      t: "Заказ под ключ",
      d: "Платформа соберёт мини-продукт, сайт или white-label.",
    },
  ];
  return (
    <div className="space-y-16">
      <section className="overflow-hidden rounded-[2rem] bg-hero p-8 text-primary-foreground shadow-pop sm:p-14">
        <p className="mb-4 inline-block rounded-full bg-background/20 px-3 py-1 text-sm font-semibold">
          Для психологов, экспертов и игропрактиков
        </p>
        <h1 className="max-w-3xl text-3xl font-bold leading-tight sm:text-5xl">
          Учись продавать играючи. Первая сделка без страха.
        </h1>
        <p className="mt-5 max-w-xl text-lg opacity-90">
          Тренируйтесь на ботах-клиентах, получайте бейджи и выпускайте свои мини-продукты.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild size="lg" variant="secondary">
            <Link to={me ? "/dashboard" : "/auth"}>
              {me ? "В мой кабинет" : "Начать бесплатно"}
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-background/15 hover:text-primary-foreground"
          >
            <Link to="/marketplace">Смотреть каталог</Link>
          </Button>
        </div>
      </section>
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {feats.map((f) => (
          <div key={f.t} className="rounded-3xl border bg-card p-6">
            <f.icon className="size-8 text-primary" />
            <h3 className="mt-4 font-bold">{f.t}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{f.d}</p>
          </div>
        ))}
      </section>
      <section>
        <h2 className="text-2xl font-bold">Игры внутри</h2>
        <div className="mt-6 flex flex-wrap gap-2">
          {GAMES.map((g) => (
            <span
              key={g.slug}
              className="rounded-full bg-secondary px-4 py-2 text-sm font-semibold text-secondary-foreground"
            >
              {g.emoji} {g.title}
            </span>
          ))}
        </div>
      </section>
    </div>
  );
}
