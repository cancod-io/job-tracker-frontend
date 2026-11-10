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
        description="Store your own logins and keys. Search, filter by type, then show or copy a secret from its card."
        breadcrumbs={[{ label: "Credentials" }]}
      />
      <div className="rounded-2xl border border-border/80 bg-card/50 p-4 shadow-sm md:p-6">
        <CredentialsPanel />
      </div>
    </>
  );
}
