import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { RequireAuth } from "@/components/app/guards";
import { ProductForm } from "@/components/app/ProductForm";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/products/$id_/edit")({
  head: () => ({
    meta: [
      { title: "Редактирование — Внедряй" },
      { name: "description", content: "Редактирование мини-продукта." },
      { property: "og:title", content: "Редактирование — Внедряй" },
      { property: "og:description", content: "Редактирование мини-продукта." },
    ],
  }),
  component: Edit,
});

function Edit() {
  const { id } = Route.useParams();
  const p = useStore((s) => s.products.find((x) => x.id === id));
  return (
    <RequireAuth>
      {(me) =>
        !p || (p.authorId !== me.id && !p.coauthors.includes(me.id) && me.role !== "admin") ? (
          <div className="text-center">
            <h1 className="text-xl font-bold">Нет доступа к редактированию</h1>
            <Button asChild className="mt-4">
              <Link to="/marketplace">В маркетплейс</Link>
            </Button>
          </div>
        ) : (
          <div className="mx-auto max-w-3xl">
            <h1 className="mb-6 text-2xl font-bold">Редактирование</h1>
            <ProductForm authorId={me.id} initial={p} />
          </div>
        )
      }
    </RequireAuth>
  );
}
