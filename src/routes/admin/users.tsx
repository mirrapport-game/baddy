import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EMAIL_RE } from "@/components/app/guards";
import { getState, setState, uid, useStore, type Role } from "@/lib/store";

export const Route = createFileRoute("/admin/users")({ component: Users });

function Users() {
  const users = useStore((s) => s.users);
  const products = useStore((s) => s.products);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [co, setCo] = useState<Record<string, string>>({});
  const add = () => {
    const em = email.trim().toLowerCase();
    if (name.trim().length < 2) return toast.error("Введите имя");
    if (!EMAIL_RE.test(em)) return toast.error("Некорректный email");
    if (getState().users.some((u) => u.email === em)) return toast.error("Email уже есть");
    setState((s) => ({
      ...s,
      users: [
        ...s.users,
        {
          id: uid("u"),
          name: name.trim(),
          email: em,
          role: "member",
          avatar: name.trim().slice(0, 2).toUpperCase(),
          specialization: "Психолог",
          city: "",
          approach: "",
          bio: "",
          rating: 0,
        },
      ],
    }));
    setName("");
    setEmail("");
    toast.success("Участник добавлен");
  };
  const assign = (userId: string) => {
    const pid = co[userId];
    if (!pid) return toast.error("Выберите продукт");
    setState((s) => ({
      ...s,
      products: s.products.map((p) =>
        p.id === pid && p.authorId !== userId && !p.coauthors.includes(userId)
          ? { ...p, coauthors: [...p.coauthors, userId] }
          : p,
      ),
    }));
    toast.success("Назначен соавтором");
  };
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 rounded-3xl border bg-card p-5 sm:flex-row">
        <Input placeholder="Имя" value={name} onChange={(e) => setName(e.target.value)} />
        <Input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Button onClick={add}>Добавить участника</Button>
      </div>
      {users.map((u) => (
        <div
          key={u.id}
          className="grid gap-3 rounded-3xl border bg-card p-5 md:grid-cols-[1fr_140px_1fr] md:items-center"
        >
          <div>
            <p className="font-bold">{u.name}</p>
            <p className="text-sm text-muted-foreground">
              {u.email} · {u.specialization}
            </p>
          </div>
          <select
            className="h-9 rounded-md border bg-background px-3 text-sm"
            value={u.role}
            onChange={(e) => {
              setState((s) => ({
                ...s,
                users: s.users.map((x) =>
                  x.id === u.id ? { ...x, role: e.target.value as Role } : x,
                ),
              }));
              toast.success("Роль обновлена");
            }}
          >
            <option value="member">Участник</option>
            <option value="admin">Админ</option>
          </select>
          <div className="flex gap-2">
            <select
              className="h-9 min-w-0 flex-1 rounded-md border bg-background px-3 text-sm"
              value={co[u.id] ?? ""}
              onChange={(e) => setCo({ ...co, [u.id]: e.target.value })}
            >
              <option value="">Сделать соавтором…</option>
              {products
                .filter((p) => p.authorId !== u.id && !p.coauthors.includes(u.id))
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
            </select>
            <Button size="sm" variant="outline" onClick={() => assign(u.id)}>
              OK
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
