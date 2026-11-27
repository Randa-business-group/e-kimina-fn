import type { ComponentProps, ReactNode } from "react";
import { ArrowRight, CircleAlert, Eye, EyeOff, Loader2, type LucideIcon } from "lucide-react";
import { DesktopArt, MobileArt } from "@/components/auth/login-art";
import { cn } from "@/utils/cn";

/* Shared warm botanical layout for every auth screen (login, register, password reset, email verification).
   Colours come from the warm palette in app/globals.css (clay, clay-deep, clay-soft, cream, sand-line,
   ink-brown, bark). Radii are fixed pixel values so they don't follow the app-wide --radius scale. */

const display = "font-display";

export const authLinkClass =
  "font-medium text-clay underline underline-offset-[3px] transition hover:text-clay-deep focus-visible:rounded-[4px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay";

export const authFormClass = "flex w-full flex-col gap-4 lg:gap-5";

/** Styling for each box of `OTPInput` (pass as `cellClassName`). Overrides the component's default sizes. */
export const authOtpCellClass = cn(
  "h-[52px] w-[47px] rounded-[6px] border-[1.5px] border-sand-line bg-white/45 text-[22px] font-semibold text-ink-brown",
  "sm:h-[52px] sm:w-[47px] sm:text-[22px] lg:h-[66px] lg:w-[59px] lg:rounded-[8px] lg:text-[25px]",
  "focus:border-clay focus:ring-4 focus:ring-clay/15 focus:ring-offset-0 data-filled:border-clay",
  display,
);

type AuthShellProps = {
  icon: LucideIcon;
  title: ReactNode;
  /** Small spaced capitals under the title. */
  subtitle: ReactNode;
  /** Short explanatory text under the subtitle. */
  description?: ReactNode;
  /** Position in a multi-step flow, announced to screen readers ("Step 2 of 3"). */
  steps?: number;
  step?: number;
  children: ReactNode;
};

export function AuthShell({ icon: Icon, title, subtitle, description, steps = 3, step = 0, children }: AuthShellProps) {
  return (
    <div
      className="relative isolate min-h-dvh overflow-hidden bg-cream font-sans text-ink-brown"
    >
      <DesktopArt />
      <MobileArt />

      <main
        className={cn(
          "relative mx-auto flex min-h-dvh w-full max-w-md flex-col items-center px-7 pb-32 pt-60",
          // Desktop: the column sits in the right half, centred around ~71% of the width.
          "lg:mx-0 lg:ml-[50%] lg:w-[42%] lg:max-w-none lg:justify-center lg:px-0 lg:py-16",
        )}
      >
        <div className="flex w-full max-w-[336px] flex-col items-center lg:max-w-[438px]">
          <header className="flex flex-col items-center text-center">
            {/* Badge: a softly rounded square turned 45°, with the page icon upright inside. */}
            <div aria-hidden className="relative flex size-[76px] shrink-0 items-center justify-center lg:size-[116px]">
              <div className="absolute inset-3 rotate-45 rounded-[6px] bg-clay-soft lg:inset-[17px] lg:rounded-[8px]" />
              <Icon className="relative size-[26px] lg:size-[38px]" strokeWidth={1.6} />
            </div>

            <h1
              className={cn(
                display,
                "mt-[3px] text-[34px] font-semibold leading-[37px] tracking-[-0.01em] lg:mt-1 lg:text-[58px] lg:leading-[64px]",
              )}
            >
              {title}
            </h1>
            <p className="mt-[11px] text-[11.5px] font-medium uppercase leading-[15px] tracking-[0.3em] text-bark lg:mt-[13px] lg:text-[15px] lg:leading-5">
              {subtitle}
            </p>
            {steps > 1 ? (
              <p className="sr-only">
                Step {step + 1} of {steps}
              </p>
            ) : null}
            {description ? (
              <p className="mt-3.5 text-sm leading-normal text-bark lg:mt-[18px] lg:text-[15.5px]">{description}</p>
            ) : null}
          </header>

          <div className={cn("w-full", description ? "mt-6 lg:mt-[29px]" : "mt-[46px] lg:mt-[63px]")}>{children}</div>
        </div>
      </main>
    </div>
  );
}

