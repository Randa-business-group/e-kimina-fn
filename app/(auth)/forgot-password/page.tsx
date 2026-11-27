"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { KeyRound, Mail } from "lucide-react";
import {
  AuthAlert,
  AuthButton,
  AuthField,
  AuthFooter,
  AuthShell,
  authFormClass,
  authLinkClass,
} from "@/components/auth/auth-shell";
import { getApiErrorMessage } from "@/lib/api/error-utils";
import { toastAuthError } from "@/lib/auth-toast";
import { useForgotPasswordMutation } from "@/lib/auth/auth-queries";
import { ApiError } from "@/lib/query/query-client";
import { forgotPasswordRequestSchema } from "@/types/auth-schema";
import type { z } from "zod";

type ForgotFormValues = z.infer<typeof forgotPasswordRequestSchema>;

export default function ForgotPasswordPage() {
  const router = useRouter();
  const mutation = useForgotPasswordMutation();

  const form = useForm<ForgotFormValues>({
    resolver: zodResolver(forgotPasswordRequestSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const res = await mutation.mutateAsync(values);
      toast.success(res.message);
      router.push(
        `/reset-password?email=${encodeURIComponent(values.email.trim().toLowerCase())}`,
      );
    } catch (e) {
      const message =
        e instanceof ApiError || e instanceof Error
          ? getApiErrorMessage(e)
          : "Something went wrong.";
      toastAuthError(message);
      form.setError("root", { message });
    }
  });

  const { errors } = form.formState;

  return (
    <AuthShell
      icon={KeyRound}
      title="Forgot Password?"
      subtitle="Reset your password"
      description="Enter your account email. We'll send you a 6-digit code, then you can choose a new password."
      steps={3}
      step={0}
    >
      <form onSubmit={onSubmit} className={authFormClass}>
        {errors.root?.message ? <AuthAlert>{errors.root.message}</AuthAlert> : null}

        <AuthField
          id="fp-email"
          label="Email"
          icon={<Mail />}
          type="email"
          autoComplete="email"
          placeholder="Email address"
          error={errors.email?.message}
          {...form.register("email")}
        />

        <AuthButton disabled={mutation.isPending} busy={mutation.isPending}>
          {mutation.isPending ? "Sending…" : "Send code"}
        </AuthButton>

        <AuthFooter>
          <p>
            Remembered it?{" "}
            <Link href="/login" className={authLinkClass}>
              Back to sign in
            </Link>
          </p>
        </AuthFooter>
      </form>
    </AuthShell>
  );
}
