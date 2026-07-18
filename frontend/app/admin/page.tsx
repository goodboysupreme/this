import type { Metadata } from "next";
import { AdminClient } from "@/components/admin/admin-client";

export const metadata: Metadata = {
  title: "Admin",
  description: "PlaceIQ administration: experience moderation, dataset uploads and analytics.",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return <AdminClient />;
}
