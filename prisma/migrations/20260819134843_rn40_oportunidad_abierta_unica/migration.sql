-- RN-40: "Un asociado puede tener varias oportunidades simultáneas, una por
-- producto. Validar que no exista más de una oportunidad abierta
-- (estado = PROSPECCION) para la misma pareja asociado + producto."
--
-- Va como índice único parcial y no solo como validación en la aplicación:
-- dos envíos simultáneos del formulario pasarían la validación y crearían el
-- duplicado. Prisma no expresa índices parciales en el schema, así que se
-- declara acá; `prisma migrate diff` no lo detecta como drift.
CREATE UNIQUE INDEX "ux_oportunidad_abierta_asociado_producto"
  ON "oportunidad" ("asociado_id", "producto_codigo")
  WHERE estado = 'PROSPECCION';
