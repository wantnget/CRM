"use client";

import { useEffect, useState } from "react";
import { Loader } from "lucide-react";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { OTP_EXPIRES_IN_SECONDS } from "@/lib/otp-config";

type OtpFormProps = {
  email: string;
  phone?: string | null;
  sentAt: number | null;
  isPending: boolean;
  error: string | null;
  fieldError?: string;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onUseAnotherEmail: () => void;
  onResend: () => void;
};

function useOtpCountdown(sentAt: number | null) {
  const [secondsLeft, setSecondsLeft] = useState(OTP_EXPIRES_IN_SECONDS);

  useEffect(() => {
    if (!sentAt) return;

    const tick = () => {
      const transcurridos = Math.floor((Date.now() - sentAt) / 1000);
      setSecondsLeft(Math.max(OTP_EXPIRES_IN_SECONDS - transcurridos, 0));
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [sentAt]);

  return secondsLeft;
}

export function OtpForm({
  email,
  phone,
  sentAt,
  isPending,
  error,
  fieldError,
  onSubmit,
  onUseAnotherEmail,
  onResend,
}: OtpFormProps) {
  const secondsLeft = useOtpCountdown(sentAt);
  const expired = secondsLeft <= 0;
  const minutos = Math.floor(secondsLeft / 60);
  const segundos = secondsLeft % 60;
  const tiempoRestante = `${minutos}:${segundos.toString().padStart(2, "0")}`;

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="otp">Código de verificación</Label>
        <p className="text-sm text-muted-foreground">
          Te enviamos un código por WhatsApp al número asociado a{" "}
          <span className="font-medium text-foreground">{email}</span>
          {phone ? (
            <>
              {" "}
              (<span className="font-medium text-foreground">{phone}</span>)
            </>
          ) : null}
          .
        </p>
        <p
          className={
            expired
              ? "text-sm font-medium text-destructive"
              : "text-sm text-muted-foreground"
          }
        >
          {expired ? "El código expiró." : `Expira en ${tiempoRestante}`}
        </p>
        <InputOTP
          maxLength={6}
          name="otp"
          id="otp"
          inputMode="numeric"
          pattern={REGEXP_ONLY_DIGITS}
          disabled={isPending || expired}
          containerClassName="mt-2 justify-center"
        >
          <InputOTPGroup>
            <InputOTPSlot
              index={0}
              aria-invalid={Boolean(fieldError)}
              className="size-14 text-xl"
            />
            <InputOTPSlot
              index={1}
              aria-invalid={Boolean(fieldError)}
              className="size-14 text-xl"
            />
            <InputOTPSlot
              index={2}
              aria-invalid={Boolean(fieldError)}
              className="size-14 text-xl"
            />
          </InputOTPGroup>
          <InputOTPSeparator />
          <InputOTPGroup>
            <InputOTPSlot
              index={3}
              aria-invalid={Boolean(fieldError)}
              className="size-14 text-xl"
            />
            <InputOTPSlot
              index={4}
              aria-invalid={Boolean(fieldError)}
              className="size-14 text-xl"
            />
            <InputOTPSlot
              index={5}
              aria-invalid={Boolean(fieldError)}
              className="size-14 text-xl"
            />
          </InputOTPGroup>
        </InputOTP>
      </div>

      {expired ? (
        <Button
          type="button"
          size="lg"
          onClick={onResend}
          disabled={isPending}
          className="mt-2 h-11 bg-[#0f2b46] text-white hover:bg-[#0f2b46]/90"
        >
          Reenviar código
        </Button>
      ) : (
        <Button
          type="submit"
          size="lg"
          className="mt-2 h-11 bg-[#0f2b46] text-white hover:bg-[#0f2b46]/90"
          disabled={isPending}
        >
          {isPending ? (
            <>
              <Loader className="size-4.5 animate-spin" />
              Verificando…
            </>
          ) : (
            "Confirmar código"
          )}
        </Button>
      )}

      <button
        type="button"
        onClick={onUseAnotherEmail}
        disabled={isPending}
        className="text-sm text-muted-foreground hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
      >
        Usar otro correo
      </button>
    </form>
  );
}
