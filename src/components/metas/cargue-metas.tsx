"use client";

import { useActionState, useEffect, useId, useRef, useState } from "react";
import { CircleAlert, CircleCheck, FileSpreadsheet, UploadCloud, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cargarMetas, type ResultadoCargue } from "@/lib/acciones/cargue-metas";
import { formatoFechaHora, formatoUnidades } from "@/lib/formato";
import type { ResumenCargue } from "@/lib/metas";

type CargueMetasProps = {
  resumen: ResumenCargue;
  periodo: string;
};

export function CargueMetas({ resumen, periodo }: CargueMetasProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [archivo, setArchivo] = useState<File | null>(null);
  const [arrastrando, setArrastrando] = useState(false);
  const [resultado, formAction, pendiente] = useActionState<ResultadoCargue | null, FormData>(
    cargarMetas,
    null,
  );
  // Se guarda el resultado ya descartado en vez de un booleano "mostrar": así
  // la visibilidad se deriva del render y el efecto no necesita un setState
  // sincrónico, que dispararía un segundo render en cascada.
  const [descartado, setDescartado] = useState<ResultadoCargue | null>(null);
  const mostrarResultado = resultado !== null && resultado !== descartado;

  useEffect(() => {
    if (!mostrarResultado) return;

    // Un cargue sin filas con error deja el formulario limpio para el siguiente.
    if (resultado.filasError === 0) cancelar();

    const timeout = setTimeout(() => setDescartado(resultado), 4000);
    return () => clearTimeout(timeout);
  }, [resultado, mostrarResultado]);

  function onDrop(event: React.DragEvent<HTMLElement>) {
    event.preventDefault();
    setArrastrando(false);
    const primero = event.dataTransfer.files[0];
    if (!primero || !inputRef.current) return;

    // El input nativo no recibe el archivo soltado por sí solo: hay que
    // asignárselo a mano para que quede en el FormData al enviar.
    const transferencia = new DataTransfer();
    transferencia.items.add(primero);
    inputRef.current.files = transferencia.files;
    setArchivo(primero);
  }

  function cancelar() {
    setArchivo(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
        Cargue
      </p>
      <h2 className="mt-1 text-base font-semibold text-want-navy">
        Metas por gestor y producto
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Cargue un archivo CSV con las columnas Gestor, Producto, Líder, Mes y
        Meta. El cargue reemplaza las metas del periodo indicado.
      </p>

      <form action={formAction} className="mt-4 flex flex-col gap-3">
        {/* El input vive siempre montado: si se saca del árbol al elegir un
            archivo, el form pierde el campo "archivo" al enviar. */}
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          name="archivo"
          accept=".csv"
          className="sr-only"
          onChange={(event) => setArchivo(event.target.files?.[0] ?? null)}
        />

        {archivo ? (
          <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
            <span className="flex min-w-0 items-center gap-2">
              <FileSpreadsheet className="size-4 shrink-0 text-want-naranja" />
              <span className="truncate text-sm font-medium text-foreground">
                {archivo.name}
              </span>
            </span>
            <button
              type="button"
              onClick={cancelar}
              className="inline-flex size-11 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground sm:size-6"
              aria-label="Quitar archivo"
            >
              <X className="size-4" />
            </button>
          </div>
        ) : (
          <label
            htmlFor={inputId}
            onDragOver={(event) => {
              event.preventDefault();
              setArrastrando(true);
            }}
            onDragLeave={() => setArrastrando(false)}
            onDrop={onDrop}
            className={`flex cursor-pointer flex-col items-center gap-3 rounded-lg border-2 border-dashed px-6 py-10 text-center transition-colors ${
              arrastrando ? "border-want-naranja bg-want-naranja/5" : "border-border"
            }`}
          >
            <UploadCloud className="size-6 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Arrastre el archivo o selecciónelo
            </span>
            <span className="inline-flex h-11 items-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground sm:h-8">
              Seleccionar CSV
            </span>
          </label>
        )}

        {resultado && mostrarResultado ? (
          <div
            className={`rounded-lg border px-4 py-3 text-sm ${
              resultado.filasError > 0
                ? "border-want-rojo/30 bg-want-rojo/5"
                : "border-want-verde/30 bg-want-verde/5"
            }`}
          >
            <p className="flex items-center gap-2 font-medium text-foreground">
              {resultado.filasError > 0 ? (
                <CircleAlert className="size-4 text-want-rojo" />
              ) : (
                <CircleCheck className="size-4 text-want-verde" />
              )}
              {resultado.filasOk} de {resultado.filasTotales} filas cargadas
            </p>
            {resultado.errores.length > 0 ? (
              <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-muted-foreground">
                {resultado.errores.slice(0, 8).map((error) => (
                  <li key={error}>{error}</li>
                ))}
                {resultado.errores.length > 8 ? (
                  <li>y {resultado.errores.length - 8} error(es) más.</li>
                ) : null}
              </ul>
            ) : null}
          </div>
        ) : null}

        {archivo ? (
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={cancelar}>
              Cancelar
            </Button>
            <Button type="submit" disabled={pendiente}>
              {pendiente ? "Guardando…" : "Guardar"}
            </Button>
          </div>
        ) : null}
      </form>

      <div className="mt-5 flex flex-col gap-1 border-t border-border pt-4 text-sm">
        <p className="text-muted-foreground">
          Último cargue:{" "}
          <span className="font-medium text-foreground">
            {resumen.ultimoCargue ? formatoFechaHora(resumen.ultimoCargue) : "Sin cargues registrados"}
          </span>
        </p>
        <p className="text-muted-foreground">
          Registros vigentes:{" "}
          <span className="font-medium text-foreground">
            {formatoUnidades(resumen.registrosVigentes)} registros
          </span>
        </p>
        <p className="text-muted-foreground">
          Periodo: <span className="font-medium text-foreground">{periodo}</span>
        </p>
      </div>
    </div>
  );
}
