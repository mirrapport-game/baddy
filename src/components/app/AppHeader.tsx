import { Link, useNavigate } from "@tanstack/react-router";
import { Menu, Sparkles, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { setState, useMe } from "@/lib/store";

const NAV = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/games", label: "Игры" },
  { to: "/marketplace", label: "Маркетплейс" },
  { to: "/collaborations", label: "Коллаборации" },
  { to: "/orders/new", label: "Заказы" },
  { to: "/profile", label: "Профиль" },
] as const;

export function AppHeader() {
  const me = useMe();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const items = me
    ? [...NAV, ...(me.role === "admin" ? [{ to: "/admin", label: "Админка" } as const] : [])]
    : [{ to: "/marketplace", label: "Маркетплейс" } as const];
  const logout = () => {
    setState((s) => ({ ...s, currentUserId: null }));
    setOpen(false);
    navigate({ to: "/" });
  };
  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4">
        <Link
          to="/"
          className="flex items-center gap-2 font-display text-lg font-bold"
          onClick={() => setOpen(false)}
        >
          <span className="grid size-8 place-items-center rounded-xl bg-hero text-primary-foreground">
            <Sparkles className="size-4" />
          </span>
          Внедряй
        </Link>
        <nav className="ml-4 hidden flex-1 items-center gap-1 lg:flex">
          {items.map((i) => (
            <Link
              key={i.to}
              to={i.to}
              className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
              activeProps={{ className: "bg-muted text-foreground" }}
            >
              {i.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto hidden items-center gap-2 lg:flex">
          {me ? (
            <>
              <span className="grid size-8 place-items-center rounded-full bg-secondary text-xs font-bold text-secondary-foreground">
                {me.avatar}
              </span>
              <Button variant="ghost" size="sm" onClick={logout}>
                Выйти
              </Button>
            </>
          ) : (
            <Button size="sm" onClick={() => navigate({ to: "/auth" })}>
              Войти
            </Button>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="ml-auto lg:hidden"
          aria-label="Меню"
          onClick={() => setOpen((o) => !o)}
        >
          {open ? <X /> : <Menu />}
        </Button>
      </div>
      {open && (
        <nav className="border-t bg-background px-4 py-3 lg:hidden">
          {items.map((i) => (
            <Link
              key={i.to}
              to={i.to}
              onClick={() => setOpen(false)}
              className="block rounded-lg px-3 py-3 font-medium hover:bg-muted"
            >
              {i.label}
            </Link>
          ))}
          {me ? (
            <Button variant="outline" className="mt-2 w-full" onClick={logout}>
              Выйти
            </Button>
          ) : (
            <Button
              className="mt-2 w-full"
              onClick={() => {
                setOpen(false);
                navigate({ to: "/auth" });
              }}
            >
              Войти
            </Button>
          )}
        </nav>
      )}
    </header>
  );
}
