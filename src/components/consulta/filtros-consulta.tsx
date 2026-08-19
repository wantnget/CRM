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
  /**
   * Rango de imputación vigente. Se omite donde la pantalla no lo ofrece —el
   * cargue de Metas reusa esta barra solo por los selectores—, y entonces los
   * dos botones no se dibujan.
   */
  rango?: "mes" | "anio";
  /** Periodo 'MM-YYYY' y año, solo para rotular los dos botones. */
  periodoEtiqueta?: string;
  anio?: string;
  /** El Gestor no elige de quién ve datos: solo se le ofrece el rango. */
  conSelectores?: boolean;
};

export function FiltrosConsulta({
  basePath,
  opciones,
  liderId,
  gestorId,
  rango,
  periodoEtiqueta,
  anio,
  conSelectores = true,
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
  function navegar(lider: string, gestor: string, rangoNuevo: "mes" | "anio" | undefined = rango) {
    const params = new URLSearchParams();
    if (lider !== TODOS) params.set("lider", lider);
    if (gestor !== TODOS) params.set("gestor", gestor);
    // El rango viaja siempre: si se omitiera, cambiar de gestor devolvería la
    // vista al mes actual sin que nadie lo pidiera.
    if (rangoNuevo) params.set("rango", rangoNuevo);
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

        {/* El rango aplica a las dos pestañas: ambas leen del mismo recorte. */}
        {rango ? (
        <div className="inline-flex rounded-lg border border-border p-0.5">
          <button
            type="button"
            aria-pressed={rango === "mes"}
            onClick={() => navegar(liderSeleccionado, gestorSeleccionado, "mes")}
            className={
              rango === "mes"
                ? "rounded-md bg-want-navy px-3 py-1.5 text-xs font-medium text-white"
                : "rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:text-foreground"
            }
          >
            Mes {periodoEtiqueta}
          </button>
          <button
            type="button"
            aria-pressed={rango === "anio"}
            onClick={() => navegar(liderSeleccionado, gestorSeleccionado, "anio")}
            className={
              rango === "anio"
                ? "rounded-md bg-want-navy px-3 py-1.5 text-xs font-medium text-white"
                : "rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:text-foreground"
            }
          >
            Acumulado {anio}
          </button>
        </div>
        ) : null}

        {conSelectores && opciones.lideres.length > 0 ? (
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
        ) : null}

        {conSelectores ? (
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
        ) : null}
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
