import { CredentialsPanel } from "@/components/credentials/credentials-panel";
import { PageHeader } from "@/components/layout/page-header";

export const metadata = {
  title: "Credentials",
};

export default function CredentialsPage() {
  return (
    <>
      <PageHeader
        title="Credentials"
        description="Safely store and manage your own passwords and keys. Secrets are write-only and never returned by the API."
        breadcrumbs={[{ label: "Credentials" }]}
      />
      <div className="rounded-2xl border border-border/80 bg-card/50 p-4 shadow-sm md:p-6">
        <CredentialsPanel />
      </div>
    </>
  );
}
