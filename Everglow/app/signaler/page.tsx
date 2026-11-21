import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { describeTarget } from "@/lib/reports.view";
import { ReportForm } from "@/components/ReportForm";
import { Icon } from "@/components/Icon";

export default async function ReportPage({ searchParams }: { searchParams: Promise<{ type?: string; id?: string }> }) {
  await requireUser();
  const { type = "", id = "" } = await searchParams;
  const target = describeTarget(type, Number(id));
  if (!target) notFound();
  return (
    <main>
      <header className="topbar">
        <Link href={target.href ?? "/"} className="icon-btn" aria-label="Retour"><Icon name="back" /></Link>
        <b style={{ fontSize: 17 }}>Signaler</b>
      </header>
      <div className="page">
        <div className="report-target">
          <b>{target.label}</b>
          {target.text && <span className="muted small">« {target.text.length > 120 ? target.text.slice(0, 120) + "…" : target.text} »</span>}
        </div>
        <ReportForm type={type} id={Number(id)} />
      </div>
    </main>
  );
}
