"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { OpcionesFiltro } from "@/lib/consulta-general";

const TODOS = "todos";

type FiltrosConsultaProps = {
  basePath: string;
  opciones: OpcionesFiltro;
  liderId?: string;
  gestorId?: string;
};

export function FiltrosConsulta({
  basePath,
  opciones,
  liderId,
  gestorId,
}: FiltrosConsultaProps) {
  const router = useRouter();
  const [liderSeleccionado, setLiderSeleccionado] = useState(liderId ?? TODOS);
  const [gestorSeleccionado, setGestorSeleccionado] = useState(gestorId ?? TODOS);

  const gestoresVisibles = useMemo(
    () =>
      liderSeleccionado === TODOS
        ? opciones.gestores
        : opciones.gestores.filter((gestor) => gestor.liderId === liderSeleccionado),
    [opciones.gestores, liderSeleccionado],
  );

  // El filtro se aplica al tiro (sin botón intermedio): cada cambio navega a
  // la misma ruta con los query params actualizados, que es lo que lee el
  // server component para volver a consultar.
  function navegar(lider: string, gestor: string) {
    const params = new URLSearchParams();
    if (lider !== TODOS) params.set("lider", lider);
    if (gestor !== TODOS) params.set("gestor", gestor);
    const query = params.toString();
    router.push(query ? `${basePath}?${query}` : basePath);
  }

  function alCambiarLider(valor: string) {
    setLiderSeleccionado(valor);

    // El gestor elegido puede quedar fuera del líder nuevo: si ya no aplica,
    // vuelve a "Todos" en vez de mandar un filtro inconsistente.
    const gestorSigueValido =
      valor === TODOS ||
      opciones.gestores.some((g) => g.id === gestorSeleccionado && g.liderId === valor);
    const gestorFinal = gestorSigueValido ? gestorSeleccionado : TODOS;
    if (!gestorSigueValido) setGestorSeleccionado(TODOS);

    navegar(valor, gestorFinal);
  }

  function alCambiarGestor(valor: string) {
    setGestorSeleccionado(valor);
    navegar(liderSeleccionado, valor);
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-card px-5 py-4">
      <div className="flex flex-wrap items-center gap-5">
        <span className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
          Filtros
        </span>

        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          Líder
          <Select value={liderSeleccionado} onValueChange={alCambiarLider}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={TODOS}>Todos</SelectItem>
              {opciones.lideres.map((lider) => (
                <SelectItem key={lider.id} value={lider.id}>
                  {lider.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>

        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          Gestor
          <Select value={gestorSeleccionado} onValueChange={alCambiarGestor}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={TODOS}>Todos</SelectItem>
              {gestoresVisibles.map((gestor) => (
                <SelectItem key={gestor.id} value={gestor.id}>
                  {gestor.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => router.refresh()}
      >
        <RefreshCw className="size-3.5" />
        Actualizar
      </Button>
    </div>
  );
}
