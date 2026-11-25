import { createFileRoute, Link } from "@tanstack/react-router";
import { Progress } from "@/components/ui/progress";
import { GAMES } from "@/lib/games";
import { useMe, useStore } from "@/lib/store";

export const Route = createFileRoute("/games/")({
  head: () => ({
    meta: [
      { title: "10 игр продаж — Внедряй" },
      {
        name: "description",
        content: "Хаб игр-тренажёров продаж: возражения, боль клиента, воронка и другие.",
      },
      { property: "og:title", content: "10 игр продаж — Внедряй" },
      { property: "og:description", content: "Игры-тренажёры продаж." },
    ],
  }),
  component: GamesHub,
});

function GamesHub() {
  const me = useMe();
  const prog = useStore((s) => (me ? s.games[me.id] : undefined) ?? {});
  return (
    <div>
      <h1 className="text-2xl font-bold sm:text-3xl">Игры</h1>
      <p className="mt-2 text-muted-foreground">Каждая игра сохраняет прогресс и выдаёт бейдж.</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {GAMES.map((g) => {
          const p = prog[g.slug];
          return (
            <Link
              key={g.slug}
              to="/games/$slug"
              params={{ slug: g.slug }}
              className="group rounded-3xl border bg-card p-6 transition hover:-translate-y-1 hover:shadow-pop"
            >
              <div className="flex items-start justify-between">
                <span className="text-4xl">{g.emoji}</span>
                <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold text-secondary-foreground">
                  {g.level}
                </span>
              </div>
              <h3 className="mt-4 font-bold group-hover:text-primary">{g.title}</h3>
              <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{g.description}</p>
              <div className="mt-4 flex items-center gap-3 text-xs text-muted-foreground">
                <Progress value={p?.completed ? 100 : p ? 40 : 0} className="h-2" />
                {p?.completed ? "✅" : p ? `${p.best} очк.` : "Новая"}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
