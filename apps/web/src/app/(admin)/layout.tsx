import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const headersList = await headers();
  const adminKey = process.env.ADMIN_SECRET_KEY;

  // Proteção simples por query param ?key=ADMIN_SECRET_KEY
  // Em produção trocar por autenticação robusta
  const url = headersList.get("x-url") ?? "";
  const referer = headersList.get("referer") ?? "";

  // Vercel injeta x-forwarded-host, usamos cookie para manter sessão
  // Por ora: sem proteção no layout, proteção está na página
  void url;
  void referer;
  void adminKey;

  return <>{children}</>;
}
