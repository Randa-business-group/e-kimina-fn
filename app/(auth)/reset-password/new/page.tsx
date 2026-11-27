"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Lock, LockKeyhole } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import {
  AuthAlert,
  AuthButton,
  AuthField,
  AuthFooter,
  AuthLoading,
  AuthShell,
  PasswordToggle,
  authFormClass,
} from "@/components/auth/auth-shell";
import { getApiErrorMessage } from "@/lib/api/error-utils";
import { PASSWORD_RESET_TOKEN_KEY } from "@/lib/auth/password-reset-token";
import { toastAuthError } from "@/lib/auth-toast";
import { useCompletePasswordResetMutation } from "@/lib/auth/auth-queries";
import { ApiError } from "@/lib/query/query-client";

const newPasswordSchema = z
  .object({
    password: z.string().min(8).max(72),
    confirmPassword: z.string().min(8).max(72),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type NewPasswordFormValues = z.infer<typeof newPasswordSchema>;

function NewPasswordShell({ children }: { children: React.ReactNode }) {
  return (
    <AuthShell
      icon={LockKeyhole}
      title="New Password"
      subtitle="Choose a new password"
      description="After saving, sign in again with your email and new password."
      steps={3}
      step={2}
    >
      {children}
    </AuthShell>
  );
}

export default function ResetPasswordNewPage() {
  const router = useRouter();
  const mutation = useCompletePasswordResetMutation();
  const [showPassword, setShowPassword] = useState(false);
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [sessionChecked, setSessionChecked] = useState(false);

  const form = useForm<NewPasswordFormValues>({
    resolver: zodResolver(newPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  useEffect(() => {
    setSessionChecked(true);
    if (typeof sessionStorage === "undefined") {
      toastAuthError("Start again from forgot password.");
      router.replace("/forgot-password");
      return;
    }
    const t = sessionStorage.getItem(PASSWORD_RESET_TOKEN_KEY);
    if (!t) {
      toastAuthError("Start again from forgot password.");
      router.replace("/forgot-password");
      return;
    }
    setResetToken(t);
  }, [router]);

  const onSubmit = form.handleSubmit(async (values) => {
    if (!resetToken) {
      return;
    }
    try {
      const res = await mutation.mutateAsync({
        resetToken,
        password: values.password,
      });
      if (typeof sessionStorage !== "undefined") {
        sessionStorage.removeItem(PASSWORD_RESET_TOKEN_KEY);
      }
      toast.success(res.message);
      router.push("/login");
      router.refresh();
    } catch (e) {
      const message =
        e instanceof ApiError || e instanceof Error
          ? getApiErrorMessage(e)
          : "Could not update password.";
      toastAuthError(message);
      form.setError("root", { message });
    }
  });

  if (!sessionChecked || resetToken === null) {
    return (
      <NewPasswordShell>
        <AuthLoading />
      </NewPasswordShell>
    );
  }

  const { errors } = form.formState;
  const toggle = <PasswordToggle shown={showPassword} onToggle={() => setShowPassword((v) => !v)} />;

  return (
    <NewPasswordShell>
      <form onSubmit={onSubmit} className={authFormClass}>
        {errors.root?.message ? <AuthAlert>{errors.root.message}</AuthAlert> : null}

        <AuthField
          id="np-pass"
          label="New password"
          icon={<Lock />}
          type={showPassword ? "text" : "password"}
          autoComplete="new-password"
          placeholder="New password"
          error={errors.password?.message}
          hint="Must be at least 8 characters."
          trailing={toggle}
          {...form.register("password")}
        />

        <AuthField
          id="np-confirm"
          label="Confirm password"
          icon={<Lock />}
          type={showPassword ? "text" : "password"}
          autoComplete="new-password"
          placeholder="Confirm password"
          error={errors.confirmPassword?.message}
          {...form.register("confirmPassword")}
        />

        <AuthButton disabled={mutation.isPending} busy={mutation.isPending}>
          {mutation.isPending ? "Saving…" : "Update password"}
        </AuthButton>

        <AuthFooter>
          <Link href="/login" className="transition hover:text-ink-brown">
            Back to sign in
          </Link>
        </AuthFooter>
      </form>
    </NewPasswordShell>
  );
}
