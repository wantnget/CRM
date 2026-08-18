const formatoNumero = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 0 });

export function formatoUnidades(valor: number) {
  return formatoNumero.format(valor);
}

export function formatoMonto(valor: number) {
  return `$ ${formatoNumero.format(valor)}`;
}

export function formatoPorUnidadMedida(valor: number, unidadMedida: "UNIDADES" | "MONTO") {
  return unidadMedida === "MONTO" ? formatoMonto(valor) : formatoUnidades(valor);
}

const formatoFecha = new Intl.DateTimeFormat("es-CO", {
  timeZone: "America/Bogota",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

export function formatoFechaHora(fecha: Date) {
  return formatoFecha.format(fecha).replace(",", "");
}
