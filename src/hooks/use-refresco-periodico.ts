"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Vuelve a pedir los datos del servidor cada cierto tiempo.
 *
 * Es la forma más simple de ver los mensajes entrantes sin recargar: el webhook
 * los guarda y la pantalla los recoge en el siguiente ciclo. Se salta el
 * refresco cuando la pestaña está en segundo plano para no consultar de gratis.
 */
export function useRefrescoPeriodico(segundos: number) {
  const router = useRouter();

  useEffect(() => {
    const intervalo = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, segundos * 1000);

    return () => clearInterval(intervalo);
  }, [router, segundos]);
}
