-- CreateEnum
CREATE TYPE "EstadoGenerico" AS ENUM ('ACTIVO', 'INACTIVO');

-- CreateEnum
CREATE TYPE "AmbitoRol" AS ENUM ('GLOBAL', 'COMPANIA', 'OFICINA', 'PROPIO', 'PENDIENTE_DEFINIR');

-- CreateEnum
CREATE TYPE "UnidadMedidaProducto" AS ENUM ('UNIDADES', 'MONTO');

-- CreateEnum
CREATE TYPE "EstadoOportunidad" AS ENUM ('PROSPECCION', 'CERRADO');

-- CreateEnum
CREATE TYPE "EtapaProspeccion" AS ENUM ('CONTACTO', 'OFERTA', 'CIERRE');

-- CreateEnum
CREATE TYPE "ResultadoCierre" AS ENUM ('VENTA', 'NO_VENTA');

-- CreateEnum
CREATE TYPE "DireccionComunicacion" AS ENUM ('ENTRADA', 'SALIDA');

-- CreateEnum
CREATE TYPE "MedioComunicacion" AS ENUM ('WHATSAPP', 'EMAIL');

-- CreateEnum
CREATE TYPE "TipoCierreSesion" AS ENUM ('MANUAL', 'AUTOMATICO', 'EXPIRACION_TOKEN');

-- CreateEnum
CREATE TYPE "EstadoCodigoVerificacion" AS ENUM ('VIGENTE', 'CONSUMIDO', 'EXPIRADO', 'ANULADO');

-- CreateEnum
CREATE TYPE "TipoCargue" AS ENUM ('METAS', 'CAMPANAS', 'COMUNICACION_MASIVA');

-- CreateEnum
CREATE TYPE "EstadoCargue" AS ENUM ('PENDIENTE', 'PROCESANDO', 'PROCESADO', 'PROCESADO_CON_ERRORES', 'FALLIDO');

-- CreateEnum
CREATE TYPE "OperacionAuditoria" AS ENUM ('INSERT', 'UPDATE', 'CAMBIO_ESTADO', 'LOGIN', 'LOGOUT', 'CARGUE');

-- CreateEnum
CREATE TYPE "TipoIdentificacion" AS ENUM ('CC', 'CE', 'TI', 'NIT', 'PAS', 'PEP');

-- CreateEnum
CREATE TYPE "ResultadoContacto" AS ENUM ('EFECTIVO', 'NO_CONTESTA', 'NUMERO_ERRADO', 'SOLICITA_LLAMAR_DESPUES', 'OTRO');

-- CreateTable
CREATE TABLE "rol" (
    "codigo" VARCHAR(30) NOT NULL,
    "nombre" VARCHAR(60) NOT NULL,
    "ambito" "AmbitoRol" NOT NULL,
    "orden" INTEGER NOT NULL,
    "descripcion" TEXT,

    CONSTRAINT "rol_pkey" PRIMARY KEY ("codigo")
);
