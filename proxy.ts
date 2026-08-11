import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PORTAL_URL = "https://cimsa-admin-portal.vercel.app/";

function getAdminAuth() {
  const app =
    getApps().length > 0
      ? getApps()[0]
      : initializeApp({
          credential: cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(
              /\\n/g,
              "\n"
            ),
          }),
        });

  return getAuth(app);
}

export async function proxy(request: NextRequest) {
  const sessionCookie = request.cookies.get("cimsa_session")?.value;

  // No hay sesión
  if (!sessionCookie) {
    return NextResponse.redirect(PORTAL_URL);
  }

  try {
    // Verificar sesión Firebase
    await getAdminAuth().verifySessionCookie(
      sessionCookie,
      true
    );

    // Sesión válida
    return NextResponse.next();
  } catch (error) {
    console.error("Sesión SSO inválida:", error);

    const response = NextResponse.redirect(PORTAL_URL);

    // Eliminar cookie inválida
    response.cookies.set("cimsa_session", "", {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      expires: new Date(0),
      path: "/",
    });

    return response;
  }
}

export const config = {
  matcher: [
    "/",
    "/dashboard/:path*",
  ],
};