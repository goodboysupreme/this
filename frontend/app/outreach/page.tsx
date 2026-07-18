import type { Metadata } from "next";
import { OutreachCentre } from "@/components/outreach/outreach-centre";

export const metadata: Metadata = { title: "Cold Email Centre" };

export default function OutreachPage() {
  return <OutreachCentre />;
}
