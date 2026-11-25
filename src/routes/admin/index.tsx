import { createFileRoute } from "@tanstack/react-router";
import { rub } from "@/components/app/guards";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/admin/")({ component: Analytics });

function Analytics() {
  const s = useStore((x) => x);
  const plays = Object.values(s.games)
    .flatMap((g) => Object.values(g))
    .reduce((a, g) => a + g.plays, 0);
  const completed = Object.values(s.games)
    .flatMap((g) => Object.values(g))
    .filter((g) => g.completed).length;
  const revenue = s.purchases.reduce((a, p) => a + p.amount, 0);
  const players = Object.keys(s.games).length;
  const buyers = new Set(s.purchases.map((p) => p.userId)).size;
  const conv = s.users.length ? Math.round((buyers / s.users.length) * 100) : 0;
  const cards = [
    ["Пользователи", s.users.length],
    ["Сыграно игр", plays],
    ["Пройдено игр", completed],
    ["Игроков", players],
    ["Покупки", s.purchases.length],
    ["Выручка", rub(revenue)],
    ["Заказы", s.orders.length],
    ["Конверсия в покупку", `${conv}%`],
    ["На модерации", s.products.filter((p) => p.status === "pending").length],
  ];
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {cards.map(([l, v]) => (
        <div key={l as string} className="rounded-3xl border bg-card p-5">
          <p className="text-sm text-muted-foreground">{l}</p>
          <p className="mt-1 font-display text-2xl font-bold">{v}</p>
        </div>
      ))}
    </div>
  );
}
