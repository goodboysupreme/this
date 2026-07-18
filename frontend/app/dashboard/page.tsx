import type { Metadata } from "next";
import { DashboardClient } from "@/components/dashboard/dashboard-client";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Your PlaceIQ home — academic profile, favorite companies and quick links to resume & outreach tools.",
};

export default function DashboardPage() {
  return <DashboardClient />;
}
