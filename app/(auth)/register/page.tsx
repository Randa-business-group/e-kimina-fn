"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Lock, Mail, User, UserPlus } from "lucide-react";
import {
  AuthAlert,
  AuthButton,
  AuthField,
  AuthFooter,
  AuthLoading,
  AuthShell,
  PasswordToggle,
  authFormClass,
  authLinkClass,
} from "@/components/auth/auth-shell";
import { getApiErrorMessage } from "@/lib/api/error-utils";
import { fetchTreasurerInvitationPreview } from "@/lib/api/auth-api";
import { toast } from "sonner";
import { toastAuthError, toastRegisterSuccess } from "@/lib/auth-toast";
import { useRegisterMutation } from "@/lib/auth/auth-queries";
import { ApiError } from "@/lib/query/query-client";
import type { RegisterRequest, RegisterResult } from "@/types/auth";
import {
  registerFormSchema,
  type RegisterFormValues,
} from "@/types/auth-schema";

/** Register → verify email. */
const FLOW_STEPS = 2;

function toRegisterRequest(
  values: RegisterFormValues,
  invitationToken: string | null,
): RegisterRequest {
  const base: RegisterRequest = {
    email: values.email.trim().toLowerCase(),
    password: values.password,
    fullName: `${values.firstName.trim()} ${values.lastName.trim()}`.trim(),
  };
  if (invitationToken) {
    return { ...base, invitationToken };
  }
  return base;
}

function RegisterShell({ children }: { children: React.ReactNode }) {
  return (
    <AuthShell icon={UserPlus} title="Get Started" subtitle="Create your account" steps={FLOW_STEPS} step={0}>
      {children}
    </AuthShell>
  );
}

function RegisterPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const invitationToken = searchParams.get("invitation");
  const [showPassword, setShowPassword] = useState(false);
  const [inviteEmailLocked, setInviteEmailLocked] = useState(false);
  /** False until we know whether `invitation` query param is valid (or absent). */
  const [inviteResolved, setInviteResolved] = useState(false);
  const registerMutation = useRegisterMutation();

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
    },
  });

  useEffect(() => {
    if (!invitationToken) {
      setInviteEmailLocked(false);
      setInviteResolved(true);
      return;
    }
    let cancelled = false;
    void fetchTreasurerInvitationPreview(invitationToken)
      .then((r) => {
        if (!cancelled) {
          form.setValue("email", r.email);
          setInviteEmailLocked(true);
          setInviteResolved(true);
        }
      })
      .catch(() => {
        if (!cancelled) {
          toastAuthError("Invalid or expired invitation link.");
          setInviteEmailLocked(false);
          setInviteResolved(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [invitationToken, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const result: RegisterResult = await registerMutation.mutateAsync(
        toRegisterRequest(
          values,
          inviteEmailLocked ? invitationToken : null,
        ),
      );
      if ("needsEmailVerification" in result && result.needsEmailVerification) {
        toast.success("Check your email", {
          description: "Enter the 6-digit code to verify your account.",
        });
        router.push(
          `/verify-email?email=${encodeURIComponent(result.email)}`,
        );
        return;
      }
      toastRegisterSuccess();
      router.push("/dashboard");
      router.refresh();
    } catch (e) {
      let message = "Something went wrong. Please try again.";
      if (e instanceof ApiError || e instanceof Error) {
        message = getApiErrorMessage(e);
      }
      toastAuthError(message);
      form.setError("root", { message });
    }
  });

  const { errors } = form.formState;
  const loadingInvite = Boolean(invitationToken && !inviteResolved);

  return (
    <RegisterShell>
      <form onSubmit={onSubmit} className={authFormClass}>
        {errors.root?.message ? <AuthAlert>{errors.root.message}</AuthAlert> : null}

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-4">
          <AuthField
            id="firstName"
            label="First name"
            icon={<User />}
            type="text"
            autoComplete="given-name"
            placeholder="First name"
            error={errors.firstName?.message}
            {...form.register("firstName")}
          />
          <AuthField
            id="lastName"
            label="Last name"
            icon={<User />}
            type="text"
            autoComplete="family-name"
            placeholder="Last name"
            error={errors.lastName?.message}
            {...form.register("lastName")}
          />
        </div>

        <AuthField
          id="email"
          label="Email"
          icon={<Mail />}
          type="email"
          autoComplete="email"
          placeholder={loadingInvite ? "Loading invitation…" : "Email address"}
          readOnly={Boolean(invitationToken && inviteEmailLocked)}
          error={errors.email?.message}
          hint={invitationToken && inviteEmailLocked ? "This email comes from your invitation." : undefined}
          {...form.register("email")}
        />

        <AuthField
          id="password"
          label="Password"
          icon={<Lock />}
          type={showPassword ? "text" : "password"}
          autoComplete="new-password"
          placeholder="Password"
          error={errors.password?.message}
          hint="Must be at least 8 characters."
          trailing={<PasswordToggle shown={showPassword} onToggle={() => setShowPassword((v) => !v)} />}
          {...form.register("password")}
        />

        <AuthButton
          disabled={registerMutation.isPending || loadingInvite}
          busy={registerMutation.isPending}
        >
          {registerMutation.isPending ? "Creating account…" : "Sign up"}
        </AuthButton>

        <AuthFooter>
          <p>
            Already have an account?{" "}
            <Link href="/login" className={authLinkClass}>
              Sign in
            </Link>
          </p>
        </AuthFooter>
      </form>
    </RegisterShell>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <RegisterShell>
          <AuthLoading />
        </RegisterShell>
      }
    >
      <RegisterPageContent />
    </Suspense>
  );
}
