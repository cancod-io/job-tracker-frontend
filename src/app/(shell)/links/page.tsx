import { LinksPanel } from "@/components/links/links-panel";
import { PageHeader } from "@/components/layout/page-header";

export const metadata = {
  title: "Links",
};

export default function LinksPage() {
  return (
    <>
      <PageHeader
        title="Links"
        description="Shared website bookmarks — visible and editable by every user and admin."
        breadcrumbs={[{ label: "Links" }]}
      />
      <LinksPanel />
    </>
  );
}
