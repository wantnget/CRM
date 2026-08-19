-- Unifica la identidad en la tabla `usuario`.
-- El modelo `user` de better-auth pasa a ser `usuario`; las tablas `sesion` y
-- `codigo_verificacion` del diseño preliminar se reemplazan por `session` y
-- `verification`. `auditoria.sesion_id` se re-apunta a `session`.
-- Todas las tablas afectadas estaban vacías al aplicar esta migración.

-- DropForeignKey
ALTER TABLE "account" DROP CONSTRAINT "account_userId_fkey";

-- DropForeignKey
ALTER TABLE "auditoria" DROP CONSTRAINT "auditoria_sesion_id_fkey";

-- DropForeignKey
ALTER TABLE "codigo_verificacion" DROP CONSTRAINT "codigo_verificacion_reenvio_de_id_fkey";

-- DropForeignKey
ALTER TABLE "codigo_verificacion" DROP CONSTRAINT "codigo_verificacion_usuario_id_fkey";

-- DropForeignKey
ALTER TABLE "sesion" DROP CONSTRAINT "sesion_codigo_verificacion_id_fkey";

-- DropForeignKey
ALTER TABLE "sesion" DROP CONSTRAINT "sesion_usuario_id_fkey";

-- DropForeignKey
ALTER TABLE "session" DROP CONSTRAINT "session_userId_fkey";

-- DropForeignKey
ALTER TABLE "usuario" DROP CONSTRAINT "usuario_auth_user_id_fkey";

-- DropIndex
DROP INDEX "usuario_auth_user_id_key";

-- AlterTable
ALTER TABLE "account" DROP CONSTRAINT "account_pkey",
DROP COLUMN "userId",
ADD COLUMN     "user_id" UUID NOT NULL,
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
ADD CONSTRAINT "account_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "session" DROP CONSTRAINT "session_pkey",
DROP COLUMN "userId",
ADD COLUMN     "compania_id" UUID,
ADD COLUMN     "tipo_cierre" "TipoCierreSesion",
ADD COLUMN     "user_id" UUID NOT NULL,
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
ADD CONSTRAINT "session_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "usuario" DROP COLUMN "auth_user_id",
DROP COLUMN "nombre_completo",
ADD COLUMN     "apellidos" VARCHAR(100) NOT NULL,
ADD COLUMN     "email_verified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "image" TEXT,
ADD COLUMN     "nombres" VARCHAR(100) NOT NULL;

-- AlterTable
ALTER TABLE "verification" DROP CONSTRAINT "verification_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
ADD CONSTRAINT "verification_pkey" PRIMARY KEY ("id");

-- DropTable
DROP TABLE "codigo_verificacion";

-- DropTable
DROP TABLE "sesion";

-- DropTable
DROP TABLE "user";

-- DropEnum
DROP TYPE "EstadoCodigoVerificacion";

-- CreateIndex
CREATE INDEX "account_user_id_idx" ON "account"("user_id");

-- CreateIndex
CREATE INDEX "session_user_id_idx" ON "session"("user_id");

-- CreateIndex
CREATE INDEX "session_expiresAt_idx" ON "session"("expiresAt");

-- CreateIndex
CREATE INDEX "verification_identifier_idx" ON "verification"("identifier");

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auditoria" ADD CONSTRAINT "auditoria_sesion_id_fkey" FOREIGN KEY ("sesion_id") REFERENCES "session"("id") ON DELETE SET NULL ON UPDATE CASCADE;

