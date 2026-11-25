import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { rub } from "@/components/app/guards";
import { setState, useStore } from "@/lib/store";

export const Route = createFileRoute("/admin/moderation")({ component: Moderation });

function Moderation() {
  const pending = useStore((s) => s.products.filter((p) => p.status === "pending"));
  const users = useStore((s) => s.users);
  const [comments, setComments] = useState<Record<string, string>>({});
  const decide = (id: string, ok: boolean) => {
    const c = comments[id]?.trim() ?? "";
    if (!ok && c.length < 5) return toast.error("Напишите причину отклонения (от 5 символов)");
    setState((s) => ({
      ...s,
      products: s.products.map((p) =>
        p.id === id
          ? { ...p, status: ok ? "approved" : "rejected", moderationComment: c || undefined }
          : p,
      ),
    }));
    toast.success(ok ? "Одобрено — продукт в маркетплейсе" : "Отклонено");
  };
  if (pending.length === 0)
    return <p className="text-muted-foreground">Нет продуктов на модерации.</p>;
  return (
    <div className="space-y-4">
      {pending.map((p) => (
        <div key={p.id} className="rounded-3xl border bg-card p-6">
          <div className="flex flex-wrap justify-between gap-2">
            <div>
              <h3 className="font-bold">{p.title}</h3>
              <p className="text-sm text-muted-foreground">
                {users.find((u) => u.id === p.authorId)?.name} · {p.topic} · {rub(p.price)} ·{" "}
                {p.steps.length} шагов
              </p>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link to="/products/$id/learn" params={{ id: p.id }}>
                Тестовое прохождение
              </Link>
            </Button>
          </div>
          <p className="mt-3 text-sm">{p.description}</p>
          <Textarea
            className="mt-3"
            placeholder="Комментарий автору"
            value={comments[p.id] ?? ""}
            onChange={(e) => setComments({ ...comments, [p.id]: e.target.value })}
          />
          <div className="mt-3 flex gap-2">
            <Button onClick={() => decide(p.id, true)}>Одобрить</Button>
            <Button variant="destructive" onClick={() => decide(p.id, false)}>
              Отклонить
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
