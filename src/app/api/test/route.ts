import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const roles = await prisma.rol.findMany({
      orderBy: { orden: "asc" },
    });

    return NextResponse.json({
      ok: true,
      total: roles.length,
      data: roles,
    });
  } catch (error) {
    console.error("[GET /api/test] Error consultando roles:", error);

    return NextResponse.json(
      {
        ok: false,
        error: "No se pudo consultar los roles",
        detalle: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
