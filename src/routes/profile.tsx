import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RequireAuth, STATUS_LABEL } from "@/components/app/guards";
import { resetDemo, setState, useStore, type User } from "@/lib/store";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Профиль — Внедряй" },
      { name: "description", content: "Профиль, мои продукты, заказы и настройки." },
      { property: "og:title", content: "Профиль — Внедряй" },
      { property: "og:description", content: "Профиль участника." },
    ],
  }),
  component: () => <RequireAuth>{(me) => <Profile me={me} />}</RequireAuth>,
});

function Profile({ me }: { me: User }) {
  const [f, setF] = useState({
    name: me.name,
    specialization: me.specialization,
    city: me.city,
    approach: me.approach,
    bio: me.bio,
  });
  const mine = useStore((s) =>
    s.products.filter((p) => p.authorId === me.id || p.coauthors.includes(me.id)),
  );
  const orders = useStore((s) => s.orders.filter((o) => o.userId === me.id));
  const purchases = useStore((s) => s.purchases.filter((p) => p.userId === me.id));
  const products = useStore((s) => s.products);
  const save = () => {
    if (f.name.trim().length < 2) return toast.error("Введите имя");
    setState((s) => ({
      ...s,
      users: s.users.map((u) => (u.id === me.id ? { ...u, ...f, name: f.name.trim() } : u)),
    }));
    toast.success("Профиль сохранён");
  };
  const switchRole = () => {
    setState((s) => ({
      ...s,
      users: s.users.map((u) =>
        u.id === me.id ? { ...u, role: u.role === "admin" ? "member" : "admin" } : u,
      ),
    }));
    toast.success("Роль переключена");
  };
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-4 rounded-3xl border bg-card p-6">
        <h1 className="text-2xl font-bold">Профиль</h1>
        <p className="text-sm text-muted-foreground">
          {me.email} · роль: <b>{me.role === "admin" ? "Админ" : "Участник"}</b>
        </p>
        {(["name", "specialization", "city", "approach"] as const).map((k) => (
          <div key={k} className="space-y-1.5">
            <Label>
              {
                { name: "Имя", specialization: "Специализация", city: "Город", approach: "Подход" }[
                  k
                ]
              }
            </Label>
            <Input value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} />
          </div>
        ))}
        <div className="space-y-1.5">
          <Label>О себе</Label>
          <Textarea value={f.bio} onChange={(e) => setF({ ...f, bio: e.target.value })} />
        </div>
        <Button onClick={save}>Сохранить</Button>
        <div className="rounded-2xl border border-dashed p-4 text-sm">
          <p className="font-semibold">Демо-режим</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={switchRole}>
              Стать {me.role === "admin" ? "участником" : "админом"}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                resetDemo();
                toast.success("Данные сброшены к демо");
              }}
            >
              Сбросить демо-данные
            </Button>
          </div>
        </div>
      </div>
      <div className="space-y-4">
        <Block
          title="Мои мини-продукты"
          action={
            <Button asChild size="sm">
              <Link to="/products/new">+ Создать</Link>
            </Button>
          }
        >
          {mine.length === 0 ? (
            <Empty />
          ) : (
            mine.map((p) => (
              <Row
                key={p.id}
                left={
                  <Link
                    className="font-medium hover:text-primary"
                    to="/products/$id"
                    params={{ id: p.id }}
                  >
                    {p.title}
                  </Link>
                }
                right={STATUS_LABEL[p.status]}
              />
            ))
          )}
        </Block>
        <Block title="Купленные продукты">
          {purchases.length === 0 ? (
            <Empty />
          ) : (
            purchases.map((b) => {
              const p = products.find((x) => x.id === b.productId);
              return (
                p && (
                  <Row
                    key={b.id}
                    left={
                      <Link
                        className="font-medium hover:text-primary"
                        to="/products/$id/learn"
                        params={{ id: p.id }}
                      >
                        {p.title}
                      </Link>
                    }
                    right="Проходить →"
                  />
                )
              );
            })
          )}
        </Block>
        <Block
          title="Мои заказы"
          action={
            <Button asChild size="sm" variant="outline">
              <Link to="/orders/new">Новый заказ</Link>
            </Button>
          }
        >
          {orders.length === 0 ? (
            <Empty />
          ) : (
            orders.map((o) => <Row key={o.id} left={o.pkg} right={o.status} />)
          )}
        </Block>
      </div>
    </div>
  );
}
const Block = ({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) => (
  <div className="rounded-3xl border bg-card p-6">
    <div className="mb-3 flex items-center justify-between">
      <h2 className="font-bold">{title}</h2>
      {action}
    </div>
    <div className="space-y-2">{children}</div>
  </div>
);
const Row = ({ left, right }: { left: React.ReactNode; right: string }) => (
  <div className="flex items-center justify-between gap-2 rounded-xl bg-muted p-3 text-sm">
    {left}
    <span className="shrink-0 font-semibold">{right}</span>
  </div>
);
const Empty = () => <p className="text-sm text-muted-foreground">Пока пусто.</p>;
