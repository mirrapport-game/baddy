import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { setState, useStore, type OrderStatus } from "@/lib/store";

export const Route = createFileRoute("/admin/orders")({ component: Orders });
const STATUSES: OrderStatus[] = ["Новый", "В работе", "Готов", "Отклонён"];

function Orders() {
  const orders = useStore((s) => s.orders);
  const upd = (id: string, patch: Partial<{ status: OrderStatus; notes: string }>) =>
    setState((s) => ({
      ...s,
      orders: s.orders.map((o) => (o.id === id ? { ...o, ...patch } : o)),
    }));
  return (
    <div className="space-y-3">
      {orders.map((o) => (
        <div
          key={o.id}
          className="grid gap-3 rounded-3xl border bg-card p-5 md:grid-cols-[1fr_160px_1fr] md:items-center"
        >
          <div>
            <p className="font-bold">
              {o.name}{" "}
              <span className="font-normal text-muted-foreground">
                · {o.email} · {o.phone}
              </span>
            </p>
            <p className="text-sm">{o.pkg}</p>
            <p className="text-sm text-muted-foreground">
              {o.task} · до {o.deadline}
            </p>
          </div>
          <select
            className="h-9 rounded-md border bg-background px-3 text-sm"
            value={o.status}
            onChange={(e) => {
              upd(o.id, { status: e.target.value as OrderStatus });
              toast.success(`Статус: ${e.target.value}`);
            }}
          >
            {STATUSES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <Input
            placeholder="Заметка"
            value={o.notes}
            onChange={(e) => upd(o.id, { notes: e.target.value })}
          />
        </div>
      ))}
    </div>
  );
}
