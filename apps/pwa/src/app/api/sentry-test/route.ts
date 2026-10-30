import { NextResponse } from "next/server";

export async function GET() {
  throw new Error("Sentry Test Error (API Route): Verificando captura no servidor!");
  return NextResponse.json({ message: "Isso não deve ser retornado" });
}
