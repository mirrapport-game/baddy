import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EMAIL_RE } from "@/components/app/guards";
import { getState, setState, uid } from "@/lib/store";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Вход — Внедряй" },
      { name: "description", content: "Войдите или зарегистрируйтесь на платформе Внедряй." },
      { property: "og:title", content: "Вход — Внедряй" },
      { property: "og:description", content: "Вход и регистрация." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [name, setName] = useState("");
  const [err, setErr] = useState("");

  const login = (e?: string) => {
    const em = (e ?? email).trim().toLowerCase();
    if (!e) {
      if (!EMAIL_RE.test(em)) return setErr("Введите корректный email");
      if (pass.length < 6) return setErr("Пароль — минимум 6 символов");
    }
    const u = getState().users.find((x) => x.email === em);
    if (!u) return setErr("Пользователь не найден — зарегистрируйтесь");
    setState((s) => ({ ...s, currentUserId: u.id }));
    toast.success(`Привет, ${u.name.split(" ")[0]}!`);
    navigate({ to: "/dashboard" });
  };
  const register = () => {
    const em = email.trim().toLowerCase();
    if (name.trim().length < 2) return setErr("Введите имя");
    if (!EMAIL_RE.test(em)) return setErr("Введите корректный email");
    if (pass.length < 6) return setErr("Пароль — минимум 6 символов");
    if (getState().users.some((x) => x.email === em))
      return setErr("Такой email уже зарегистрирован");
    const id = uid("u");
    const initials = name
      .trim()
      .split(/\s+/)
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
    setState((s) => ({
      ...s,
      currentUserId: id,
      users: [
        ...s.users,
        {
          id,
          name: name.trim(),
          email: em,
          role: "member",
          avatar: initials,
          specialization: "Психолог",
          city: "",
          approach: "",
          bio: "",
          rating: 0,
        },
      ],
    }));
    toast.success("Аккаунт создан");
    navigate({ to: "/dashboard" });
  };

  return (
    <div className="mx-auto max-w-md">
      <div className="rounded-3xl border bg-card p-6 sm:p-8">
        <h1 className="text-2xl font-bold">Добро пожаловать</h1>
        <Tabs defaultValue="login" className="mt-6" onValueChange={() => setErr("")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Вход</TabsTrigger>
            <TabsTrigger value="signup">Регистрация</TabsTrigger>
          </TabsList>
          <TabsContent value="login" className="space-y-4 pt-4">
            <Field label="Email">
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </Field>
            <Field label="Пароль">
              <Input type="password" value={pass} onChange={(e) => setPass(e.target.value)} />
            </Field>
            {err && <p className="text-sm text-destructive">{err}</p>}
            <Button className="w-full" onClick={() => login()}>
              Войти
            </Button>
          </TabsContent>
          <TabsContent value="signup" className="space-y-4 pt-4">
            <Field label="Имя">
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </Field>
            <Field label="Email">
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </Field>
            <Field label="Пароль">
              <Input type="password" value={pass} onChange={(e) => setPass(e.target.value)} />
            </Field>
            {err && <p className="text-sm text-destructive">{err}</p>}
            <Button className="w-full" onClick={register}>
              Создать аккаунт
            </Button>
          </TabsContent>
        </Tabs>
      </div>
      <div className="mt-6 rounded-3xl border border-dashed p-5 text-sm">
        <p className="font-semibold">Демо-вход в один клик</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => login("anna@vnedryai.ru")}>
            Анна (участник)
          </Button>
          <Button variant="outline" size="sm" onClick={() => login("igor@vnedryai.ru")}>
            Игорь (автор)
          </Button>
          <Button variant="outline" size="sm" onClick={() => login("admin@vnedryai.ru")}>
            Мария (админ)
          </Button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
