import { AuditLog } from "@/components/admin/audit-log";
import { PageShell } from "@/components/admin/admin-ui";

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { groupId } = await searchParams;
  const gid = typeof groupId === "string" ? groupId : undefined;
  return (
    <PageShell
      title="Audit log"
      description={
        gid
          ? "Everything recorded for one group. Open a row to see what changed."
          : "Every change made on the platform: who, what, when and from where. Open a row to see what changed."
      }
    >
      <AuditLog groupId={null} platformGroupFilter={gid} />
    </PageShell>
  );
}
