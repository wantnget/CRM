"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import {
  emailSchema,
  otpSchema,
  type EmailInput,
  type OtpInput,
} from "@/lib/validations/auth";

const ERROR_MESSAGES: Record<string, string> = {
  INVALID_OTP: "El código ingresado no es válido.",
  OTP_EXPIRED: "El código expiró, solicita uno nuevo.",
  TOO_MANY_ATTEMPTS: "Demasiados intentos, solicita un código nuevo.",
};

const ERROR_DISMISS_MS = 4000;

export function useOtpLogin() {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [phoneHint, setPhoneHint] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<"email" | "otp", string>>
  >({});

  function showError(message: string, field?: "email" | "otp") {
    setError(message);
    if (field) setFieldErrors((prev) => ({ ...prev, [field]: message }));
    setTimeout(() => {
      setError(null);
      if (field) setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    }, ERROR_DISMISS_MS);
  }

  function sendCode(input: EmailInput) {
    setError(null);
    setFieldErrors({});

    const parsed = emailSchema.safeParse(input);
    if (!parsed.success) {
      setFieldErrors({ email: parsed.error.issues[0]?.message });
      return;
    }

    startTransition(async () => {
      const { error: sendError } = await authClient.emailOtp.sendVerificationOtp(
        {
          email: parsed.data.email,
          type: "sign-in",
        },
      );

      if (sendError) {
        showError(
          ERROR_MESSAGES[sendError.code ?? ""] ??
            "No se pudo enviar el código. Intenta de nuevo.",
          "email",
        );
        return;
      }

      setEmail(parsed.data.email);
      setStep("otp");

      try {
        const response = await fetch("/api/otp/phone-hint", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: parsed.data.email }),
        });
        const data = await response.json();
        setPhoneHint(data.phone ?? null);
      } catch {
        setPhoneHint(null);
      }
    });
  }

  function verifyCode(input: OtpInput, redirectTo = "/crm/wantget/v1/home") {
    setError(null);
    setFieldErrors({});

    const parsed = otpSchema.safeParse(input);
    if (!parsed.success) {
      setFieldErrors({ otp: parsed.error.issues[0]?.message });
      return;
    }

    startTransition(async () => {
      const { error: verifyError } = await authClient.signIn.emailOtp({
        email,
        otp: parsed.data.otp,
      });

      if (verifyError) {
        showError(
          ERROR_MESSAGES[verifyError.code ?? ""] ??
            "No se pudo verificar el código.",
          "otp",
        );
        return;
      }

      router.push(redirectTo);
      router.refresh();
    });
  }

  function reset() {
    setStep("email");
    setEmail("");
    setPhoneHint(null);
    setError(null);
    setFieldErrors({});
  }

  return {
    step,
    email,
    phoneHint,
    sendCode,
    verifyCode,
    reset,
    isPending,
    error,
    fieldErrors,
  };
}
