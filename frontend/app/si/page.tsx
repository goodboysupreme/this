import type { Metadata } from "next";
import { getOffers } from "@/lib/api";
import { OfferExplorer } from "@/components/offers/OfferExplorer";

export const metadata: Metadata = { title: "Summer Internships" };

export default async function SIPage() {
  const offers = await getOffers({ type: "si", limit: 1000 });
  return (
    <OfferExplorer
      type="si"
      title="Summer Internships"
      description="SI offers across years: monthly stipends, roles and shortlist cutoffs for on-campus internship season."
      offers={offers}
    />
  );
}
