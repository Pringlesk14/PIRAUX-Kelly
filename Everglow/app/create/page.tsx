import { requireUser } from "@/lib/auth";
import { ACCEPT } from "@/lib/uploads";
import { CreateForm } from "@/components/CreateForm";

export default async function CreatePage({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  await requireUser();
  const type = (await searchParams).type === "story" ? "story" : "post";
  return (
    <main className="page">
      <h1 className="page-title">Créer</h1>
      <CreateForm accept={ACCEPT} initialTarget={type} />
    </main>
  );
}