type AuthFieldProps = ComponentProps<"input"> & {
  id: string;
  /** Read by screen readers; the visible cue is the placeholder. */
  label: string;
  icon: ReactNode;
  /** Element at the end of the field, e.g. <PasswordToggle />. */
  trailing?: ReactNode;
  error?: string;
  hint?: string;
};

export function AuthField({ id, label, icon, trailing, error, hint, className, ...props }: AuthFieldProps) {
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  return (
    <div className="flex flex-col gap-1.5 lg:gap-2">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <div
        className={cn(
          "flex h-[52px] items-center gap-[18px] rounded-[8px] border-[1.5px] border-sand-line bg-white/45 pl-6 transition",
          "focus-within:border-clay focus-within:bg-white/70 focus-within:ring-4 focus-within:ring-clay/15",
          "lg:h-[66px] lg:gap-6 lg:rounded-[10px] lg:pl-8",
          trailing ? "pr-1.5 lg:pr-4" : "pr-5 lg:pr-6",
          error && "border-red-400 focus-within:ring-red-400/20",
          props.readOnly && "bg-sand/50",
          props.disabled && "opacity-60",
        )}
      >
        <span aria-hidden className="flex shrink-0 text-ink-brown [&_svg]:size-[21px] [&_svg]:stroke-[1.7] lg:[&_svg]:size-6">
          {icon}
        </span>
        <input
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(
            "h-full min-w-0 flex-1 bg-transparent text-[15px] text-ink-brown outline-none placeholder:text-bark",
            "read-only:cursor-default disabled:cursor-not-allowed lg:text-lg",
            className,
          )}
          {...props}
        />
        {trailing}
      </div>
      {error ? (
        <p id={`${id}-error`} className="pl-6 text-xs text-red-700 lg:pl-8 lg:text-sm">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="pl-6 text-[12.5px] text-bark lg:pl-8 lg:text-sm">
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
      aria-label={shown ? "Hide password" : "Show password"}
      aria-pressed={shown}
      className="flex size-11 shrink-0 items-center justify-center rounded-[6px] text-bark transition hover:text-ink-brown focus-visible:outline-2 focus-visible:outline-clay lg:size-12"
    >
      {shown ? (
        <Eye aria-hidden className="size-[22px] lg:size-6" strokeWidth={1.7} />
      ) : (
        <EyeOff aria-hidden className="size-[22px] lg:size-6" strokeWidth={1.7} />
      )}
    </button>
  );
}

export function AuthButton({ busy, children, className, type = "submit", ...props }: ComponentProps<"button"> & { busy?: boolean }) {
  return (
    <button
      type={type}
      aria-busy={busy || undefined}
      className={cn(
        "group mt-1.5 flex h-[50px] w-full items-center justify-center gap-3.5 rounded-[8px] bg-clay pl-[0.2em] text-[15px] font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-clay-deep",
        "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-clay/30 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:bg-clay",
        "lg:mt-2.5 lg:h-[63px] lg:gap-5 lg:rounded-[10px] lg:text-xl",
        className,
      )}
      {...props}
    >
      {children}
      {busy ? (
        <Loader2 aria-hidden className="size-5 animate-spin lg:size-6" />
      ) : (
        <ArrowRight aria-hidden className="size-5 transition group-hover:translate-x-0.5 lg:size-[26px]" strokeWidth={1.8} />
      )}
    </button>
  );
}

export function AuthAlert({ children }: { children: ReactNode }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-2.5 rounded-[8px] border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 lg:text-[15px]"
    >
      <CircleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
      <div>{children}</div>
    </div>
  );
}

/** Centred helper links under the submit button. */
export function AuthFooter({ children }: { children: ReactNode }) {
  return (
    <div className="mt-1.5 flex flex-col items-center gap-2 text-center text-[14.5px] text-bark lg:mt-2 lg:gap-2.5 lg:text-base">
      {children}
    </div>
  );
}

export function AuthLoading() {
  return (
    <div role="status" className="flex justify-center py-10 text-clay">
      <Loader2 aria-hidden className="size-7 animate-spin" />
      <span className="sr-only">Loading…</span>
    </div>
  );
}
