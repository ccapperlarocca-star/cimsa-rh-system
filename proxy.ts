import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PORTAL_URL = "https://cimsa-admin-portal.vercel.app/";

export function proxy(request: NextRequest) {
  const sessionCookie = request.cookies.get("cimsa_session")?.value;

  // Si no existe sesión, regresar al Portal CIMSA
  if (!sessionCookie) {
    return NextResponse.redirect(PORTAL_URL);
  }

  // Si existe la cookie, permitir continuar.
  // La validación criptográfica de Firebase se hará en el servidor.
  return NextResponse.next();
}

export const config = {
  matcher: ["/"],
};