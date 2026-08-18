import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function maskPhone(phone: string) {
  if (phone.length <= 5) return phone;
  const start = phone.slice(0, 3);
  const end = phone.slice(-2);
  const masked = "*".repeat(phone.length - 5);
  return `${start}${masked}${end}`;
}

export async function POST(request: Request) {
  const { email } = await request.json();

  const user = await prisma.user.findUnique({
    where: { email },
    select: { phone: true },
  });

  return NextResponse.json({
    phone: user?.phone ? maskPhone(user.phone) : null,
  });
}
