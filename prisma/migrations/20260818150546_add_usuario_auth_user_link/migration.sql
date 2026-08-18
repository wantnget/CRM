-- AlterTable
ALTER TABLE "usuario" ADD COLUMN     "auth_user_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "usuario_auth_user_id_key" ON "usuario"("auth_user_id");

-- AddForeignKey
ALTER TABLE "usuario" ADD CONSTRAINT "usuario_auth_user_id_fkey" FOREIGN KEY ("auth_user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

