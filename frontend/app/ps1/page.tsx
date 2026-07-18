import type { Metadata } from "next";
import { getOffers } from "@/lib/api";
import { OfferExplorer } from "@/components/offers/OfferExplorer";

export const metadata: Metadata = { title: "PS-1" };

export default async function PS1Page() {
  const offers = await getOffers({ type: "ps1", limit: 1000 });
  return (
    <OfferExplorer
      type="ps1"
      title="PS-1 Stations"
      description="First Practice School stations — stipends, domains and historical allocation data to plan your preferences."
      offers={offers}
    />
  );
}
