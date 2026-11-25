import { createFileRoute } from "@tanstack/react-router";
import { RequireAuth } from "@/components/app/guards";
import { ProductForm } from "@/components/app/ProductForm";

export const Route = createFileRoute("/products/new")({
  head: () => ({
    meta: [
      { title: "Новый мини-продукт — Внедряй" },
      { name: "description", content: "Создайте мини-продукт: шаги, квиз, соавторы." },
      { property: "og:title", content: "Новый мини-продукт — Внедряй" },
      { property: "og:description", content: "Создание мини-продукта." },
    ],
  }),
  component: () => (
    <RequireAuth>
      {(me) => (
        <div className="mx-auto max-w-3xl">
          <h1 className="mb-2 text-2xl font-bold">Новый мини-продукт</h1>
          <p className="mb-6 text-muted-foreground">
            Перед модерацией вы пройдёте продукт сами на 100% и сдадите квиз на ≥80%.
          </p>
          <ProductForm authorId={me.id} />
        </div>
      )}
    </RequireAuth>
  ),
});
