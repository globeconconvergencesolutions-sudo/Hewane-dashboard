import { BrandLogo } from "@/components/brand-logo";
import { cn } from "@/lib/utils";

type BrandMarkProps = {
  className?: string;
  imageClassName?: string;
  showWordmark?: boolean;
  variant?: "sidebar" | "auth" | "default";
};

export function BrandMark({
  className,
  imageClassName,
  showWordmark = true,
  variant = "default",
}: BrandMarkProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div
        className={cn(
          "flex shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white/95",
          variant === "sidebar" && "size-10 p-1",
          variant === "auth" && "size-12 p-1.5",
          variant === "default" && "size-11 p-1"
        )}
      >
        <BrandLogo
          className={cn("h-full w-full object-contain object-center", imageClassName)}
          priority={variant === "auth"}
        />
      </div>
      {showWordmark ? (
        <div className="min-w-0">
          <p
            className={cn(
              "truncate font-bold leading-tight",
              variant === "sidebar" ? "text-base text-white" : "text-lg text-[#1a1a2e]"
            )}
          >
            Hewane Music
          </p>
          <p
            className={cn(
              "truncate text-xs",
              variant === "sidebar" ? "text-white/50" : "text-[#7D3F7E]"
            )}
          >
            Broadcast Dashboard
          </p>
        </div>
      ) : null}
    </div>
  );
}
