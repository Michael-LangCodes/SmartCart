import { PageHeader } from "@/components/page-header";
import { RecipeForm } from "@/components/recipe-form";

export default function NewRecipePage() {
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="New recipe"
        description="Add a recipe to your collection."
      />
      <RecipeForm />
    </div>
  );
}
