import Image from "next/image";
import { Button } from "@/components/ui/button";

type SessionExpiredModalProps = {
  open: boolean;
  onSignIn: () => void;
};

export function SessionExpiredModal({
  open,
  onSignIn,
}: SessionExpiredModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-sm rounded-lg bg-white p-8 text-center shadow-xl">
        <Image
          src="/logos/imagen.png"
          alt="WANT Tech 4 All"
          width={140}
          height={42}
          className="mx-auto h-auto w-[120px]"
        />

        <div className="mt-6">
          <h2 className="text-xl font-semibold tracking-tight">
            Tu sesión ha expirado
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Por seguridad, inicia sesión nuevamente para continuar.
          </p>
        </div>

        <Button
          onClick={onSignIn}
          size="lg"
          className="mt-6 h-11 w-full bg-[#0f2b46] text-white hover:bg-[#0f2b46]/90"
        >
          Iniciar sesión
        </Button>
      </div>
    </div>
  );
}
