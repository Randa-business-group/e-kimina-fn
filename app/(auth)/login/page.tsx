"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { KeyRound, Lock, Mail, MessageSquareText, Smartphone } from "lucide-react";
import {
  AuthAlert,
  AuthButton,
  AuthField as Field,
  AuthFooter,
  AuthShell,
  PasswordToggle,
  authFormClass,
  authLinkClass as linkClass,
} from "@/components/auth/auth-shell";
import { tokenStorage } from "@/lib/api/api-client";
import {
  login,
  loginWithPhonePassword,
  requestPhoneCode,
  resendTwoFactor,
  verifyPhoneCode,
  verifyTwoFactor,
} from "@/lib/api/auth-api";
import { toastAuthError, toastLoginSuccess } from "@/lib/auth-toast";
import { authKeys } from "@/lib/auth/auth-keys";
import { isChallenge, type AuthResponse, type LoginResult, type TwoFactorChallenge } from "@/types/auth";
import { cn } from "@/utils/cn";

type Mode = "password" | "phone";

/** "Remember me" keeps the email or phone filled in on this device. */
const REMEMBER_KEY = "ekimina.login.identifier";

export default function LoginPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<Mode>("password");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [phone, setPhone] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState("");
  const [challenge, setChallenge] = useState<TwoFactorChallenge | null>(null);
  const [useRecovery, setUseRecovery] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(REMEMBER_KEY);
      if (saved) {
        setIdentifier(saved);
        setRemember(true);
      }
    } catch {
      /* storage unavailable — nothing to restore */
    }
  }, []);

  const saveRemembered = () => {
    if (mode !== "password") return;
    try {
      if (remember && identifier.trim()) localStorage.setItem(REMEMBER_KEY, identifier.trim());
      else localStorage.removeItem(REMEMBER_KEY);
    } catch {
      /* ignore */
    }
  };

  const finish = (data: AuthResponse) => {
    saveRemembered();
    tokenStorage.set(data.accessToken);
    queryClient.setQueryData(authKeys.profile(), data.user);
    toastLoginSuccess();
    const next = new URLSearchParams(window.location.search).get("next");
    router.push(next && next.startsWith("/dashboard") && !next.startsWith("//") ? next : "/dashboard");
    router.refresh();
  };

  const handle = (r: LoginResult) => {
    if (isChallenge(r)) {
      setChallenge(r);
      setCode("");
      return;
    }
    finish(r);
  };

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (e) {
      const message = e instanceof Error ? e.message : "Something went wrong. Please try again.";
      setError(message);
      toastAuthError(message);
    } finally {
      setBusy(false);
    }
  };

  const submitPassword = () =>
    run(async () => {
      const id = identifier.trim();
      if (!id || !password) throw new Error("Enter your email or phone and your password.");
      handle(id.includes("@") ? await login({ email: id, password }) : await loginWithPhonePassword(id, password));
    });

  const sendCode = () =>
    run(async () => {
      if (!phone.trim()) throw new Error("Enter your phone number.");
      await requestPhoneCode(phone.trim());
      setCodeSent(true);
    });

  const submitPhoneCode = () => run(async () => handle(await verifyPhoneCode(phone.trim(), code.trim())));

  const submitSecondStep = () =>
    run(async () => {
      if (!challenge) return;
      finish(
        await verifyTwoFactor(
          useRecovery
            ? { challengeToken: challenge.challengeToken, recoveryCode: code.trim() }
            : { challengeToken: challenge.challengeToken, code: code.trim() },
        ),
      );
    });

  const switchMode = (m: Mode) => {
    setMode(m);
    setError(null);
  };

  const subtitle = challenge
    ? "Two-step verification"
    : mode === "phone"
      ? "Sign in with an SMS code"
      : "Sign in to your account";

  const submitLabel = busy
    ? "Please wait…"
    : challenge
      ? "Verify"
      : mode === "phone" && !codeSent
        ? "Send code"
        : "Sign in";

  return (
    <AuthShell icon={Lock} title="Welcome Back" subtitle={subtitle} steps={3} step={challenge ? 1 : 0}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (challenge) void submitSecondStep();
          else if (mode === "password") void submitPassword();
          else if (!codeSent) void sendCode();
          else void submitPhoneCode();
        }}
        className={authFormClass}
      >
        {error ? <AuthAlert>{error}</AuthAlert> : null}

        {challenge ? (
          <>
            <p className="text-center text-sm text-bark lg:text-[15.5px]">
              {useRecovery
                ? "Enter one of the recovery codes you saved."
                : challenge.method === "TOTP"
                  ? "Enter the 6-digit code from your authenticator app."
                  : `Enter the 6-digit code we texted to ${challenge.phoneHint ?? "your phone"}.`}
            </p>
            <Field
              id="code"
              label={useRecovery ? "Recovery code" : "Code"}
              icon={<KeyRound />}
              autoFocus
              inputMode={useRecovery ? "text" : "numeric"}
              autoComplete="one-time-code"
              placeholder={useRecovery ? "xxxxx-xxxxx" : "6-digit code"}
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
            <div className="flex min-h-11 flex-wrap items-center justify-between gap-2 px-1 text-sm lg:text-base">
              <button type="button" className={linkClass} onClick={() => setUseRecovery((v) => !v)}>
                {useRecovery ? "Use a code instead" : "Use a recovery code"}
              </button>
              {challenge.method === "SMS" && !useRecovery ? (
                <button
                  type="button"
                  className={linkClass}
                  onClick={() => void run(async () => resendTwoFactor(challenge.challengeToken))}
                >
                  Send a new code
                </button>
              ) : null}
              <button type="button" className="text-bark transition hover:text-ink-brown" onClick={() => setChallenge(null)}>
                Back
              </button>
            </div>
          </>
        ) : mode === "password" ? (
          <>
            <Field
              id="identifier"
              label="Email or phone number"
              icon={<Mail />}
              autoComplete="username"
              placeholder="Email or Phone Number"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
            />
            <Field
              id="password"
              label="Password"
              icon={<Lock />}
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              trailing={<PasswordToggle shown={showPassword} onToggle={() => setShowPassword((v) => !v)} />}
            />
            <div className="flex min-h-11 items-center justify-between gap-3 px-0.5 text-[14.5px] lg:text-[17px]">
              <label className="flex min-h-11 cursor-pointer items-center gap-2.5 text-ink-brown lg:gap-3">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="size-[19px] cursor-pointer rounded-sm accent-clay lg:size-[23px]"
                />
                Remember me
              </label>
              <Link href="/forgot-password" className={linkClass}>
                Forgot Password?
              </Link>
            </div>
          </>
        ) : (
          <>
            <Field
              id="phone"
              label="Phone number"
              icon={<Smartphone />}
              type="tel"
              autoComplete="tel"
              placeholder="Phone number, e.g. 0788123456"
              value={phone}
              disabled={codeSent}
              onChange={(e) => setPhone(e.target.value)}
            />
            {codeSent ? (
              <>
                <Field
                  id="sms-code"
                  label="Code from the SMS"
                  icon={<MessageSquareText />}
                  autoFocus
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="6-digit code from the SMS"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                />
                <button
                  type="button"
                  className={cn(linkClass, "self-start text-sm")}
                  onClick={() => {
                    setCodeSent(false);
                    setCode("");
                  }}
                >
                  Use another number or send again
                </button>
              </>
            ) : (
              <p className="text-sm text-bark lg:text-[15.5px]">We text a 6-digit code to the number on your account.</p>
            )}
          </>
        )}

        <AuthButton disabled={busy} busy={busy}>
          {submitLabel}
        </AuthButton>

        {!challenge ? (
          <AuthFooter>
            <p>
              Don&apos;t have an account?{" "}
              <Link href="/register" className={linkClass}>
                Register
              </Link>
            </p>
          </AuthFooter>
        ) : null}
      </form>
    </AuthShell>
  );
}
