import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { AuthForm } from "@/components/AuthForm";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ supprime?: string }> }) {
  if (await currentUser()) redirect("/");
  const deleted = (await searchParams).supprime === "1";
  return <AuthForm mode="login" notice={deleted ? "Ton compte et toutes tes données ont été supprimés. À bientôt peut-être !" : undefined} />;
}
