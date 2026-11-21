import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { ProfileForm } from "@/components/ProfileForm";

export default async function EditProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const me = await requireUser();
  if ((await params).username.toLowerCase() !== me.username) redirect(`/u/${me.username}/edit`);
  return (
    <main className="page">
      <h1 className="page-title">Modifier le profil</h1>
      <ProfileForm displayName={me.display_name} bio={me.bio} />
    </main>
  );
}
