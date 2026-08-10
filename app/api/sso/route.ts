import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminAuth } from "@/lib/firebase-admin";

const SESSION_DURATION = 1000 * 60 * 60 * 24 * 5;

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") || "";

    let idToken = "";

    // =========================================
    // RECIBIR TOKEN DESDE FORMULARIO
    // =========================================
    if (contentType.includes("application/x-www-form-urlencoded")) {
      const formData = await request.formData();

      idToken = String(formData.get("idToken") || "");
    }

    // =========================================
    // TAMBIÉN ACEPTAR JSON
    // =========================================
    else if (contentType.includes("application/json")) {
      const body = await request.json();

      idToken = body?.idToken || "";
    }

    // =========================================
    // VALIDAR TOKEN
    // =========================================
    if (!idToken) {
      return NextResponse.json(
        {
          error: "Token de Firebase no proporcionado.",
        },
        {
          status: 400,
        }
      );
    }

    // =========================================
    // VERIFICAR TOKEN CON FIREBASE ADMIN
    // =========================================
    const decodedToken = await adminAuth.verifyIdToken(idToken);

    if (!decodedToken.uid) {
      return NextResponse.json(
        {
          error: "Usuario no válido.",
        },
        {
          status: 401,
        }
      );
    }

    // =========================================
    // CREAR SESSION COOKIE
    // =========================================
    const sessionCookie = await adminAuth.createSessionCookie(
      idToken,
      {
        expiresIn: SESSION_DURATION,
      }
    );

    // =========================================
    // GUARDAR COOKIE
    // =========================================
    const cookieStore = await cookies();

    cookieStore.set("cimsa_session", sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_DURATION / 1000,
    });

    // =========================================
    // REDIRECCIONAR AL SISTEMA
    // =========================================
    return NextResponse.redirect(
      new URL("/", request.url)
    );

  } catch (error) {
    console.error("SSO ERROR:", error);

    return NextResponse.json(
      {
        error: "No se pudo validar la sesión de CIMSA.",
      },
      {
        status: 401,
      }
    );
  }
}