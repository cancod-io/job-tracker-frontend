import type { Metadata } from "next";
import { NotFoundPage } from "@/components/errors/not-found-page";

export const metadata: Metadata = {
  title: "404: This page could not be found",
};

export default function RootPage() {
  return <NotFoundPage />;
}
