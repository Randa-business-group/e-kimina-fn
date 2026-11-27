"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { Mail, MailCheck } from "lucide-react";
import {
  AuthAlert,
  AuthButton,
  AuthField,
  AuthFooter,
  AuthLoading,
  AuthShell,
  authFormClass,
  authLinkClass,
  authOtpCellClass,
} from "@/components/auth/auth-shell";
import { OTPInput } from "@/components/ui/otp-input";
import { getApiErrorMessage } from "@/lib/api/error-utils";
import { toastAuthError } from "@/lib/auth-toast";
import {
  useResendVerificationMutation,
  useVerifyEmailMutation,
} from "@/lib/auth/auth-queries";
import { ApiError } from "@/lib/query/query-client";
import { verifyEmailRequestSchema } from "@/types/auth-schema";
import type { z } from "zod";

type VerifyEmailFormValues = z.infer<typeof verifyEmailRequestSchema>;

function VerifyShell({ children }: { children: React.ReactNode }) {
  return (
    <AuthShell
      icon={MailCheck}
      title="Verify Email"
      subtitle="Activate your account"
      description="We sent a 6-digit code to your email. Enter it below to activate your account."
      steps={2}
      step={1}
    >
      {children}
    </AuthShell>
  );
}

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailParam = searchParams.get("email") ?? "";
  const verifyMutation = useVerifyEmailMutation();
  const resendMutation = useResendVerificationMutation();
  const [cooldown, setCooldown] = useState(0);

  const form = useForm<VerifyEmailFormValues>({
    resolver: zodResolver(verifyEmailRequestSchema),
    defaultValues: { email: emailParam, otp: "" },
  });

  useEffect(() => {
    if (emailParam) {
      form.setValue("email", emailParam);
    }
  }, [emailParam, form]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await verifyMutation.mutateAsync(values);
      toast.success("Email verified", { description: "Welcome to E-Kimina." });
      router.push("/dashboard");
      router.refresh();
    } catch (e) {
      const message =
        e instanceof ApiError || e instanceof Error
          ? getApiErrorMessage(e)
          : "Verification failed.";
      toastAuthError(message);
      form.setError("root", { message });
    }
  });

  const onResend = async () => {
    const email = form.getValues("email").trim();
    if (!email) {
      toastAuthError("Enter your email first.");
      return;
    }
    try {
      await resendMutation.mutateAsync({ email });
      toast.success("If your account needs verification, we sent a new code.");
      setCooldown(60);
    } catch (e) {
      const message =
        e instanceof ApiError || e instanceof Error
          ? getApiErrorMessage(e)
          : "Could not resend.";
      toastAuthError(message);
    }
  };

  const { errors } = form.formState;

  return (
    <VerifyShell>
      <form onSubmit={onSubmit} className={authFormClass}>
        {errors.root?.message ? <AuthAlert>{errors.root.message}</AuthAlert> : null}

        <AuthField
          id="ve-email"
          label="Email"
          icon={<Mail />}
          type="email"
          autoComplete="email"
          placeholder="Email address"
          error={errors.email?.message}
          {...form.register("email")}
        />

        <div className="flex flex-col gap-1.5">
          <Controller
            control={form.control}
            name="otp"
            render={({ field }) => (
              <OTPInput
                numericOnly
                value={field.value}
                onChange={field.onChange}
                disabled={verifyMutation.isPending}
                aria-label="Email verification code"
                className="justify-between sm:justify-between"
                cellClassName={authOtpCellClass}
              />
            )}
          />
          {errors.otp ? <p className="text-xs text-red-700">{errors.otp.message}</p> : null}
        </div>

        <AuthButton disabled={verifyMutation.isPending} busy={verifyMutation.isPending}>
          {verifyMutation.isPending ? "Verifying…" : "Verify"}
        </AuthButton>

        <AuthFooter>
          <p>
            Didn&apos;t get it?{" "}
            <button
              type="button"
              disabled={resendMutation.isPending || cooldown > 0}
              onClick={() => void onResend()}
              className={`${authLinkClass} disabled:cursor-not-allowed disabled:no-underline disabled:opacity-60`}
            >
              {cooldown > 0 ? `Resend code (${cooldown}s)` : "Resend code"}
            </button>
          </p>
          <Link href="/login" className="transition hover:text-ink-brown">
            Back to sign in
          </Link>
        </AuthFooter>
      </form>
    </VerifyShell>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <VerifyShell>
          <AuthLoading />
        </VerifyShell>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
