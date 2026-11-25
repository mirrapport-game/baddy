import { createFileRoute, Link } from "@tanstack/react-router";
import { Award, Flame, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RequireAuth } from "@/components/app/guards";
import { BRIDGE_TIPS, GAMES } from "@/lib/games";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Мой прогресс — Внедряй" },
      { name: "description", content: "Прогресс, серия, бейджи и миссия дня." },
      { property: "og:title", content: "Мой прогресс — Внедряй" },
      { property: "og:description", content: "Личный кабинет участника." },
    ],
  }),
  component: () => <RequireAuth>{(me) => <Dash userId={me.id} name={me.name} />}</RequireAuth>,
});

function Dash({ userId, name }: { userId: string; name: string }) {
  const games = useStore((s) => s.games[userId] ?? {});
  const purchases = useStore((s) => s.purchases.filter((p) => p.userId === userId));
  const products = useStore((s) => s.products);
  const done = GAMES.filter((g) => games[g.slug]?.completed).length;
  const badges = Object.values(games).flatMap((g) => g.badges);
  const points = Object.values(games).reduce((a, g) => a + g.best, 0);
  const streak = games["bridge"]?.streak ?? 0;
  const next = GAMES.find((g) => !games[g.slug]?.completed) ?? GAMES[1];
  const tip = BRIDGE_TIPS[new Date().getDate() % BRIDGE_TIPS.length];
  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold sm:text-3xl">Привет, {name.split(" ")[0]}! 👋</h1>
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat
          icon={<Target className="text-primary" />}
          label="Игр пройдено"
          value={`${done} / ${GAMES.length}`}
        >
          <Progress value={(done / GAMES.length) * 100} className="mt-3" />
        </Stat>
        <Stat
          icon={<Flame className="text-destructive" />}
          label="Серия «Мост»"
          value={`${streak} дн.`}
        />
        <Stat
          icon={<Award className="text-warning" />}
          label="Очки / бейджи"
          value={`${points} / ${badges.length}`}
        />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-3xl bg-hero p-6 text-primary-foreground">
          <p className="text-sm font-semibold opacity-80">Ближайшая миссия</p>
          <h2 className="mt-2 text-xl font-bold">
            {next.emoji} {next.title}
          </h2>
          <p className="mt-2 opacity-90">{next.description}</p>
          <Button asChild variant="secondary" className="mt-4">
            <Link to="/games/$slug" params={{ slug: next.slug }}>
              Играть
            </Link>
          </Button>
        </div>
        <div className="rounded-3xl border bg-card p-6">
          <p className="text-sm font-semibold text-muted-foreground">Фишка дня</p>
          <p className="mt-2 text-lg font-semibold">{tip.tip}</p>
          <p className="mt-2 text-muted-foreground">Микродействие: {tip.action}</p>
          <Button asChild variant="outline" className="mt-4">
            <Link to="/games/$slug" params={{ slug: "bridge" }}>
              Выполнить в «Мосте»
            </Link>
          </Button>
        </div>
      </div>
      <div className="rounded-3xl border bg-card p-6">
        <h2 className="font-bold">Бейджи</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {badges.length ? (
            badges.map((b) => (
              <span key={b} className="rounded-full bg-warning/30 px-3 py-1 text-sm font-semibold">
                🏅 {b}
              </span>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">
              Пройдите первую игру, чтобы получить бейдж.
            </p>
          )}
        </div>
      </div>
      <div className="rounded-3xl border bg-card p-6">
        <h2 className="font-bold">Мои продукты</h2>
        {purchases.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">Пока нет покупок.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {purchases.map((p) => {
              const pr = products.find((x) => x.id === p.productId);
              return (
                pr && (
                  <li
                    key={p.id}
                    className="flex items-center justify-between gap-3 rounded-xl bg-muted p-3"
                  >
                    <span className="font-medium">{pr.title}</span>
                    <Button asChild size="sm">
                      <Link to="/products/$id/learn" params={{ id: pr.id }}>
                        Проходить
                      </Link>
                    </Button>
                  </li>
                )
              );
            })}
          </ul>
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <Link to="/marketplace">Маркетплейс</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link to="/products/new">Создать мини-продукт</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link to="/collaborations">Найти партнёра</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border bg-card p-5">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {icon}
        {label}
      </div>
      <p className="mt-2 font-display text-2xl font-bold">{value}</p>
      {children}
    </div>
  );
}
