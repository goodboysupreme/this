import type { Metadata } from "next";
import { CompareClient } from "@/components/compare/compare-client";

export const metadata: Metadata = {
  title: "Compare Companies",
  description:
    "Compare BITS Pilani recruiters side by side: offers, CGPA cutoffs, stipends and CTCs across years.",
};

export default function ComparePage() {
  return <CompareClient />;
}
