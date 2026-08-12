import { cookies } from "next/headers";
import { adminAuth } from "@/lib/firebase-admin";

export async function verificarSesionCimsa() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("cimsa_session")?.value;

    if (!sessionCookie) {
      return null;
    }

    return await adminAuth.verifySessionCookie(sessionCookie, true);
  } catch (error) {
    console.error("Error verificando sesión CIMSA:", error);
    return null;
  }
}