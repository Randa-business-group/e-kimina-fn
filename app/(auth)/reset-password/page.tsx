"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { Mail, ShieldCheck } from "lucide-react";
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
import { PASSWORD_RESET_TOKEN_KEY } from "@/lib/auth/password-reset-token";
import { toastAuthError } from "@/lib/auth-toast";
import { useVerifyResetOtpMutation } from "@/lib/auth/auth-queries";
import { ApiError } from "@/lib/query/query-client";
import { verifyResetOtpRequestSchema } from "@/types/auth-schema";
import { base64UrlDecode } from "@/utils/base64url";
import type { z } from "zod";

type ResetOtpFormValues = z.infer<typeof verifyResetOtpRequestSchema>;

function ResetShell({ children }: { children: React.ReactNode }) {
  return (
    <AuthShell
      icon={ShieldCheck}
      title="Check Your Email"
      subtitle="Enter the reset code"
      description="We emailed you a 6-digit code. Enter it here, then choose a new password on the next step."
      steps={3}
      step={1}
    >
      {children}
    </AuthShell>
  );
}

function ResetPasswordOtpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const verifyMutation = useVerifyResetOtpMutation();

  const form = useForm<ResetOtpFormValues>({
    resolver: zodResolver(verifyResetOtpRequestSchema),
    defaultValues: { email: "", otp: "" },
  });

  useEffect(() => {
    const emailQ = searchParams.get("email");
    const otpQ = searchParams.get("otp");

    if (emailQ) {
      const raw = decodeURIComponent(emailQ);
      if (raw.includes("@")) {
        form.setValue("email", raw);
      } else {
        try {
          form.setValue("email", base64UrlDecode(emailQ));
        } catch {
          form.setValue("email", raw);
        }
      }
    }

    if (otpQ) {
      const raw = decodeURIComponent(otpQ);
      if (/^\d{6}$/.test(raw)) {
        form.setValue("otp", raw);
      } else {
        try {
          form.setValue("otp", base64UrlDecode(otpQ));
        } catch {
          form.setValue("otp", raw);
        }
      }
    }
  }, [searchParams, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const { resetToken } = await verifyMutation.mutateAsync({
        email: values.email.trim().toLowerCase(),
        otp: values.otp,
      });
      if (typeof sessionStorage !== "undefined") {
        sessionStorage.setItem(PASSWORD_RESET_TOKEN_KEY, resetToken);
      }
      toast.success("Code verified", { description: "Choose a new password." });
      router.push("/reset-password/new");
    } catch (e) {
      const message =
        e instanceof ApiError || e instanceof Error
          ? getApiErrorMessage(e)
          : "Verification failed.";
      toastAuthError(message);
      form.setError("root", { message });
    }
  });

  const { errors } = form.formState;

  return (
    <ResetShell>
      <form onSubmit={onSubmit} className={authFormClass}>
        {errors.root?.message ? <AuthAlert>{errors.root.message}</AuthAlert> : null}

        <AuthField
          id="rp-email"
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
                aria-label="One-time password"
                className="justify-between sm:justify-between"
                cellClassName={authOtpCellClass}
              />
            )}
          />
          {errors.otp ? <p className="text-xs text-red-700">{errors.otp.message}</p> : null}
        </div>

        <AuthButton disabled={verifyMutation.isPending} busy={verifyMutation.isPending}>
          {verifyMutation.isPending ? "Checking…" : "Continue"}
        </AuthButton>

        <AuthFooter>
          <p>
            Didn&apos;t get a code?{" "}
            <Link href="/forgot-password" className={authLinkClass}>
              Send again
            </Link>
          </p>
          <Link href="/login" className="transition hover:text-ink-brown">
            Back to sign in
          </Link>
        </AuthFooter>
      </form>
    </ResetShell>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <ResetShell>
          <AuthLoading />
        </ResetShell>
      }
    >
      <ResetPasswordOtpContent />
    </Suspense>
  );
}
