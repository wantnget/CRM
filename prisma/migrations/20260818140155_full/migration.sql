-- CreateTable
CREATE TABLE "producto" (
    "codigo" VARCHAR(30) NOT NULL,
    "nombre" VARCHAR(60) NOT NULL,
    "unidad_medida" "UnidadMedidaProducto" NOT NULL,
    "orden" INTEGER NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "producto_pkey" PRIMARY KEY ("codigo")
);

-- CreateTable
CREATE TABLE "canal_comunicacion" (
    "codigo" VARCHAR(30) NOT NULL,
    "nombre" VARCHAR(60) NOT NULL,
    "medio" "MedioComunicacion" NOT NULL,
    "direccion" "DireccionComunicacion" NOT NULL,
    "orden" INTEGER NOT NULL,

    CONSTRAINT "canal_comunicacion_pkey" PRIMARY KEY ("codigo")
);

-- CreateTable
CREATE TABLE "compania" (
    "id" UUID NOT NULL,
    "nit" VARCHAR(20) NOT NULL,
    "digito_verificacion" CHAR(1),
    "razon_social" VARCHAR(200) NOT NULL,
    "estado" "EstadoGenerico" NOT NULL DEFAULT 'ACTIVO',
    "hora_cierre_sesion" VARCHAR(5) NOT NULL DEFAULT '18:30',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID NOT NULL,
    "updated_at" TIMESTAMPTZ(6),
    "updated_by" UUID,

    CONSTRAINT "compania_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "oficina" (
    "id" UUID NOT NULL,
    "compania_id" UUID NOT NULL,
    "codigo" VARCHAR(20) NOT NULL,
    "nombre" VARCHAR(120) NOT NULL,
    "estado" "EstadoGenerico" NOT NULL DEFAULT 'ACTIVO',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID NOT NULL,
    "updated_at" TIMESTAMPTZ(6),
    "updated_by" UUID,

    CONSTRAINT "oficina_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuario" (
    "id" UUID NOT NULL,
    "compania_id" UUID,
    "email" VARCHAR(160) NOT NULL,
    "numero_identificacion" VARCHAR(20) NOT NULL,
    "tipo_identificacion" "TipoIdentificacion" NOT NULL DEFAULT 'CC',
    "nombre_completo" VARCHAR(200) NOT NULL,
    "telefono_whatsapp" VARCHAR(20) NOT NULL,
    "rol_codigo" VARCHAR(30) NOT NULL,
    "oficina_id" UUID,
    "estado" "EstadoGenerico" NOT NULL DEFAULT 'ACTIVO',
    "ultimo_acceso_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMPTZ(6),
    "updated_by" UUID,

    CONSTRAINT "usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuario_oficina" (
    "id" UUID NOT NULL,
    "compania_id" UUID NOT NULL,
    "usuario_id" UUID NOT NULL,
    "oficina_id" UUID NOT NULL,
    "vigente" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID NOT NULL,

    CONSTRAINT "usuario_oficina_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuario_canal" (
    "id" UUID NOT NULL,
    "compania_id" UUID NOT NULL,
    "usuario_id" UUID NOT NULL,
    "canal_codigo" VARCHAR(30) NOT NULL,
    "habilitado" BOOLEAN NOT NULL DEFAULT false,
    "updated_at" TIMESTAMPTZ(6),
    "updated_by" UUID,

    CONSTRAINT "usuario_canal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asignacion_gestor_lider" (
    "id" UUID NOT NULL,
    "compania_id" UUID NOT NULL,
    "gestor_id" UUID NOT NULL,
    "lider_id" UUID NOT NULL,
    "vigente_desde" DATE NOT NULL,
    "vigente_hasta" DATE,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID NOT NULL,

    CONSTRAINT "asignacion_gestor_lider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "codigo_verificacion" (
    "id" UUID NOT NULL,
    "usuario_id" UUID NOT NULL,
    "codigo_hash" VARCHAR(255) NOT NULL,
    "canal_envio" VARCHAR(20) NOT NULL DEFAULT 'WHATSAPP',
    "destino_enmascarado" VARCHAR(30) NOT NULL,
    "generado_at" TIMESTAMPTZ(6) NOT NULL,
    "expira_at" TIMESTAMPTZ(6) NOT NULL,
    "consumido_at" TIMESTAMPTZ(6),
    "estado" "EstadoCodigoVerificacion" NOT NULL DEFAULT 'VIGENTE',
    "intentos_fallidos" SMALLINT NOT NULL DEFAULT 0,
    "reenvio_de_id" UUID,
    "ip_solicitud" INET,
    "user_agent" TEXT,

    CONSTRAINT "codigo_verificacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sesion" (
    "id" UUID NOT NULL,
    "usuario_id" UUID NOT NULL,
    "compania_id" UUID,
    "codigo_verificacion_id" UUID NOT NULL,
    "inicio_at" TIMESTAMPTZ(6) NOT NULL,
    "cierre_programado_at" TIMESTAMPTZ(6) NOT NULL,
    "cierre_real_at" TIMESTAMPTZ(6),
    "tipo_cierre" "TipoCierreSesion",
    "jti" VARCHAR(80) NOT NULL,
    "ip" INET,
    "user_agent" TEXT,

    CONSTRAINT "sesion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asociado" (
    "id" UUID NOT NULL,
    "compania_id" UUID NOT NULL,
    "numero_identificacion" VARCHAR(20) NOT NULL,
    "tipo_identificacion" "TipoIdentificacion" NOT NULL DEFAULT 'CC',
    "nombre_completo" VARCHAR(200) NOT NULL,
    "telefono_whatsapp" VARCHAR(20),
    "email" VARCHAR(160),
    "oficina_id" UUID NOT NULL,
    "estado" "EstadoGenerico" NOT NULL DEFAULT 'ACTIVO',
    "origen" VARCHAR(40),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID NOT NULL,
    "updated_at" TIMESTAMPTZ(6),
    "updated_by" UUID,

    CONSTRAINT "asociado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asignacion_asociado" (
    "id" UUID NOT NULL,
    "compania_id" UUID NOT NULL,
    "asociado_id" UUID NOT NULL,
    "gestor_id" UUID NOT NULL,
    "asignado_por_id" UUID NOT NULL,
    "fecha_asignacion" TIMESTAMPTZ(6) NOT NULL,
    "vigente" BOOLEAN NOT NULL DEFAULT true,
    "fecha_desasignacion" TIMESTAMPTZ(6),
    "observacion" TEXT,

    CONSTRAINT "asignacion_asociado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "oportunidad" (
    "id" UUID NOT NULL,
    "compania_id" UUID NOT NULL,
    "asociado_id" UUID NOT NULL,
    "producto_codigo" VARCHAR(30) NOT NULL,
    "gestor_id" UUID NOT NULL,
    "lider_id" UUID NOT NULL,
    "oficina_id" UUID NOT NULL,
    "estado" "EstadoOportunidad" NOT NULL DEFAULT 'PROSPECCION',
    "etapa" "EtapaProspeccion" NOT NULL DEFAULT 'CONTACTO',
    "resultado_cierre" "ResultadoCierre",
    "cantidad" INTEGER,
    "monto" DECIMAL(18,2),
    "fecha_apertura" TIMESTAMPTZ(6) NOT NULL,
    "fecha_ultima_gestion" TIMESTAMPTZ(6),
    "fecha_cierre" TIMESTAMPTZ(6),
    "periodo" CHAR(7) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID NOT NULL,
    "updated_at" TIMESTAMPTZ(6),
    "updated_by" UUID,

    CONSTRAINT "oportunidad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gestion" (
    "id" UUID NOT NULL,
    "compania_id" UUID NOT NULL,
    "oportunidad_id" UUID NOT NULL,
    "asociado_id" UUID NOT NULL,
    "gestor_id" UUID NOT NULL,
    "fecha_hora" TIMESTAMPTZ(6) NOT NULL,
    "etapa" "EtapaProspeccion" NOT NULL,
    "canal_codigo" VARCHAR(30),
    "direccion" "DireccionComunicacion",
    "contenido" TEXT,
    "observacion" TEXT,
    "resultado_contacto" "ResultadoContacto",
    "proximo_contacto_at" TIMESTAMPTZ(6),
    "mensaje_externo_id" VARCHAR(120),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID NOT NULL,

    CONSTRAINT "gestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meta" (
    "id" UUID NOT NULL,
    "compania_id" UUID NOT NULL,
    "periodo" CHAR(7) NOT NULL,
    "rol_objetivo" VARCHAR(30) NOT NULL,
    "usuario_id" UUID NOT NULL,
    "lider_id" UUID,
    "producto_codigo" VARCHAR(30) NOT NULL,
    "meta_cantidad" INTEGER,
    "meta_monto" DECIMAL(18,2),
    "cargue_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID NOT NULL,
    "updated_at" TIMESTAMPTZ(6),
    "updated_by" UUID,

    CONSTRAINT "meta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cargue_archivo" (
    "id" UUID NOT NULL,
    "compania_id" UUID NOT NULL,
    "tipo" "TipoCargue" NOT NULL,
    "usuario_id" UUID NOT NULL,
    "nombre_archivo" VARCHAR(255) NOT NULL,
    "ruta_almacenamiento" TEXT,
    "hash_archivo" VARCHAR(64),
    "periodo" CHAR(7),
    "filas_totales" INTEGER,
    "filas_ok" INTEGER,
    "filas_error" INTEGER,
    "estado" "EstadoCargue" NOT NULL DEFAULT 'PENDIENTE',
    "log_errores" JSONB,
    "iniciado_at" TIMESTAMPTZ(6) NOT NULL,
    "finalizado_at" TIMESTAMPTZ(6),

    CONSTRAINT "cargue_archivo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auditoria" (
    "id" BIGSERIAL NOT NULL,
    "compania_id" UUID,
    "tabla" VARCHAR(60) NOT NULL,
    "registro_id" UUID NOT NULL,
    "operacion" "OperacionAuditoria" NOT NULL,
    "usuario_id" UUID,
    "sesion_id" UUID,
    "valores_anteriores" JSONB,
    "valores_nuevos" JSONB,
    "ip" INET,
    "ocurrido_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auditoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_MetaToOportunidad" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL,

    CONSTRAINT "_MetaToOportunidad_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "compania_nit_key" ON "compania"("nit");

-- CreateIndex
CREATE INDEX "compania_estado_idx" ON "compania"("estado");

-- CreateIndex
CREATE UNIQUE INDEX "oficina_compania_id_codigo_key" ON "oficina"("compania_id", "codigo");

-- CreateIndex
CREATE UNIQUE INDEX "usuario_email_key" ON "usuario"("email");

-- CreateIndex
CREATE INDEX "usuario_compania_id_rol_codigo_estado_idx" ON "usuario"("compania_id", "rol_codigo", "estado");

-- CreateIndex
CREATE INDEX "usuario_oficina_id_idx" ON "usuario"("oficina_id");

-- CreateIndex
CREATE UNIQUE INDEX "usuario_compania_id_numero_identificacion_key" ON "usuario"("compania_id", "numero_identificacion");

-- CreateIndex
CREATE UNIQUE INDEX "usuario_oficina_usuario_id_oficina_id_key" ON "usuario_oficina"("usuario_id", "oficina_id");

-- CreateIndex
CREATE UNIQUE INDEX "usuario_canal_usuario_id_canal_codigo_key" ON "usuario_canal"("usuario_id", "canal_codigo");

-- CreateIndex
CREATE INDEX "asignacion_gestor_lider_gestor_id_vigente_desde_idx" ON "asignacion_gestor_lider"("gestor_id", "vigente_desde");

-- CreateIndex
CREATE INDEX "asignacion_gestor_lider_lider_id_idx" ON "asignacion_gestor_lider"("lider_id");

-- CreateIndex
CREATE INDEX "codigo_verificacion_usuario_id_estado_expira_at_idx" ON "codigo_verificacion"("usuario_id", "estado", "expira_at");

-- CreateIndex
CREATE INDEX "codigo_verificacion_expira_at_idx" ON "codigo_verificacion"("expira_at");

-- CreateIndex
CREATE UNIQUE INDEX "sesion_codigo_verificacion_id_key" ON "sesion"("codigo_verificacion_id");

-- CreateIndex
CREATE UNIQUE INDEX "sesion_jti_key" ON "sesion"("jti");

-- CreateIndex
CREATE INDEX "sesion_usuario_id_cierre_real_at_idx" ON "sesion"("usuario_id", "cierre_real_at");

-- CreateIndex
CREATE INDEX "sesion_cierre_programado_at_idx" ON "sesion"("cierre_programado_at");

-- CreateIndex
CREATE INDEX "asociado_oficina_id_idx" ON "asociado"("oficina_id");

-- CreateIndex
CREATE INDEX "asociado_compania_id_nombre_completo_idx" ON "asociado"("compania_id", "nombre_completo");

-- CreateIndex
CREATE UNIQUE INDEX "asociado_compania_id_numero_identificacion_key" ON "asociado"("compania_id", "numero_identificacion");

-- CreateIndex
CREATE INDEX "asignacion_asociado_gestor_id_vigente_idx" ON "asignacion_asociado"("gestor_id", "vigente");

-- CreateIndex
CREATE INDEX "asignacion_asociado_asociado_id_vigente_idx" ON "asignacion_asociado"("asociado_id", "vigente");

-- CreateIndex
CREATE INDEX "oportunidad_compania_id_periodo_producto_codigo_idx" ON "oportunidad"("compania_id", "periodo", "producto_codigo");

-- CreateIndex
CREATE INDEX "oportunidad_gestor_id_periodo_idx" ON "oportunidad"("gestor_id", "periodo");

-- CreateIndex
CREATE INDEX "oportunidad_lider_id_periodo_idx" ON "oportunidad"("lider_id", "periodo");

-- CreateIndex
CREATE INDEX "oportunidad_oficina_id_periodo_idx" ON "oportunidad"("oficina_id", "periodo");

-- CreateIndex
CREATE INDEX "oportunidad_asociado_id_fecha_apertura_idx" ON "oportunidad"("asociado_id", "fecha_apertura");

-- CreateIndex
CREATE INDEX "oportunidad_estado_etapa_idx" ON "oportunidad"("estado", "etapa");

-- CreateIndex
CREATE INDEX "gestion_oportunidad_id_fecha_hora_idx" ON "gestion"("oportunidad_id", "fecha_hora");

-- CreateIndex
CREATE INDEX "gestion_asociado_id_fecha_hora_idx" ON "gestion"("asociado_id", "fecha_hora");

-- CreateIndex
CREATE INDEX "gestion_gestor_id_fecha_hora_idx" ON "gestion"("gestor_id", "fecha_hora");

-- CreateIndex
CREATE INDEX "meta_periodo_producto_codigo_idx" ON "meta"("periodo", "producto_codigo");

-- CreateIndex
CREATE UNIQUE INDEX "meta_compania_id_periodo_usuario_id_producto_codigo_key" ON "meta"("compania_id", "periodo", "usuario_id", "producto_codigo");

-- CreateIndex
CREATE INDEX "cargue_archivo_compania_id_tipo_iniciado_at_idx" ON "cargue_archivo"("compania_id", "tipo", "iniciado_at");

-- CreateIndex
CREATE INDEX "auditoria_tabla_registro_id_ocurrido_at_idx" ON "auditoria"("tabla", "registro_id", "ocurrido_at");

-- CreateIndex
CREATE INDEX "auditoria_usuario_id_ocurrido_at_idx" ON "auditoria"("usuario_id", "ocurrido_at");

-- CreateIndex
CREATE INDEX "_MetaToOportunidad_B_index" ON "_MetaToOportunidad"("B");

-- AddForeignKey
ALTER TABLE "oficina" ADD CONSTRAINT "oficina_compania_id_fkey" FOREIGN KEY ("compania_id") REFERENCES "compania"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuario" ADD CONSTRAINT "usuario_compania_id_fkey" FOREIGN KEY ("compania_id") REFERENCES "compania"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuario" ADD CONSTRAINT "usuario_rol_codigo_fkey" FOREIGN KEY ("rol_codigo") REFERENCES "rol"("codigo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuario" ADD CONSTRAINT "usuario_oficina_id_fkey" FOREIGN KEY ("oficina_id") REFERENCES "oficina"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuario_oficina" ADD CONSTRAINT "usuario_oficina_compania_id_fkey" FOREIGN KEY ("compania_id") REFERENCES "compania"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuario_oficina" ADD CONSTRAINT "usuario_oficina_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuario_oficina" ADD CONSTRAINT "usuario_oficina_oficina_id_fkey" FOREIGN KEY ("oficina_id") REFERENCES "oficina"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuario_canal" ADD CONSTRAINT "usuario_canal_compania_id_fkey" FOREIGN KEY ("compania_id") REFERENCES "compania"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuario_canal" ADD CONSTRAINT "usuario_canal_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuario_canal" ADD CONSTRAINT "usuario_canal_canal_codigo_fkey" FOREIGN KEY ("canal_codigo") REFERENCES "canal_comunicacion"("codigo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asignacion_gestor_lider" ADD CONSTRAINT "asignacion_gestor_lider_compania_id_fkey" FOREIGN KEY ("compania_id") REFERENCES "compania"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asignacion_gestor_lider" ADD CONSTRAINT "asignacion_gestor_lider_gestor_id_fkey" FOREIGN KEY ("gestor_id") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asignacion_gestor_lider" ADD CONSTRAINT "asignacion_gestor_lider_lider_id_fkey" FOREIGN KEY ("lider_id") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "codigo_verificacion" ADD CONSTRAINT "codigo_verificacion_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "codigo_verificacion" ADD CONSTRAINT "codigo_verificacion_reenvio_de_id_fkey" FOREIGN KEY ("reenvio_de_id") REFERENCES "codigo_verificacion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sesion" ADD CONSTRAINT "sesion_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sesion" ADD CONSTRAINT "sesion_codigo_verificacion_id_fkey" FOREIGN KEY ("codigo_verificacion_id") REFERENCES "codigo_verificacion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asociado" ADD CONSTRAINT "asociado_compania_id_fkey" FOREIGN KEY ("compania_id") REFERENCES "compania"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asociado" ADD CONSTRAINT "asociado_oficina_id_fkey" FOREIGN KEY ("oficina_id") REFERENCES "oficina"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asignacion_asociado" ADD CONSTRAINT "asignacion_asociado_compania_id_fkey" FOREIGN KEY ("compania_id") REFERENCES "compania"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asignacion_asociado" ADD CONSTRAINT "asignacion_asociado_asociado_id_fkey" FOREIGN KEY ("asociado_id") REFERENCES "asociado"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asignacion_asociado" ADD CONSTRAINT "asignacion_asociado_gestor_id_fkey" FOREIGN KEY ("gestor_id") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asignacion_asociado" ADD CONSTRAINT "asignacion_asociado_asignado_por_id_fkey" FOREIGN KEY ("asignado_por_id") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oportunidad" ADD CONSTRAINT "oportunidad_compania_id_fkey" FOREIGN KEY ("compania_id") REFERENCES "compania"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oportunidad" ADD CONSTRAINT "oportunidad_asociado_id_fkey" FOREIGN KEY ("asociado_id") REFERENCES "asociado"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oportunidad" ADD CONSTRAINT "oportunidad_producto_codigo_fkey" FOREIGN KEY ("producto_codigo") REFERENCES "producto"("codigo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oportunidad" ADD CONSTRAINT "oportunidad_gestor_id_fkey" FOREIGN KEY ("gestor_id") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oportunidad" ADD CONSTRAINT "oportunidad_lider_id_fkey" FOREIGN KEY ("lider_id") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oportunidad" ADD CONSTRAINT "oportunidad_oficina_id_fkey" FOREIGN KEY ("oficina_id") REFERENCES "oficina"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gestion" ADD CONSTRAINT "gestion_compania_id_fkey" FOREIGN KEY ("compania_id") REFERENCES "compania"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gestion" ADD CONSTRAINT "gestion_oportunidad_id_fkey" FOREIGN KEY ("oportunidad_id") REFERENCES "oportunidad"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gestion" ADD CONSTRAINT "gestion_asociado_id_fkey" FOREIGN KEY ("asociado_id") REFERENCES "asociado"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gestion" ADD CONSTRAINT "gestion_gestor_id_fkey" FOREIGN KEY ("gestor_id") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gestion" ADD CONSTRAINT "gestion_canal_codigo_fkey" FOREIGN KEY ("canal_codigo") REFERENCES "canal_comunicacion"("codigo") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meta" ADD CONSTRAINT "meta_compania_id_fkey" FOREIGN KEY ("compania_id") REFERENCES "compania"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meta" ADD CONSTRAINT "meta_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meta" ADD CONSTRAINT "meta_lider_id_fkey" FOREIGN KEY ("lider_id") REFERENCES "usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meta" ADD CONSTRAINT "meta_producto_codigo_fkey" FOREIGN KEY ("producto_codigo") REFERENCES "producto"("codigo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meta" ADD CONSTRAINT "meta_cargue_id_fkey" FOREIGN KEY ("cargue_id") REFERENCES "cargue_archivo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cargue_archivo" ADD CONSTRAINT "cargue_archivo_compania_id_fkey" FOREIGN KEY ("compania_id") REFERENCES "compania"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cargue_archivo" ADD CONSTRAINT "cargue_archivo_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auditoria" ADD CONSTRAINT "auditoria_compania_id_fkey" FOREIGN KEY ("compania_id") REFERENCES "compania"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auditoria" ADD CONSTRAINT "auditoria_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auditoria" ADD CONSTRAINT "auditoria_sesion_id_fkey" FOREIGN KEY ("sesion_id") REFERENCES "sesion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_MetaToOportunidad" ADD CONSTRAINT "_MetaToOportunidad_A_fkey" FOREIGN KEY ("A") REFERENCES "meta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_MetaToOportunidad" ADD CONSTRAINT "_MetaToOportunidad_B_fkey" FOREIGN KEY ("B") REFERENCES "oportunidad"("id") ON DELETE CASCADE ON UPDATE CASCADE;
