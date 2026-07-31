import Image from "next/image";
import { Utensils } from "lucide-react";

type Props = {
  src: string | null | undefined;
  alt: string;
  /** Card thumbnail vs detail hero */
  variant?: "card" | "hero";
  className?: string;
};

/** Recipe cover image with a soft placeholder when none is set. */
export function RecipeImage({
  src,
  alt,
  variant = "card",
  className = "",
}: Props) {
  const aspect =
    variant === "hero" ? "aspect-[16/9]" : "aspect-[16/10]";
  const sizes =
    variant === "hero"
      ? "(max-width: 768px) 100vw, 672px"
      : "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw";

  if (src) {
    return (
      <div
        className={`relative overflow-hidden bg-zinc-100 dark:bg-zinc-800 ${aspect} ${className}`}
      >
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          unoptimized
          className="object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden bg-gradient-to-br from-emerald-50 to-zinc-100 dark:from-emerald-950/40 dark:to-zinc-900 ${aspect} ${className}`}
      aria-hidden
    >
      <Utensils
        className={
          variant === "hero"
            ? "h-12 w-12 text-emerald-600/40 dark:text-emerald-400/30"
            : "h-8 w-8 text-emerald-600/40 dark:text-emerald-400/30"
        }
      />
    </div>
  );
}
