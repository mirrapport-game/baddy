import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { RequireAdmin } from "@/components/app/guards";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Админка — Внедряй" },
      { name: "description", content: "Модерация, заказы, пользователи и аналитика." },
      { property: "og:title", content: "Админка — Внедряй" },
      { property: "og:description", content: "Админ-панель платформы." },
    ],
  }),
  component: () => (
    <RequireAdmin>
      {() => (
        <div>
          <nav className="mb-6 flex flex-wrap gap-2">
            {(
              [
                ["/admin", "Аналитика"],
                ["/admin/moderation", "Модерация"],
                ["/admin/orders", "Заказы"],
                ["/admin/users", "Пользователи"],
              ] as const
            ).map(([to, l]) => (
              <Link
                key={to}
                to={to}
                activeOptions={{ exact: true }}
                className="rounded-full border px-4 py-2 text-sm font-semibold"
                activeProps={{ className: "bg-primary text-primary-foreground border-primary" }}
              >
                {l}
              </Link>
            ))}
          </nav>
          <Outlet />
        </div>
      )}
    </RequireAdmin>
  ),
});
