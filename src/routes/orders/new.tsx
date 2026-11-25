import { createFileRoute } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { EMAIL_RE, PHONE_RE } from "@/components/app/guards";
import { setState, uid, useMe, useStore } from "@/lib/store";

const PACKAGES = [
  {
    id: "5 000 ₽ — мини-продукт",
    price: "5 000 ₽",
    title: "Мини-продукт",
    items: ["Мини-продукт под ключ", "Размещение в общей базе"],
  },
  {
    id: "9 900 ₽ + 1 000 ₽/мес — сайт + подписка",
    price: "9 900 ₽ + 1 000 ₽/мес",
    title: "Продукт + сайт",
    items: ["Мини-продукт", "Свой сайт", "Подписка на поддержку"],
  },
  {
    id: "35 000 ₽ — white-label",
    price: "35 000 ₽",
    title: "White-label",
    items: ["Под вашим брендом", "Без ограничений"],
  },
];

export const Route = createFileRoute("/orders/new")({
  head: () => ({
    meta: [
      { title: "Заказать мини-продукт — Внедряй" },
      {
        name: "description",
        content: "Пакеты: мини-продукт, сайт с подпиской или white-label под вашим брендом.",
      },
      { property: "og:title", content: "Заказать мини-продукт — Внедряй" },
      { property: "og:description", content: "Платформа соберёт мини-продукт за вас." },
    ],
  }),
  component: OrderNew,
});

function OrderNew() {
  const me = useMe();
  const myOrders = useStore((s) => s.orders.filter((o) => me && o.userId === me.id));
  const [f, setF] = useState({
    name: me?.name ?? "",
    email: me?.email ?? "",
    phone: "",
    pkg: PACKAGES[0].id,
    task: "",
    deadline: "",
  });
  const [err, setErr] = useState<Record<string, string>>({});
  const set =
    (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setF({ ...f, [k]: e.target.value });
  const submit = () => {
    const e: Record<string, string> = {};
    if (f.name.trim().length < 2) e.name = "Введите имя";
    if (!EMAIL_RE.test(f.email.trim())) e.email = "Некорректный email";
    if (!PHONE_RE.test(f.phone.trim())) e.phone = "Телефон в формате +7 999 000-00-00";
    if (f.task.trim().length < 10) e.task = "Опишите задачу (от 10 символов)";
    if (!f.deadline) e.deadline = "Укажите дедлайн";
    else if (f.deadline < new Date().toISOString().slice(0, 10))
      e.deadline = "Дедлайн не может быть в прошлом";
    setErr(e);
    if (Object.keys(e).length) return;
    setState((s) => ({
      ...s,
      orders: [
        {
          id: uid("o"),
          userId: me?.id ?? null,
          ...f,
          name: f.name.trim(),
          email: f.email.trim(),
          status: "Новый",
          notes: "",
          createdAt: Date.now(),
        },
        ...s.orders,
      ],
    }));
    toast.success("Заказ создан! Статус: «Новый»");
    setF({ ...f, task: "", deadline: "", phone: "" });
  };
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">Заказать мини-продукт у платформы</h1>
        <p className="mt-1 text-muted-foreground">Мы соберём продукт за вас.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {PACKAGES.map((p) => (
          <button
            key={p.id}
            onClick={() => setF({ ...f, pkg: p.id })}
            className={`rounded-3xl border-2 bg-card p-6 text-left transition ${f.pkg === p.id ? "border-primary shadow-pop" : "border-transparent"}`}
          >
            <p className="font-bold">{p.title}</p>
            <p className="mt-2 font-display text-xl font-bold text-primary">{p.price}</p>
            <ul className="mt-3 space-y-1 text-sm">
              {p.items.map((i) => (
                <li key={i} className="flex gap-2">
                  <Check className="size-4 text-success" />
                  {i}
                </li>
              ))}
            </ul>
          </button>
        ))}
      </div>
      <div className="grid gap-4 rounded-3xl border bg-card p-6 sm:grid-cols-2">
        <F l="Имя" e={err.name}>
          <Input value={f.name} onChange={set("name")} />
        </F>
        <F l="Email" e={err.email}>
          <Input type="email" value={f.email} onChange={set("email")} />
        </F>
        <F l="Телефон" e={err.phone}>
          <Input
            type="tel"
            placeholder="+7 999 000-00-00"
            value={f.phone}
            onChange={set("phone")}
          />
        </F>
        <F l="Дедлайн" e={err.deadline}>
          <Input type="date" value={f.deadline} onChange={set("deadline")} />
        </F>
        <div className="sm:col-span-2">
          <F l="Описание задачи" e={err.task}>
            <Textarea value={f.task} onChange={set("task")} />
          </F>
        </div>
        <div className="sm:col-span-2">
          <p className="mb-3 text-sm text-muted-foreground">
            Пакет: <b>{f.pkg}</b>
          </p>
          <Button size="lg" className="w-full" onClick={submit}>
            Отправить заказ
          </Button>
        </div>
      </div>
      {me && myOrders.length > 0 && (
        <div className="rounded-3xl border bg-card p-6">
          <h2 className="font-bold">Мои заказы</h2>
          <ul className="mt-3 space-y-2">
            {myOrders.map((o) => (
              <li
                key={o.id}
                className="flex flex-wrap justify-between gap-2 rounded-xl bg-muted p-3 text-sm"
              >
                <span>{o.pkg}</span>
                <span className="font-semibold">{o.status}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
const F = ({ l, e, children }: { l: string; e?: string; children: React.ReactNode }) => (
  <div className="space-y-1.5">
    <Label>{l}</Label>
    {children}
    {e && <p className="text-sm text-destructive">{e}</p>}
  </div>
);
