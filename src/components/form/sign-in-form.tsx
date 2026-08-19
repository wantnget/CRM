"use client";

import { useSearchParams } from "next/navigation";
import { Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useOtpLogin } from "@/hooks/use-otp-login";
import { OtpForm } from "@/components/form/otp";

export function SignInForm() {
  const searchParams = useSearchParams();
  const callbackURL =
    searchParams.get("callbackURL") || "/crm/wantget/v1/home";
  const {
    step,
    email,
    phoneHint,
    sentAt,
    sendCode,
    resendCode,
    verifyCode,
    reset,
    isPending,
    error,
    fieldErrors,
  } = useOtpLogin();

  function handleEmailSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    sendCode({ email: String(formData.get("email") ?? "") });
  }

  function handleOtpSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    verifyCode({ otp: String(formData.get("otp") ?? "") }, callbackURL);
  }

  if (step === "otp") {
    return (
      <OtpForm
        email={email}
        phone={phoneHint}
        sentAt={sentAt}
        isPending={isPending}
        error={error}
        fieldError={fieldErrors.otp}
        onSubmit={handleOtpSubmit}
        onUseAnotherEmail={reset}
        onResend={resendCode}
      />
    );
  }

  return (
    <form onSubmit={handleEmailSubmit} noValidate className="flex flex-col gap-4">
      {error ? (
        <p
          role="alert"
          className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {error}
        </p>
      ) : null}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Correo electrónico</Label>
        <div className="relative">
          <Mail className="pointer-events-none absolute top-1/2 left-4 size-4.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="usuario@wantnget.com.co"
            aria-invalid={Boolean(fieldErrors.email)}
            disabled={isPending}
            className="pl-11"
          />
        </div>
        {fieldErrors.email ? (
          <p className="text-xs text-destructive">{fieldErrors.email}</p>
        ) : null}
      </div>

      <Button
        type="submit"
        size="lg"
        className="mt-2 h-11 bg-[#0f2b46] text-white hover:bg-[#0f2b46]/90"
        disabled={isPending}
      >
        {isPending ? (
          <>
            <Loader2 className="size-4.5 animate-spin" />
            Enviando…
          </>
        ) : (
          "Enviar código"
        )}
      </Button>
    </form>
  );
}
