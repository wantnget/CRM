-- RN-37 / RN-38: el cierre de una oportunidad va acompañado de su resultado y
-- de su fecha, y una oportunidad que no está en CIERRE no tiene ninguno de los
-- dos. Es el CHECK ck_oportunidad_cierre_coherente del spec.
--
-- De los cuatro CHECK que el spec define para `oportunidad` este es el único
-- que los datos de referencia satisfacen hoy:
--
--   - ck_oportunidad_estado_coherente ((estado = 'CERRADO') = (etapa = 'CIERRE'))
--     lo violan las 2 filas de INC-04, que traen estado Prospección con etapa
--     Finaliza - No Venta.
--   - ck_oportunidad_venta_con_valor lo violan las 5 filas de INC-05, ventas
--     cerradas sin valor.
--   - ck_oportunidad_valor_por_unidad no se puede expresar como CHECK: la
--     unidad de medida vive en `producto`, y un CHECK no consulta otra tabla.
--     Necesita trigger o una columna redundante.
--
-- Los tres se hacen cumplir en las server actions de Prospección. Ponerlos en
-- la base exige antes decidir qué hacer con esos datos del Excel.
ALTER TABLE "oportunidad"
  ADD CONSTRAINT "ck_oportunidad_cierre_coherente" CHECK (
    (etapa = 'CIERRE' AND resultado_cierre IS NOT NULL AND fecha_cierre IS NOT NULL)
    OR
    (etapa <> 'CIERRE' AND resultado_cierre IS NULL AND fecha_cierre IS NULL)
  );
