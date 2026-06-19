import { cn } from "@/lib/utils";

type PageHeroProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
};

export function PageHero({
  eyebrow = "Hewane School of Music",
  title,
  description,
  actions,
  className,
}: PageHeroProps) {
  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-2xl border border-primary/10 bg-gradient-to-br from-[#1a1a2e] via-[#2d1b3d] to-[#7D3F7E] p-6 text-white shadow-lg md:p-8",
        className
      )}
    >
      <div className="absolute -right-8 -top-8 size-40 rounded-full bg-[#E8B825]/20 blur-2xl" />
      <div className="absolute bottom-0 left-1/3 size-32 rounded-full bg-white/10 blur-3xl" />
      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-[#E8B825]">
            {eyebrow}
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">{title}</h1>
          {description ? (
            <p className="mt-3 text-sm text-white/75 md:text-base">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>
    </section>
  );
}
