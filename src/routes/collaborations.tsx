import { createFileRoute, useNavigate } from "@tanstack/react-router";
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
import { Textarea } from "@/components/ui/textarea";
import { RequireAuth } from "@/components/app/guards";
import { setState, uid, useStore, type User } from "@/lib/store";

export const Route = createFileRoute("/collaborations")({
  head: () => ({
    meta: [
      { title: "Коллаборации — Внедряй" },
      { name: "description", content: "Найдите партнёра и создайте совместный мини-продукт." },
      { property: "og:title", content: "Коллаборации — Внедряй" },
      { property: "og:description", content: "Матчинг партнёров для экспертов." },
    ],
  }),
  component: () => <RequireAuth>{(me) => <Collabs me={me} />}</RequireAuth>,
});

function compat(a: User, b: User) {
  let s = 55;
  if (a.specialization !== b.specialization) s += 15;
  if (a.city && a.city === b.city) s += 15;
  if (a.approach && a.approach === b.approach) s += 5;
  return Math.min(
    98,
    s + ((a.id.charCodeAt(a.id.length - 1) + b.id.charCodeAt(b.id.length - 1)) % 10),
  );
}

function Collabs({ me }: { me: User }) {
  const navigate = useNavigate();
  const users = useStore((s) => s.users.filter((u) => u.id !== me.id));
  const collabs = useStore((s) => s.collabs);
  const [spec, setSpec] = useState("");
  const [city, setCity] = useState("");
  const [appr, setAppr] = useState("");
  const [matched, setMatched] = useState<string[] | null>(null);
  const [to, setTo] = useState<User | null>(null);
  const [msg, setMsg] = useState("");
  const all = useStore((s) => s.users);
  const uniq = (k: keyof User) => [...new Set(all.map((u) => String(u[k])).filter(Boolean))];
  let list = users.filter(
    (u) =>
      (!spec || u.specialization === spec) &&
      (!city || u.city === city) &&
      (!appr || u.approach === appr),
  );
  if (matched) list = matched.map((id) => list.find((u) => u.id === id)).filter(Boolean) as User[];
  const incoming = collabs.filter((c) => c.to === me.id);
  const outgoing = collabs.filter((c) => c.from === me.id);
  const name = (id: string) => all.find((u) => u.id === id)?.name ?? "—";
  const send = () => {
    if (!to) return;
    if (msg.trim().length < 10) return toast.error("Сообщение — минимум 10 символов");
    setState((s) => ({
      ...s,
      collabs: [
        ...s.collabs,
        { id: uid("c"), from: me.id, to: to.id, status: "pending", message: msg.trim() },
      ],
    }));
    setTo(null);
    setMsg("");
    toast.success("Заявка отправлена");
  };
  const respond = (id: string, status: "accepted" | "rejected") => {
    setState((s) => ({
      ...s,
      collabs: s.collabs.map((c) => (c.id === id ? { ...c, status } : c)),
    }));
    toast.success(status === "accepted" ? "Заявка принята" : "Заявка отклонена");
  };
  const st = { pending: "Ожидает", accepted: "Принята", rejected: "Отклонена" };
  const sel = "h-9 rounded-md border bg-background px-3 text-sm";
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-2xl font-bold sm:text-3xl">Коллаборации</h1>
        <Button
          onClick={() => {
            setMatched([...users].sort((a, b) => compat(me, b) - compat(me, a)).map((u) => u.id));
            toast.success("Подобрали партнёров по совместимости");
          }}
        >
          ✨ Найти партнёра
        </Button>
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        <select className={sel} value={spec} onChange={(e) => setSpec(e.target.value)}>
          <option value="">Все специализации</option>
          {uniq("specialization").map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
        <select className={sel} value={city} onChange={(e) => setCity(e.target.value)}>
          <option value="">Все города</option>
          {uniq("city").map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
        <select className={sel} value={appr} onChange={(e) => setAppr(e.target.value)}>
          <option value="">Все подходы</option>
          {uniq("approach").map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {list.length === 0 && <p className="text-muted-foreground">Никого не нашли по фильтрам.</p>}
        {list.map((u) => {
          const c = collabs.find(
            (x) => (x.from === me.id && x.to === u.id) || (x.to === me.id && x.from === u.id),
          );
          return (
            <div key={u.id} className="rounded-3xl border bg-card p-6">
              <div className="flex items-center gap-3">
                <span className="grid size-12 place-items-center rounded-full bg-secondary font-bold text-secondary-foreground">
                  {u.avatar}
                </span>
                <div>
                  <p className="font-bold">{u.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {u.specialization} · {u.city || "—"}
                  </p>
                </div>
              </div>
              <p className="mt-3 text-sm">
                {u.approach && (
                  <span className="rounded-full bg-muted px-2 py-0.5">{u.approach}</span>
                )}
              </p>
              {matched && (
                <p className="mt-3 text-sm font-semibold text-primary">
                  Совместимость {compat(me, u)}%
                </p>
              )}
              {c ? (
                <p className="mt-4 text-sm text-muted-foreground">Заявка: {st[c.status]}</p>
              ) : (
                <Button className="mt-4 w-full" variant="outline" onClick={() => setTo(u)}>
                  Отправить заявку
                </Button>
              )}
              {c?.status === "accepted" && (
                <Button
                  size="sm"
                  className="mt-2 w-full"
                  onClick={() => {
                    toast("Добавьте партнёра соавтором в форме");
                    navigate({ to: "/products/new" });
                  }}
                >
                  Создать совместный продукт
                </Button>
              )}
            </div>
          );
        })}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-3xl border bg-card p-6">
          <h2 className="font-bold">Входящие заявки</h2>
          {incoming.length === 0 && (
            <p className="mt-2 text-sm text-muted-foreground">Нет заявок.</p>
          )}
          <ul className="mt-3 space-y-2">
            {incoming.map((c) => (
              <li key={c.id} className="rounded-xl bg-muted p-3 text-sm">
                <b>{name(c.from)}</b>: {c.message}
                {c.status === "pending" ? (
                  <div className="mt-2 flex gap-2">
                    <Button size="sm" onClick={() => respond(c.id, "accepted")}>
                      Принять
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => respond(c.id, "rejected")}>
                      Отклонить
                    </Button>
                  </div>
                ) : (
                  <p className="mt-1 font-semibold">{st[c.status]}</p>
                )}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-3xl border bg-card p-6">
          <h2 className="font-bold">Мои заявки</h2>
          {outgoing.length === 0 && (
            <p className="mt-2 text-sm text-muted-foreground">Вы ещё не отправляли заявок.</p>
          )}
          <ul className="mt-3 space-y-2">
            {outgoing.map((c) => (
              <li key={c.id} className="rounded-xl bg-muted p-3 text-sm">
                <b>→ {name(c.to)}</b>: {c.message}
                <p className="mt-1 font-semibold">{st[c.status]}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <Dialog open={!!to} onOpenChange={(o) => !o && setTo(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Заявка для {to?.name}</DialogTitle>
          </DialogHeader>
          <Textarea
            placeholder="Что предлагаете сделать вместе?"
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setTo(null)}>
              Отмена
            </Button>
            <Button onClick={send}>Отправить</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
