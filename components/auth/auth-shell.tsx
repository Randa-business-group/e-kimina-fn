import type { ComponentProps, ReactNode } from "react";
import { ArrowRight, Eye, EyeOff, type LucideIcon } from "lucide-react";
import { CornerWaves, DesktopHero, LeafSprig, LineWaves, MobileHero } from "@/components/auth/login-art";
import { cn } from "@/utils/cn";

/* Shared warm "landscape card" layout for every auth screen (login, register, password reset, email verification). */

const serif = { fontFamily: "var(--font-playfair), Georgia, serif" };

export const authLinkClass = "font-medium text-clay underline underline-offset-4 transition hover:text-clay-deep";

export const authFormClass = "flex flex-col gap-5";

/** Styling for each box of `OTPInput` (pass as `cellClassName`). */
export const authOtpCellClass =
  "h-12 w-11 rounded-md border-sand-line bg-cream/60 text-ink-brown focus:border-clay focus:ring-clay/20 focus:ring-offset-0 data-filled:border-clay sm:h-13 sm:w-12";

type AuthShellProps = {
  icon: LucideIcon;
  title: ReactNode;
  subtitle: ReactNode;
  /** Short explanatory text under the divider. */
  description?: ReactNode;
  /** Number of progress dots and which one is current. */
  steps?: number;
  step?: number;
  children: ReactNode;
};

export function AuthShell({ icon: Icon, title, subtitle, description, steps = 3, step = 0, children }: AuthShellProps) {
  return (
    <div className="min-h-screen w-full bg-sand text-ink-brown lg:flex lg:items-center lg:justify-center lg:p-8">
      <div className="relative flex min-h-screen w-full flex-col overflow-hidden bg-cream lg:min-h-[min(800px,calc(100vh-4rem))] lg:max-w-6xl lg:flex-row lg:rounded-lg lg:shadow-[0_30px_80px_-30px_rgba(91,48,20,0.35)]">
        {/* Artwork */}
        <DesktopHero className="hidden shrink-0 lg:block lg:w-[44%]" />
        <MobileHero className="h-[40vh] min-h-60 max-h-90 shrink-0 lg:hidden" />

        <LeafSprig className="pointer-events-none absolute right-0 top-0 z-10 hidden w-72 lg:block" />
        <LeafSprig className="pointer-events-none absolute right-0 top-0 z-10 w-44 sm:w-52 lg:hidden" />
        <LineWaves className="pointer-events-none absolute bottom-0 right-0 hidden w-[26rem] lg:block" />
        <LeafSprig className="pointer-events-none absolute bottom-0 right-0 w-44 -scale-y-100 lg:hidden" />
        <CornerWaves className="pointer-events-none absolute bottom-0 left-0 h-24 w-48 lg:hidden" />

        <main className="relative z-10 flex flex-1 flex-col items-center px-6 pb-28 lg:justify-center lg:px-12 lg:py-16">
          <div className="-mt-12 flex w-full max-w-md flex-col lg:mt-0">
            <header className="flex flex-col items-center text-center">
              <div className="mb-6 flex size-14 rotate-45 items-center justify-center rounded-md bg-clay-soft shadow-[0_10px_24px_-12px_rgba(181,71,15,0.45)] lg:mb-8 lg:size-16">
                <Icon className="size-6 -rotate-45 text-ink-brown lg:size-7" strokeWidth={1.8} />
              </div>
              <h1 className="text-4xl font-bold leading-tight tracking-tight lg:text-[3.4rem]" style={serif}>
                {title}
              </h1>
              <p className="mt-3 text-xs font-medium uppercase tracking-[0.28em] text-bark lg:text-sm">{subtitle}</p>
              <div className="mt-5 flex items-center gap-3" aria-hidden>
                <span className="h-px w-10 bg-sand-line" />
                <span className="h-1 w-14 rounded-sm bg-clay" />
                <span className="h-px w-10 bg-sand-line" />
              </div>
              {description ? <p className="mt-5 max-w-sm text-sm leading-relaxed text-bark">{description}</p> : null}
            </header>

            <div className="mt-8 lg:mt-10">{children}</div>
          </div>

          {steps > 1 ? (
            <div className="absolute bottom-8 left-1/2 flex -translate-x-1/2 gap-3 lg:bottom-9" aria-hidden>
              {Array.from({ length: steps }, (_, i) => (
                <span key={i} className={cn("size-2.5 rounded-full", i === step ? "bg-clay" : "bg-clay-soft")} />
              ))}
            </div>
          ) : null}
        </main>
      </div>
    </div>
  );
}

type AuthFieldProps = ComponentProps<"input"> & {
  id: string;
  /** Read by screen readers; the visible cue is the placeholder. */
  label: string;
  icon: ReactNode;
  trailing?: ReactNode;
  error?: string;
  hint?: string;
};

export function AuthField({ id, label, icon, trailing, error, hint, className, ...props }: AuthFieldProps) {
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  return (
    <div className="flex flex-col gap-1.5">
      <div className="relative">
        <label htmlFor={id} className="sr-only">
          {label}
        </label>
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-brown/80 [&_svg]:size-5">
          {icon}
        </span>
        <input
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(
            "h-13 w-full rounded-md border border-sand-line bg-cream/60 pl-12 pr-4 text-[15px] text-ink-brown outline-none transition",
            "placeholder:text-bark/80 focus:border-clay focus:bg-white/70 focus:ring-2 focus:ring-clay/15",
            "read-only:bg-sand/50 disabled:cursor-not-allowed disabled:opacity-60",
            "aria-invalid:border-red-400 aria-invalid:focus:ring-red-400/20",
            trailing ? "pr-12" : null,
            className,
          )}
          {...props}
        />
        {trailing ? <span className="absolute right-3 top-1/2 -translate-y-1/2">{trailing}</span> : null}
      </div>
      {error ? (
        <p id={`${id}-error`} className="text-xs text-red-700">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-xs text-bark">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function PasswordToggle({ shown, onToggle }: { shown: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex size-8 items-center justify-center rounded-sm text-bark transition hover:text-ink-brown"
      aria-label={shown ? "Hide password" : "Show password"}
    >
      {shown ? <Eye className="size-5" /> : <EyeOff className="size-5" />}
    </button>
  );
}

export function AuthButton({ busy, children, className, ...props }: ComponentProps<"button"> & { busy?: boolean }) {
  return (
    <button
      type="submit"
      className={cn(
        "group mt-2 flex h-13 w-full items-center justify-center gap-3 rounded-md bg-clay text-sm font-semibold uppercase tracking-[0.25em] text-white shadow-[0_12px_24px_-14px_rgba(152,58,10,0.9)] transition hover:bg-clay-deep",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay/40 focus-visible:ring-offset-2 focus-visible:ring-offset-cream disabled:opacity-60 lg:h-14 lg:text-base",
        className,
      )}
      {...props}
    >
      {children}
      {!busy ? <ArrowRight className="size-5 transition group-hover:translate-x-0.5" /> : null}
    </button>
  );
}

export function AuthAlert({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
      {children}
    </p>
  );
}

/** Centered helper links under the submit button. */
export function AuthFooter({ children }: { children: ReactNode }) {
  return <div className="flex flex-col items-center gap-2 text-center text-sm text-bark">{children}</div>;
}

export function AuthLoading() {
  return <p className="text-center text-sm text-bark">Loading…</p>;
}
