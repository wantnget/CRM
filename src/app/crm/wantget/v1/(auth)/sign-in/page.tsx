import { Suspense } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { SignInForm } from "@/components/form/sign-in-form";

export const metadata: Metadata = {
  title: "Inicie sesión — WANT Tech 4 All",
};

export default function SignInPage() {
  return (
    <div className="grid flex-1 lg:grid-cols-2">
      <div className="flex flex-col justify-between bg-[#0f2b46] px-5 py-10 sm:px-10 sm:py-12 lg:px-[72px] lg:py-16 text-white">
        <Image
          src="/logos/imagen.png"
          alt="WANT Tech 4 All"
          width={208}
          height={62}
          className="h-auto w-40 sm:w-[208px] brightness-0 invert"
          priority
        />
        <div className="max-w-[460px]">
          <Badge
            variant="outline"
            className="w-fit gap-2 rounded-full border-amber-500/50 px-3 py-[5px] text-[11px] font-semibold tracking-[0.09em] text-amber-500 uppercase"
          >
            Plataforma CRM
          </Badge>
          <h1 className="mt-4 mb-3 sm:mt-5 sm:mb-3.5 text-[28px] sm:text-4xl lg:text-[44px] leading-[1.08] font-bold tracking-[-0.02em] text-balance">
            Prospección y contacto con el asociado, en un solo lugar.
          </h1>
          <p className="text-sm sm:text-base leading-[1.6] text-white/72">
            Gestione afiliación, colocación, ahorro, CDAT, seguros y servicios
            sociales con seguimiento por oficina, líder y gestor.
          </p>
        </div>

        <div className="text-xs text-white/45">
          Fondo Want · NIT 900100200 · Ambiente de demostración
        </div>
      </div>

      <div className="flex items-center justify-center bg-slate-50 px-5 py-10 sm:px-16 sm:py-12">
        <div className="w-full max-w-md p-0 sm:p-8 lg:p-12">
          <p className="text-xs font-medium tracking-widest text-muted-foreground">
            INGRESO
          </p>
          <h2 className="mt-1 text-3xl font-semibold tracking-tight">
            Inicie sesión
          </h2>
          <p className="mt-1 text-base text-muted-foreground">
            Ingrese su correo para recibir un código de verificación.
          </p>

          <div className="mt-8">
            <Suspense fallback={null}>
              <SignInForm />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}
