import { redirect } from "next/navigation";
import { verificarSesionCimsa } from "@/lib/auth";
export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await verificarSesionCimsa();

  if (!session) {
    redirect("https://cimsa-admin-portal.vercel.app/");
  }

  return children;
}
