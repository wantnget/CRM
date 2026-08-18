"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "@/lib/auth-client";
import { SessionExpiredModal } from "@/components/session-expired-modal";

/**
 * Vigila el cierre de la ventana de sesión (RN-28). Cuando `session.expiresAt`
 * llega, muestra el modal y obliga a volver a autenticarse.
 *
 * Vivía dentro de topbar.tsx; se extrajo porque el sidebar reemplazó a esa
 * barra y la vigilancia no debía perderse. No renderiza nada mientras la
 * sesión está vigente.
 */
export function SessionWatcher() {
  const { data: session } = useSession();
  const [expirada, setExpirada] = useState(false);
  const router = useRouter();

  const expiraEnMs = session
    ? new Date(session.session.expiresAt).getTime()
    : null;

  useEffect(() => {
    if (!expiraEnMs) return;

    // El primer cálculo va dentro del intervalo para no llamar a setState de
    // forma sincrónica dentro del efecto.
    const revisar = () => setExpirada(expiraEnMs - Date.now() <= 0);
    const intervalo = setInterval(revisar, 1000);
    return () => clearInterval(intervalo);
  }, [expiraEnMs]);

  function volverAIniciarSesion() {
    signOut().finally(() => {
      router.push("/crm/wantget/v1/sign-in");
      router.refresh();
    });
  }

  return (
    <SessionExpiredModal
      open={expirada}
      onSignIn={volverAIniciarSesion}
    />
  );
}
