"use client";

import { useCallback, useRef, useState } from "react";
import type { Call, Device } from "@twilio/voice-sdk";

/**
 * Softphone WebRTC del canal Llamada (mismo patrón que alivio-app):
 * un Device de @twilio/voice-sdk se registra con un Access Token propio del
 * gestor y origina la llamada; Twilio conecta ese Device con un número real
 * por PSTN vía el TwiML de /api/voz/twiml.
 */

export type EstadoLlamada =
  | "inactivo"
  | "conectando"
  | "timbrando"
  | "en_llamada"
  | "error";

export function useSoftphone() {
  const [estado, setEstado] = useState<EstadoLlamada>("inactivo");
  const [duracion, setDuracion] = useState(0);
  const deviceRef = useRef<Device | null>(null);
  const callRef = useRef<Call | null>(null);
  const inicioRef = useRef<number | null>(null);
  const intervaloRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const detenerCronometro = useCallback(() => {
    if (intervaloRef.current) {
      clearInterval(intervaloRef.current);
      intervaloRef.current = null;
    }
    inicioRef.current = null;
    setDuracion(0);
  }, []);

  const iniciarCronometro = useCallback(() => {
    inicioRef.current = Date.now();
    intervaloRef.current = setInterval(() => {
      if (inicioRef.current) {
        setDuracion(Math.floor((Date.now() - inicioRef.current) / 1000));
      }
    }, 1000);
  }, []);

  const obtenerDevice = useCallback(async () => {
    if (deviceRef.current) return deviceRef.current;

    const respuesta = await fetch("/api/voz/token");
    if (!respuesta.ok) throw new Error("No se pudo obtener el token de voz");
    const { token } = await respuesta.json();

    const { Device } = await import("@twilio/voice-sdk");
    const device = new Device(token, { logLevel: "error" });
    await device.register();

    deviceRef.current = device;
    return device;
  }, []);

  const llamar = useCallback(async (destino: string) => {
    setEstado("conectando");

    try {
      const device = await obtenerDevice();
      const call = await device.connect({ params: { To: destino } });
      callRef.current = call;

      call.on("ringing", () => setEstado("timbrando"));
      call.on("accept", () => {
        setEstado("en_llamada");
        iniciarCronometro();
      });
      call.on("disconnect", () => {
        setEstado("inactivo");
        detenerCronometro();
        callRef.current = null;
      });
      call.on("cancel", () => {
        setEstado("inactivo");
        detenerCronometro();
        callRef.current = null;
      });
      call.on("error", (error) => {
        console.error("[softphone]", error);
        setEstado("error");
        detenerCronometro();
        callRef.current = null;
      });
    } catch (error) {
      console.error("[softphone]", error);
      setEstado("error");
    }
  }, [obtenerDevice, iniciarCronometro, detenerCronometro]);

  const colgar = useCallback(() => {
    callRef.current?.disconnect();
  }, []);

  return { estado, duracion, llamar, colgar };
}
