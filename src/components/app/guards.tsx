import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { useMe, type User } from "@/lib/store";

export function RequireAuth({ children }: { children: (me: User) => ReactNode }) {
  const me = useMe();
  if (!me)
    return (
      <div className="mx-auto max-w-md rounded-3xl border bg-card p-8 text-center">
        <h2 className="text-xl font-bold">Нужно войти</h2>
        <p className="mt-2 text-muted-foreground">Эта страница доступна участникам платформы.</p>
        <Button asChild className="mt-6">
          <Link to="/auth">Войти или зарегистрироваться</Link>
        </Button>
      </div>
    );
  return <>{children(me)}</>;
}

export function RequireAdmin({ children }: { children: (me: User) => ReactNode }) {
  return (
    <RequireAuth>
      {(me) =>
        me.role === "admin" ? (
          children(me)
        ) : (
          <div className="mx-auto max-w-md rounded-3xl border bg-card p-8 text-center">
            <h2 className="text-xl font-bold">Только для админа</h2>
            <p className="mt-2 text-muted-foreground">
              Переключить роль можно в профиле (демо-режим).
            </p>
            <Button asChild className="mt-6">
              <Link to="/profile">В профиль</Link>
            </Button>
          </div>
        )
      }
    </RequireAuth>
  );
}

export const COVER: Record<string, string> = {
  violet: "from-primary/80 to-primary/40",
  teal: "from-accent to-secondary",
  amber: "from-warning to-warning/50",
  rose: "from-destructive/70 to-primary/40",
  sky: "from-accent/70 to-primary/60",
  lime: "from-success/80 to-accent/50",
};

export const STATUS_LABEL: Record<string, string> = {
  draft: "Черновик",
  self_passed: "Пройден автором",
  pending: "На модерации",
  approved: "Опубликован",
  rejected: "Отклонён",
};
export const rub = (n: number) => n.toLocaleString("ru-RU") + " ₽";
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PHONE_RE = /^\+?\d[\d\s()-]{9,16}$/;
