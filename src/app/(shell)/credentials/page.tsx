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
        description="Your vault in one view — search, filter by type, reveal or copy secrets, and edit without leaving the table."
        breadcrumbs={[{ label: "Credentials" }]}
      />
      <CredentialsPanel />
    </>
  );
}
