import "dotenv/config";
import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";

const TEST_USERS = [
  {
    name: "Usuario de Prueba",
    email: "test@wantnget.com.co",
    phone: "3112836339",
  },
  {
    name: "Admin de Prueba",
    email: "admin@wantnget.com.co",
    phone: "3022988434",
  },
];

async function main() {
  for (const testUser of TEST_USERS) {
    const existing = await prisma.user.findUnique({
      where: { email: testUser.email },
    });

    if (existing) {
      await prisma.user.update({
        where: { email: testUser.email },
        data: { phone: testUser.phone },
      });
      console.log(`Actualizado: ${testUser.email} (${testUser.phone})`);
      continue;
    }

    await prisma.user.create({
      data: {
        id: randomUUID(),
        name: testUser.name,
        email: testUser.email,
        phone: testUser.phone,
        emailVerified: true,
      },
    });
    console.log(`Creado: ${testUser.email} (${testUser.phone})`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
