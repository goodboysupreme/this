import type { Metadata } from "next";
import { getOffers } from "@/lib/api";
import { OfferExplorer } from "@/components/offers/OfferExplorer";

export const metadata: Metadata = { title: "Placements Hub" };

export default async function PlacementsPage() {
  const offers = await getOffers({ type: "placement", limit: 1000 });
  return (
    <OfferExplorer
      type="placement"
      title="Placements Hub"
      description="Every campus placement offer on record: roles, CTCs, CGPA cutoffs and branch eligibility, filterable by year."
      offers={offers}
    />
  );
}
