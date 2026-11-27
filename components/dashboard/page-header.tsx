import { cn } from "@/utils/cn";

type PageHeaderProps = {
  title: string;
  description?: string;
  className?: string;
};

export function PageHeader({ title, description, className }: PageHeaderProps) {
  return (
    <header className={cn("mb-5 sm:mb-6", className)}>
      <h1 className="font-display text-[28px] font-semibold leading-tight tracking-[-0.01em] text-text sm:text-[34px]">
        {title}
      </h1>
      {description ? (
        <p className="mt-1 max-w-prose text-sm leading-relaxed text-text-muted sm:text-[15px]">
          {description}
        </p>
      ) : null}
    </header>
  );
}
